# AI Skill Pack

This repo now includes an AI-readable skill pack in the style of the official
OKX `onchainos-skills` package.

The goal is not to add more marketing copy. The goal is to let another AI agent
load a focused `SKILL.md` and then:

- replay the canonical protected-commerce proof path
- integrate an external commerce surface into the Risk OS contract
- classify what is proven, prepared, historical, or intentionally not claimed

## Included Skills

### 1. `civilis-risk-os-canonical-replay`

Use when an AI needs to:

- restage a fresh replay item
- run the canonical `quote -> buy -> claim -> refund -> repricing` path
- interpret canonical actors and hashes correctly
- report captured proof without drifting into overclaim

Entry:

- [../skills/civilis-risk-os-canonical-replay/SKILL.md](../skills/civilis-risk-os-canonical-replay/SKILL.md)

### 2. `civilis-risk-os-external-consumer`

Use when an AI needs to:

- integrate another app or commerce surface against the Risk OS API
- choose between mirrored quote, challengeable settlement, or portability-only
  adapter patterns
- apply the external consumer schema and auth headers correctly

Entry:

- [../skills/civilis-risk-os-external-consumer/SKILL.md](../skills/civilis-risk-os-external-consumer/SKILL.md)

### 3. `civilis-risk-os-proof-boundaries`

Use when an AI needs to:

- write docs, README text, demos, or reviews without overclaiming
- separate canonical proof, historical depth evidence, and proof-prep surfaces
- explain exactly what the current Agentic Wallet and x402 evidence does and
  does not prove

Entry:

- [../skills/civilis-risk-os-proof-boundaries/SKILL.md](../skills/civilis-risk-os-proof-boundaries/SKILL.md)

### 4. `civilis-risk-os-integration-check`

Use when an AI needs to:

- classify whether a proposed consumer is truly a live protected integration
- distinguish quote-only consumers from portability adapters
- identify the exact missing pieces before a new adapter is called complete

Entry:

- [../skills/civilis-risk-os-integration-check/SKILL.md](../skills/civilis-risk-os-integration-check/SKILL.md)

## Why This Matters

The strongest long-term value of Civilis Risk OS is not only the demo UI or the
mainnet hashes. It is the fact that another AI can learn a narrow, rigorous
protected-commerce workflow and apply it without re-deriving the whole project.

That is why the skill pack is split into:

- one skill for replay
- one skill for integration
- one skill for proof discipline
- one skill for integration classification

This mirrors the most useful lesson from the official OKX package:

**clear capability boundaries are more reusable than one giant “do everything”
bundle.**
