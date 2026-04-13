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

test('runtime help exposes the direct command surface', async () => {
  const { stdout } = await runNode('examples/risk-os-runtime.mjs', ['help']);
  assert.match(stdout, /Civilis Risk OS Runtime CLI/);
  assert.match(stdout, /\bquote\b/);
  assert.match(stdout, /\bbuy\b/);
  assert.match(stdout, /\bclaim\b/);
  assert.match(stdout, /\bresolve\b/);
  assert.match(stdout, /\brequote\b/);
});

test('runtime demo returns live health and quote when the backend is reachable', async (t) => {
  const baseUrl = process.env.RISK_OS_DEMO_BASE_URL || 'http://127.0.0.1:3011';

  try {
    const health = await fetch(`${baseUrl}/health`);
    if (!health.ok) {
      t.skip(`Runtime backend returned ${health.status} for ${baseUrl}/health`);
      return;
    }
  } catch {
    t.skip(`Runtime backend is not reachable at ${baseUrl}`);
    return;
  }

  const { stdout } = await runNode('examples/runtime-demo.mjs', [], {
    RISK_OS_DEMO_BASE_URL: baseUrl,
  });
  const result = JSON.parse(stdout);

  assert.equal(result.ok, true);
  assert.equal(result.health.status, 'ok');
  assert.equal(typeof result.demo.itemId, 'number');
  assert.equal(typeof result.quote.quoteId, 'number');
  assert.equal(typeof result.quote.recommendedMode, 'string');
});
