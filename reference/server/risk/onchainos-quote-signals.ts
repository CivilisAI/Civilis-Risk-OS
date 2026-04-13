import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { getUsdtAddress } from '../config/xlayer.js';

const execFile = promisify(execFileCallback);
const ONCHAINOS_BIN = process.env.ONCHAINOS_BIN?.trim() || 'onchainos';
const ONCHAINOS_TIMEOUT_MS = 12_000;
const ONCHAINOS_MAX_BUFFER = 1024 * 1024 * 4;
const XLAYER_CHAIN = 'xlayer';

type AssociatedTokenSource =
  | 'intel_content_address'
  | 'payment_rail_fallback'
  | 'none';

interface TokenScanRow {
  address?: string;
  tokenAddress?: string;
  tokenContractAddress?: string;
  contractAddress?: string;
  riskLevel?: string | number;
  level?: string | number;
}

interface TokenHoldersRow {
  holdPercent?: string | number;
}

interface TokenAdvancedInfo {
  top10HoldPercent?: string | number;
  riskControlLevel?: string | number;
  suspiciousHoldingPercent?: string | number;
  bundleHoldingPercent?: string | number;
}

interface OnchainosEnvelope<T> {
  ok?: boolean;
  data?: T;
  msg?: string;
  message?: string;
}

export interface QuoteOnchainSignalAdjustments {
  delta: number;
  reason: string;
  detail: string;
}

export interface QuoteOnchainSignalSummary {
  sellerWalletAddress: string | null;
  associatedTokenAddress: string | null;
  associatedTokenSource: AssociatedTokenSource;
  sellerWalletSecurity: {
    scanned: boolean;
    flaggedTokenCount: number;
    flaggedTokenAddresses: string[];
    error: string | null;
  };
  tokenConcentration: {
    scanned: boolean;
    top10HoldPercent: number | null;
    largestHolderPercent: number | null;
    top5HolderPercent: number | null;
    riskControlLevel: number | null;
    suspiciousHoldingPercent: number | null;
    bundleHoldingPercent: number | null;
    error: string | null;
  };
}

export async function getOnchainOsQuoteSignals(params: {
  sellerWalletAddress?: string | null;
  itemContent?: unknown;
}): Promise<{
  signals: QuoteOnchainSignalSummary;
  adjustments: QuoteOnchainSignalAdjustments[];
}> {
  const sellerWalletAddress = normalizeAddress(params.sellerWalletAddress);
  const associatedTokenAddress = await resolveAssociatedTokenAddress(params.itemContent);
  const signals: QuoteOnchainSignalSummary = {
    sellerWalletAddress,
    associatedTokenAddress: associatedTokenAddress.address,
    associatedTokenSource: associatedTokenAddress.source,
    sellerWalletSecurity: {
      scanned: false,
      flaggedTokenCount: 0,
      flaggedTokenAddresses: [],
      error: null,
    },
    tokenConcentration: {
      scanned: false,
      top10HoldPercent: null,
      largestHolderPercent: null,
      top5HolderPercent: null,
      riskControlLevel: null,
      suspiciousHoldingPercent: null,
      bundleHoldingPercent: null,
      error: null,
    },
  };
  const adjustments: QuoteOnchainSignalAdjustments[] = [];

  if (sellerWalletAddress) {
    try {
      const security = await runOnchainosCommand<TokenScanRow[]>([
        'security',
        'token-scan',
        '--address',
        sellerWalletAddress,
        '--chain',
        XLAYER_CHAIN,
      ]);
      signals.sellerWalletSecurity.scanned = true;
      const rows = Array.isArray(security.data) ? security.data : [];
      const addresses = rows
        .map((row) =>
          normalizeAddress(
            row.address ??
            row.tokenAddress ??
            row.tokenContractAddress ??
            row.contractAddress ??
            null,
          ),
        )
        .filter((value): value is string => Boolean(value));

      signals.sellerWalletSecurity.flaggedTokenAddresses = Array.from(new Set(addresses));
      signals.sellerWalletSecurity.flaggedTokenCount = signals.sellerWalletSecurity.flaggedTokenAddresses.length;

      if (signals.sellerWalletSecurity.flaggedTokenCount > 0) {
        adjustments.push({
          delta: 6,
          reason: 'seller_wallet_tokens_flagged_by_okx_security',
          detail: `OKX Security flagged ${signals.sellerWalletSecurity.flaggedTokenCount} token(s) held by the seller wallet`,
        });
      }
    } catch (error) {
      signals.sellerWalletSecurity.error = error instanceof Error ? error.message : String(error);
    }
  }

  if (associatedTokenAddress.address) {
    try {
      const [advancedInfo, holderInfo] = await Promise.all([
        runOnchainosCommand<TokenAdvancedInfo>([
          'token',
          'advanced-info',
          '--chain',
          XLAYER_CHAIN,
          '--address',
          associatedTokenAddress.address,
        ]),
        runOnchainosCommand<TokenHoldersRow[]>([
          'token',
          'holders',
          '--chain',
          XLAYER_CHAIN,
          '--address',
          associatedTokenAddress.address,
        ]),
      ]);

      signals.tokenConcentration.scanned = true;
      const advanced = advancedInfo.data ?? {};
      const holders = Array.isArray(holderInfo.data) ? holderInfo.data : [];
      const holderPercents = holders
        .map((row) => readNumber(row.holdPercent))
        .filter((value): value is number => value != null);

      signals.tokenConcentration.top10HoldPercent = readNumber(advanced.top10HoldPercent);
      signals.tokenConcentration.riskControlLevel = readNumber(advanced.riskControlLevel);
      signals.tokenConcentration.suspiciousHoldingPercent = readNumber(advanced.suspiciousHoldingPercent);
      signals.tokenConcentration.bundleHoldingPercent = readNumber(advanced.bundleHoldingPercent);
      signals.tokenConcentration.largestHolderPercent = holderPercents[0] ?? null;
      signals.tokenConcentration.top5HolderPercent = sumPercents(holderPercents, 5);

      const concentrationLabel =
        associatedTokenAddress.source === 'payment_rail_fallback'
          ? 'payment_rail_token'
          : 'associated_token';

      if ((signals.tokenConcentration.top10HoldPercent ?? 0) >= 40) {
        adjustments.push({
          delta: 5,
          reason: `${concentrationLabel}_top10_holder_concentration_high`,
          detail: `Top 10 holders control ${(signals.tokenConcentration.top10HoldPercent ?? 0).toFixed(2)}%`,
        });
      }

      if ((signals.tokenConcentration.largestHolderPercent ?? 0) >= 20) {
        adjustments.push({
          delta: 4,
          reason: `${concentrationLabel}_largest_holder_concentration_high`,
          detail: `Largest holder controls ${(signals.tokenConcentration.largestHolderPercent ?? 0).toFixed(2)}%`,
        });
      }

      if ((signals.tokenConcentration.riskControlLevel ?? 0) >= 2) {
        adjustments.push({
          delta: 5,
          reason: `${concentrationLabel}_okx_risk_control_elevated`,
          detail: `OKX advanced token info reported riskControlLevel=${signals.tokenConcentration.riskControlLevel}`,
        });
      }

      if ((signals.tokenConcentration.suspiciousHoldingPercent ?? 0) >= 10) {
        adjustments.push({
          delta: 3,
          reason: `${concentrationLabel}_suspicious_holder_share_elevated`,
          detail: `Suspicious holding share is ${(signals.tokenConcentration.suspiciousHoldingPercent ?? 0).toFixed(2)}%`,
        });
      }
    } catch (error) {
      signals.tokenConcentration.error = error instanceof Error ? error.message : String(error);
    }
  }

  return { signals, adjustments };
}

