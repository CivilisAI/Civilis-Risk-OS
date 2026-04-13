# External Consumer Guide

Civilis Risk OS is demonstrated through Civilis Intel Market, but the intended
submission claim is broader:

**another agent app can reuse the same protection pattern without adopting the
rest of the Civilis world.**

This guide should be read after:

- [Runtime Quickstart](runtime-quickstart.md)
- [Runtime Tool Surface](runtime-tool-surface.md)
- [Proof Surface Matrix](proof-surface-matrix.md)
- [External Consumer Schema](external-consumer-schema.md)
- [Integration Checklist](integration-checklist.md)
- [../openapi/risk-os.openapi.yaml](../openapi/risk-os.openapi.yaml)
- [Championship Replay Mode](championship-replay-mode.md)

## Who This Is For

This submission is designed for:

- agent marketplaces
- paid research or intel endpoints
- agent API sellers
- agent-to-agent task surfaces that want challengeable settlement

## Reusable Consumer Pattern

The current public surface is intel-scoped, but the protection loop is generic.

The fastest way for another AI to use that loop is no longer to handcraft HTTP
calls first. It is to start from the runtime wrapper:

- [../examples/risk-os-runtime.mjs](../examples/risk-os-runtime.mjs)

### Step 1. Quote the seller risk before purchase

Call:

- `POST /api/risk/quote/intel`

You receive:

- `risk_score`
- `recommended_mode`
- `premium`
- `claim_window_seconds`
- risk reasons

### Step 2. Choose the settlement mode

If risk is low, a client may accept `instant`.

If risk is elevated, the client should choose `challengeable` so principal is
funded into the protected `ERC-8183` path instead of becoming instantly final.

### Step 3. Execute the protected buy

Call:

- `POST /api/intel/items/:id/buy`

For the challengeable path, the protected purchase enters a challenge window
after delivery is submitted.

### Step 4. File a claim only if the delivery fails the protected threshold

Optional preparation call:

- `GET /api/risk/purchases/:id/claim-proof`

The buyer side now has two integration paths:

- use the strict proof-environment claimant token
- or fetch a deterministic `claim-proof` message and sign it with the buyer
  wallet

By default, one of those proof paths is required. An unauthenticated buyer claim
is not accepted unless a developer explicitly enables
`RISK_OS_ALLOW_UNAUTHENTICATED_DEV=true` in a non-submission environment.

Call:

- `POST /api/risk/claims`

This opens the evaluator-driven resolution path.

### Step 5. Resolve to `release` or `refund`

An external evaluator has two integration paths:

- use the strict proof-environment evaluator token
- or fetch a deterministic `resolve-proof` message and sign it with the
  evaluator wallet

By default, one of those evaluator proof paths is also required. The submission
does not rely on an open resolver endpoint.

Optional preparation call:

- `GET /api/risk/claims/:id/resolve-proof`

Call:

- `POST /api/risk/claims/:id/resolve`

The evaluator decides whether the seller should receive principal or the buyer
should be refunded.

### Step 6. Reuse the later repriced quote

Protected outcomes change later seller risk.

That means the skill does not merely settle one transaction; it changes how the
next transaction is priced and routed.

## Why This Matters

The reusable claim is not:

- “this is only a Civilis page feature”

The reusable claim is:

- **“this is a protection primitive any agent commerce app can wrap around
  payment and delivery.”**

This repo now includes a validated external-consumer quickstart script:

- [../examples/external-consumer-quickstart.mjs](../examples/external-consumer-quickstart.mjs)

The strongest current canonical replay from the public quickstart path is:

- quote `34`
- challengeable protected purchase `11`
- buyer claim-proof for `sage`
- unauthenticated claim rejected with `403`
- authenticated claim `10`
- evaluator refund resolution through `arbiter`
- later quote `36`

This path now proves the full reusable flow against independently controlled
Agentic Wallet actors for buyer, seller, and evaluator. Earlier historical
quickstart captures remain in the evidence pack as additional depth, but the
current repo should be read against the `16 -> 34 -> 11 -> 10 -> 36` canonical
path first.

This repo also includes a second lightweight reference adapter for a different
commerce surface:

- [The Square paywalled intel unlock adapter](second-adapter-paywalled-intel-unlock.md)

That adapter is intentionally documented as a portability pattern, not as a
second live mainnet-proved integration.

What it proves:

- a second commerce surface can normalize into the same quote / claim / resolve
  language
- Risk OS is broader than one Civilis page

What it does not prove:

- a second mainnet-proved protected settlement loop
- a second fully captured dispute and repricing chain

The strongest way to read the adapter is:

- **Intel Market** proves the live protected settlement loop
- **The Square paywalled intel unlock** proves that another commerce surface can
  normalize into the same Risk OS contract without inventing a weaker dispute
  model

## Current Scope Boundaries

This repo currently proves the pattern through one live reference integration:

- Civilis Intel Market

And one lightweight reference adapter:

- The Square paywalled intel unlocks

It does not yet claim:

- generalized adapters for every commerce vertical
- partial refunds
- decentralized arbitration
- wallet-signature-bound universal claimant/evaluator auth across every role and
  surface
