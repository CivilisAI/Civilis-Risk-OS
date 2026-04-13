#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

async function readJson(relativePath) {
  const text = await fs.readFile(path.join(repoRoot, relativePath), 'utf8');
  return JSON.parse(text);
}

async function readText(relativePath) {
  return fs.readFile(path.join(repoRoot, relativePath), 'utf8');
}

function assertIncludes(text, needle, label, failures) {
  if (!text.includes(needle)) {
    failures.push(`${label} missing ${needle}`);
  }
}

async function main() {
  const manifest = await readJson('submission.manifest.json');
  const readme = await readText('README.md');
  const onePager = await readText('docs/judge-one-pager.md');

  const failures = [];

  assertIncludes(readme, manifest.name, 'README', failures);
  assertIncludes(readme, String(manifest.canonicalProof.replayItemId), 'README', failures);
  assertIncludes(readme, String(manifest.canonicalProof.quoteId), 'README', failures);
  assertIncludes(readme, manifest.canonicalProof.hashes.fundedPrincipal, 'README', failures);
  assertIncludes(onePager, manifest.canonicalActors.buyer.agentId, 'Judge One Pager', failures);
  assertIncludes(onePager, manifest.canonicalProof.hashes.rejectRefund, 'Judge One Pager', failures);

  for (const file of manifest.surfaces.schemas) {
    await fs.access(path.join(repoRoot, file));
  }

  for (const file of manifest.surfaces.examples) {
    await fs.access(path.join(repoRoot, file));
  }

  for (const file of manifest.surfaces.skills) {
    await fs.access(path.join(repoRoot, file));
  }

  console.log(JSON.stringify({
    ok: failures.length === 0,
    failures,
    manifestSummary: {
      name: manifest.name,
      arena: manifest.arena,
      chainId: manifest.chain.chainId,
      referenceIntegration: manifest.referenceIntegration
    }
  }, null, 2));

  if (failures.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[verify-submission-manifest] failed:', error.message);
  process.exit(1);
});
