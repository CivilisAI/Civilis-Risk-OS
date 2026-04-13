import { getPool, withTransaction } from '../db/postgres.js';
import { finalizeIntelPurchaseSettlement } from '../erc8183/hooks/intel-hook.js';
import { reputationRegistry } from '../erc8004/reputation-registry.js';
import {
  getProtectedIntelPurchaseRecord,
  getProtectedIntelPurchaseView,
  updateProtectedIntelPurchaseRecord,
} from './protected-purchase.js';
import type {
  ClaimDecision,
  ClaimType,
  ProtectedIntelPurchaseView,
  PurchaseClaimRecord,
} from './risk-types.js';

interface ClaimRow {
  id: number;
  protected_purchase_id: number;
  claimant_agent_id: string;
  claim_type: ClaimType;
  status: 'open' | 'resolving' | 'resolved';
  reason_text: string | null;
  evidence: Record<string, unknown> | null;
  decision: ClaimDecision | null;
  decision_reason: string | null;
  evaluator_address: string | null;
  resolved_at: string | null;
  created_at: string;
}

function mapClaimRow(row: ClaimRow): PurchaseClaimRecord {
  return {
    id: row.id,
    protectedPurchaseId: row.protected_purchase_id,
    claimantAgentId: row.claimant_agent_id,
    claimType: row.claim_type,
    status: row.status,
    reasonText: row.reason_text,
    evidence: row.evidence ?? {},
    decision: row.decision,
    decisionReason: row.decision_reason,
    evaluatorAddress: row.evaluator_address,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
  };
}

