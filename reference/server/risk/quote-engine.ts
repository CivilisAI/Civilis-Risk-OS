import { getPool } from '../db/postgres.js';
import { reputationRegistry } from '../erc8004/reputation-registry.js';
import { validationRegistry } from '../erc8004/validation-registry.js';
import { computeIntelRiskQuote, RISK_QUOTE_TTL_SECONDS } from './risk-policy.js';
import type { RiskQuoteInput, RiskQuoteRecord } from './risk-types.js';

interface QuoteSeedRow {
  intel_item_id: number;
  item_price: string;
  seller_agent_id: string;
  seller_token_id: number | null;
}

interface CreditScoreRow {
  credit_score: string;
  total_verified: number;
  fake_count: number;
}

interface RefundHistoryRow {
  protected_count: string;
  refunded_count: string;
}

function mapQuoteRecord(row: Record<string, unknown>): RiskQuoteRecord {
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

export async function createIntelRiskQuote(params: RiskQuoteInput): Promise<RiskQuoteRecord> {
  const { intelItemId, buyerAgentId } = params;
  const pool = getPool();

  const itemResult = await pool.query<QuoteSeedRow>(
    `SELECT
       i.id AS intel_item_id,
       i.price AS item_price,
       i.producer_agent_id AS seller_agent_id,
       a.erc8004_token_id AS seller_token_id
     FROM intel_items i
     JOIN agents a ON a.agent_id = i.producer_agent_id
     WHERE i.id = $1
       AND i.status = 'active'
       AND i.is_public = false`,
    [intelItemId],
  );

  if (itemResult.rows.length === 0) {
    throw new Error('Intel item not found or not eligible for protected quoting');
  }

  const seed = itemResult.rows[0];
  const price = Number(seed.item_price);

  const [creditResult, refundResult, reputation, validation] = await Promise.all([
    pool.query<CreditScoreRow>(
      `SELECT credit_score, total_verified, fake_count
       FROM intel_credit_scores
       WHERE agent_id = $1`,
      [seed.seller_agent_id],
    ),
    pool.query<RefundHistoryRow>(
      `SELECT
         COUNT(*)::text AS protected_count,
         COUNT(*) FILTER (WHERE status = 'refunded')::text AS refunded_count
       FROM protected_intel_purchases
       WHERE seller_agent_id = $1`,
      [seed.seller_agent_id],
    ),
    seed.seller_token_id
      ? reputationRegistry.getAgentReputation(
          seed.seller_token_id,
          ['intel_accuracy', 'intel_fraud', 'intel_protected_release', 'intel_protected_refund'],
        )
      : Promise.resolve({ count: 0, averageValue: 0, onChainCount: 0, onChainAverageValue: 0 }),
    seed.seller_token_id
      ? validationRegistry.getProducerValidationSummary(seed.seller_token_id, { localOnly: true })
      : Promise.resolve({
          totalValidations: 0,
          averageScore: 50,
          fakeCount: 0,
          verifiedCount: 0,
          onChainCount: 0,
          onChainAverageScore: 0,
        }),
  ]);

  const credit = creditResult.rows[0];
  const refund = refundResult.rows[0];
  const protectedCount = Number(refund?.protected_count ?? 0);
  const refundedCount = Number(refund?.refunded_count ?? 0);
  const historicalRefundRate = protectedCount > 0 ? refundedCount / protectedCount : 0;

  const computed = computeIntelRiskQuote({
    itemPrice: price,
    sellerAgentId: seed.seller_agent_id,
    creditScore: Number(credit?.credit_score ?? 50),
    totalVerified: Number(credit?.total_verified ?? 0),
    fakeCount: Math.max(Number(credit?.fake_count ?? 0), Number(validation.fakeCount ?? 0)),
    reputationAverageValue: Number(reputation.averageValue ?? 0),
    validationAverageScore: Number(validation.averageScore ?? 50),
    historicalRefundRate,
  });

  const expiresAt = new Date(Date.now() + RISK_QUOTE_TTL_SECONDS * 1000);

  const insert = await pool.query<Record<string, unknown>>(
    `INSERT INTO risk_quotes (
       domain,
       intel_item_id,
       buyer_agent_id,
       seller_agent_id,
       risk_score,
       recommended_mode,
       premium_bps,
       premium_amount,
       claim_window_seconds,
       reasons,
       inputs,
       expires_at
     ) VALUES (
       'intel_purchase',
       $1,
       $2,
       $3,
       $4,
       $5,
       $6,
       $7,
       $8,
       $9::jsonb,
       $10::jsonb,
       $11
     )
     RETURNING *`,
    [
      intelItemId,
      buyerAgentId,
      seed.seller_agent_id,
      computed.riskScore,
      computed.recommendedMode,
      computed.premiumBps,
      computed.premiumAmount.toFixed(6),
      computed.claimWindowSeconds,
      JSON.stringify(computed.reasons),
      JSON.stringify(computed.inputs),
      expiresAt.toISOString(),
    ],
  );

  return mapQuoteRecord(insert.rows[0]);
}

export async function getRiskQuoteById(quoteId: number): Promise<RiskQuoteRecord | null> {
  const pool = getPool();
  const result = await pool.query<Record<string, unknown>>(
    'SELECT * FROM risk_quotes WHERE id = $1',
    [quoteId],
  );
  return result.rows[0] ? mapQuoteRecord(result.rows[0]) : null;
}
