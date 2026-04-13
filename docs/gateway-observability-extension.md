# Gateway Observability Extension

This document defines the most natural next-step observability layer for
Civilis Risk OS using the official `okx-onchain-gateway` capability boundary.

It is a design extension, not a claim that the current canonical replay already
depends on gateway-level simulation or broadcast traces.

## Why This Is The Right Next Observability Layer

Risk OS already captures:

- canonical actors
- canonical tx hashes
- local protected purchase and claim state
- repricing outcomes

The next most useful infrastructure-grade enhancement is to add **simulation and
broadcast observability** around settlement.

This matches the official `okx-onchain-gateway` boundary:

- gas estimation
- simulation
- broadcast
- order / tx tracking

## Suggested Observability Surfaces

### A. Settlement simulation

Before release or refund:

1. prepare settlement payload
2. simulate via gateway
3. persist simulation metadata next to the protected purchase

### B. Broadcast trace

For release/refund execution:

1. submit settlement
2. record broadcast / tracking metadata
3. attach order or tx tracking evidence to the proof pack

### C. Replay-grade audit layer

This would let a future verifier say not only:

- “the tx hash exists”

but also:

- “the settlement was simulated and broadcast through a tracked path”

## Why This Helps The Submission

This is a good next infrastructure step because it:

- increases replay credibility
- strengthens the “primitive, not page feature” story
- stays aligned with official Onchain OS capability boundaries

## Current Submission Boundary

Current repo claim:

- **future observability extension, not a current canonical requirement**
