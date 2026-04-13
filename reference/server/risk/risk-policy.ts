import type {
  PurchaseProtectionMode,
  RiskQuoteComputationInput,
  RiskQuoteComputationResult,
} from './risk-types.js';

export const RISK_QUOTE_TTL_SECONDS = 15 * 60;
export const LOW_RISK_CHALLENGE_WINDOW_SECONDS = 30 * 60;
export const HIGH_RISK_CHALLENGE_WINDOW_SECONDS = 60 * 60;

const LOW_RISK_CUTOFF = 35;
const HIGH_RISK_CUTOFF = 65;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundMoney(value: number): number {
  return Number(value.toFixed(6));
}

function normalizeReputationRisk(averageValue: number): number {
  const bounded = clamp(averageValue, -100, 100);
  return 100 - ((bounded + 100) / 2);
}

export function getProtectionTermsFromRisk(riskScore: number): {
  recommendedMode: PurchaseProtectionMode;
  premiumBps: number;
  claimWindowSeconds: number;
} {
  if (riskScore < LOW_RISK_CUTOFF) {
    return {
      recommendedMode: 'instant',
      premiumBps: 0,
      claimWindowSeconds: 0,
    };
  }

  if (riskScore < HIGH_RISK_CUTOFF) {
    return {
      recommendedMode: 'challengeable',
      premiumBps: 250,
      claimWindowSeconds: LOW_RISK_CHALLENGE_WINDOW_SECONDS,
    };
  }

  return {
    recommendedMode: 'challengeable',
    premiumBps: 500,
    claimWindowSeconds: HIGH_RISK_CHALLENGE_WINDOW_SECONDS,
  };
}

export function computeIntelRiskQuote(
  input: RiskQuoteComputationInput,
): RiskQuoteComputationResult {
  const sellerCreditRisk = clamp(100 - input.creditScore, 0, 100);
  const sellerRepRisk = clamp(normalizeReputationRisk(input.reputationAverageValue), 0, 100);
  const sellerValidationRisk = clamp(100 - input.validationAverageScore, 0, 100);
  const claimRateRisk = clamp(input.historicalRefundRate * 100, 0, 100);

  let riskScore =
    0.4 * sellerCreditRisk +
    0.25 * sellerRepRisk +
    0.2 * sellerValidationRisk +
    0.15 * claimRateRisk;

  const reasons: string[] = [];

  if (input.fakeCount > 0) {
    riskScore += 10;
    reasons.push('seller_has_fake_history');
  }

  if (input.totalVerified < 3) {
    riskScore += 8;
    reasons.push('seller_validation_history_shallow');
  }

  if (input.validationAverageScore < 60) {
    reasons.push('seller_validation_score_low');
  }

  if (input.historicalRefundRate >= 0.2) {
    reasons.push('seller_claim_refund_rate_elevated');
  }

  if (input.creditScore < 45) {
    reasons.push('seller_credit_below_neutral');
  }

  const boundedRisk = Math.round(clamp(riskScore, 0, 100));
  const { recommendedMode, premiumBps, claimWindowSeconds } = getProtectionTermsFromRisk(boundedRisk);

  if (recommendedMode === 'instant' && reasons.length === 0) {
    reasons.push('seller_history_supports_instant_settlement');
  }

  return {
    riskScore: boundedRisk,
    recommendedMode,
    premiumBps,
    premiumAmount: roundMoney((input.itemPrice * premiumBps) / 10000),
    claimWindowSeconds,
    reasons,
    inputs: {
      itemPrice: input.itemPrice,
      sellerAgentId: input.sellerAgentId,
      creditScore: input.creditScore,
      totalVerified: input.totalVerified,
      fakeCount: input.fakeCount,
      reputationAverageValue: input.reputationAverageValue,
      validationAverageScore: input.validationAverageScore,
      historicalRefundRate: Number(input.historicalRefundRate.toFixed(4)),
      components: {
        sellerCreditRisk: Number(sellerCreditRisk.toFixed(2)),
        sellerRepRisk: Number(sellerRepRisk.toFixed(2)),
        sellerValidationRisk: Number(sellerValidationRisk.toFixed(2)),
        claimRateRisk: Number(claimRateRisk.toFixed(2)),
      },
    },
  };
}
