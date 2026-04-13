# Civilis Risk OS Implementation Plan

## Implementation Principle

Build the smallest safe extension that preserves the existing Intel Market and ACP semantics.

Do not replace the commerce stack.
Do not invent a new protocol.
Do not overstate decentralization.

For submission packaging, do not present this as a generic feature expansion of
Civilis alone. Present it as a **Skills Arena reusable protection skill** with
Intel Market as the reference integration.

## Existing Building Blocks

- Intel purchase route
- ACP funded and record-only job creation
- ACP submit / complete / reject lifecycle
- ERC-8004 reputation summary
- ERC-8004 validation summary
- Intel credit score view

## Submission Packaging Objectives

The docs and submission material must make these points unambiguous:

- `Civilis` is the live showcase environment
- `Civilis Risk OS` is the reusable submission artifact
- the current public API is intel-scoped, but the protection pattern is the
  transferable part
- verified evidence and target proof are clearly separated

The docs should not imply that generic multi-market packaging is already fully
finished.

## Critical Constraint

The current funded intel flow auto-completes after delivery.

That behavior must be split into:
- delivery submission
- later settlement finalization

Without that split, protected commerce is not real.

## New Backend Modules

In the original working implementation, these modules lived under the internal
server package. In this public submission repo, their extracted counterparts
live under `reference/server/...`.

- `reference/server/risk/risk-types.ts`
- `reference/server/risk/risk-policy.ts`
- `reference/server/risk/quote-engine.ts`
- `reference/server/risk/protected-purchase.ts`
- `reference/server/risk/claim-lifecycle.ts`
- `reference/server/risk/risk-routes.ts`
- `reference/server/risk/challenge-window-worker.ts`

## Existing Files To Modify

- `reference/server/intel/intel-routes.ts`
- `reference/server/erc8183/hooks/intel-hook.ts`
- `reference/server/db/postgres.ts`
- `reference/server/app/index.ts`
- `reference/server/erc8004/reputation-registry.ts`
- `reference/dashboard/lib/api.ts`
- `reference/dashboard/ProtectedCommercePanel.tsx`

## Data Model Additions

### `risk_quotes`

Stores quote inputs and outputs for a single protected purchase decision.

### `protected_intel_purchases`

Stores the risk-layer state attached to a funded intel purchase.

### `purchase_claims`

Stores buyer claims and evaluator outcomes.

## API Surface

### `POST /api/risk/quote/intel`

Returns:
- risk score
- recommended mode
- premium
- challenge window
- reasons

### `POST /api/intel/items/:id/buy`

Extends current body with:
- `purchaseMode`
- `quoteId`

### `POST /api/risk/claims`

Creates a claim on a protected purchase.

### `POST /api/risk/claims/:id/resolve`

Evaluator resolves claim to `release` or `refund`.

### `GET /api/risk/purchases/:id`

Returns the purchase, linked claim, deadline, and settlement view.

## Reusable Skill Framing

For Skills Arena, the reusable claim is:

- quote a transaction before purchase
- select a protected settlement mode
- open a dispute during the challenge window
- let an evaluator decide release or refund
- feed the outcome back into future risk pricing

The Intel Market route names in this repo are the current reference adapter, not
the whole submission claim.

## UI Scope

Intel page only.

Required UI blocks:
- risk quote card
- mode selector
- challenge deadline
- claim action
- purchase status / resolution state

The UI exists to make the skill legible to judges. It should not be described
as the primary product artifact.

## Build Order

1. Split funded intel lifecycle so it no longer auto-completes.
2. Add database tables.
3. Implement quote engine and risk policy.
4. Implement protected purchase orchestration.
5. Implement claim lifecycle and resolution.
6. Add minimum UI.
7. Run verification and generate mainnet evidence.

## Verification Plan

- server type check
- dashboard build
- targeted flow test with local runtime
- self-review against acceptance criteria

## Submission Evidence Checklist

Before submission packaging is considered complete, confirm whether each item is:

- `verified now`
- `captured as mainnet evidence`
- `still target proof`

Checklist:

- quote before purchase
- challengeable purchase held in ACP `submitted`
- claim creation during challenge window
- evaluator-authorized release path
- evaluator-authorized refund path
- later quote change after a resolved outcome
- screenshots or demo clips showing the protection loop

## Verified Evidence vs Remaining Proof

### Already Verified

- Risk OS routes are mounted and reachable in strict mainnet mode.
- Quote generation works against a protected intel item.
- Challengeable purchase creates a funded ACP job and leaves it in `submitted`.
- Protected purchase aggregation view works.
- Claim creation works and moves a purchase into `claimed`.
- Evaluator-gated `refund` works.
- Evaluator-gated `release` works.
- ACP job `1955` reached `rejected` and emitted a `Refunded` event.
- ACP job `1956` reached `completed` and emitted `PaymentReleased`.
- Later quotes repriced the same seller from `76` risk to `91` risk after refund, and from `91` to `79` after a clean release.

### Remaining Proof To Capture

- optional reputation/validation write proof cited alongside the repricing loop
- optional broader README/demo packaging for release-vs-refund comparison

README and submission copy should now treat both refund and release paths as
verified while keeping stronger wallet-bound auth and premium collection in the
"remaining proof" bucket.

## Linked Impact Review Areas

Because this work touches funds, escrow lifecycle, protocol clients, DB schema, and route semantics, every final report must explicitly review:

- affected contracts
- server protocol clients
- DTO and types
- API routes
- dashboard consumers
- scripts, docs, and preflight checks

## Submission Non-Goals

Do not package this MVP as:

- a fully decentralized dispute court
- a fully capitalized insurance reserve
- a generalized protection layer for every Civilis market
- a completed Skill Store plugin with all adapters already built

Package it as:

- a narrow, reusable protection pattern
- implemented and demonstrated through Intel Market
- aligned with x402, Agentic Wallet, ERC-8183, and ERC-8004
