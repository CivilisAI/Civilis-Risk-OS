#!/usr/bin/env node

import { ensureRuntime, withDefaultRuntimeAuth } from './lib/runtime-bootstrap.mjs';
import { BUNDLED_RUNTIME_BASE_URL } from './lib/bundled-runtime-profile.mjs';
import { runProtectedLoop } from './lib/runtime-full-loop.mjs';

const HELP = `Civilis Risk OS Runtime CLI

Use this CLI as the fastest direct runtime surface for another AI.

Usage:
  node examples/risk-os-runtime.mjs <command> [flags]

Commands:
  help
  health
  quote
  buy
  purchase
  claim-proof
  claim
  resolve-proof
  resolve
  requote
  full-loop

Common flags:
  --base-url <url>              API base URL (default bundled runtime: http://127.0.0.1:3401)
  --item <intelItemId>          Intel item id
  --buyer <agentId>             Buyer agent id (default: sage)
  --purchase <protectedId>      Protected purchase id
  --claim <claimId>             Claim id
  --mode <instant|challengeable>
  --decision <release|refund>        Optional when the runtime can supply an evaluator advisory
  --reason <text>                    Optional when proof/advisory generation supplies it
  --claim-type <type>
  --claimant-token <token>
  --claimant-signature <sig>
  --evaluator-token <token>
  --evaluator-signature <sig>
  --json                        Reserved for explicit machine output (JSON is already the default)

Examples:
  node examples/risk-os-runtime.mjs health
  node examples/risk-os-runtime.mjs quote --item 501 --buyer sage
  node examples/risk-os-runtime.mjs buy --item 501 --buyer sage --mode challengeable --quote 1
  node examples/risk-os-runtime.mjs claim --purchase 1 --reason "delivery was misleading"
  node examples/risk-os-runtime.mjs resolve --claim 1 --decision refund --reason "quality below threshold"
  node examples/risk-os-runtime.mjs resolve-proof --claim 1
  node examples/risk-os-runtime.mjs full-loop --buyer sage
`;

const DEFAULTS = {
  baseUrl: process.env.RISK_OS_BASE_URL || BUNDLED_RUNTIME_BASE_URL,
  buyerAgentId: process.env.RISK_OS_BUYER_AGENT_ID || 'sage',
  purchaseMode: process.env.RISK_OS_PURCHASE_MODE || 'challengeable',
  claimType: process.env.RISK_OS_CLAIM_TYPE || 'misleading_or_invalid_intel',
  claimReason: process.env.RISK_OS_CLAIM_REASON || 'runtime-cli-claim',
  resolutionDecision: process.env.RISK_OS_RESOLUTION_DECISION || 'refund',
  resolutionReason: process.env.RISK_OS_RESOLUTION_REASON || 'runtime-cli-resolution',
  claimantToken: process.env.RISK_OS_CLAIMANT_TOKEN || '',
  claimantSignature: process.env.RISK_OS_CLAIMANT_SIGNATURE || '',
  evaluatorToken: process.env.RISK_OS_EVALUATOR_TOKEN || '',
  evaluatorSignature: process.env.RISK_OS_EVALUATOR_SIGNATURE || '',
};

function parseArgs(argv) {
  const [command = 'help', ...rest] = argv;
  const flags = {};

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = rest[i + 1];
    if (!next || next.startsWith('--')) {
      flags[key] = true;
      continue;
    }
    flags[key] = next;
    i += 1;
  }

  return { command, flags };
}

function getNumber(value, label) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(`Missing or invalid ${label}`);
  }
  return numeric;
}

function getString(value, fallback, label) {
  const normalized = (value ?? fallback ?? '').trim();
  if (!normalized) throw new Error(`Missing ${label}`);
  return normalized;
}

