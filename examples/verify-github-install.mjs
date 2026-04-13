#!/usr/bin/env node

import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function main() {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'civilis-risk-os-gh-install-'));
  const baseUrl = 'http://127.0.0.1:3411';

  await execFileAsync('npm', ['init', '-y'], { cwd: tempRoot });
  await execFileAsync('npm', ['install', 'github:CivilisAI/Civilis-Risk-OS'], { cwd: tempRoot });
  const help = await execFileAsync('npx', ['civilis-risk-os-runtime', 'help'], { cwd: tempRoot });
  const health = await execFileAsync('npx', ['civilis-risk-os-runtime', 'health', '--base-url', baseUrl], {
    cwd: tempRoot,
  });
  const quote = await execFileAsync(
    'npx',
    ['civilis-risk-os-runtime', 'quote', '--base-url', baseUrl, '--item', '501', '--buyer', 'sage'],
    {
      cwd: tempRoot,
    },
  );

  const healthResult = JSON.parse(health.stdout);
  const quoteResult = JSON.parse(quote.stdout);
  const ok =
    /Civilis Risk OS Runtime CLI/.test(help.stdout) &&
    healthResult?.status === 'ok' &&
    (typeof quoteResult?.quoteId === 'number' ||
      typeof quoteResult?.quote_id === 'number');

  console.log(JSON.stringify({
    ok,
    tempRoot,
    command: `npm install github:CivilisAI/Civilis-Risk-OS && npx civilis-risk-os-runtime help && npx civilis-risk-os-runtime health --base-url ${baseUrl} && npx civilis-risk-os-runtime quote --base-url ${baseUrl} --item 501 --buyer sage`,
  }, null, 2));

  if (!ok) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[verify-github-install] failed:', error.message);
  process.exit(1);
});
