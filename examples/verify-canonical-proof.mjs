#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const HELP = `Civilis Risk OS canonical proof verifier

Modes:
  default / offline-docs  Verify that canonical ids and hashes are consistent across public docs.
  health                  Also probe a live proof server health endpoint.
  api                     Verify docs and query the canonical protected purchase from a live proof server.
  onchain                 Verify docs and fetch receipts for canonical tx hashes from X Layer RPC.
  full                    Run docs + health + api + onchain in one report.

Optional env:
  RISK_OS_VERIFY_MODE=offline-docs|health|api|onchain|full
  RISK_OS_BASE_URL=http://127.0.0.1:3020
  RISK_OS_RPC_URL=https://rpc.xlayer.tech
  RISK_OS_VERIFY_VERBOSE=1
  RISK_OS_VERIFY_ITEM_ID=899
  RISK_OS_VERIFY_QUOTE_ID=2
  RISK_OS_VERIFY_PURCHASE_ID=1
  RISK_OS_VERIFY_CLAIM_ID=10
  RISK_OS_VERIFY_LATER_QUOTE_ID=36
  RISK_OS_VERIFY_FUNDED_TX=0x...
  RISK_OS_VERIFY_SUBMIT_TX=0x...
  RISK_OS_VERIFY_REFUND_TX=0x...
