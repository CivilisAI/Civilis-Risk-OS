import type { PoolClient } from 'pg';
import { getPool } from '../db/postgres.js';
import type {
  CreateProtectedIntelPurchaseInput,
  ProtectedIntelPurchaseRecord,
  ProtectedIntelPurchaseView,
  PurchaseClaimRecord,
  RiskQuoteRecord,
} from './risk-types.js';

function mapQuote(row: Record<string, unknown> | null | undefined): RiskQuoteRecord | null {
  if (!row) return null;
  return {
    id: Number(row.id),
    domain: 'intel_purchase',
    intelItemId: Number(row.intel_item_id),
    buyerAgentId: String(row.buyer_agent_id),
    sellerAgentId: String(row.seller_agent_id),
    riskScore: Number(row.risk_score),
    recommendedMode: String(row.recommended_mode) as RiskQuoteRecord['recommendedMode'],
    premiumBps: Number(row.premium_bps),
    premiumAmount: Number(row.premium_amount ?? 0),
    claimWindowSeconds: Number(row.claim_window_seconds),
    reasons: Array.isArray(row.reasons) ? (row.reasons as string[]) : [],
    inputs: (row.inputs as Record<string, unknown> | null) ?? {},
    createdAt: String(row.created_at),
    expiresAt: String(row.expires_at),
  };
}

function mapProtectedPurchase(row: Record<string, unknown>): ProtectedIntelPurchaseRecord {
  return {
    id: Number(row.id),
    quoteId: row.quote_id == null ? null : Number(row.quote_id),
    intelItemId: Number(row.intel_item_id),
    intelPurchaseId: row.intel_purchase_id == null ? null : Number(row.intel_purchase_id),
    buyerAgentId: String(row.buyer_agent_id),
    sellerAgentId: String(row.seller_agent_id),
    mode: String(row.mode) as ProtectedIntelPurchaseRecord['mode'],
    status: String(row.status) as ProtectedIntelPurchaseRecord['status'],
    principalAmount: Number(row.principal_amount ?? 0),
    premiumAmount: Number(row.premium_amount ?? 0),
    premiumTxId: row.premium_tx_id == null ? null : Number(row.premium_tx_id),
    principalAcpJobId: row.principal_acp_job_id == null ? null : Number(row.principal_acp_job_id),
    deliverableHash: row.deliverable_hash == null ? null : String(row.deliverable_hash),
    challengeDeadline: row.challenge_deadline == null ? null : String(row.challenge_deadline),
    releasedAt: row.released_at == null ? null : String(row.released_at),
    refundedAt: row.refunded_at == null ? null : String(row.refunded_at),
    metadata: (row.metadata as Record<string, unknown> | null) ?? {},
    createdAt: String(row.created_at),
  };
}

function mapClaim(row: Record<string, unknown> | null | undefined): PurchaseClaimRecord | null {
  if (!row) return null;
  return {
    id: Number(row.id),
    protectedPurchaseId: Number(row.protected_purchase_id),
    claimantAgentId: String(row.claimant_agent_id),
    claimType: String(row.claim_type) as PurchaseClaimRecord['claimType'],
    status: String(row.status) as PurchaseClaimRecord['status'],
    reasonText: row.reason_text == null ? null : String(row.reason_text),
    evidence: (row.evidence as Record<string, unknown> | null) ?? {},
    decision: row.decision == null ? null : (String(row.decision) as PurchaseClaimRecord['decision']),
    decisionReason: row.decision_reason == null ? null : String(row.decision_reason),
    evaluatorAddress: row.evaluator_address == null ? null : String(row.evaluator_address),
    resolvedAt: row.resolved_at == null ? null : String(row.resolved_at),
    createdAt: String(row.created_at),
  };
}

function getExecutor(client?: PoolClient): { query: PoolClient['query'] } {
  return client ?? getPool();
}

export async function createProtectedIntelPurchaseRecord(
  params: CreateProtectedIntelPurchaseInput,
  client?: PoolClient,
): Promise<ProtectedIntelPurchaseRecord> {
  const executor = getExecutor(client);
  const status = params.status ?? (params.principalAcpJobId == null ? 'pending_acp_job' : 'challenge_window');
  const result = await executor.query<Record<string, unknown>>(
    `INSERT INTO protected_intel_purchases (
       quote_id,
       intel_item_id,
       intel_purchase_id,
       buyer_agent_id,
       seller_agent_id,
       mode,
       status,
       principal_amount,
       premium_amount,
       principal_acp_job_id,
       deliverable_hash,
       challenge_deadline,
     metadata
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb
     )
     RETURNING *`,
    [
      params.quoteId,
      params.intelItemId,
      params.intelPurchaseId,
      params.buyerAgentId,
      params.sellerAgentId,
      params.mode,
      status,
      params.principalAmount.toFixed(6),
      params.premiumAmount.toFixed(6),
      params.principalAcpJobId,
      params.deliverableHash,
      params.challengeDeadline.toISOString(),
      JSON.stringify(params.metadata ?? {}),
    ],
  );

  return mapProtectedPurchase(result.rows[0]);
}

