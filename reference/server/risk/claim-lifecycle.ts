import { ethers } from 'ethers';
import { getPool, withTransaction } from '../db/postgres.js';
import { getXLayerNetwork, isStrictOnchainMode } from '../config/xlayer.js';
import { finalizeIntelPurchaseSettlement } from '../erc8183/hooks/intel-hook.js';
import { reputationRegistry } from '../erc8004/reputation-registry.js';
import { isLLMConfigured, llmText } from '../llm/text.js';
import {
  getProtectedIntelPurchaseRecord,
  getProtectedIntelPurchaseView,
  updateProtectedIntelPurchaseRecord,
} from './protected-purchase.js';
import type {
  ClaimDecision,
  ClaimType,
  ProtectedIntelPurchaseRecord,
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

export interface EvaluatorResolutionProof {
  claimId: number;
  protectedPurchaseId: number;
  evaluatorAddress: string;
  decision: ClaimDecision;
  decisionReason: string;
  decisionReasonHash: string;
  message: string;
}

export interface ClaimCreationProof {
  protectedPurchaseId: number;
  claimantAgentId: string;
  claimantAddress: string;
  claimType: ClaimType;
  reasonText: string;
  reasonTextHash: string;
  message: string;
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

function normalizeDecisionReason(value?: string | null): string {
  return value?.trim() ?? '';
}

function normalizeClaimReason(value?: string | null): string {
  return value?.trim() ?? '';
}

export function buildEvaluatorResolutionProof(params: {
  claimId: number;
  protectedPurchaseId: number;
  evaluatorAddress: string;
  decision: ClaimDecision;
  decisionReason?: string | null;
}): EvaluatorResolutionProof {
  const evaluatorAddress = ethers.getAddress(params.evaluatorAddress);
  const decisionReason = normalizeDecisionReason(params.decisionReason);
  const decisionReasonHash = ethers.id(decisionReason || 'NO_REASON');
  const message = [
    'Civilis Risk OS Evaluator Resolution',
    `claimId:${params.claimId}`,
    `protectedPurchaseId:${params.protectedPurchaseId}`,
    `decision:${params.decision}`,
    `decisionReasonHash:${decisionReasonHash}`,
    `evaluator:${evaluatorAddress}`,
    'chainId:196',
  ].join('\n');

  return {
    claimId: params.claimId,
    protectedPurchaseId: params.protectedPurchaseId,
    evaluatorAddress,
    decision: params.decision,
    decisionReason,
    decisionReasonHash,
    message,
  };
}

export function buildClaimCreationProof(params: {
  protectedPurchaseId: number;
  claimantAgentId: string;
  claimantAddress: string;
  claimType: ClaimType;
  reasonText?: string | null;
}): ClaimCreationProof {
  const claimantAddress = ethers.getAddress(params.claimantAddress);
  const reasonText = normalizeClaimReason(params.reasonText);
  const reasonTextHash = ethers.id(reasonText || 'NO_REASON');
  const message = [
    'Civilis Risk OS Claim Creation',
    `protectedPurchaseId:${params.protectedPurchaseId}`,
    `claimantAgentId:${params.claimantAgentId}`,
    `claimant:${claimantAddress}`,
    `claimType:${params.claimType}`,
    `reasonTextHash:${reasonTextHash}`,
    'chainId:196',
  ].join('\n');

  return {
    protectedPurchaseId: params.protectedPurchaseId,
    claimantAgentId: params.claimantAgentId,
    claimantAddress,
    claimType: params.claimType,
    reasonText,
    reasonTextHash,
    message,
  };
}

function readConfiguredToken(kind: 'claimant' | 'evaluator'): string | null {
  const value = kind === 'claimant'
    ? process.env.RISK_OS_CLAIMANT_AUTH_TOKEN
    : process.env.RISK_OS_EVALUATOR_AUTH_TOKEN;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function isAuthBypassExplicitlyAllowed(): boolean {
  const value = process.env.RISK_OS_ALLOW_UNAUTHENTICATED_DEV?.trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

function isRoleProofRequired(): boolean {
  if (isAuthBypassExplicitlyAllowed()) {
    return false;
  }
  return true;
}

function isLLMEvaluatorEnabled(): boolean {
  const value = process.env.RISK_OS_ENABLE_LLM_EVALUATOR?.trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

function readLLMModelLabel(): string {
  return process.env.LLM_MODEL?.trim() || process.env.LLM_OBSERVER_MODEL?.trim() || 'configured_llm';
}

interface ClaimResolutionContext {
  claim: PurchaseClaimRecord;
  purchase: ProtectedIntelPurchaseRecord;
  configuredEvaluatorAddress: string;
}

interface EvaluatorDecisionAdvisory {
  decision: ClaimDecision;
  reasoning: string;
  confidence: number;
  model: string;
}

interface ClaimCreationContext {
  purchase: ProtectedIntelPurchaseRecord;
  claimantAddress: string;
}

interface ProtectedOutcomeRepricingContext {
  protectedPurchaseId: number;
  buyerAgentId: string;
  sellerAgentId: string;
  outcome: 'release' | 'refund';
  claimId?: number | null;
  requestedBy: 'claim_resolution' | 'challenge_window_worker';
}

async function loadClaimResolutionContext(claimId: number): Promise<ClaimResolutionContext> {
  const pool = getPool();
  const claimResult = await pool.query<ClaimRow>(
    'SELECT * FROM purchase_claims WHERE id = $1',
    [claimId],
  );

  if (claimResult.rows.length === 0) {
    throw new Error('Claim not found');
  }

  const claim = mapClaimRow(claimResult.rows[0]);
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

  return {
    claim,
    purchase,
    configuredEvaluatorAddress,
  };
}

async function loadClaimCreationContext(protectedPurchaseId: number): Promise<ClaimCreationContext> {
  const purchase = await getProtectedIntelPurchaseRecord(protectedPurchaseId);
  if (!purchase) {
    throw new Error('Protected purchase not found');
  }

  const pool = getPool();
  const buyerResult = await pool.query<{ wallet_address: string | null }>(
    `SELECT wallet_address
     FROM agents
     WHERE agent_id = $1`,
    [purchase.buyerAgentId],
  );

  const claimantAddress = buyerResult.rows[0]?.wallet_address;
  if (!claimantAddress) {
    throw new Error('Protected purchase buyer is missing a wallet address');
  }

  return {
    purchase,
    claimantAddress,
  };
}

async function maybeGenerateEvaluatorDecisionAdvisory(
  context: ClaimResolutionContext,
): Promise<EvaluatorDecisionAdvisory | null> {
  if (!isLLMEvaluatorEnabled() || !isLLMConfigured('observer')) {
    return null;
  }

  const pool = getPool();
  const intelResult = await pool.query<{
    category: string;
    content: Record<string, unknown>;
  }>(
    `SELECT category, content
     FROM intel_items
     WHERE id = $1`,
    [context.purchase.intelItemId],
  );

  const intel = intelResult.rows[0];
  if (!intel) {
    return null;
  }

  const intelSummary = readIntelSummary(intel.content);
  const intelData = readIntelData(intel.content);
  const response = await llmText({
    systemPrompt: [
      'You are the evaluator advisor for Civilis Risk OS.',
      'Return strict JSON only with keys decision, reasoning, confidence.',
      'decision must be exactly "refund" or "release".',
      'reasoning must be concise, concrete, and tied to the claim.',
      'confidence must be a number between 0 and 1.',
      'Refund only when the claim plausibly shows the intel was misleading, invalid, incomplete, or not delivered as quoted.',
      'Release when the claim does not justify refunding the protected purchase.',
    ].join(' '),
    userPrompt: JSON.stringify({
      protectedPurchaseId: context.purchase.id,
      intelItemId: context.purchase.intelItemId,
      intelCategory: intel.category,
      intelSummary,
      intelData,
      claimType: context.claim.claimType,
      claimReason: context.claim.reasonText,
      purchaseMode: context.purchase.mode,
      principalAmount: context.purchase.principalAmount,
      premiumAmount: context.purchase.premiumAmount,
    }),
    maxTokens: 220,
    temperature: 0.1,
    retries: 1,
    scope: 'observer',
  });

  if (!response) {
    return null;
  }

  return parseEvaluatorDecisionAdvisory(response);
}

function parseEvaluatorDecisionAdvisory(raw: string): EvaluatorDecisionAdvisory | null {
  const trimmed = raw.trim();
  const jsonCandidate = extractFirstJsonObject(trimmed) ?? trimmed;

  try {
    const parsed = JSON.parse(jsonCandidate) as {
      decision?: unknown;
      reasoning?: unknown;
      confidence?: unknown;
    };
    const decision = parsed.decision === 'refund' || parsed.decision === 'release'
      ? parsed.decision
      : null;
    const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning.trim() : '';
    const confidence = readConfidence(parsed.confidence);

    if (!decision || !reasoning || confidence == null) {
      return null;
    }

    return {
      decision,
      reasoning,
      confidence,
      model: readLLMModelLabel(),
    };
  } catch {
    return null;
  }
}

function extractFirstJsonObject(value: string): string | null {
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return value.slice(start, end + 1);
}

function readIntelSummary(content: Record<string, unknown>): string {
  const summary = content.summary;
  if (typeof summary === 'string' && summary.trim().length > 0) {
    return summary.trim();
  }
  return JSON.stringify(content).slice(0, 800);
}

function readIntelData(content: Record<string, unknown>): Record<string, unknown> {
  const data = content.data;
  return data && typeof data === 'object' && !Array.isArray(data)
    ? data as Record<string, unknown>
    : {};
}

function readConfidence(value: unknown): number | null {
  const raw = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(raw)) {
    return null;
  }

  const bounded = Math.max(0, Math.min(1, raw));
  return Number(bounded.toFixed(4));
}

function verifyEvaluatorSignature(params: {
  signature?: string | null;
  configuredEvaluatorAddress: string;
  proof: EvaluatorResolutionProof;
}): void {
  if (!params.signature) {
    throw new Error('A valid evaluator signature is required when no evaluator auth token is supplied');
  }

  let recoveredAddress: string;
  try {
    recoveredAddress = ethers.verifyMessage(params.proof.message, params.signature).toLowerCase();
  } catch (error) {
    throw new Error(`Invalid evaluator signature: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (recoveredAddress !== params.configuredEvaluatorAddress) {
    throw new Error('Evaluator signature does not match the configured evaluator address');
  }
}

function verifyClaimantSignature(params: {
  signature?: string | null;
  claimantAddress: string;
  proof: ClaimCreationProof;
}): void {
  if (!params.signature) {
    throw new Error('A valid claimant signature is required when no claimant auth token is supplied');
  }

  let recoveredAddress: string;
  try {
    recoveredAddress = ethers.verifyMessage(params.proof.message, params.signature).toLowerCase();
  } catch (error) {
    throw new Error(`Invalid claimant signature: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (recoveredAddress !== params.claimantAddress.toLowerCase()) {
    throw new Error('Claimant signature does not match the protected purchase buyer wallet');
  }
}

function assertClaimantAuthorization(params: {
  protectedPurchaseId: number;
  claimantAgentId: string;
  claimantAddress: string;
  claimType: ClaimType;
  reasonText?: string | null;
  claimantAuthToken?: string | null;
  claimantSignature?: string | null;
}): ClaimCreationProof {
  const proof = buildClaimCreationProof({
    protectedPurchaseId: params.protectedPurchaseId,
    claimantAgentId: params.claimantAgentId,
    claimantAddress: params.claimantAddress,
    claimType: params.claimType,
    reasonText: params.reasonText,
  });
  const configuredToken = readConfiguredToken('claimant');
  const hasMatchingToken = Boolean(
    configuredToken &&
    params.claimantAuthToken &&
    params.claimantAuthToken === configuredToken,
  );
  const hasSignature = Boolean(params.claimantSignature?.trim());

  if (hasMatchingToken) {
    return proof;
  }

  if (hasSignature) {
    verifyClaimantSignature({
      signature: params.claimantSignature,
      claimantAddress: params.claimantAddress,
      proof,
    });
    return proof;
  }

  if (configuredToken && isRoleProofRequired()) {
    throw new Error('A valid claimant auth token or claimant signature is required');
  }

  if (configuredToken) {
    throw new Error('Invalid claimant auth token');
  }

  if (isRoleProofRequired()) {
    throw new Error('A valid claimant signature is required when no claimant auth token is configured');
  }

  return proof;
}

function assertEvaluatorAuthorization(params: {
  claimId: number;
  protectedPurchaseId: number;
  configuredEvaluatorAddress: string;
  decision: ClaimDecision;
  decisionReason?: string | null;
  evaluatorAuthToken?: string | null;
  evaluatorSignature?: string | null;
}): EvaluatorResolutionProof {
  const proof = buildEvaluatorResolutionProof({
    claimId: params.claimId,
    protectedPurchaseId: params.protectedPurchaseId,
    evaluatorAddress: params.configuredEvaluatorAddress,
    decision: params.decision,
    decisionReason: params.decisionReason,
  });
  const configuredToken = readConfiguredToken('evaluator');
  const hasMatchingToken = Boolean(
    configuredToken &&
    params.evaluatorAuthToken &&
    params.evaluatorAuthToken === configuredToken,
  );
  const hasSignature = Boolean(params.evaluatorSignature?.trim());

  if (hasMatchingToken) {
    return proof;
  }

  if (hasSignature) {
    verifyEvaluatorSignature({
      signature: params.evaluatorSignature,
      configuredEvaluatorAddress: params.configuredEvaluatorAddress,
      proof,
    });
    return proof;
  }

  if (configuredToken && isRoleProofRequired()) {
    throw new Error('A valid evaluator auth token or evaluator signature is required');
  }

  if (configuredToken) {
    throw new Error('Invalid evaluator auth token');
  }

  if (isRoleProofRequired()) {
    throw new Error('A valid evaluator signature is required when no evaluator auth token is configured');
  }

  return proof;
}

export async function getEvaluatorResolutionProof(params: {
  claimId: number;
  decision?: ClaimDecision;
  decisionReason?: string | null;
}): Promise<EvaluatorResolutionProof> {
  const context = await loadClaimResolutionContext(params.claimId);
  if (context.claim.status === 'resolved') {
    throw new Error('Claim already resolved');
  }

  const advisory = await maybeGenerateEvaluatorDecisionAdvisory(context);
  const effectiveDecision = params.decision ?? advisory?.decision;
  if (!effectiveDecision) {
    throw new Error('A decision is required unless LLM evaluator advisory is enabled and configured');
  }
  const effectiveDecisionReason = params.decisionReason ?? advisory?.reasoning ?? null;

  return buildEvaluatorResolutionProof({
    claimId: context.claim.id,
    protectedPurchaseId: context.purchase.id,
    evaluatorAddress: context.configuredEvaluatorAddress,
    decision: effectiveDecision,
    decisionReason: effectiveDecisionReason,
  });
}

export async function getClaimCreationProof(params: {
  protectedPurchaseId: number;
  claimType: ClaimType;
  reasonText?: string | null;
}): Promise<ClaimCreationProof> {
  const { purchase, claimantAddress } = await loadClaimCreationContext(params.protectedPurchaseId);
  return buildClaimCreationProof({
    protectedPurchaseId: purchase.id,
    claimantAgentId: purchase.buyerAgentId,
    claimantAddress,
    claimType: params.claimType,
    reasonText: params.reasonText,
  });
}

async function loadSellerToken(producerAgentId: string): Promise<number | null> {
  const pool = getPool();
  const result = await pool.query<{ erc8004_token_id: number | null }>(
    'SELECT erc8004_token_id FROM agents WHERE agent_id = $1',
    [producerAgentId],
  );
  return result.rows[0]?.erc8004_token_id ?? null;
}

async function markProtectedOutcomeRepricingQueued(context: ProtectedOutcomeRepricingContext): Promise<void> {
  await updateProtectedIntelPurchaseRecord({
    protectedPurchaseId: context.protectedPurchaseId,
    metadata: {
      repricingState: 'pending',
      repricingOutcome: context.outcome,
      repricingClaimId: context.claimId ?? null,
      repricingQueuedAt: new Date().toISOString(),
      repricingRequestedBy: context.requestedBy,
      repricingLastError: null,
      repricingSyncedAt: null,
    },
  });
}

async function syncProtectedOutcomeRepricing(context: ProtectedOutcomeRepricingContext): Promise<boolean> {
  const sellerTokenId = await loadSellerToken(context.sellerAgentId);
  if (!sellerTokenId) {
    await updateProtectedIntelPurchaseRecord({
      protectedPurchaseId: context.protectedPurchaseId,
      metadata: {
        repricingState: 'skipped_missing_token',
        repricingOutcome: context.outcome,
        repricingClaimId: context.claimId ?? null,
        repricingRequestedBy: context.requestedBy,
        repricingSyncedAt: new Date().toISOString(),
        repricingLastError: null,
      },
    }).catch(() => undefined);
    return false;
  }

  try {
    await reputationRegistry.reportProtectedIntelOutcome({
      buyerAgentId: context.buyerAgentId,
      producerAgentId: context.sellerAgentId,
      producerTokenId: sellerTokenId,
      outcome: context.outcome,
      protectedPurchaseId: context.protectedPurchaseId,
      claimId: context.claimId ?? undefined,
    });

    await updateProtectedIntelPurchaseRecord({
      protectedPurchaseId: context.protectedPurchaseId,
      metadata: {
        repricingState: 'synced',
        repricingOutcome: context.outcome,
        repricingClaimId: context.claimId ?? null,
        repricingRequestedBy: context.requestedBy,
        repricingSyncedAt: new Date().toISOString(),
        repricingLastError: null,
      },
    });
    return true;
  } catch (error) {
    await updateProtectedIntelPurchaseRecord({
      protectedPurchaseId: context.protectedPurchaseId,
      metadata: {
        repricingState: 'error',
        repricingOutcome: context.outcome,
        repricingClaimId: context.claimId ?? null,
        repricingRequestedBy: context.requestedBy,
        repricingLastError: error instanceof Error ? error.message : String(error),
      },
    }).catch(() => undefined);
    return false;
  }
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
          repricingState: 'pending',
          repricingOutcome: settlementOutcome,
          repricingClaimId: params.claimId,
          repricingQueuedAt: new Date().toISOString(),
          repricingRequestedBy: 'claim_resolution',
          repricingLastError: null,
          repricingSyncedAt: null,
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
  claimantSignature?: string | null;
}): Promise<ProtectedIntelPurchaseView> {
  const { purchase, claimantAddress } = await loadClaimCreationContext(params.protectedPurchaseId);
  assertClaimantAuthorization({
    protectedPurchaseId: purchase.id,
    claimantAgentId: purchase.buyerAgentId,
    claimantAddress,
    claimType: params.claimType,
    reasonText: params.reasonText,
    claimantAuthToken: params.claimantAuthToken,
    claimantSignature: params.claimantSignature,
  });

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
  decision?: ClaimDecision;
  decisionReason?: string;
  evaluatorAuthToken?: string | null;
  evaluatorSignature?: string | null;
}): Promise<ProtectedIntelPurchaseView> {
  const { claim, purchase, configuredEvaluatorAddress } = await loadClaimResolutionContext(params.claimId);
  if (claim.status === 'resolved') {
    throw new Error('Claim already resolved');
  }

  const advisory = await maybeGenerateEvaluatorDecisionAdvisory({
    claim,
    purchase,
    configuredEvaluatorAddress,
  });
  const effectiveDecision = params.decision ?? claim.decision ?? advisory?.decision;
  if (!effectiveDecision) {
    throw new Error('A decision is required unless LLM evaluator advisory is enabled and configured');
  }
  const effectiveDecisionReason = params.decisionReason ?? claim.decisionReason ?? advisory?.reasoning ?? null;

  const proof = assertEvaluatorAuthorization({
    claimId: claim.id,
    protectedPurchaseId: purchase.id,
    configuredEvaluatorAddress,
    decision: effectiveDecision,
    decisionReason: effectiveDecisionReason,
    evaluatorAuthToken: params.evaluatorAuthToken,
    evaluatorSignature: params.evaluatorSignature,
  });
  const pool = getPool();

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
          effectiveDecision,
          effectiveDecisionReason ?? currentClaim.decisionReason ?? null,
          proof.evaluatorAddress.toLowerCase(),
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
          settlementOutcome: effectiveDecision,
          settlementRequestedBy: 'claim_resolution',
          settlementRequestedAt: new Date().toISOString(),
          settlementLastError: null,
          evaluatorAdvisoryDecision: advisory?.decision ?? null,
          evaluatorAdvisoryConfidence: advisory?.confidence ?? null,
          evaluatorAdvisoryModel: advisory?.model ?? null,
          evaluatorAdvisoryApplied: params.decision == null && params.decisionReason == null && advisory != null,
          evaluatorAdvisoryReasoning: advisory?.reasoning ?? null,
        },
      }, client);
    });
  }

  if (claim.status === 'resolving' && claim.decision && claim.decision !== effectiveDecision) {
    throw new Error('Claim is already being resolved with a different decision');
  }

  const settlementOutcome = effectiveDecision === 'refund' ? 'refund' : 'release';
  try {
    await finalizeIntelPurchaseSettlement({
      acpJobId: purchase.principalAcpJobId ?? 0,
      outcome: settlementOutcome,
      reason: effectiveDecisionReason ?? `protected_intel_${settlementOutcome}_${purchase.id}`,
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
    decision: effectiveDecision,
    decisionReason: effectiveDecisionReason,
    evaluatorAddress: proof.evaluatorAddress.toLowerCase(),
  });

  await syncProtectedOutcomeRepricing({
    protectedPurchaseId: purchase.id,
    buyerAgentId: purchase.buyerAgentId,
    sellerAgentId: purchase.sellerAgentId,
    outcome: settlementOutcome,
    claimId: claim.id,
    requestedBy: 'claim_resolution',
  });

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
          repricingState: 'pending',
          repricingOutcome: 'release',
          repricingClaimId: null,
          repricingQueuedAt: new Date().toISOString(),
          repricingRequestedBy: 'challenge_window_worker',
          repricingLastError: null,
          repricingSyncedAt: null,
        },
      });

      await syncProtectedOutcomeRepricing({
        protectedPurchaseId: row.id,
        buyerAgentId: row.buyer_agent_id,
        sellerAgentId: row.seller_agent_id,
        outcome: 'release',
        claimId: null,
        requestedBy: 'challenge_window_worker',
      });

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