`;

const CANONICAL = {
  item: '16',
  quote: '34',
  purchase: '11',
  claim: '10',
  laterQuote: '36',
  fundedTx: '0x3626e79f734b6708d357e3556353617d4600bbb5d859ff47d1dc6846b76479fa',
  submitTx: '0x813b673060e0d0f7d88ebd466801049c76b662297820a6f23a066773b32d0260',
  refundTx: '0xc857156addb058461cb0eb04647eb896a3db54185e2fbcd09dd295b1bf236929'
};

const VERIFY_TARGET = {
  item: process.env.RISK_OS_VERIFY_ITEM_ID || CANONICAL.item,
  quote: process.env.RISK_OS_VERIFY_QUOTE_ID || CANONICAL.quote,
  purchase: process.env.RISK_OS_VERIFY_PURCHASE_ID || CANONICAL.purchase,
  claim: process.env.RISK_OS_VERIFY_CLAIM_ID || CANONICAL.claim,
  laterQuote: process.env.RISK_OS_VERIFY_LATER_QUOTE_ID || CANONICAL.laterQuote,
  fundedTx: process.env.RISK_OS_VERIFY_FUNDED_TX || CANONICAL.fundedTx,
  submitTx: process.env.RISK_OS_VERIFY_SUBMIT_TX || CANONICAL.submitTx,
  refundTx: process.env.RISK_OS_VERIFY_REFUND_TX || CANONICAL.refundTx
};

const DOCS_TO_CHECK = [
  'README.md',
  'docs/project-one-pager.md',
  'docs/championship-replay-mode.md',
  'docs/proof-surface-matrix.md',
  'docs/mainnet-evidence.md',
  'docs/release-readiness-audit.md',
  'docs/public-reference-pack.md',
  'docs/external-consumer-schema.md',
  'skills/civilis-risk-os-canonical-replay/references/canonical-replay.md',
  'skills/civilis-risk-os-proof-boundaries/references/proof-classification.md',
  'skills/civilis-risk-os-external-consumer/references/consumer-schema.md'
];

async function read(relativePath) {
  return fs.readFile(path.join(repoRoot, relativePath), 'utf8');
}

function checkIncludes(content, needle, file, failures) {
  if (!content.includes(needle)) {
    failures.push(`${file} missing ${needle}`);
  }
}

async function verifyDocs() {
  const failures = [];
  const usingOverrides = JSON.stringify(VERIFY_TARGET) !== JSON.stringify(CANONICAL);

  for (const file of DOCS_TO_CHECK) {
    const content = await read(file);
    if (!usingOverrides) {
      checkIncludes(content, CANONICAL.item, file, failures);
      checkIncludes(content, CANONICAL.quote, file, failures);
      checkIncludes(content, CANONICAL.purchase, file, failures);
      checkIncludes(content, CANONICAL.claim, file, failures);
      checkIncludes(content, CANONICAL.laterQuote, file, failures);
      checkIncludes(content, CANONICAL.fundedTx, file, failures);
      checkIncludes(content, CANONICAL.submitTx, file, failures);
      checkIncludes(content, CANONICAL.refundTx, file, failures);
    }
  }

  return {
    mode: 'offline-docs',
    canonical: CANONICAL,
    verifyTarget: VERIFY_TARGET,
    docMode: usingOverrides ? 'historical-canonical-docs-with-runtime-overrides' : 'strict-canonical-docs',
    checkedFiles: DOCS_TO_CHECK,
    ok: failures.length === 0,
    failures
  };
}

async function verifyHealth() {
  const baseUrl = (process.env.RISK_OS_BASE_URL || 'http://127.0.0.1:3020').replace(/\/$/, '');
  const docs = await verifyDocs();

  let health = null;
  let healthError = null;
  try {
    const response = await fetch(`${baseUrl}/health`);
    const text = await response.text();
    health = text ? JSON.parse(text) : null;
    if (!response.ok) {
      healthError = `${response.status} ${response.statusText}`;
    }
  } catch (error) {
    healthError = error.message;
  }

  return {
    ...docs,
    mode: 'health',
    baseUrl,
    health,
    healthError,
    ok: docs.ok && !healthError
  };
}

async function verifyApi() {
  const baseUrl = (process.env.RISK_OS_BASE_URL || 'http://127.0.0.1:3020').replace(/\/$/, '');
  const docs = await verifyDocs();

  let purchaseView = null;
  let apiError = null;
  try {
    const response = await fetch(`${baseUrl}/api/risk/purchases/${VERIFY_TARGET.purchase}`);
    const text = await response.text();
    purchaseView = text ? JSON.parse(text) : null;
    if (!response.ok) {
      apiError = `${response.status} ${response.statusText}`;
    }
  } catch (error) {
    apiError = error.message;
  }

  const apiChecks = {
    purchaseIdMatches: purchaseView?.protected_purchase_id === Number(VERIFY_TARGET.purchase),
    buyerMatches: purchaseView?.buyer_agent_id === 'sage',
    sellerMatches: purchaseView?.seller_agent_id === 'fox',
    quoteMatches: purchaseView?.quote_id === Number(VERIFY_TARGET.quote)
  };
  const apiFailures = Object.entries(apiChecks)
    .filter(([, ok]) => !ok)
    .map(([label]) => label);

  return {
    ...docs,
    mode: 'api',
    baseUrl,
    purchaseView,
    apiChecks,
    apiError,
    apiOk: !apiError && apiFailures.length === 0,
    ok: docs.ok && !apiError && apiFailures.length === 0,
    apiFailures
  };
}

async function rpc(method, params) {
  const rpcUrl = process.env.RISK_OS_RPC_URL || 'https://rpc.xlayer.tech';
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    })
  });
  const body = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || `${response.status} ${response.statusText}`);
  }
  return { rpcUrl, result: body.result };
}

async function verifyOnchain() {
  const docs = await verifyDocs();
  const txEntries = Object.entries({
    fundedPrincipal: VERIFY_TARGET.fundedTx,
    deliverySubmit: VERIFY_TARGET.submitTx,
    rejectRefund: VERIFY_TARGET.refundTx
  });

  const receipts = {};
  const failures = [];
  let rpcUrl = process.env.RISK_OS_RPC_URL || 'https://rpc.xlayer.tech';
  const receiptSummary = {};

  for (const [label, hash] of txEntries) {
    try {
      const receipt = await rpc('eth_getTransactionReceipt', [hash]);
      rpcUrl = receipt.rpcUrl;
      receipts[label] = receipt.result;
      if (!receipt.result) {
        failures.push(`${label} receipt missing`);
        continue;
      }
      if (receipt.result.status !== '0x1') {
        failures.push(`${label} receipt status ${receipt.result.status}`);
      }
      receiptSummary[label] = {
        txHash: hash,
        blockNumber: receipt.result.blockNumber,
        status: receipt.result.status,
        from: receipt.result.from,
        to: receipt.result.to,
        logCount: Array.isArray(receipt.result.logs) ? receipt.result.logs.length : 0
      };
    } catch (error) {
      failures.push(`${label} receipt lookup failed: ${error.message}`);
    }
  }

  const result = {
    ...docs,
    mode: 'onchain',
    rpcUrl,
    receiptSummary,
    ok: docs.ok && failures.length === 0,
    onchainOk: failures.length === 0,
    onchainFailures: failures
  };

  if (process.env.RISK_OS_VERIFY_VERBOSE === '1') {
    result.receipts = receipts;
  }

  return result;
}

async function main() {
  const mode = process.env.RISK_OS_VERIFY_MODE || 'offline-docs';

  if (mode === 'help') {
    console.log(HELP);
    return;
  }

  if (mode === 'health') {
    console.log(JSON.stringify(await verifyHealth(), null, 2));
    return;
  }

  if (mode === 'api') {
    console.log(JSON.stringify(await verifyApi(), null, 2));
    return;
  }

  if (mode === 'onchain') {
    console.log(JSON.stringify(await verifyOnchain(), null, 2));
    return;
  }

  if (mode === 'full') {
    console.log(JSON.stringify({
      docs: await verifyDocs(),
      health: await verifyHealth(),
      api: await verifyApi(),
      onchain: await verifyOnchain()
    }, null, 2));
    return;
  }

  console.log(JSON.stringify(await verifyDocs(), null, 2));
}

main().catch((error) => {
  console.error('[verify-canonical-proof] failed:', error.message);
  process.exit(1);
});
