const DEFAULT_ITEMS = [
  {
    id: 501,
    category: 'economic_forecast',
    sellerAgentId: 'chaos',
    sellerName: 'Chaos',
    sellerWallet: '0xchaos0000000000000000000000000000000501',
    price: 0.1307,
    baseRisk: 64,
    content: {
      headline: 'Rate cut thesis with fragile supporting evidence',
      summary: 'High-upside macro thesis with thin corroboration.',
    },
  },
  {
    id: 502,
    category: 'counter_intel',
    sellerAgentId: 'fox',
    sellerName: 'Fox',
    sellerWallet: '0xfox000000000000000000000000000000000502',
    price: 0.0898,
    baseRisk: 58,
    content: {
      headline: 'Counterparty activity report',
      summary: 'Actionable but likely incomplete activity report.',
    },
  },
  {
    id: 503,
    category: 'behavior_pattern',
    sellerAgentId: 'oracle',
    sellerName: 'Oracle',
    sellerWallet: '0xoracle000000000000000000000000000000503',
    price: 0.0398,
    baseRisk: 24,
    content: {
      headline: 'Stable behavior pattern snapshot',
      summary: 'Lower-risk listing used to show instant recommendation.',
    },
  },
];

const BUNDLED_RUNTIME_AUTH = {
  claimantToken: 'bundled-claimant-token',
  evaluatorToken: 'bundled-evaluator-token',
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return `0x${Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-headers':
        'content-type,x-civilis-risk-claimant-token,x-civilis-risk-claimant-signature,x-civilis-risk-evaluator-token,x-civilis-risk-evaluator-signature',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
    },
  });
}

function computeProtectionTerms(riskScore) {
  if (riskScore >= 50) {
    return {
      recommendedMode: 'challengeable',
      premiumBps: 250,
      claimWindowSeconds: 1800,
    };
  }

  return {
    recommendedMode: 'instant',
    premiumBps: 0,
    claimWindowSeconds: 0,
  };
}

function createSellerAdjustments(state, sellerAgentId) {
  const history = state.sellerOutcomes.get(sellerAgentId) || { refunds: 0, releases: 0 };
  const adjustments = [];

  if (history.refunds > 0) {
    adjustments.push({
      delta: Math.min(18, history.refunds * 6),
      reason: 'seller_refund_history_detected',
    });
  }

  if (history.releases > 0 && history.refunds === 0) {
    adjustments.push({
      delta: -4,
      reason: 'seller_release_history_supports_instant_settlement',
    });
  }

  return adjustments;
}

function createQuote(state, item, buyerAgentId) {
  const adjustments = createSellerAdjustments(state, item.sellerAgentId);
  const riskScore = Math.max(
    0,
    Math.min(100, item.baseRisk + adjustments.reduce((sum, adjustment) => sum + adjustment.delta, 0)),
  );
  const protection = computeProtectionTerms(riskScore);
  const premiumAmount = Number(((item.price * protection.premiumBps) / 10_000).toFixed(6));
  const quoteId = state.nextQuoteId++;
  const quote = {
    quote_id: quoteId,
    intel_item_id: item.id,
    buyer_agent_id: buyerAgentId,
    seller_agent_id: item.sellerAgentId,
    risk_score: riskScore,
    recommended_mode: protection.recommendedMode,
    premium_bps: protection.premiumBps,
    premium_amount: premiumAmount.toFixed(6),
    claim_window_seconds: protection.claimWindowSeconds,
    reasons: adjustments.length
      ? adjustments.map((adjustment) => adjustment.reason)
      : protection.recommendedMode === 'challengeable'
        ? ['seller_validation_score_low']
        : ['seller_history_supports_instant_settlement'],
    inputs: {
      onchainOsSignals: {
        tokenSecurity: {
          status: 'ok',
          source: 'cloudflare-worker',
        },
        holderDistribution: {
          concentrationScore: riskScore >= 50 ? 72 : 21,
          source: 'cloudflare-worker',
        },
      },
      onchainOsAdjustments: adjustments,
    },
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
  state.quotes.set(quoteId, quote);
  return quote;
}

function requireAuth(request, kind) {
  if (kind === 'claimant') {
    return (
      request.headers.get('x-civilis-risk-claimant-token') === BUNDLED_RUNTIME_AUTH.claimantToken ||
      Boolean(request.headers.get('x-civilis-risk-claimant-signature'))
    );
  }

  return (
    request.headers.get('x-civilis-risk-evaluator-token') === BUNDLED_RUNTIME_AUTH.evaluatorToken ||
    Boolean(request.headers.get('x-civilis-risk-evaluator-signature'))
  );
}

function getClaim(claims, claimId) {
  const claim = claims.get(claimId);
  if (!claim) {
    const error = new Error('Claim not found');
    error.statusCode = 404;
    throw error;
  }
  return claim;
}

function getPurchase(purchases, purchaseId) {
  const purchase = purchases.get(purchaseId);
  if (!purchase) {
    const error = new Error('Protected purchase not found');
    error.statusCode = 404;
    throw error;
  }
  return purchase;
}

function createAdvisory(claim, purchase) {
  const reasonText = `${claim.reasonText} ${(purchase.item.content?.summary ?? '')}`.toLowerCase();
  const refund = /(misleading|incomplete|not delivered|invalid|wrong|missing)/u.test(reasonText);
  return {
    decision: refund ? 'refund' : 'release',
    reasoning: refund
      ? 'Hosted evaluator marked the delivery below the protected threshold.'
      : 'Hosted evaluator found the delivered intel consistent with the quoted scope.',
    confidence: refund ? 0.86 : 0.72,
  };
}

function formatPurchaseView(purchase, claim = null) {
  return {
    id: purchase.id,
    status: purchase.status,
    acp_job_id: purchase.acpJobId,
    on_chain_job_id: purchase.onChainJobId,
    on_chain_tx_hash: purchase.onChainTxHash,
    quote_id: purchase.quoteId,
    intel_item_id: purchase.item.id,
    buyer_agent_id: purchase.buyerAgentId,
    seller_agent_id: purchase.item.sellerAgentId,
    evaluator_address: purchase.evaluatorAddress,
    principal_amount: purchase.item.price.toFixed(6),
    premium_amount: purchase.premiumAmount.toFixed(6),
    claim_window_seconds: purchase.claimWindowSeconds,
    challenge_deadline: purchase.challengeDeadline,
    claim: claim
      ? {
          id: claim.id,
          status: claim.status,
          claim_type: claim.claimType,
          reason_text: claim.reasonText,
        }
      : null,
  };
}

function createState() {
  return {
    items: clone(DEFAULT_ITEMS),
    nextQuoteId: 1,
    nextPurchaseId: 1,
    nextClaimId: 1,
    nextOnChainJobId: 6001,
    nextAcpJobId: 9001,
    quotes: new Map(),
    purchases: new Map(),
    claims: new Map(),
    sellerOutcomes: new Map(),
  };
}

let state = createState();

export async function handleRuntimeRequest(request) {
  if (request.method === 'OPTIONS') {
    return json({ ok: true });
  }

  const url = new URL(request.url);
  const itemBuyMatch = request.method === 'POST' ? url.pathname.match(/^\/api\/intel\/items\/(\d+)\/buy$/u) : null;
  const purchaseMatch = request.method === 'GET' ? url.pathname.match(/^\/api\/risk\/purchases\/(\d+)$/u) : null;
  const claimProofMatch = request.method === 'GET' ? url.pathname.match(/^\/api\/risk\/purchases\/(\d+)\/claim-proof$/u) : null;
  const resolveProofMatch = request.method === 'GET' ? url.pathname.match(/^\/api\/risk\/claims\/(\d+)\/resolve-proof$/u) : null;
  const resolveMatch = request.method === 'POST' ? url.pathname.match(/^\/api\/risk\/claims\/(\d+)\/resolve$/u) : null;

  try {
    if (request.method === 'GET' && url.pathname === '/health') {
      return json({
        status: 'ok',
        service: 'Civilis Risk OS Hosted Runtime',
        checks: {
          mode: 'bundled-hosted',
          network: 'cloudflare-workers',
          acp: 'bundled',
          erc8004: 'bundled',
          commerce: 'bundled',
          riskAuth: 'bundled_default_auth',
        },
      });
    }

    if (request.method === 'POST' && url.pathname === '/admin/reset') {
      state = createState();
      return json({ ok: true, reset: true });
    }

    if (request.method === 'GET' && url.pathname === '/api/intel/items') {
      return json({
        items: state.items.map((item) => ({
          id: item.id,
          category: item.category,
          price: item.price.toFixed(6),
          seller_agent_id: item.sellerAgentId,
          seller_name: item.sellerName,
          content_preview: item.content?.headline ?? null,
        })),
      });
    }

    if (request.method === 'POST' && url.pathname === '/api/risk/quote/intel') {
      const body = await request.json();
      const intelItemId = Number(body.intelItemId);
      const buyerAgentId = String(body.buyerAgentId ?? '').trim();
      const item = state.items.find((entry) => entry.id === intelItemId);
      if (!item || !buyerAgentId) {
        return json({ error: 'intelItemId and buyerAgentId are required' }, 400);
      }
      return json(createQuote(state, item, buyerAgentId));
    }

    if (itemBuyMatch) {
      const itemId = Number(itemBuyMatch[1]);
      const body = await request.json();
      const quoteId = Number(body.quoteId);
      const buyerAgentId = String(body.buyerAgentId ?? '').trim();
      const purchaseMode = String(body.purchaseMode ?? '').trim();
      const item = state.items.find((entry) => entry.id === itemId);
      const quote = state.quotes.get(quoteId);
      if (!item || !quote || !buyerAgentId) {
        return json({ error: 'item, quote, and buyer are required' }, 400);
      }
      if (quote.intel_item_id !== itemId || quote.buyer_agent_id !== buyerAgentId) {
        return json({ error: 'quote does not match the requested item or buyer' }, 409);
      }
      if (purchaseMode !== quote.recommended_mode && quote.recommended_mode === 'challengeable') {
        return json({ error: 'challengeable quote must be purchased in challengeable mode' }, 409);
      }

      const purchaseId = state.nextPurchaseId++;
      const protectedMode = quote.recommended_mode === 'challengeable' ? 'challengeable' : 'instant';
      const purchase = {
        id: purchaseId,
        quoteId,
        buyerAgentId,
        item,
        premiumAmount: Number(quote.premium_amount),
        claimWindowSeconds: quote.claim_window_seconds,
        status: protectedMode === 'challengeable' ? 'challenge_window' : 'released',
        acpJobId: state.nextAcpJobId++,
        onChainJobId: state.nextOnChainJobId++,
        onChainTxHash: `0xruntime${String(purchaseId).padStart(58, '0')}`,
        evaluatorAddress: '0x400ea2f2af2732c4e2af9fb2f8616468ad49023d',
        challengeDeadline:
          protectedMode === 'challengeable'
            ? new Date(Date.now() + quote.claim_window_seconds * 1000).toISOString()
            : null,
      };
      state.purchases.set(purchaseId, purchase);
      return json({
        success: true,
        settlementMode: 'acp_funded',
        purchaseMode: protectedMode,
        acpJobId: purchase.acpJobId,
        onChainJobId: purchase.onChainJobId,
        onChainTxHash: purchase.onChainTxHash,
        content: item.content,
        protected_purchase_id: purchaseId,
        quote_id: quoteId,
        intel_item_id: item.id,
        buyer_agent_id: buyerAgentId,
        seller_agent_id: item.sellerAgentId,
        status: purchase.status,
        principal_amount: item.price.toFixed(6),
        premium_amount: purchase.premiumAmount.toFixed(6),
        evaluator_address: purchase.evaluatorAddress,
        challenge_deadline: purchase.challengeDeadline,
        claim: null,
      });
    }

    if (purchaseMatch) {
      const purchase = getPurchase(state.purchases, Number(purchaseMatch[1]));
      const claim = [...state.claims.values()].find((entry) => entry.protectedPurchaseId === purchase.id) ?? null;
      return json(formatPurchaseView(purchase, claim));
    }

    if (claimProofMatch) {
      const purchase = getPurchase(state.purchases, Number(claimProofMatch[1]));
      const claimType = String(url.searchParams.get('claimType') ?? 'misleading_or_invalid_intel');
      const reasonText = String(url.searchParams.get('reasonText') ?? '');
      return json({
        protected_purchase_id: purchase.id,
        claimant_address: '0x3dba0d4e682be54be41b48cbe9572a81d14e94c9',
        claim_type: claimType,
        reason_text_hash: await sha256Hex(reasonText),
      });
    }

    if (request.method === 'POST' && url.pathname === '/api/risk/claims') {
      if (!requireAuth(request, 'claimant')) {
        return json({ error: 'A valid claimant auth token or claimant signature is required' }, 403);
      }
      const body = await request.json();
      const protectedPurchaseId = Number(body.protectedPurchaseId);
      const claimType = String(body.claimType ?? 'misleading_or_invalid_intel');
      const reasonText = String(body.reasonText ?? '').trim();
      const purchase = getPurchase(state.purchases, protectedPurchaseId);
      const claimId = state.nextClaimId++;
      const claim = {
        id: claimId,
        protectedPurchaseId,
        claimType,
        reasonText,
        status: 'open',
      };
      state.claims.set(claimId, claim);
      purchase.status = 'claimed';
      return json({
        claim_id: claimId,
        protected_purchase_id: protectedPurchaseId,
        claim_type: claimType,
        status: 'open',
      });
    }

    if (resolveProofMatch) {
      const claim = getClaim(state.claims, Number(resolveProofMatch[1]));
      const purchase = getPurchase(state.purchases, claim.protectedPurchaseId);
      const advisory = createAdvisory(claim, purchase);
      const decision = String(url.searchParams.get('decision') ?? advisory.decision);
      const decisionReason = String(url.searchParams.get('decisionReason') ?? advisory.reasoning);
      return json({
        claim_id: claim.id,
        protected_purchase_id: claim.protectedPurchaseId,
        decision,
        decision_reason_hash: await sha256Hex(decisionReason),
        evaluator_address: purchase.evaluatorAddress,
        advisory,
      });
    }

    if (resolveMatch) {
      if (!requireAuth(request, 'evaluator')) {
        return json({ error: 'A valid evaluator auth token or evaluator signature is required' }, 403);
      }

      const claim = getClaim(state.claims, Number(resolveMatch[1]));
      const purchase = getPurchase(state.purchases, claim.protectedPurchaseId);
      const body = await request.json();
      const advisory = createAdvisory(claim, purchase);
      const decision = String(body.decision ?? advisory.decision);
      if (decision !== 'refund' && decision !== 'release') {
        return json({ error: 'decision must be release or refund' }, 400);
      }

      const history = state.sellerOutcomes.get(purchase.item.sellerAgentId) || { refunds: 0, releases: 0 };
      if (decision === 'refund') history.refunds += 1;
      else history.releases += 1;
      state.sellerOutcomes.set(purchase.item.sellerAgentId, history);

      claim.status = 'resolved';
      purchase.status = decision === 'refund' ? 'refunded' : 'released';
      return json({
        success: true,
        decision,
        protectedPurchaseStatus: purchase.status,
        acpJobStatus: decision === 'refund' ? 'refunded' : 'released',
      });
    }

    return json({ error: 'Not found' }, 404);
  } catch (error) {
    const statusCode = Number(error?.statusCode ?? 500);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return json({ error: message }, statusCode);
  }
}