export async function runPendingDeliveryRecoveryCycle(): Promise<number> {
  const pool = getPool();
  const pending = await pool.query<{
    id: number;
    intel_item_id: number;
    seller_agent_id: string;
    principal_acp_job_id: number | null;
    deliverable_hash: string | null;
  }>(
    `SELECT id, intel_item_id, seller_agent_id, principal_acp_job_id, deliverable_hash
     FROM protected_intel_purchases
     WHERE status = 'pending_delivery'
     ORDER BY created_at ASC
     LIMIT 20`,
  );

  let recovered = 0;
  for (const row of pending.rows) {
    try {
      if (row.principal_acp_job_id == null) {
        throw new Error('Protected purchase is missing an ACP job id');
      }

      const acpResult = await pool.query<{ status: string }>(
        'SELECT status FROM acp_jobs WHERE id = $1',
        [row.principal_acp_job_id],
      );
      const acpStatus = acpResult.rows[0]?.status ?? null;
      if (!acpStatus) {
        throw new Error('ACP job not found for protected purchase');
      }

      if (acpStatus === 'submitted') {
        await updateProtectedIntelPurchaseRecord({
          protectedPurchaseId: row.id,
          status: 'challenge_window',
          metadata: {
            deliverySubmissionState: 'submitted',
            deliveryRecoveredBy: 'pending_delivery_worker',
            deliveryRecoveredAt: new Date().toISOString(),
            deliveryError: null,
          },
        });
        recovered += 1;
        continue;
      }

      if (acpStatus === 'completed') {
        await updateProtectedIntelPurchaseRecord({
          protectedPurchaseId: row.id,
          status: 'released',
          metadata: {
            deliverySubmissionState: 'submitted',
            deliveryRecoveredBy: 'pending_delivery_worker',
            deliveryRecoveredAt: new Date().toISOString(),
            settlementRecoveredFromAcpStatus: 'completed',
            deliveryError: null,
          },
        });
        recovered += 1;
        continue;
      }

      if (acpStatus === 'rejected') {
        await updateProtectedIntelPurchaseRecord({
          protectedPurchaseId: row.id,
          status: 'refunded',
          metadata: {
            deliverySubmissionState: 'submitted',
            deliveryRecoveredBy: 'pending_delivery_worker',
            deliveryRecoveredAt: new Date().toISOString(),
            settlementRecoveredFromAcpStatus: 'rejected',
            deliveryError: null,
          },
        });
        recovered += 1;
        continue;
      }

      await updateProtectedIntelPurchaseRecord({
        protectedPurchaseId: row.id,
        status: 'delivery_failed',
        metadata: {
          deliverySubmissionState: 'unrecovered',
          deliveryRecoveredBy: 'pending_delivery_worker',
          deliveryRecoveredAt: new Date().toISOString(),
          deliveryError: `ACP job is still ${acpStatus}; manual replay required`,
        },
      });
    } catch (error) {
      await updateProtectedIntelPurchaseRecord({
        protectedPurchaseId: row.id,
        status: 'delivery_failed',
        metadata: {
          deliveryRecoveredBy: 'pending_delivery_worker',
          deliveryRecoveredAt: new Date().toISOString(),
          deliveryError: error instanceof Error ? error.message : String(error),
        },
      }).catch(() => undefined);
      console.warn('[RiskOS] pending delivery recovery failed:', row.id, error);
    }
  }

  return recovered;
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

      await syncProtectedOutcomeRepricing({
        protectedPurchaseId: row.protected_purchase_id,
        buyerAgentId: row.buyer_agent_id,
        sellerAgentId: row.seller_agent_id,
        outcome: row.decision === 'refund' ? 'refund' : 'release',
        claimId: row.claim_id,
        requestedBy: 'claim_resolution',
      });

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

export async function runRepricingRecoveryCycle(): Promise<number> {
  const pool = getPool();
  const pending = await pool.query<{
    protected_purchase_id: number;
    buyer_agent_id: string;
    seller_agent_id: string;
    status: 'released' | 'refunded';
    repricing_outcome: 'release' | 'refund' | null;
    repricing_claim_id: string | null;
    repricing_requested_by: 'claim_resolution' | 'challenge_window_worker' | null;
  }>(
    `SELECT
       id AS protected_purchase_id,
       buyer_agent_id,
       seller_agent_id,
       status,
       NULLIF(metadata->>'repricingOutcome', '') AS repricing_outcome,
       NULLIF(metadata->>'repricingClaimId', '') AS repricing_claim_id,
       NULLIF(metadata->>'repricingRequestedBy', '') AS repricing_requested_by
     FROM protected_intel_purchases
     WHERE status IN ('released', 'refunded')
       AND COALESCE(metadata->>'repricingState', 'pending') IN ('pending', 'error')
     ORDER BY id ASC
     LIMIT 20`,
  );

  let recovered = 0;
  for (const row of pending.rows) {
    const outcome = row.repricing_outcome ?? (row.status === 'refunded' ? 'refund' : 'release');
    const requestedBy = row.repricing_requested_by ?? (outcome === 'refund' ? 'claim_resolution' : 'challenge_window_worker');
    const synced = await syncProtectedOutcomeRepricing({
      protectedPurchaseId: row.protected_purchase_id,
      buyerAgentId: row.buyer_agent_id,
      sellerAgentId: row.seller_agent_id,
      outcome,
      claimId: row.repricing_claim_id ? Number(row.repricing_claim_id) : null,
      requestedBy,
    });
    if (synced) {
      recovered += 1;
    }
  }

  return recovered;
}
