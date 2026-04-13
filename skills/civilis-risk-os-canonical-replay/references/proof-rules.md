# Replay Proof Rules

## Allowed Labels

When describing replay evidence, use exactly one of these labels:

- `canonical captured proof`
- `historical depth evidence`
- `proof-prep surface`
- `not claimed`
- `UNVERIFIED`

## Required Boundaries

- Do not claim decentralized arbitration.
- Do not claim partial refunds.
- Do not claim a second live mainnet settlement loop from the portability
  adapter.
- Do not claim generic buyer wallet-signature proof for arbitrary claim payloads
  unless a real captured proof exists.

## Current Strict Boundary

Agentic Wallet capability and x402 signing capability are real.

What is still not publicly captured in this repo is:

- a generic buyer wallet-signature loop for arbitrary claim-proof payloads

Reason:

- the current official Agentic Wallet CLI does not expose a public generic
  `message-sign` command

Authoritative sources:

- [../../../docs/proof-surface-matrix.md](../../../docs/proof-surface-matrix.md)
- [../../../docs/protocol-boundaries.md](../../../docs/protocol-boundaries.md)
