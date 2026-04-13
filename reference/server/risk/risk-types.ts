export type RiskDomain = 'intel_purchase';

export type PurchaseProtectionMode = 'instant' | 'challengeable';

export type ProtectedPurchaseStatus =
  | 'pending_acp_job'
  | 'pending_purchase_record'
  | 'pending_delivery'
  | 'challenge_window'
  | 'settling'
  | 'purchase_failed'
  | 'delivery_failed'
  | 'claimed'
  | 'released'
  | 'refunded';

export type ClaimType = 'misleading_or_invalid_intel';

export type ClaimStatus = 'open' | 'resolving' | 'resolved';

export type ClaimDecision = 'release' | 'refund';

export interface RiskQuoteInput {
  intelItemId: number;
  buyerAgentId: string;
}

export interface RiskQuoteComputationInput {
  itemPrice: number;
  sellerAgentId: string;
  creditScore: number;
  totalVerified: number;
  fakeCount: number;
  reputationAverageValue: number;
  validationAverageScore: number;
  historicalRefundRate: number;
}

export interface RiskQuoteComputationResult {
  riskScore: number;
  recommendedMode: PurchaseProtectionMode;
  premiumBps: number;
  premiumAmount: number;
  claimWindowSeconds: number;
  reasons: string[];
  inputs: Record<string, unknown>;
}

export interface RiskQuoteRecord {
  id: number;
  domain: RiskDomain;
  intelItemId: number;
  buyerAgentId: string;
  sellerAgentId: string;
  riskScore: number;
  recommendedMode: PurchaseProtectionMode;
  premiumBps: number;
  premiumAmount: number;
  claimWindowSeconds: number;
  reasons: string[];
  inputs: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
}

export interface CreateProtectedIntelPurchaseInput {
  quoteId: number | null;
  intelItemId: number;
  intelPurchaseId: number | null;
  buyerAgentId: string;
  sellerAgentId: string;
  mode: PurchaseProtectionMode;
  principalAmount: number;
  premiumAmount: number;
  principalAcpJobId: number | null;
  deliverableHash: string;
  challengeDeadline: Date;
  status?: ProtectedPurchaseStatus;
  metadata?: Record<string, unknown>;
}

export interface ProtectedIntelPurchaseRecord {
  id: number;
  quoteId: number | null;
  intelItemId: number;
  intelPurchaseId: number | null;
  buyerAgentId: string;
  sellerAgentId: string;
  mode: PurchaseProtectionMode;
  status: ProtectedPurchaseStatus;
  principalAmount: number;
  premiumAmount: number;
  premiumTxId: number | null;
  principalAcpJobId: number | null;
  deliverableHash: string | null;
  challengeDeadline: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PurchaseClaimRecord {
  id: number;
  protectedPurchaseId: number;
  claimantAgentId: string;
  claimType: ClaimType;
  status: ClaimStatus;
  reasonText: string | null;
  evidence: Record<string, unknown>;
  decision: ClaimDecision | null;
  decisionReason: string | null;
  evaluatorAddress: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ProtectedIntelPurchaseView {
  purchase: ProtectedIntelPurchaseRecord;
  quote: RiskQuoteRecord | null;
  claim: PurchaseClaimRecord | null;
  acpJob: {
    id: number;
    onChainJobId: number;
    status: string;
    budget: number;
    submittedAt: string | null;
    settledAt: string | null;
    evaluatorAddress: string;
  } | null;
}
