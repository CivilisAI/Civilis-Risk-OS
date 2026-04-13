import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
let macosProxyConfigPromise = null;

function getHeaderEntries(headers) {
  if (!headers) return [];
  if (headers instanceof Headers) {
    return Array.from(headers.entries());
  }
  if (Array.isArray(headers)) {
    return headers.map(([key, value]) => [String(key), String(value)]);
  }
  return Object.entries(headers).map(([key, value]) => [String(key), String(value)]);
}

function parseNoProxy(rawValue) {
  return String(rawValue ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function shouldBypassProxy(url, noProxyEntries) {
  const target = new URL(url);
  const hostname = target.hostname.toLowerCase();

  if (
    hostname === '127.0.0.1' ||
    hostname === 'localhost' ||
    hostname === '::1'
  ) {
    return true;
  }

  return noProxyEntries.some((entry) => {
    const normalized = entry.toLowerCase();
    if (normalized === '*') return true;
    if (normalized === hostname) return true;
    if (normalized.startsWith('.')) {
      return hostname.endsWith(normalized);
    }
    return hostname.endsWith(`.${normalized}`);
  });
}

function getProxyFromEnv(url) {
  const target = new URL(url);
  const protocol = target.protocol === 'https:' ? 'https' : 'http';
  const noProxyEntries = parseNoProxy(
    process.env.NO_PROXY ?? process.env.no_proxy ?? '',
  );

  if (shouldBypassProxy(url, noProxyEntries)) {
    return null;
  }

  const candidates =
    protocol === 'https:'
      ? [
          process.env.HTTPS_PROXY,
          process.env.https_proxy,
          process.env.HTTP_PROXY,
          process.env.http_proxy,
          process.env.ALL_PROXY,
          process.env.all_proxy,
        ]
      : [
          process.env.HTTP_PROXY,
          process.env.http_proxy,
          process.env.ALL_PROXY,
          process.env.all_proxy,
        ];

  const proxyUrl = candidates.find((value) => typeof value === 'string' && value.trim());
  return proxyUrl ? proxyUrl.trim() : null;
}

function parseScutilProxyValue(text, key) {
  const match = text.match(new RegExp(`\\b${key}\\s*:\\s*([^\\n]+)`));
  return match ? match[1].trim() : null;
}

async function getMacOsSystemProxy(url) {
  if (process.platform !== 'darwin') return null;
  if (shouldBypassProxy(url, [])) return null;

  if (!macosProxyConfigPromise) {
    macosProxyConfigPromise = execFileAsync('scutil', ['--proxy'])
      .then(({ stdout }) => stdout)
      .catch(() => '');
  }

  const stdout = await macosProxyConfigPromise;
  if (!stdout) return null;

  const target = new URL(url);
  const isHttps = target.protocol === 'https:';
  const prefix = isHttps ? 'HTTPS' : 'HTTP';
  const enabled = parseScutilProxyValue(stdout, `${prefix}Enable`);
  const host = parseScutilProxyValue(stdout, `${prefix}Proxy`);
  const port = parseScutilProxyValue(stdout, `${prefix}Port`);

  if (enabled !== '1' || !host || !port) {
    return null;
  }

  return `http://${host}:${port}`;
}

async function resolveProxy(url) {
  const envProxy = getProxyFromEnv(url);
  if (envProxy) return envProxy;
  return getMacOsSystemProxy(url);
}

async function fetchWithTimeout(url, init = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  let timeoutId = null;

  try {
    return await new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fetch(url, { ...init, signal: controller.signal })
        .then(resolve)
        .catch(reject);
    });
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function fetchViaCurl(url, init = {}, proxyUrl, timeoutMs = 12000) {
  const method = String(init.method ?? 'GET').toUpperCase();
  const headers = getHeaderEntries(init.headers);
  const args = [
    '--silent',
    '--show-error',
    '--location',
    '--max-time',
    String(Math.max(1, Math.ceil(timeoutMs / 1000))),
    '--write-out',
    '\n%{http_code}',
    '--proxy',
    proxyUrl,
    '--request',
    method,
  ];

  for (const [key, value] of headers) {
    args.push('--header', `${key}: ${value}`);
  }

  if (typeof init.body === 'string') {
    args.push('--data-raw', init.body);
  }

  args.push(url);

  const { stdout } = await execFileAsync('curl', args, {
    maxBuffer: 5 * 1024 * 1024,
  });

  const trimmed = stdout.replace(/\s+$/u, '');
  const splitAt = trimmed.lastIndexOf('\n');
  const bodyText = splitAt >= 0 ? trimmed.slice(0, splitAt) : '';
  const statusText = splitAt >= 0 ? trimmed.slice(splitAt + 1) : trimmed;
  const status = Number(statusText);

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `HTTP ${status}`,
    async text() {
      return bodyText;
    },
  };
}

export async function requestJson(url, init = {}, options = {}) {
  const timeoutMs = Number(options.timeoutMs ?? 12000);
  const proxyUrl = await resolveProxy(url);
  let response;

  if (proxyUrl) {
    try {
      response = await fetchViaCurl(url, init, proxyUrl, timeoutMs);
    } catch {
      response = await fetchWithTimeout(url, init, timeoutMs);
    }
  } else {
    response = await fetchWithTimeout(url, init, timeoutMs);
  }

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = body?.error || body?.message || response.statusText;
    throw new Error(`${response.status} ${message}`);
  }
  return body;
}

export async function getResolvedProxy(url) {
  return resolveProxy(url);
}
