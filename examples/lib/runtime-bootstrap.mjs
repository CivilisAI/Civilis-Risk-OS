import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function requestJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = body?.error || body?.message || response.statusText;
    throw new Error(`${response.status} ${message}`);
  }
  return body;
}

export async function isRuntimeReachable(baseUrl) {
  try {
    const health = await requestJson(`${baseUrl.replace(/\/$/, '')}/health`);
    return health?.status === 'ok';
  } catch {
    return false;
  }
}

function resolveRuntimeRoot() {
  const explicitRoot = process.env.RISK_OS_RUNTIME_ROOT?.trim();
  if (explicitRoot) {
    const srcDir = path.join(explicitRoot, 'src');
    if (fs.existsSync(path.join(srcDir, 'package.json'))) {
      return srcDir;
    }
  }

  const siblingCivilis = path.resolve(repoRoot, '..', 'Civilis', 'src');
  if (fs.existsSync(path.join(siblingCivilis, 'package.json'))) {
    return siblingCivilis;
  }

  return null;
}

function portFromBaseUrl(baseUrl) {
  const parsed = new URL(baseUrl);
  return parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80;
}

export async function ensureRuntime(baseUrl) {
  if (await isRuntimeReachable(baseUrl)) {
    return {
      started: false,
      child: null,
      baseUrl,
      stop() {},
    };
  }

  const runtimeRoot = resolveRuntimeRoot();
  if (!runtimeRoot) {
    throw new Error(
      `No compatible runtime is reachable at ${baseUrl} and no linked Civilis workspace was found. ` +
      'Set RISK_OS_DEMO_BASE_URL to a hosted compatible runtime or set RISK_OS_RUNTIME_ROOT to a local Civilis checkout.',
    );
  }

  const port = String(portFromBaseUrl(baseUrl));
  const child = spawn('pnpm', ['dev:server'], {
    cwd: runtimeRoot,
    env: {
      ...process.env,
      PORT: port,
    },
    stdio: 'ignore',
    detached: true,
  });
  child.unref();

  const cleanup = () => {
    if (child.pid) {
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch {}
    }
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(143);
  });

  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    if (await isRuntimeReachable(baseUrl)) {
      return {
        started: true,
        child,
        baseUrl,
        stop: cleanup,
      };
    }
    if (child.exitCode !== null) {
      break;
    }
    await sleep(1000);
  }

  cleanup();
  throw new Error(
    `Failed to auto-start a compatible runtime at ${baseUrl} from ${runtimeRoot}. ` +
    'Use an already running compatible runtime or check the local Civilis workspace env.',
  );
}
