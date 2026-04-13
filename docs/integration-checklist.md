# Integration Checklist

This checklist is for any external team, AI agent, or evaluator that wants to
integrate against the Civilis Risk OS contract without drifting away from the
submission's proven boundaries.

## 1. Decide What You Are Building

Choose exactly one:

- **quote-only consumer**
- **live challengeable settlement consumer**
- **portability-only adapter**

Do not present a portability-only adapter as a live protected settlement
integration.

## 2. Map The Required Roles

Every consumer must define:

- buyer
- seller
- evaluator

If one of those roles does not exist, you are not implementing the full
challengeable protection loop.

## 3. Decide The Proof Model

In the current submission surface, protected actions are expected to use one of
these proof paths:

- strict claimant / evaluator token gates
- deterministic proof message + wallet signature, where that path is exposed

If neither exists, the integration should be classified as `quote-only` or
`UNVERIFIED`.

## 4. Minimum Endpoint Surface

For a full protected integration, you should understand:

- `POST /api/risk/quote/intel`
- `POST /api/intel/items/:id/buy`
- `GET /api/risk/purchases/:id/claim-proof`
- `POST /api/risk/claims`
- `GET /api/risk/claims/:id/resolve-proof`
- `POST /api/risk/claims/:id/resolve`

For a portability-only adapter, quote normalization may be enough.

## 5. Canonical Request Shapes

Use the machine-readable schemas in:

- [../schemas/risk-quote.response.json](../schemas/risk-quote.response.json)
- [../schemas/protected-purchase.response.json](../schemas/protected-purchase.response.json)
- [../schemas/claim.request.json](../schemas/claim.request.json)
- [../schemas/resolve.request.json](../schemas/resolve.request.json)

## 6. Settlement Classification

Treat the integration as:

- **live challengeable settlement** only if principal actually routes through
  the protected `ERC-8183` path and can later be released or refunded
- **portability adapter** if you only normalize another surface into the quote /
  dispute vocabulary

## 7. Repricing Requirement

The strongest Risk OS integrations do not stop at one transaction.

They also feed outcome back into a later quote:

- refund should worsen later seller risk
- release should improve or stabilize later seller risk

If repricing is not present, call the integration partial, not complete.

## 8. Onchain OS Capability Boundaries

Use the official capability map rigorously:

- `okx-agentic-wallet` for wallet-backed actors
- `okx-x402-payment` for x402 payment proof flows
- `okx-onchain-gateway` for simulation / gas / broadcast observability
- `okx-security` for token / tx / signature scanning

Reference:

- [OnchainOS Skills Application Map](onchainos-skills-application-map.md)

## 9. Honest Boundaries

Do not claim:

- generic buyer wallet-signature proof unless you captured it
- decentralized arbitration
- generalized insurance reserve
- second live mainnet settlement proof unless you actually have it

Use:

- [Proof Surface Matrix](proof-surface-matrix.md)
- [Protocol Boundaries](protocol-boundaries.md)

## 10. Final Readiness Check

Before calling an integration complete, confirm:

- roles are explicit
- endpoint surface is explicit
- proof path is explicit
- settlement classification is explicit
- repricing is present or honestly omitted
- claims are aligned with captured evidence
