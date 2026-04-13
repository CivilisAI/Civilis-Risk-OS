#!/usr/bin/env node

const HELP = `Civilis Risk OS external consumer quickstart

Canonical replay:
  stage fresh intel -> quote -> quote-buy -> claim-proof -> claim -> resolve-proof -> resolve

Core env:
  RISK_OS_BASE_URL
  RISK_OS_ACTION=quote|quote-buy|claim-proof|claim|resolve-proof|resolve|help
  RISK_OS_INTEL_ITEM_ID
  RISK_OS_BUYER_AGENT_ID=sage

Auth env for strict proof mode:
  RISK_OS_CLAIMANT_TOKEN
  RISK_OS_EVALUATOR_TOKEN

Optional signature env:
  RISK_OS_CLAIMANT_SIGNATURE
  RISK_OS_EVALUATOR_SIGNATURE

Canonical historical path:
  16 -> 34 -> 11 -> 10 -> 36
`;

const baseUrl = (process.env.RISK_OS_BASE_URL || 'http://127.0.0.1:3020').replace(/\/$/, '');
const action = process.env.RISK_OS_ACTION || 'quote';
const itemId = Number(process.env.RISK_OS_INTEL_ITEM_ID || '0');
const buyerAgentId = process.env.RISK_OS_BUYER_AGENT_ID || 'sage';
const protectedPurchaseId = Number(process.env.RISK_OS_PROTECTED_PURCHASE_ID || '0');
const claimId = Number(process.env.RISK_OS_CLAIM_ID || '0');
const claimType = process.env.RISK_OS_CLAIM_TYPE || 'misleading_or_invalid_intel';
const claimReason = process.env.RISK_OS_CLAIM_REASON || 'external-consumer-quickstart';
const resolutionDecision = process.env.RISK_OS_RESOLUTION_DECISION || 'refund';
const resolutionReason = process.env.RISK_OS_RESOLUTION_REASON || 'external-consumer-resolution';
const claimantToken = process.env.RISK_OS_CLAIMANT_TOKEN || '';
const claimantSignature = process.env.RISK_OS_CLAIMANT_SIGNATURE || '';
const evaluatorToken = process.env.RISK_OS_EVALUATOR_TOKEN || '';
const evaluatorSignature = process.env.RISK_OS_EVALUATOR_SIGNATURE || '';

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(body)}`);
  }

  return body;
}

async function runQuote() {
  if (!itemId) {
    throw new Error('Set RISK_OS_INTEL_ITEM_ID from a fresh stage-risk-os-demo run before requesting a quote');
  }
  return request('/api/risk/quote/intel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intelItemId: itemId,
      buyerAgentId,
    }),
  });
}

async function runBuy() {
  if (!itemId) {
    throw new Error('Set RISK_OS_INTEL_ITEM_ID from a fresh stage-risk-os-demo run before running quote-buy');
  }
  const quote = await runQuote();
  const buy = await request(`/api/intel/items/${itemId}/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerAgentId,
      purchaseMode: 'challengeable',
      quoteId: quote.quote_id,
    }),
  });

  return { quote, buy };
}

async function runClaimProof() {
  const purchaseId = protectedPurchaseId || Number(process.env.RISK_OS_PROTECTED_PURCHASE_ID_REQUIRED || '0');
  if (!purchaseId) {
    throw new Error('Set RISK_OS_PROTECTED_PURCHASE_ID before requesting claim-proof');
  }

  const params = new URLSearchParams({
    claimType,
    reasonText: claimReason,
  });

  return request(`/api/risk/purchases/${purchaseId}/claim-proof?${params.toString()}`);
}

async function runClaim() {
  const purchaseId = protectedPurchaseId || Number(process.env.RISK_OS_PROTECTED_PURCHASE_ID_REQUIRED || '0');
  if (!purchaseId) {
    throw new Error('Set RISK_OS_PROTECTED_PURCHASE_ID before creating a claim');
  }

  return request('/api/risk/claims', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(claimantToken ? { 'x-civilis-risk-claimant-token': claimantToken } : {}),
      ...(claimantSignature ? { 'x-civilis-risk-claimant-signature': claimantSignature } : {}),
    },
    body: JSON.stringify({
      protectedPurchaseId: purchaseId,
      claimType,
      reasonText: claimReason,
      evidence: {
        source: 'external-consumer-quickstart',
      },
    }),
  });
}

async function runResolveProof() {
  const id = claimId || Number(process.env.RISK_OS_CLAIM_ID_REQUIRED || '0');
  if (!id) {
    throw new Error('Set RISK_OS_CLAIM_ID before requesting resolve-proof');
  }

  const params = new URLSearchParams({
    decision: resolutionDecision,
    decisionReason: resolutionReason,
  });

  return request(`/api/risk/claims/${id}/resolve-proof?${params.toString()}`);
}

async function runResolve() {
  const id = claimId || Number(process.env.RISK_OS_CLAIM_ID_REQUIRED || '0');
  if (!id) {
    throw new Error('Set RISK_OS_CLAIM_ID before resolving a claim');
  }

  return request(`/api/risk/claims/${id}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(evaluatorToken ? { 'x-civilis-risk-evaluator-token': evaluatorToken } : {}),
      ...(evaluatorSignature ? { 'x-civilis-risk-evaluator-signature': evaluatorSignature } : {}),
    },
    body: JSON.stringify({
      decision: resolutionDecision,
      decisionReason: resolutionReason,
    }),
  });
}

async function main() {
  let output;
  switch (action) {
    case 'help':
      console.log(HELP);
      return;
    case 'quote':
      output = await runQuote();
      break;
    case 'quote-buy':
      output = await runBuy();
      break;
    case 'claim-proof':
      output = await runClaimProof();
      break;
    case 'claim':
      output = await runClaim();
      break;
    case 'resolve-proof':
      output = await runResolveProof();
      break;
    case 'resolve':
      output = await runResolve();
      break;
    default:
      throw new Error(`Unsupported RISK_OS_ACTION: ${action}. Set RISK_OS_ACTION=help for usage.`);
  }

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error('[external-consumer-quickstart] failed:', error.message);
  process.exit(1);
});
