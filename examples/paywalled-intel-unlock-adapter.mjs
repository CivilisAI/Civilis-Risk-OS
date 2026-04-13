#!/usr/bin/env node

import { createHash } from 'node:crypto';

const baseUrl = (process.env.RISK_OS_BASE_URL || 'http://127.0.0.1:3020').replace(/\/$/, '');
const postId = Number(process.env.RISK_OS_SOCIAL_POST_ID || '0');
const buyerAgentId = process.env.RISK_OS_BUYER_AGENT_ID || 'sage';
const mirroredIntelItemId = Number(process.env.RISK_OS_MIRRORED_INTEL_ITEM_ID || '0');

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(body)}`);
  }
  return body;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function normalize(post) {
  if (post.postType !== 'paywall') {
    throw new Error('Post is not a paywalled post');
  }
  if (!post.intelType) {
    throw new Error('Post is not an intel post');
  }

  return {
    commerceSurface: 'social_paywalled_intel_unlock',
    postId: post.id,
    buyerAgentId,
    sellerAgentId: post.authorAgentId,
    intelType: post.intelType,
    quotedAmount: post.paywallPrice ?? null,
    claimType: 'misleading_or_invalid_intel',
    deliveryReference: `social-post:${post.id}`,
    contentHash: `sha256:${sha256(post.content || '')}`,
    mirroredIntelItemId: mirroredIntelItemId || null,
  };
}

async function maybeAttachMirroredQuote(normalized) {
  if (!mirroredIntelItemId) {
    return {
      ...normalized,
      note: 'Set RISK_OS_MIRRORED_INTEL_ITEM_ID to fetch a live Risk OS quote for the mirrored intel item.',
    };
  }

  const quote = await request('/api/risk/quote/intel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intelItemId: mirroredIntelItemId,
      buyerAgentId,
    }),
  });

  return {
    ...normalized,
    mirroredQuote: quote,
  };
}

async function main() {
  if (!postId) {
    throw new Error('Set RISK_OS_SOCIAL_POST_ID to inspect a paywalled intel post');
  }

  const post = await request(`/api/social/post/${postId}?viewerAgentId=${encodeURIComponent(buyerAgentId)}`);
  const normalized = normalize(post);
  const output = await maybeAttachMirroredQuote(normalized);
  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error('[paywalled-intel-unlock-adapter] failed:', error.message);
  process.exit(1);
});
