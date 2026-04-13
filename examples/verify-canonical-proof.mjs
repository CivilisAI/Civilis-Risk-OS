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

Optional env:
  RISK_OS_VERIFY_MODE=offline-docs|health
  RISK_OS_BASE_URL=http://127.0.0.1:3020
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

const DOCS_TO_CHECK = [
  'README.md',
  'docs/judge-one-pager.md',
  'docs/championship-replay-mode.md',
  'docs/proof-surface-matrix.md',
  'docs/mainnet-evidence.md',
  'docs/final-championship-audit.md',
  'docs/submission-reference.md',
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

  for (const file of DOCS_TO_CHECK) {
    const content = await read(file);
    checkIncludes(content, CANONICAL.item, file, failures);
    checkIncludes(content, CANONICAL.quote, file, failures);
    checkIncludes(content, CANONICAL.purchase, file, failures);
    checkIncludes(content, CANONICAL.claim, file, failures);
    checkIncludes(content, CANONICAL.laterQuote, file, failures);
    checkIncludes(content, CANONICAL.fundedTx, file, failures);
    checkIncludes(content, CANONICAL.submitTx, file, failures);
    checkIncludes(content, CANONICAL.refundTx, file, failures);
  }

  return {
    mode: 'offline-docs',
    canonical: CANONICAL,
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
    healthError
  };
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

  console.log(JSON.stringify(await verifyDocs(), null, 2));
}

main().catch((error) => {
  console.error('[verify-canonical-proof] failed:', error.message);
  process.exit(1);
});