export async function updateProtectedIntelPurchaseRecord(
  params: {
    protectedPurchaseId: number;
    principalAcpJobId?: number | null;
    intelPurchaseId?: number | null;
    status?: ProtectedIntelPurchaseRecord['status'];
    metadata?: Record<string, unknown>;
  },
  client?: PoolClient,
): Promise<ProtectedIntelPurchaseRecord | null> {
  const executor = getExecutor(client);
  const existing = await executor.query<Record<string, unknown>>(
    'SELECT * FROM protected_intel_purchases WHERE id = $1',
    [params.protectedPurchaseId],
  );
  if (existing.rows.length === 0) {
    return null;
  }

  const current = existing.rows[0];
  const mergedMetadata = {
    ...((current.metadata as Record<string, unknown> | null) ?? {}),
    ...(params.metadata ?? {}),
  };

  const result = await executor.query<Record<string, unknown>>(
    `UPDATE protected_intel_purchases
     SET principal_acp_job_id = COALESCE($2, principal_acp_job_id),
         intel_purchase_id = COALESCE($3, intel_purchase_id),
         status = COALESCE($4, status),
         metadata = $5::jsonb
     WHERE id = $1
     RETURNING *`,
    [
      params.protectedPurchaseId,
      params.principalAcpJobId ?? null,
      params.intelPurchaseId ?? null,
      params.status ?? null,
      JSON.stringify(mergedMetadata),
    ],
  );

  return result.rows[0] ? mapProtectedPurchase(result.rows[0]) : null;
}

export async function getProtectedIntelPurchaseRecord(
  protectedPurchaseId: number,
): Promise<ProtectedIntelPurchaseRecord | null> {
  const pool = getPool();
  const result = await pool.query<Record<string, unknown>>(
    'SELECT * FROM protected_intel_purchases WHERE id = $1',
    [protectedPurchaseId],
  );
  return result.rows[0] ? mapProtectedPurchase(result.rows[0]) : null;
}

export async function getOpenClaimForProtectedPurchase(
  protectedPurchaseId: number,
): Promise<PurchaseClaimRecord | null> {
  const pool = getPool();
  const result = await pool.query<Record<string, unknown>>(
    `SELECT *
     FROM purchase_claims
     WHERE protected_purchase_id = $1
     ORDER BY id DESC
     LIMIT 1`,
    [protectedPurchaseId],
  );
  return result.rows[0] ? mapClaim(result.rows[0]) : null;
}

export async function getProtectedIntelPurchaseView(
  protectedPurchaseId: number,
): Promise<ProtectedIntelPurchaseView | null> {
  const pool = getPool();
  const purchaseResult = await pool.query<Record<string, unknown>>(
    'SELECT * FROM protected_intel_purchases WHERE id = $1',
    [protectedPurchaseId],
  );

  if (purchaseResult.rows.length === 0) {
    return null;
  }

  const purchase = mapProtectedPurchase(purchaseResult.rows[0]);

  const [quoteResult, claimResult, acpResult] = await Promise.all([
    purchase.quoteId != null
      ? pool.query<Record<string, unknown>>('SELECT * FROM risk_quotes WHERE id = $1', [purchase.quoteId])
      : Promise.resolve({ rows: [] } as { rows: Record<string, unknown>[] }),
    pool.query<Record<string, unknown>>(
      `SELECT *
       FROM purchase_claims
       WHERE protected_purchase_id = $1
       ORDER BY id DESC
       LIMIT 1`,
      [protectedPurchaseId],
    ),
    purchase.principalAcpJobId == null
      ? Promise.resolve({ rows: [] } as {
          rows: {
            id: number;
            on_chain_job_id: number;
            status: string;
            budget: string;
            submitted_at: string | null;
            settled_at: string | null;
            evaluator_address: string;
          }[];
        })
      : pool.query<{
          id: number;
          on_chain_job_id: number;
          status: string;
          budget: string;
          submitted_at: string | null;
          settled_at: string | null;
          evaluator_address: string;
        }>(
          `SELECT id, on_chain_job_id, status, budget, submitted_at, settled_at, evaluator_address
           FROM acp_jobs
           WHERE id = $1`,
          [purchase.principalAcpJobId],
        ),
  ]);

  return {
    purchase,
    quote: quoteResult.rows[0] ? mapQuote(quoteResult.rows[0]) : null,
    claim: claimResult.rows[0] ? mapClaim(claimResult.rows[0]) : null,
    acpJob: acpResult.rows[0]
      ? {
          id: acpResult.rows[0].id,
          onChainJobId: Number(acpResult.rows[0].on_chain_job_id),
          status: acpResult.rows[0].status,
          budget: Number(acpResult.rows[0].budget ?? 0),
          submittedAt: acpResult.rows[0].submitted_at,
          settledAt: acpResult.rows[0].settled_at,
          evaluatorAddress: acpResult.rows[0].evaluator_address,
        }
      : null,
  };
}
