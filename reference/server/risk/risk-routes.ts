import { Router, type Router as RouterType } from 'express';
import { createProtectedPurchaseClaim, resolveProtectedPurchaseClaim } from './claim-lifecycle.js';
import { getProtectedIntelPurchaseView } from './protected-purchase.js';
import { createIntelRiskQuote } from './quote-engine.js';
import type { ClaimDecision, ClaimType } from './risk-types.js';

const router: RouterType = Router();

function asIsoString(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function readRoleToken(req: { header(name: string): string | undefined }, headerName: string): string | null {
  const value = req.header(headerName)?.trim();
  return value ? value : null;
}

function toQuoteResponse(quote: Awaited<ReturnType<typeof createIntelRiskQuote>>) {
  return {
    quote_id: quote.id,
    intel_item_id: quote.intelItemId,
    buyer_agent_id: quote.buyerAgentId,
    seller_agent_id: quote.sellerAgentId,
    risk_score: quote.riskScore,
    recommended_mode: quote.recommendedMode,
    premium_bps: quote.premiumBps,
    premium_amount: quote.premiumAmount.toFixed(6),
    claim_window_seconds: quote.claimWindowSeconds,
    reasons: quote.reasons,
    expires_at: asIsoString(quote.expiresAt),
  };
}

function toPurchaseViewResponse(view: NonNullable<Awaited<ReturnType<typeof getProtectedIntelPurchaseView>>>) {
  return {
    protected_purchase_id: view.purchase.id,
    quote_id: view.purchase.quoteId,
    intel_item_id: view.purchase.intelItemId,
    buyer_agent_id: view.purchase.buyerAgentId,
    seller_agent_id: view.purchase.sellerAgentId,
    purchase_mode: view.purchase.mode,
    status: view.purchase.status,
    principal_amount: view.purchase.principalAmount.toFixed(6),
    premium_amount: view.purchase.premiumAmount.toFixed(6),
    acp_job_id: view.purchase.principalAcpJobId,
    evaluator_address: view.claim?.evaluatorAddress ?? view.acpJob?.evaluatorAddress ?? null,
    challenge_deadline: asIsoString(view.purchase.challengeDeadline),
    settled_at: asIsoString(view.purchase.releasedAt ?? view.purchase.refundedAt ?? view.acpJob?.settledAt ?? null),
    created_at: asIsoString(view.purchase.createdAt),
    claim: view.claim
      ? {
          claim_id: view.claim.id,
          protected_purchase_id: view.claim.protectedPurchaseId,
          claimant_agent_id: view.claim.claimantAgentId,
          claim_type: view.claim.claimType,
          status: view.claim.status,
          reason_text: view.claim.reasonText,
          decision: view.claim.decision,
          decision_reason: view.claim.decisionReason,
          evaluator_address: view.claim.evaluatorAddress,
          created_at: asIsoString(view.claim.createdAt),
          resolved_at: asIsoString(view.claim.resolvedAt),
        }
      : null,
  };
}

router.post('/quote/intel', async (req, res) => {
  try {
    const { intelItemId, buyerAgentId } = req.body as {
      intelItemId?: number;
      buyerAgentId?: string;
    };

    if (!intelItemId || !buyerAgentId) {
      return res.status(400).json({ error: 'intelItemId and buyerAgentId are required' });
    }

    const quote = await createIntelRiskQuote({ intelItemId, buyerAgentId });
    res.json(toQuoteResponse(quote));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(message.includes('not found') ? 404 : 400).json({ error: message });
  }
});

router.get('/purchases/:id', async (req, res) => {
  try {
    const purchaseId = Number(req.params.id);
    if (!Number.isFinite(purchaseId)) {
      return res.status(400).json({ error: 'Invalid protected purchase id' });
    }

    const view = await getProtectedIntelPurchaseView(purchaseId);
    if (!view) {
      return res.status(404).json({ error: 'Protected purchase not found' });
    }

    res.json(toPurchaseViewResponse(view));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post('/claims', async (req, res) => {
  try {
    const { protectedPurchaseId, claimType, reasonText, evidence } = req.body as {
      protectedPurchaseId?: number;
      claimType?: ClaimType;
      reasonText?: string;
      evidence?: Record<string, unknown>;
    };
    const claimantAuthToken =
      readRoleToken(req, 'x-civilis-risk-claimant-token') ??
      (typeof req.body?.claimantAuthToken === 'string' ? req.body.claimantAuthToken.trim() : null);

    if (!protectedPurchaseId || !claimType) {
      return res.status(400).json({ error: 'protectedPurchaseId and claimType are required' });
    }

    const view = await createProtectedPurchaseClaim({
      protectedPurchaseId,
      claimType,
      reasonText,
      evidence,
      claimantAuthToken,
    });

    if (!view.claim) {
      return res.status(500).json({ error: 'Claim created but no claim record was returned' });
    }

    res.json({
      claim_id: view.claim.id,
      protected_purchase_id: view.claim.protectedPurchaseId,
      claimant_agent_id: view.claim.claimantAgentId,
      claim_type: view.claim.claimType,
      status: view.claim.status,
      reason_text: view.claim.reasonText,
      decision: view.claim.decision,
      decision_reason: view.claim.decisionReason,
      evaluator_address: view.claim.evaluatorAddress,
      created_at: asIsoString(view.claim.createdAt),
      resolved_at: asIsoString(view.claim.resolvedAt),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes('auth token') || message.includes('configured evaluator') ? 403 : 400;
    res.status(status).json({ error: message });
  }
});

router.post('/claims/:id/resolve', async (req, res) => {
  try {
    const claimId = Number(req.params.id);
    const { decision, decisionReason } = req.body as {
      decision?: ClaimDecision;
      decisionReason?: string;
      evaluatorAuthToken?: string;
    };
    const evaluatorAuthToken =
      readRoleToken(req, 'x-civilis-risk-evaluator-token') ??
      (typeof req.body?.evaluatorAuthToken === 'string' ? req.body.evaluatorAuthToken.trim() : null);

    if (!Number.isFinite(claimId) || !decision) {
      return res.status(400).json({ error: 'claim id and decision are required' });
    }

    const view = await resolveProtectedPurchaseClaim({
      claimId,
      decision,
      decisionReason,
      evaluatorAuthToken,
    });

    if (!view.claim) {
      return res.status(500).json({ error: 'Claim resolved but no claim record was returned' });
    }

    res.json({
      claim_id: view.claim.id,
      protected_purchase_id: view.claim.protectedPurchaseId,
      claimant_agent_id: view.claim.claimantAgentId,
      claim_type: view.claim.claimType,
      status: view.claim.status,
      reason_text: view.claim.reasonText,
      decision: view.claim.decision,
      decision_reason: view.claim.decisionReason,
      evaluator_address: view.claim.evaluatorAddress,
      created_at: asIsoString(view.claim.createdAt),
      resolved_at: asIsoString(view.claim.resolvedAt),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes('auth token') || message.includes('configured evaluator') ? 403 : 400;
    res.status(status).json({ error: message });
  }
});

export default router;
