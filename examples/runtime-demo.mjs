#!/usr/bin/env node

import { ensureRuntime, requestJson } from './lib/runtime-bootstrap.mjs';
import { BUNDLED_RUNTIME_BASE_URL } from './lib/bundled-runtime-profile.mjs';

const baseUrl = process.env.RISK_OS_DEMO_BASE_URL || BUNDLED_RUNTIME_BASE_URL;
const buyer = process.env.RISK_OS_DEMO_BUYER || 'sage';
const requestedItemId = process.env.RISK_OS_DEMO_ITEM_ID || null;

async function main() {
  const runtime = await ensureRuntime(baseUrl);
  try {
    const health = await requestJson(`${baseUrl}/health`);
    const listingResponse = await requestJson(`${baseUrl}/api/intel/items`);
    const items = Array.isArray(listingResponse?.items) ? listingResponse.items : [];
    const selectedItem = requestedItemId
      ? items.find((item) => String(item.id) === String(requestedItemId))
      : items[0];

    if (!selectedItem) {
      throw new Error('No eligible intel items were returned by the runtime.');
    }

    const quote = await requestJson(`${baseUrl}/api/risk/quote/intel`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        intelItemId: Number(selectedItem.id),
        buyerAgentId: buyer,
      }),
    });

    console.log(JSON.stringify({
      ok: true,
      demo: {
        baseUrl,
        buyer,
        runtimeStartedByDemo: runtime.started,
        itemId: Number(selectedItem.id),
        itemCategory: selectedItem.category ?? null,
      },
      health: {
        status: health.status,
        network: health.checks?.network ?? null,
        mode: health.checks?.mode ?? null,
        acp: health.checks?.acp ?? null,
        erc8004: health.checks?.erc8004 ?? null,
      },
      quote: {
        quoteId: quote.quote_id,
        sellerAgentId: quote.seller_agent_id,
        riskScore: quote.risk_score,
        recommendedMode: quote.recommended_mode,
        premiumAmount: quote.premium_amount,
        claimWindowSeconds: quote.claim_window_seconds,
      },
    }, null, 2));
  } finally {
    runtime.stop();
  }
}

main().catch((error) => {
  console.error('[runtime-demo] failed:', error.message);
  process.exit(1);
});