async function request(baseUrl, path, options = {}) {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const response = await fetch(`${normalizedBase}${path}`, options);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(body)}`);
  }

  return body;
}

async function run(command, flags) {
  const baseUrl = getString(flags['base-url'], DEFAULTS.baseUrl, 'base-url');
  if (command === 'help') {
    return { ok: true, help: HELP };
  }

  const runtime = await ensureRuntime(baseUrl);
  const normalizedFlags = withDefaultRuntimeAuth({
    ...flags,
    'claimant-token': flags['claimant-token'] ?? DEFAULTS.claimantToken,
    'claimant-signature': flags['claimant-signature'] ?? DEFAULTS.claimantSignature,
    'evaluator-token': flags['evaluator-token'] ?? DEFAULTS.evaluatorToken,
    'evaluator-signature': flags['evaluator-signature'] ?? DEFAULTS.evaluatorSignature,
  }, runtime);

  const buyerAgentId = getString(normalizedFlags.buyer, DEFAULTS.buyerAgentId, 'buyer agent id');
  const claimType = getString(normalizedFlags['claim-type'], DEFAULTS.claimType, 'claim type');
  const claimantToken = String(normalizedFlags['claimant-token'] ?? '');
  const claimantSignature = String(normalizedFlags['claimant-signature'] ?? '');
  const evaluatorToken = String(normalizedFlags['evaluator-token'] ?? '');
  const evaluatorSignature = String(normalizedFlags['evaluator-signature'] ?? '');

  try {
    switch (command) {
      case 'health':
        return request(baseUrl, '/health');
      case 'quote': {
        const intelItemId = getNumber(normalizedFlags.item, 'item');
        return request(baseUrl, '/api/risk/quote/intel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intelItemId, buyerAgentId }),
        });
      }
      case 'buy': {
        const intelItemId = getNumber(normalizedFlags.item, 'item');
        const quoteId = getNumber(normalizedFlags.quote, 'quote');
        const purchaseMode = getString(normalizedFlags.mode, DEFAULTS.purchaseMode, 'purchase mode');
        return request(baseUrl, `/api/intel/items/${intelItemId}/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buyerAgentId, purchaseMode, quoteId }),
        });
      }
      case 'purchase': {
        const purchaseId = getNumber(normalizedFlags.purchase, 'purchase');
        return request(baseUrl, `/api/risk/purchases/${purchaseId}`);
      }
      case 'claim-proof': {
        const purchaseId = getNumber(normalizedFlags.purchase, 'purchase');
        const claimReason = getString(normalizedFlags.reason, DEFAULTS.claimReason, 'reason');
        const params = new URLSearchParams({
          claimType,
          reasonText: claimReason,
        });
        return request(baseUrl, `/api/risk/purchases/${purchaseId}/claim-proof?${params.toString()}`);
      }
      case 'claim': {
        const purchaseId = getNumber(normalizedFlags.purchase, 'purchase');
        const claimReason = getString(normalizedFlags.reason, DEFAULTS.claimReason, 'reason');
        return request(baseUrl, '/api/risk/claims', {
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
            evidence: { source: 'risk-os-runtime-cli' },
          }),
        });
      }
      case 'resolve-proof': {
        const claimId = getNumber(normalizedFlags.claim, 'claim');
        const params = new URLSearchParams();
        if (typeof normalizedFlags.decision === 'string' && normalizedFlags.decision.trim()) {
          params.set('decision', normalizedFlags.decision.trim());
        }
        if (typeof normalizedFlags.reason === 'string' && normalizedFlags.reason.trim()) {
          params.set('decisionReason', normalizedFlags.reason.trim());
        }
        return request(baseUrl, `/api/risk/claims/${claimId}/resolve-proof?${params.toString()}`);
      }
      case 'resolve': {
        const claimId = getNumber(normalizedFlags.claim, 'claim');
        const decision = typeof normalizedFlags.decision === 'string' && normalizedFlags.decision.trim()
          ? normalizedFlags.decision.trim()
          : null;
        const resolutionReason = typeof normalizedFlags.reason === 'string' && normalizedFlags.reason.trim()
          ? normalizedFlags.reason.trim()
          : null;
        return request(baseUrl, `/api/risk/claims/${claimId}/resolve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(evaluatorToken ? { 'x-civilis-risk-evaluator-token': evaluatorToken } : {}),
            ...(evaluatorSignature ? { 'x-civilis-risk-evaluator-signature': evaluatorSignature } : {}),
          },
          body: JSON.stringify({
            ...(decision ? { decision } : {}),
            ...(resolutionReason ? { decisionReason: resolutionReason } : {}),
          }),
        });
      }
      case 'requote': {
        const intelItemId = getNumber(normalizedFlags.item, 'item');
        return request(baseUrl, '/api/risk/quote/intel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intelItemId, buyerAgentId }),
        });
      }
      case 'full-loop':
        return runProtectedLoop({
          baseUrl,
          buyerAgentId,
          itemId: normalizedFlags.item ?? null,
          claimType,
          claimReason: getString(normalizedFlags.reason, DEFAULTS.claimReason, 'reason'),
          decision: getString(normalizedFlags.decision, DEFAULTS.resolutionDecision, 'decision'),
          decisionReason: getString(normalizedFlags['resolution-reason'] ?? normalizedFlags.reason, DEFAULTS.resolutionReason, 'resolution reason'),
          claimantToken,
          claimantSignature,
          evaluatorToken,
          evaluatorSignature,
        });
      default:
        throw new Error(`Unsupported command: ${command}. Run 'help' for usage.`);
    }
  } finally {
    runtime.stop();
  }
}

const { command, flags } = parseArgs(process.argv.slice(2));

run(command, flags)
  .then((output) => {
    if (command === 'help') {
      console.log(output.help);
      return;
    }
    console.log(JSON.stringify(output, null, 2));
  })
  .catch((error) => {
    console.error('[risk-os-runtime] failed:', error.message);
    process.exit(1);
  });
