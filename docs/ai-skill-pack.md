# AI Skill Pack

This repo now includes an AI-readable skill pack in the style of the official
OKX `onchainos-skills` package.

The goal is not to add more marketing copy. The goal is to let another AI agent
either call Risk OS directly as a runtime tool or load a focused `SKILL.md`
for a narrower supporting task.

The strongest path is now:

- install the repo
- run the runtime CLI
- call `quote / buy / claim / resolve / requote`
- then fall back to narrower supporting skills only when the primary product
  skill is not enough

## Included Skills

### 1. `civilis-risk-os`

Use when an AI needs one primary, installable Skill entry for Civilis Risk OS.

It is the product-facing skill and should be the default starting point for:

- install
- runtime command discovery
- parameter rules
- auth selection
- direct buyer / evaluator workflow calls

Entry:

- [../skills/civilis-risk-os/SKILL.md](../skills/civilis-risk-os/SKILL.md)
- [runtime-quickstart.md](runtime-quickstart.md)
- [runtime-tool-surface.md](runtime-tool-surface.md)

### 2. Supporting: `civilis-risk-os-runtime`

Use when an AI needs to:

- directly call Risk OS as a runtime protection primitive
- execute `quote`, `buy`, `purchase`, `claim`, `resolve`, and `requote`
- switch between local proof env and hosted runtime modes by changing only the
  base URL

Entry:

- [../skills/civilis-risk-os-runtime/SKILL.md](../skills/civilis-risk-os-runtime/SKILL.md)
- [runtime-quickstart.md](runtime-quickstart.md)
- [runtime-tool-surface.md](runtime-tool-surface.md)

### 3. Supporting: `civilis-risk-os-canonical-replay`

Use when an AI needs to:

- restage a fresh replay item
- run the canonical `quote -> buy -> claim -> refund -> repricing` path
- interpret canonical actors and hashes correctly
- report captured proof without drifting into overclaim

Entry:

- [../skills/civilis-risk-os-canonical-replay/SKILL.md](../skills/civilis-risk-os-canonical-replay/SKILL.md)

### 4. Supporting: `civilis-risk-os-external-consumer`

Use when an AI needs to:

- integrate another app or commerce surface against the Risk OS API
- choose between mirrored quote, challengeable settlement, or portability-only
  adapter patterns
- apply the external consumer schema and auth headers correctly

Entry:

- [../skills/civilis-risk-os-external-consumer/SKILL.md](../skills/civilis-risk-os-external-consumer/SKILL.md)

### 5. Supporting: `civilis-risk-os-proof-boundaries`

Use when an AI needs to:

- write docs, README text, demos, or reviews without overclaiming
- separate canonical proof, historical depth evidence, and proof-prep surfaces
- explain exactly what the current Agentic Wallet and x402 evidence does and
  does not prove

Entry:

- [../skills/civilis-risk-os-proof-boundaries/SKILL.md](../skills/civilis-risk-os-proof-boundaries/SKILL.md)

### 6. Supporting: `civilis-risk-os-integration-check`

Use when an AI needs to:

- classify whether a proposed consumer is truly a live protected integration
- distinguish quote-only consumers from portability adapters
- identify the exact missing pieces before a new adapter is called complete

Entry:

- [../skills/civilis-risk-os-integration-check/SKILL.md](../skills/civilis-risk-os-integration-check/SKILL.md)

## Why This Matters

The strongest long-term value of Civilis Risk OS is not only the demo UI or the
mainnet hashes. It is the fact that another AI can directly call a narrow,
rigorous protected-commerce workflow without re-deriving the whole project.

That is why the package is now split into:

- one primary product skill
- a small set of supporting skills for replay, integration, and proof discipline

This mirrors the most useful lesson from the official OKX package:

**clear capability boundaries are more reusable than one giant “do everything”
bundle.**

Pair this skill pack with:

- [runtime-quickstart.md](runtime-quickstart.md)
- [runtime-tool-surface.md](runtime-tool-surface.md)
- [../openapi/risk-os.openapi.yaml](../openapi/risk-os.openapi.yaml)
- [integration-checklist.md](integration-checklist.md)
- [replay-lanes.md](replay-lanes.md)
