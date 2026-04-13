import { ensureRuntime, requestJson, withDefaultRuntimeAuth } from './runtime-bootstrap.mjs';

function pickString(value, fallback) {
  const normalized = String(value ?? fallback ?? '').trim();
  return normalized;
}

function requireNumber(value, label) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(`Missing or invalid ${label}`);
  }
  return numeric;
}

async function fetchItems(baseUrl) {
  const response = await requestJson(`${baseUrl}/api/intel/items`);
  return Array.isArray(response?.items) ? response.items : [];
}

async function quoteItem(baseUrl, intelItemId, buyerAgentId) {
  return requestJson(`${baseUrl}/api/risk/quote/intel`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      intelItemId,
      buyerAgentId,
    }),
  });
}

async function resolveChallengeableQuote(baseUrl, buyerAgentId, requestedItemId = null) {
  if (requestedItemId) {
    const quote = await quoteItem(baseUrl, requestedItemId, buyerAgentId);
    if (quote.recommended_mode !== 'challengeable') {
      throw new Error(
        `Requested item ${requestedItemId} did not produce a challengeable quote (got ${quote.recommended_mode}).`,
      );
    }
    return {
      itemId: requestedItemId,
      quote,
    };
  }

  const items = (await fetchItems(baseUrl)).sort((left, right) => {
    const leftPrice = Number(left?.price ?? Number.MAX_SAFE_INTEGER);
    const rightPrice = Number(right?.price ?? Number.MAX_SAFE_INTEGER);
    return leftPrice - rightPrice;
  });
  if (!items.length) {
    throw new Error('No eligible intel items were returned by the runtime.');
  }

  const failures = [];
  for (const item of items.slice(0, 12)) {
    try {
      const quote = await quoteItem(baseUrl, Number(item.id), buyerAgentId);
      if (quote.recommended_mode === 'challengeable') {
        return {
          itemId: Number(item.id),
          quote,
        };
      }
      failures.push(`${item.id}:${quote.recommended_mode}`);
    } catch (error) {
      failures.push(`${item.id}:error:${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(
    `Could not find a challengeable quote among the current listings. Checked: ${failures.join(', ')}`,
  );
}

export async function runProtectedLoop({
  baseUrl,
  buyerAgentId,
  itemId = null,
  claimType = 'misleading_or_invalid_intel',
  claimReason = 'runtime-full-loop-claim',
  decision = 'refund',
  decisionReason = 'runtime-full-loop-resolution',
  claimantToken = '',
  claimantSignature = '',
  evaluatorToken = '',
  evaluatorSignature = '',
} = {}) {
  const runtime = await ensureRuntime(baseUrl);
  const authFlags = withDefaultRuntimeAuth({
    'claimant-token': claimantToken,
    'claimant-signature': claimantSignature,
    'evaluator-token': evaluatorToken,
    'evaluator-signature': evaluatorSignature,
  }, runtime);

  try {
    const health = await requestJson(`${baseUrl}/health`);
    const selected = await resolveChallengeableQuote(
      baseUrl,
      buyerAgentId,
      itemId ? requireNumber(itemId, 'item') : null,
    );

    const buy = await requestJson(`${baseUrl}/api/intel/items/${selected.itemId}/buy`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        buyerAgentId,
        purchaseMode: 'challengeable',
        quoteId: selected.quote.quote_id,
      }),
    });

    const protectedPurchaseId = requireNumber(buy.protected_purchase_id, 'protected purchase id');
    const purchase = await requestJson(`${baseUrl}/api/risk/purchases/${protectedPurchaseId}`);

    const claimProofParams = new URLSearchParams({
      claimType,
      reasonText: claimReason,
    });
    const claimProof = await requestJson(
      `${baseUrl}/api/risk/purchases/${protectedPurchaseId}/claim-proof?${claimProofParams.toString()}`,
    );

    const claim = await requestJson(`${baseUrl}/api/risk/claims`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(authFlags['claimant-token'] ? { 'x-civilis-risk-claimant-token': authFlags['claimant-token'] } : {}),
        ...(authFlags['claimant-signature'] ? { 'x-civilis-risk-claimant-signature': authFlags['claimant-signature'] } : {}),
      },
      body: JSON.stringify({
        protectedPurchaseId,
        claimType,
        reasonText: claimReason,
        evidence: {
          source: 'runtime-full-loop',
        },
      }),
    });

    const claimId = requireNumber(claim.claim_id, 'claim id');
    const resolveProofParams = new URLSearchParams({
      decision,
      decisionReason: decisionReason,
    });
    const resolveProof = await requestJson(
      `${baseUrl}/api/risk/claims/${claimId}/resolve-proof?${resolveProofParams.toString()}`,
    );

    const resolution = await requestJson(`${baseUrl}/api/risk/claims/${claimId}/resolve`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(authFlags['evaluator-token'] ? { 'x-civilis-risk-evaluator-token': authFlags['evaluator-token'] } : {}),
        ...(authFlags['evaluator-signature'] ? { 'x-civilis-risk-evaluator-signature': authFlags['evaluator-signature'] } : {}),
      },
      body: JSON.stringify({
        decision,
        decisionReason,
      }),
    });

    const requote = await quoteItem(baseUrl, selected.itemId, buyerAgentId);

    return {
      ok: true,
      runtime: {
        baseUrl,
        startedByTool: runtime.started,
        runtimeEnvFile: runtime.runtimeEnvFile,
        authMode: authFlags['claimant-token'] || authFlags['evaluator-token']
          ? 'token_auto_or_explicit'
          : authFlags['claimant-signature'] || authFlags['evaluator-signature']
            ? 'signature_explicit'
            : 'none',
      },
      health: {
        status: health.status,
        mode: health.checks?.mode ?? null,
        network: health.checks?.network ?? null,
        riskAuth: health.checks?.riskAuth ?? null,
      },
      actors: {
        buyer: buyerAgentId,
        seller: pickString(selected.quote.seller_agent_id, buy.seller_agent_id),
      },
      loop: {
        itemId: selected.itemId,
        quoteId: selected.quote.quote_id,
        protectedPurchaseId,
        claimId,
        laterQuoteId: requote.quote_id,
      },
      quote: {
        riskScore: selected.quote.risk_score,
        recommendedMode: selected.quote.recommended_mode,
        premiumAmount: selected.quote.premium_amount,
      },
      purchase: {
        status: purchase.status,
        acpJobId: purchase.acp_job_id,
        evaluatorAddress: purchase.evaluator_address,
      },
      claimProof: {
        claimantAddress: claimProof.claimant_address,
        reasonTextHash: claimProof.reason_text_hash,
      },
      claim: {
        status: claim.status,
        claimType: claim.claim_type,
      },
      resolveProof: {
        decision: resolveProof.decision,
        decisionReasonHash: resolveProof.decision_reason_hash,
      },
      resolution: {
        success: resolution.success,
        decision: resolution.decision,
        protectedPurchaseStatus: resolution.protectedPurchaseStatus,
        acpJobStatus: resolution.acpJobStatus,
      },
      requote: {
        riskScore: requote.risk_score,
        recommendedMode: requote.recommended_mode,
        premiumAmount: requote.premium_amount,
      },
    };
  } finally {
    runtime.stop();
  }
}
