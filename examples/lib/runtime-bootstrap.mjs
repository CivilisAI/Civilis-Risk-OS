import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUNDLED_RUNTIME_AUTH, BUNDLED_RUNTIME_BASE_URL, isLocalRuntimeUrl } from './bundled-runtime-profile.mjs';

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

export async function getRuntimeHealth(baseUrl) {
  try {
    return await requestJson(`${baseUrl.replace(/\/$/, '')}/health`);
  } catch {
    return null;
  }
}

export async function isRuntimeReachable(baseUrl) {
  const health = await getRuntimeHealth(baseUrl);
  return health?.status === 'ok';
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

function parseEnvText(text) {
  const values = {};
  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const equals = line.indexOf('=');
    if (equals <= 0) continue;
    const key = line.slice(0, equals).trim();
    let value = line.slice(equals + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function readEnvFile(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    return parseEnvText(text);
  } catch {
    return {};
  }
}

function loadRuntimeEnv(runtimeRoot) {
  const candidates = [
    path.join(runtimeRoot, '.env'),
    path.join(runtimeRoot, 'src', '.env'),
    path.resolve(runtimeRoot, '..', '.env'),
    path.resolve(runtimeRoot, '.env.local'),
    path.resolve(runtimeRoot, '..', '.env.local'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return {
        file: candidate,
        values: readEnvFile(candidate),
      };
    }
  }

  return {
    file: null,
    values: {},
  };
}

function getRuntimeAuth(runtimeEnvValues) {
  return {
    claimantToken: process.env.RISK_OS_CLAIMANT_TOKEN || runtimeEnvValues.RISK_OS_CLAIMANT_AUTH_TOKEN || '',
    evaluatorToken: process.env.RISK_OS_EVALUATOR_TOKEN || runtimeEnvValues.RISK_OS_EVALUATOR_AUTH_TOKEN || '',
    claimantSignature: process.env.RISK_OS_CLAIMANT_SIGNATURE || '',
    evaluatorSignature: process.env.RISK_OS_EVALUATOR_SIGNATURE || '',
  };
}

function getBundledRuntimeAuth() {
  return {
    ...BUNDLED_RUNTIME_AUTH,
  };
}

async function startBundledRuntime(baseUrl) {
  const port = String(portFromBaseUrl(baseUrl));
  const bundledEntrypoint = path.join(repoRoot, 'examples', 'bundled-runtime.mjs');
  const child = spawn(process.execPath, [bundledEntrypoint, port], {
    cwd: repoRoot,
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

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const health = await getRuntimeHealth(baseUrl);
    if (health?.status === 'ok') {
      return {
        started: true,
        child,
        baseUrl,
        runtimeRoot: repoRoot,
        runtimeEnvFile: null,
        auth: getBundledRuntimeAuth(),
        stop: cleanup,
      };
    }
    if (child.exitCode !== null) {
      break;
    }
    await sleep(250);
  }

  cleanup();
  throw new Error(`Failed to auto-start the bundled runtime at ${baseUrl}.`);
}

export async function ensureRuntime(baseUrl) {
  const currentHealth = await getRuntimeHealth(baseUrl);
  if (currentHealth?.status === 'ok') {
    const runtimeRoot = resolveRuntimeRoot();
    const runtimeEnv = runtimeRoot ? loadRuntimeEnv(runtimeRoot) : { file: null, values: {} };
    const bundled = currentHealth.checks?.mode === 'bundled' || baseUrl === BUNDLED_RUNTIME_BASE_URL;
    return {
      started: false,
      child: null,
      baseUrl,
      runtimeRoot,
      runtimeEnvFile: runtimeEnv.file,
      auth: bundled ? getBundledRuntimeAuth() : getRuntimeAuth(runtimeEnv.values),
      stop() {},
    };
  }

  if (isLocalRuntimeUrl(baseUrl)) {
    const liveProfile = process.env.RISK_OS_RUNTIME_PROFILE === 'live';
    if (!liveProfile) {
      return startBundledRuntime(baseUrl);
    }
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
      const runtimeEnv = loadRuntimeEnv(runtimeRoot);
      return {
        started: true,
        child,
        baseUrl,
        runtimeRoot,
        runtimeEnvFile: runtimeEnv.file,
        auth: getRuntimeAuth(runtimeEnv.values),
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

export function withDefaultRuntimeAuth(flags, runtime) {
  return {
    ...flags,
    'claimant-token': flags['claimant-token'] || runtime.auth?.claimantToken || '',
    'claimant-signature': flags['claimant-signature'] || runtime.auth?.claimantSignature || '',
    'evaluator-token': flags['evaluator-token'] || runtime.auth?.evaluatorToken || '',
    'evaluator-signature': flags['evaluator-signature'] || runtime.auth?.evaluatorSignature || '',
  };
}
