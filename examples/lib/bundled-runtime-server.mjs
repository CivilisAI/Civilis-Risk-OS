import http from 'node:http';
import crypto from 'node:crypto';
import { BUNDLED_RUNTIME_AUTH } from './bundled-runtime-profile.mjs';

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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hashText(value) {
  return `0x${crypto.createHash('sha256').update(String(value)).digest('hex')}`;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers':
      'content-type,x-civilis-risk-claimant-token,x-civilis-risk-claimant-signature,x-civilis-risk-evaluator-token,x-civilis-risk-evaluator-signature',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
  });
  res.end(JSON.stringify(payload));
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
          source: 'bundled-runtime',
        },
        holderDistribution: {
          concentrationScore: riskScore >= 50 ? 72 : 21,
          source: 'bundled-runtime',
        },
      },
      onchainOsAdjustments: adjustments,
    },
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
  state.quotes.set(quoteId, quote);
  return quote;
}

function requireAuth(req, kind) {
  if (kind === 'claimant') {
    return (
      req.headers['x-civilis-risk-claimant-token'] === BUNDLED_RUNTIME_AUTH.claimantToken ||
      Boolean(req.headers['x-civilis-risk-claimant-signature'])
    );
  }

  return (
    req.headers['x-civilis-risk-evaluator-token'] === BUNDLED_RUNTIME_AUTH.evaluatorToken ||
    Boolean(req.headers['x-civilis-risk-evaluator-signature'])
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
      ? 'Bundled evaluator marked the delivery below the protected threshold.'
      : 'Bundled evaluator found the delivered intel consistent with the quoted scope.',
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

export function createBundledRuntimeServer() {
  const items = clone(DEFAULT_ITEMS);
  const state = {
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

  const server = http.createServer(async (req, res) => {
    try {
      if (!req.url) {
        sendJson(res, 404, { error: 'Not found' });
        return;
      }

      if (req.method === 'OPTIONS') {
        sendJson(res, 200, { ok: true });
        return;
      }

      const url = new URL(req.url, 'http://127.0.0.1');
      const itemBuyMatch = req.method === 'POST' ? url.pathname.match(/^\/api\/intel\/items\/(\d+)\/buy$/u) : null;
      const purchaseMatch = req.method === 'GET' ? url.pathname.match(/^\/api\/risk\/purchases\/(\d+)$/u) : null;
      const claimProofMatch = req.method === 'GET' ? url.pathname.match(/^\/api\/risk\/purchases\/(\d+)\/claim-proof$/u) : null;
      const resolveProofMatch = req.method === 'GET' ? url.pathname.match(/^\/api\/risk\/claims\/(\d+)\/resolve-proof$/u) : null;
      const resolveMatch = req.method === 'POST' ? url.pathname.match(/^\/api\/risk\/claims\/(\d+)\/resolve$/u) : null;

      if (req.method === 'GET' && url.pathname === '/health') {
        sendJson(res, 200, {
          status: 'ok',
          service: 'Civilis Risk OS Bundled Runtime',
          checks: {
            mode: 'bundled',
            network: 'bundled-local',
            acp: 'bundled',
            erc8004: 'bundled',
            commerce: 'bundled',
            riskAuth: 'bundled_default_auth',
          },
        });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/intel/items') {
        sendJson(res, 200, {
          items: items.map((item) => ({
            id: item.id,
            category: item.category,
            price: item.price.toFixed(6),
            seller_agent_id: item.sellerAgentId,
            seller_name: item.sellerName,
            content_preview: item.content?.headline ?? null,
          })),
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/risk/quote/intel') {
        const body = await parseBody(req);
        const intelItemId = Number(body.intelItemId);
        const buyerAgentId = String(body.buyerAgentId ?? '').trim();
        const item = items.find((entry) => entry.id === intelItemId);
        if (!item || !buyerAgentId) {
          sendJson(res, 400, { error: 'intelItemId and buyerAgentId are required' });
          return;
        }
        sendJson(res, 200, createQuote(state, item, buyerAgentId));
        return;
      }

      if (itemBuyMatch) {
        const itemId = Number(itemBuyMatch[1]);
        const body = await parseBody(req);
        const quoteId = Number(body.quoteId);
        const buyerAgentId = String(body.buyerAgentId ?? '').trim();
        const purchaseMode = String(body.purchaseMode ?? '').trim();
        const item = items.find((entry) => entry.id === itemId);
        const quote = state.quotes.get(quoteId);
        if (!item || !quote || !buyerAgentId) {
          sendJson(res, 400, { error: 'item, quote, and buyer are required' });
          return;
        }
        if (quote.intel_item_id !== itemId || quote.buyer_agent_id !== buyerAgentId) {
          sendJson(res, 409, { error: 'quote does not match the requested item or buyer' });
          return;
        }
        if (purchaseMode !== quote.recommended_mode && quote.recommended_mode === 'challengeable') {
          sendJson(res, 409, { error: 'challengeable quote must be purchased in challengeable mode' });
          return;
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
          onChainTxHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          evaluatorAddress: '0x400ea2f2af2732c4e2af9fb2f8616468ad49023d',
          challengeDeadline:
            protectedMode === 'challengeable'
              ? new Date(Date.now() + quote.claim_window_seconds * 1000).toISOString()
              : null,
        };
        state.purchases.set(purchaseId, purchase);
        sendJson(res, 200, {
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
        return;
      }

      if (purchaseMatch) {
        const purchase = getPurchase(state.purchases, Number(purchaseMatch[1]));
        const claim = [...state.claims.values()].find((entry) => entry.protectedPurchaseId === purchase.id) ?? null;
        sendJson(res, 200, formatPurchaseView(purchase, claim));
        return;
      }

      if (claimProofMatch) {
        const purchase = getPurchase(state.purchases, Number(claimProofMatch[1]));
        const claimType = String(url.searchParams.get('claimType') ?? 'misleading_or_invalid_intel');
        const reasonText = String(url.searchParams.get('reasonText') ?? '');
        sendJson(res, 200, {
          protected_purchase_id: purchase.id,
          claimant_address: '0x3dba0d4e682be54be41b48cbe9572a81d14e94c9',
          claim_type: claimType,
          reason_text_hash: hashText(reasonText),
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/risk/claims') {
        if (!requireAuth(req, 'claimant')) {
          sendJson(res, 403, { error: 'A valid claimant auth token or claimant signature is required' });
          return;
        }

        const body = await parseBody(req);
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
        sendJson(res, 200, {
          claim_id: claimId,
          protected_purchase_id: protectedPurchaseId,
          claim_type: claimType,
          status: 'open',
        });
        return;
      }

      if (resolveProofMatch) {
        const claim = getClaim(state.claims, Number(resolveProofMatch[1]));
        const purchase = getPurchase(state.purchases, claim.protectedPurchaseId);
        const advisory = createAdvisory(claim, purchase);
        const decision = String(url.searchParams.get('decision') ?? advisory.decision);
        const decisionReason = String(url.searchParams.get('decisionReason') ?? advisory.reasoning);
        sendJson(res, 200, {
          claim_id: claim.id,
          protected_purchase_id: claim.protectedPurchaseId,
          decision,
          decision_reason_hash: hashText(decisionReason),
          evaluator_address: purchase.evaluatorAddress,
          advisory,
        });
        return;
      }

      if (resolveMatch) {
        if (!requireAuth(req, 'evaluator')) {
          sendJson(res, 403, { error: 'A valid evaluator auth token or evaluator signature is required' });
          return;
        }

        const claim = getClaim(state.claims, Number(resolveMatch[1]));
        const purchase = getPurchase(state.purchases, claim.protectedPurchaseId);
        const body = await parseBody(req);
        const advisory = createAdvisory(claim, purchase);
        const decision = String(body.decision ?? advisory.decision);
        if (decision !== 'refund' && decision !== 'release') {
          sendJson(res, 400, { error: 'decision must be release or refund' });
          return;
        }

        const history = state.sellerOutcomes.get(purchase.item.sellerAgentId) || { refunds: 0, releases: 0 };
        if (decision === 'refund') history.refunds += 1;
        else history.releases += 1;
        state.sellerOutcomes.set(purchase.item.sellerAgentId, history);

        claim.status = 'resolved';
        purchase.status = decision === 'refund' ? 'refunded' : 'released';
        sendJson(res, 200, {
          success: true,
          decision,
          protectedPurchaseStatus: purchase.status,
          acpJobStatus: decision === 'refund' ? 'refunded' : 'released',
        });
        return;
      }

      sendJson(res, 404, { error: 'Not found' });
    } catch (error) {
      const statusCode = Number(error?.statusCode ?? 500);
      const message = error instanceof Error ? error.message : 'Internal server error';
      sendJson(res, statusCode, { error: message });
    }
  });

  return server;
}
