import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

async function runNode(scriptRelativePath, args = [], env = {}) {
  const scriptPath = path.join(repoRoot, scriptRelativePath);
  return execFileAsync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...env,
    },
  });
}

test('protected loop verifier covers quote -> buy -> claim -> resolve -> requote in bundled mode', async () => {
  const baseUrl = process.env.RISK_OS_DEMO_BASE_URL || process.env.RISK_OS_BASE_URL || 'http://127.0.0.1:3402';
  const { stdout } = await runNode('examples/runtime-full-loop.mjs', [], {
    RISK_OS_DEMO_BASE_URL: baseUrl,
  });

  const result = JSON.parse(stdout);
  assert.equal(result.ok, true);
  assert.equal(result.health.status, 'ok');
  assert.equal(result.health.mode, 'bundled');
  assert.equal(result.quote.recommendedMode, 'challengeable');
  assert.equal(typeof result.loop.quoteId, 'number');
  assert.equal(typeof result.loop.protectedPurchaseId, 'number');
  assert.equal(typeof result.loop.claimId, 'number');
  assert.equal(result.claim.status, 'open');
  assert.equal(result.resolution.success, true);
  assert.equal(typeof result.requote.riskScore, 'number');
});