function readConfiguredToken(kind: 'claimant' | 'evaluator'): string | null {
  const value = kind === 'claimant'
    ? process.env.RISK_OS_CLAIMANT_AUTH_TOKEN
    : process.env.RISK_OS_EVALUATOR_AUTH_TOKEN;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function assertTokenGate(kind: 'claimant' | 'evaluator', providedToken?: string | null): void {
  const configured = readConfiguredToken(kind);
  if (!configured) {
    return;
  }

  if (!providedToken || providedToken !== configured) {
    throw new Error(`Invalid ${kind} auth token`);
  }
}

async function loadSellerToken(producerAgentId: string): Promise<number | null> {
  const pool = getPool();
  const result = await pool.query<{ erc8004_token_id: number | null }>(
    'SELECT erc8004_token_id FROM agents WHERE agent_id = $1',
    [producerAgentId],
  );
  return result.rows[0]?.erc8004_token_id ?? null;
}

async function persistClaimSettlementOutcome(params: {
  claimId: number;
  protectedPurchaseId: number;
  decision: ClaimDecision;
  decisionReason?: string | null;
  evaluatorAddress: string;
}): Promise<void> {
  const settlementStatus = params.decision === 'refund' ? 'refunded' : 'released';
  const settlementOutcome = params.decision === 'refund' ? 'refund' : 'release';

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE purchase_claims
       SET status = 'resolved',
           decision = $2,
           decision_reason = $3,
           evaluator_address = $4,
           resolved_at = COALESCE(resolved_at, CURRENT_TIMESTAMP)
       WHERE id = $1`,
      [
        params.claimId,
        params.decision,
        params.decisionReason ?? null,
        params.evaluatorAddress,
      ],
    );

    await client.query(
      `UPDATE protected_intel_purchases
       SET status = $2::varchar,
           released_at = CASE WHEN $2::varchar = 'released' THEN COALESCE(released_at, CURRENT_TIMESTAMP) ELSE released_at END,
           refunded_at = CASE WHEN $2::varchar = 'refunded' THEN COALESCE(refunded_at, CURRENT_TIMESTAMP) ELSE refunded_at END
       WHERE id = $1`,
      [params.protectedPurchaseId, settlementStatus],
    );

    await updateProtectedIntelPurchaseRecord({
      protectedPurchaseId: params.protectedPurchaseId,
      metadata: {
        settlementOutcome,
        settlementRequestedBy: 'claim_resolution',
        settlementRequestedAt: new Date().toISOString(),
        settlementLastError: null,
        settlementFinalizedAt: new Date().toISOString(),
      },
    }, client);
  });
}

export async function createProtectedPurchaseClaim(params: {
  protectedPurchaseId: number;
  claimType: ClaimType;
  reasonText?: string;
  evidence?: Record<string, unknown>;
  claimantAuthToken?: string | null;
}): Promise<ProtectedIntelPurchaseView> {
  assertTokenGate('claimant', params.claimantAuthToken);

  await withTransaction(async (client) => {
    const purchaseResult = await client.query<{
      id: number;
      quote_id: number | null;
      intel_item_id: number;
      intel_purchase_id: number | null;
      buyer_agent_id: string;
      seller_agent_id: string;
      mode: string;
      status: string;
      principal_amount: string;
      premium_amount: string;
      premium_tx_id: number | null;
      principal_acp_job_id: number | null;
      deliverable_hash: string | null;
      challenge_deadline: string | null;
      released_at: string | null;
      refunded_at: string | null;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }>(
      `SELECT *
       FROM protected_intel_purchases
       WHERE id = $1
       FOR UPDATE`,
      [params.protectedPurchaseId],
    );

    if (purchaseResult.rows.length === 0) {
      throw new Error('Protected purchase not found');
    }

    const purchase = purchaseResult.rows[0];
    if (purchase.status !== 'challenge_window') {
      throw new Error('This purchase is no longer claimable');
    }

    if (purchase.challenge_deadline && new Date(purchase.challenge_deadline).getTime() < Date.now()) {
      throw new Error('Challenge window already expired');
    }

    const existingClaim = await client.query<{ id: number; status: string }>(
      `SELECT id, status
       FROM purchase_claims
       WHERE protected_purchase_id = $1
       ORDER BY id DESC
       LIMIT 1
       FOR UPDATE`,
      [params.protectedPurchaseId],
    );

    if (existingClaim.rows[0] && existingClaim.rows[0].status !== 'resolved') {
      throw new Error('A claim is already open for this protected purchase');
    }

    await client.query(
      `INSERT INTO purchase_claims (
         protected_purchase_id,
         claimant_agent_id,
         claim_type,
         status,
         reason_text,
         evidence
       ) VALUES ($1, $2, $3, 'open', $4, $5::jsonb)`,
      [
        params.protectedPurchaseId,
        purchase.buyer_agent_id,
        params.claimType,
        params.reasonText ?? null,
        JSON.stringify(params.evidence ?? {}),
      ],
    );

    await client.query(
      `UPDATE protected_intel_purchases
       SET status = 'claimed'
       WHERE id = $1`,
      [params.protectedPurchaseId],
    );
  });

  const view = await getProtectedIntelPurchaseView(params.protectedPurchaseId);
  if (!view) {
    throw new Error('Protected purchase disappeared after claim creation');
  }
  return view;
}

export async function resolveProtectedPurchaseClaim(params: {
  claimId: number;
  decision: ClaimDecision;
  decisionReason?: string;
  evaluatorAuthToken?: string | null;
}): Promise<ProtectedIntelPurchaseView> {
  assertTokenGate('evaluator', params.evaluatorAuthToken);

  const pool = getPool();
  const claimResult = await pool.query<ClaimRow>(
    'SELECT * FROM purchase_claims WHERE id = $1',
    [params.claimId],
  );

  if (claimResult.rows.length === 0) {
    throw new Error('Claim not found');
  }

  const claim = mapClaimRow(claimResult.rows[0]);
  if (claim.status === 'resolved') {
    throw new Error('Claim already resolved');
  }

  const purchase = await getProtectedIntelPurchaseRecord(claim.protectedPurchaseId);
  if (!purchase) {
    throw new Error('Protected purchase not found');
  }

  const acpJobResult = await pool.query<{ evaluator_address: string }>(
    `SELECT evaluator_address
     FROM acp_jobs
     WHERE id = $1`,
    [purchase.principalAcpJobId ?? null],
  );
  const configuredEvaluatorAddress = acpJobResult.rows[0]?.evaluator_address?.toLowerCase() ?? null;

  if (!configuredEvaluatorAddress) {
    throw new Error('Protected purchase is missing an evaluator address');
  }

  if (claim.status === 'open') {
    await withTransaction(async (client) => {
      const lockedClaim = await client.query<ClaimRow>(
        'SELECT * FROM purchase_claims WHERE id = $1 FOR UPDATE',
        [params.claimId],
      );
      if (lockedClaim.rows.length === 0) {
        throw new Error('Claim not found');
      }

      const currentClaim = mapClaimRow(lockedClaim.rows[0]);
      if (currentClaim.status === 'resolved') {
        throw new Error('Claim already resolved');
      }

      const lockedPurchase = await client.query<{
        id: number;
        status: string;
      }>(
        'SELECT id, status FROM protected_intel_purchases WHERE id = $1 FOR UPDATE',
        [claim.protectedPurchaseId],
      );
      if (lockedPurchase.rows.length === 0) {
        throw new Error('Protected purchase not found');
      }

      if (lockedPurchase.rows[0].status !== 'claimed') {
        throw new Error(`Protected purchase cannot enter settlement from status ${lockedPurchase.rows[0].status}`);
      }

      await client.query(
        `UPDATE purchase_claims
         SET status = 'resolving',
             decision = $2,
             decision_reason = $3,
             evaluator_address = $4
         WHERE id = $1`,
        [
          params.claimId,
          params.decision,
          params.decisionReason ?? currentClaim.decisionReason ?? null,
          configuredEvaluatorAddress,
        ],
      );

      await client.query(
        `UPDATE protected_intel_purchases
         SET status = 'settling'
         WHERE id = $1`,
        [claim.protectedPurchaseId],
      );

      await updateProtectedIntelPurchaseRecord({
        protectedPurchaseId: claim.protectedPurchaseId,
        metadata: {
          settlementOutcome: params.decision,
          settlementRequestedBy: 'claim_resolution',
          settlementRequestedAt: new Date().toISOString(),
          settlementLastError: null,
        },
      }, client);
    });
  }

  if (claim.status === 'resolving' && claim.decision && claim.decision !== params.decision) {
    throw new Error('Claim is already being resolved with a different decision');
  }

  const settlementOutcome = (claim.decision ?? params.decision) === 'refund' ? 'refund' : 'release';
  try {
    await finalizeIntelPurchaseSettlement({
      acpJobId: purchase.principalAcpJobId ?? 0,
      outcome: settlementOutcome,
      reason: params.decisionReason ?? claim.decisionReason ?? `protected_intel_${settlementOutcome}_${purchase.id}`,
    });
  } catch (error) {
    await updateProtectedIntelPurchaseRecord({
      protectedPurchaseId: purchase.id,
      status: 'settling',
      metadata: {
        settlementOutcome,
        settlementRequestedBy: 'claim_resolution',
        settlementRequestedAt: new Date().toISOString(),
        settlementLastError: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }

  await persistClaimSettlementOutcome({
    claimId: params.claimId,
    protectedPurchaseId: purchase.id,
    decision: claim.decision ?? params.decision,
    decisionReason: params.decisionReason ?? claim.decisionReason ?? null,
    evaluatorAddress: configuredEvaluatorAddress,
  });

  const sellerTokenId = await loadSellerToken(purchase.sellerAgentId);
  if (sellerTokenId) {
    await reputationRegistry.reportProtectedIntelOutcome({
      buyerAgentId: purchase.buyerAgentId,
      producerAgentId: purchase.sellerAgentId,
      producerTokenId: sellerTokenId,
      outcome: settlementOutcome,
      protectedPurchaseId: purchase.id,
      claimId: claim.id,
    });
  }

  const view = await getProtectedIntelPurchaseView(purchase.id);
  if (!view) {
    throw new Error('Protected purchase disappeared after claim resolution');
  }
  return view;
}

export async function runChallengeWindowReleaseCycle(): Promise<number> {
  const pool = getPool();
  const due = await pool.query<{
    id: number;
    principal_acp_job_id: number | null;
    buyer_agent_id: string;
    seller_agent_id: string;
    status: string;
  }>(
    `SELECT id, principal_acp_job_id, buyer_agent_id, seller_agent_id, status
     FROM protected_intel_purchases
     WHERE (
       status = 'challenge_window'
       OR (
         status = 'settling'
         AND metadata->>'settlementRequestedBy' = 'challenge_window_worker'
         AND metadata->>'settlementOutcome' = 'release'
       )
     )
       AND challenge_deadline IS NOT NULL
       AND challenge_deadline <= CURRENT_TIMESTAMP
     ORDER BY challenge_deadline ASC
     LIMIT 20`,
  );

  let released = 0;
  for (const row of due.rows) {
    try {
      if (row.principal_acp_job_id == null) {
        throw new Error('Protected purchase is missing an ACP job id');
      }

      if (row.status === 'challenge_window') {
        await withTransaction(async (client) => {
          const locked = await client.query<{ status: string }>(
            'SELECT status FROM protected_intel_purchases WHERE id = $1 FOR UPDATE',
            [row.id],
          );
          if (locked.rows.length === 0) {
            throw new Error('Protected purchase not found');
          }
          if (locked.rows[0].status !== 'challenge_window') {
            return;
          }

          await client.query(
            `UPDATE protected_intel_purchases
             SET status = 'settling'
             WHERE id = $1`,
            [row.id],
          );
          await updateProtectedIntelPurchaseRecord({
            protectedPurchaseId: row.id,
            metadata: {
              settlementOutcome: 'release',
              settlementRequestedBy: 'challenge_window_worker',
              settlementRequestedAt: new Date().toISOString(),
              settlementLastError: null,
            },
          }, client);
        });
      }

      await finalizeIntelPurchaseSettlement({
        acpJobId: row.principal_acp_job_id,
        outcome: 'release',
        reason: `protected_intel_deadline_release_${row.id}`,
      });

      await pool.query(
        `UPDATE protected_intel_purchases
         SET status = 'released',
             released_at = COALESCE(released_at, CURRENT_TIMESTAMP)
         WHERE id = $1
           AND status = 'settling'`,
        [row.id],
      );

      await updateProtectedIntelPurchaseRecord({
        protectedPurchaseId: row.id,
        metadata: {
          settlementOutcome: 'release',
          settlementRequestedBy: 'challenge_window_worker',
          settlementRequestedAt: new Date().toISOString(),
          settlementLastError: null,
          settlementFinalizedAt: new Date().toISOString(),
        },
      });

      const sellerTokenId = await loadSellerToken(row.seller_agent_id);
      if (sellerTokenId) {
        await reputationRegistry.reportProtectedIntelOutcome({
          buyerAgentId: row.buyer_agent_id,
          producerAgentId: row.seller_agent_id,
          producerTokenId: sellerTokenId,
          outcome: 'release',
          protectedPurchaseId: row.id,
        });
      }

      released += 1;
    } catch (error) {
      await updateProtectedIntelPurchaseRecord({
        protectedPurchaseId: row.id,
        status: 'settling',
        metadata: {
          settlementOutcome: 'release',
          settlementRequestedBy: 'challenge_window_worker',
          settlementRequestedAt: new Date().toISOString(),
          settlementLastError: error instanceof Error ? error.message : String(error),
        },
      }).catch(() => undefined);
      console.warn('[RiskOS] challenge window release failed:', row.id, error);
    }
  }

  return released;
}

export async function runClaimResolutionRecoveryCycle(): Promise<number> {
  const pool = getPool();
  const pending = await pool.query<{
    claim_id: number;
    protected_purchase_id: number;
    buyer_agent_id: string;
    seller_agent_id: string;
    principal_acp_job_id: number | null;
    decision: ClaimDecision;
    decision_reason: string | null;
    evaluator_address: string | null;
  }>(
    `SELECT
       c.id AS claim_id,
       c.protected_purchase_id,
       p.buyer_agent_id,
       p.seller_agent_id,
       p.principal_acp_job_id,
       c.decision,
       c.decision_reason,
       c.evaluator_address
     FROM purchase_claims c
     JOIN protected_intel_purchases p ON p.id = c.protected_purchase_id
     WHERE c.status = 'resolving'
       AND c.decision IS NOT NULL
       AND p.status = 'settling'
       AND p.metadata->>'settlementRequestedBy' = 'claim_resolution'
     ORDER BY c.id ASC
     LIMIT 20`,
  );

  let recovered = 0;
  for (const row of pending.rows) {
    try {
      if (row.principal_acp_job_id == null) {
        throw new Error('Protected purchase is missing an ACP job id');
      }
      if (!row.evaluator_address) {
        throw new Error('Claim resolution is missing an evaluator address');
      }

      await finalizeIntelPurchaseSettlement({
        acpJobId: row.principal_acp_job_id,
        outcome: row.decision === 'refund' ? 'refund' : 'release',
        reason: row.decision_reason ?? `protected_intel_${row.decision}_${row.protected_purchase_id}`,
      });

      await persistClaimSettlementOutcome({
        claimId: row.claim_id,
        protectedPurchaseId: row.protected_purchase_id,
        decision: row.decision,
        decisionReason: row.decision_reason,
        evaluatorAddress: row.evaluator_address,
      });

      const sellerTokenId = await loadSellerToken(row.seller_agent_id);
      if (sellerTokenId) {
        await reputationRegistry.reportProtectedIntelOutcome({
          buyerAgentId: row.buyer_agent_id,
          producerAgentId: row.seller_agent_id,
          producerTokenId: sellerTokenId,
          outcome: row.decision === 'refund' ? 'refund' : 'release',
          protectedPurchaseId: row.protected_purchase_id,
          claimId: row.claim_id,
        });
      }

      recovered += 1;
    } catch (error) {
      await updateProtectedIntelPurchaseRecord({
        protectedPurchaseId: row.protected_purchase_id,
        status: 'settling',
        metadata: {
          settlementOutcome: row.decision === 'refund' ? 'refund' : 'release',
          settlementRequestedBy: 'claim_resolution',
          settlementRequestedAt: new Date().toISOString(),
          settlementLastError: error instanceof Error ? error.message : String(error),
        },
      }).catch(() => undefined);
      console.warn('[RiskOS] claim resolution recovery failed:', row.claim_id, error);
    }
  }

  return recovered;
}
