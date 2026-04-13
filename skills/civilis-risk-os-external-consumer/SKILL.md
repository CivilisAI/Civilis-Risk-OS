---
name: civilis-risk-os-external-consumer
description: "Use this skill when an AI agent needs to integrate another commerce surface or application against the Civilis Risk OS protection flow. Covers the external-consumer schema, the quote -> challengeable buy -> claim -> resolve pattern, auth header expectations, and how to build portability adapters without overclaiming a second live mainnet loop. Do NOT use for replaying the canonical proof path; use civilis-risk-os-canonical-replay instead. Do NOT use for judging what can be claimed in README or demos without proof discipline; use civilis-risk-os-proof-boundaries instead."
metadata:
  author: CivilisAI
  version: "0.1.0"
  homepage: "https://github.com/CivilisAI/Civilis-Risk-OS"
---

# Civilis Risk OS External Consumer

Use this skill to wrap another agent app or commerce surface around the Risk OS
protection primitive.

## Load These References

Always read:

- [references/consumer-schema.md](references/consumer-schema.md)
- [references/adapter-patterns.md](references/adapter-patterns.md)

## Use This Skill For

- consumer integration planning
- adapter design
- request / response shaping
- auth header selection
- portability-proof documentation

## Do Not Use This Skill For

- proving the canonical mainnet replay
- deciding what is safe to claim in marketing or README text without proof
  review
- presenting a second adapter as a second live mainnet-proved settlement loop

## Integration Workflow

1. Normalize the consumer into three role questions:
   - who is the buyer?
   - who is the seller?
   - who can act as evaluator?
2. Decide whether the consumer needs:
   - quote only
   - full challengeable protected buy
   - portability-only adapter proof
3. Use the consumer schema to map:
   - quote request
   - buy request
   - claim request
   - resolve request
4. Choose one of the adapter patterns in `references/adapter-patterns.md`.
5. Preserve proof discipline:
   - one live loop is proven through Intel Market
   - another adapter may prove portability without proving a second live loop

## Minimal Consumer Contract

At minimum, an external consumer should understand:

- `POST /api/risk/quote/intel`
- `POST /api/intel/items/:id/buy`
- `GET /api/risk/purchases/:id/claim-proof`
- `POST /api/risk/claims`
- `GET /api/risk/claims/:id/resolve-proof`
- `POST /api/risk/claims/:id/resolve`

## Output Contract

When proposing or describing an adapter, always state:

- whether it is live-settlement or portability-only
- the roles it maps to buyer / seller / evaluator
- which auth path it depends on
- whether later repricing is part of the integration
