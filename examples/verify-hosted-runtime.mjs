#!/usr/bin/env node

import { requestJson } from './lib/http-client.mjs';
import { ensureRuntime, withRuntimeRequestHeaders } from './lib/runtime-bootstrap.mjs';
import { runProtectedLoop } from './lib/runtime-full-loop.mjs';

const baseUrl =
  process.env.RISK_OS_HOSTED_BASE_URL ||
  'https://civilis-risk-os-runtime.ceolaexekiel.workers.dev';

async function main() {
  process.env.RISK_OS_RUNTIME_SESSION ||= `verify-hosted-${Date.now()}`;
  const runtime = await ensureRuntime(baseUrl);
  try {
    const requestBaseUrl = runtime.requestBaseUrl || baseUrl;
    const health = await requestJson(`${requestBaseUrl}/health`, {
      headers: withRuntimeRequestHeaders(undefined, runtime),
    });
    const quote = await requestJson(`${requestBaseUrl}/api/risk/quote/intel`, {
      method: 'POST',
      headers: withRuntimeRequestHeaders({ 'content-type': 'application/json' }, runtime),
      body: JSON.stringify({
        intelItemId: 501,
        buyerAgentId: 'sage',
      }),
    });

    const loop = await runProtectedLoop({
      baseUrl,
      buyerAgentId: 'sage',
      itemId: 501,
      claimReason: 'hosted-runtime-check',
      decision: 'refund',
      decisionReason: 'hosted-runtime-check',
    });

    console.log(
      JSON.stringify(
        {
          ok: health?.status === 'ok' && loop?.ok === true,
          hosted: {
            baseUrl,
            mode: health?.checks?.mode ?? null,
            network: health?.checks?.network ?? null,
          },
          quote: {
            quoteId: quote?.quote_id ?? null,
            recommendedMode: quote?.recommended_mode ?? null,
            premiumAmount: quote?.premium_amount ?? null,
          },
          fullLoop: {
            protectedPurchaseId: loop?.loop?.protectedPurchaseId ?? null,
            claimId: loop?.loop?.claimId ?? null,
            laterQuoteId: loop?.loop?.laterQuoteId ?? null,
            resolutionDecision: loop?.resolution?.decision ?? null,
            requoteRiskScore: loop?.requote?.riskScore ?? null,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    runtime.stop();
  }
}

main().catch((error) => {
  console.error('[verify-hosted-runtime] failed:', error.message);
  process.exit(1);
});
