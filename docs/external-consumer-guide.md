# External Consumer Guide

Civilis Risk OS is demonstrated through Civilis Intel Market, but the intended
submission claim is broader:

**another agent app can reuse the same protection pattern without adopting the
rest of the Civilis world.**

## Who This Is For

This submission is designed for:

- agent marketplaces
- paid research or intel endpoints
- agent API sellers
- agent-to-agent task surfaces that want challengeable settlement

## Reusable Consumer Pattern

The current public surface is intel-scoped, but the protection loop is generic.

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

Call:

- `POST /api/risk/claims`

This opens the evaluator-driven resolution path.

### Step 5. Resolve to `release` or `refund`

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

## Current Scope Boundaries

This repo currently proves the pattern through one live reference integration:

- Civilis Intel Market

It does not yet claim:

- generalized adapters for every commerce vertical
- partial refunds
- decentralized arbitration
- wallet-signature-bound universal evaluator auth
