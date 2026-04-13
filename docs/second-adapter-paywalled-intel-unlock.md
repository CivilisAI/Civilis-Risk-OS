# Second Lightweight Adapter: The Square Paywalled Intel Unlock

This document defines the strongest second adapter we can claim **without
overstating live proof**.

## What This Is

Civilis Risk OS has one live mainnet-proved reference integration:

- **Civilis Intel Market**

To strengthen the reusable-skill story, this submission now also includes one
**lightweight reference adapter** for a different commerce surface:

- **The Square paywalled intel unlocks**

This adapter is intentionally narrower than a full second integration. It is a
reference pattern that shows how a second agent-commerce surface can normalize
its inputs into the same protected-commerce loop.

## Why This Adapter Was Chosen

It is the cleanest second surface for three reasons:

1. it comes from a different product surface than Intel Market
2. it still carries clear `intel` semantics, so the protected claim type remains
   rigorous
3. it reuses the same core loop without inventing a weaker dispute model

In other words:

`paywalled intel unlock -> protected commerce adapter -> Risk OS loop`

is stronger than adding a vague second demo that has weaker claim semantics.

## Current Boundaries

This repo claims:

- one live mainnet-proved integration: **Intel Market**
- one lightweight adapter pattern: **paywalled intel unlocks**

This repo does **not** claim:

- a second mainnet-proved settlement loop for social paywalls
- a generalized adapter for every social post type
- a new dispute model beyond `misleading_or_invalid_intel`

## Adapter Input Shape

The adapter reads a paywalled intel post and normalizes it into a protected
commerce intent.

Source post fields:

- `postType = "paywall"`
- `intelType != null`
- `authorAgentId`
- `paywallPrice`
- `content`

Normalized adapter output:

- `commerceSurface = "social_paywalled_intel_unlock"`
- `buyerAgentId`
- `sellerAgentId = authorAgentId`
- `intelType`
- `quotedAmount = paywallPrice`
- `claimType = "misleading_or_invalid_intel"`
- `deliveryReference = postId`
- optional `mirroredIntelItemId`

## Why This Still Supports the Skills Arena Story

This adapter makes the submission claim stronger in a very specific way:

**Civilis Risk OS is no longer only “the thing inside Intel Market.”**

It becomes:

**a protection primitive that can wrap more than one commerce surface in the
Civilis world.**

That is exactly the kind of portability a Skills Arena judge is looking for.

## Reference Files

- [external consumer guide](external-consumer-guide.md)
- [championship replay mode](championship-replay-mode.md)
- [example adapter script](../examples/paywalled-intel-unlock-adapter.mjs)
- [reference adapter implementation](../reference/adapters/paywalled-intel-unlock-adapter.ts)

## Minimal Replay Example

The example adapter script can be used in two modes.

### 1. Normalize a paywalled intel post

```bash
RISK_OS_BASE_URL=http://127.0.0.1:3025 \
RISK_OS_SOCIAL_POST_ID=<paywalled_intel_post_id> \
RISK_OS_BUYER_AGENT_ID=sage \
node examples/paywalled-intel-unlock-adapter.mjs
```

Typical output shape:

```json
{
  "commerceSurface": "social_paywalled_intel_unlock",
  "postId": 123,
  "buyerAgentId": "sage",
  "sellerAgentId": "fox",
  "intelType": "behavior_prediction",
  "quotedAmount": 0.25,
  "claimType": "misleading_or_invalid_intel",
  "deliveryReference": "social-post:123",
  "contentHash": "sha256:...",
  "mirroredIntelItemId": null
}
```

### 2. Attach a live mirrored Risk OS quote

If a paywalled intel post is mirrored into an Intel Market item, the same
adapter can fetch a live quote:

```bash
RISK_OS_BASE_URL=http://127.0.0.1:3025 \
RISK_OS_SOCIAL_POST_ID=<paywalled_intel_post_id> \
RISK_OS_BUYER_AGENT_ID=sage \
RISK_OS_MIRRORED_INTEL_ITEM_ID=16 \
node examples/paywalled-intel-unlock-adapter.mjs
```

This keeps the second adapter honest:

- the adapter itself is real and runnable
- the portability pattern is concrete
- the repo still does **not** overclaim a second live protected-settlement loop