async function resolveAssociatedTokenAddress(itemContent: unknown): Promise<{
  address: string | null;
  source: AssociatedTokenSource;
}> {
  const extractedAddress = findFirstAddress(itemContent);
  if (extractedAddress) {
    return {
      address: extractedAddress,
      source: 'intel_content_address',
    };
  }

  const paymentTokenAddress = normalizeAddress(getUsdtAddress());
  if (paymentTokenAddress) {
    return {
      address: paymentTokenAddress,
      source: 'payment_rail_fallback',
    };
  }

  return {
    address: null,
    source: 'none',
  };
}

async function runOnchainosCommand<T>(args: string[]): Promise<OnchainosEnvelope<T>> {
  const env = buildCliEnv();
  const { stdout, stderr } = await execFile(ONCHAINOS_BIN, args, {
    env,
    timeout: ONCHAINOS_TIMEOUT_MS,
    maxBuffer: ONCHAINOS_MAX_BUFFER,
  });

  const raw = stdout.trim();
  if (!raw) {
    throw new Error(`onchainos ${args.join(' ')} returned no JSON output${stderr?.trim() ? ` (${stderr.trim()})` : ''}`);
  }

  try {
    return JSON.parse(raw) as OnchainosEnvelope<T>;
  } catch (error) {
    throw new Error(
      `Failed to parse onchainos ${args.join(' ')} output as JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function buildCliEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  const proxy = process.env.RISK_OS_OKX_PROXY_URL?.trim();
  if (proxy) {
    env.HTTP_PROXY = proxy;
    env.HTTPS_PROXY = proxy;
    env.http_proxy = proxy;
    env.https_proxy = proxy;
  }
  return env;
}

function findFirstAddress(value: unknown): string | null {
  const visited = new Set<unknown>();
  return walkForAddress(value, visited);
}

function walkForAddress(value: unknown, visited: Set<unknown>): string | null {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    const match = value.match(/0x[a-fA-F0-9]{40}/);
    return match ? match[0].toLowerCase() : null;
  }

  if (typeof value !== 'object') {
    return null;
  }

  if (visited.has(value)) {
    return null;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = walkForAddress(entry, visited);
      if (found) {
        return found;
      }
    }
    return null;
  }

  for (const entry of Object.values(value as Record<string, unknown>)) {
    const found = walkForAddress(entry, visited);
    if (found) {
      return found;
    }
  }
  return null;
}

function normalizeAddress(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return null;
  }

  return trimmed.toLowerCase();
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function sumPercents(values: number[], count: number): number | null {
  if (values.length === 0) {
    return null;
  }

  const total = values.slice(0, count).reduce((sum, value) => sum + value, 0);
  return Number(total.toFixed(4));
}
