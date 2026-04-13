#!/usr/bin/env node

import { BUNDLED_RUNTIME_BASE_URL } from './lib/bundled-runtime-profile.mjs';
import { runProtectedLoop } from './lib/runtime-full-loop.mjs';

const baseUrl = process.env.RISK_OS_DEMO_BASE_URL || process.env.RISK_OS_BASE_URL || BUNDLED_RUNTIME_BASE_URL;
const buyerAgentId = process.env.RISK_OS_DEMO_BUYER || process.env.RISK_OS_BUYER_AGENT_ID || 'sage';
const itemId = process.env.RISK_OS_DEMO_ITEM_ID || process.env.RISK_OS_INTEL_ITEM_ID || null;
const claimType = process.env.RISK_OS_CLAIM_TYPE || 'misleading_or_invalid_intel';
const claimReason = process.env.RISK_OS_CLAIM_REASON || 'runtime-full-loop-claim';
const decision = process.env.RISK_OS_RESOLUTION_DECISION || 'refund';
const decisionReason = process.env.RISK_OS_RESOLUTION_REASON || 'runtime-full-loop-resolution';

runProtectedLoop({
  baseUrl,
  buyerAgentId,
  itemId,
  claimType,
  claimReason,
  decision,
  decisionReason,
  claimantToken: process.env.RISK_OS_CLAIMANT_TOKEN || '',
  claimantSignature: process.env.RISK_OS_CLAIMANT_SIGNATURE || '',
  evaluatorToken: process.env.RISK_OS_EVALUATOR_TOKEN || '',
  evaluatorSignature: process.env.RISK_OS_EVALUATOR_SIGNATURE || '',
}).then((result) => {
  console.log(JSON.stringify(result, null, 2));
}).catch((error) => {
  console.error('[runtime-full-loop] failed:', error.message);
  process.exit(1);
});
