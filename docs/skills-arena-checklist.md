# Build X Requirements Mapping

This checklist maps the public Build X **Skills Arena** requirements directly to
the materials in this submission repo.

## Required Items

### 1. Create Agentic Wallet as the on-chain identity

Covered by:

- [README.md](../README.md#agentic-wallet-roles-used-in-proof)
- [docs/skills-arena-risk-os-evidence.md](skills-arena-risk-os-evidence.md)

Submission proof actors:

- buyer: `sage`
- seller: `fox`
- evaluator: `arbiter`

Repro support:

- [reference/server/scripts/stage-risk-os-demo.ts](../reference/server/scripts/stage-risk-os-demo.ts)

## 2. Use at least one core Onchain OS Skill or Uniswap Skill module

Covered by:

- [README.md](../README.md#onchain-os-skill-usage)
- [README.md](../README.md#how-the-official-stack-is-used)
- [docs/mainnet-evidence.md](mainnet-evidence.md)

Core modules used in this submission:

- `x402 Payment API`
- `Agentic Wallet`
- `ERC-8183 / ACP`
- `ERC-8004`

No Uniswap MVP claim is made in this snapshot.

### 3. Publish code to a public GitHub repo with a README containing the required fields

This public repo is the submission pack:

- [CivilisAI/Civilis-Risk-OS](https://github.com/CivilisAI/Civilis-Risk-OS)

README coverage:

- project introduction:
  [README.md](../README.md#project-introduction)
- architecture overview:
  [README.md](../README.md#architecture-overview)
- deployment addresses:
  [README.md](../README.md#deployment-addresses)
- Onchain OS Skill or Uniswap Skill usage:
  [README.md](../README.md#onchain-os-skill-usage)
- working mechanism:
  [README.md](../README.md#working-mechanism)
- team members:
  [README.md](../README.md#team-members)
- positioning in the X Layer ecosystem:
  [README.md](../README.md#positioning-in-the-x-layer-ecosystem)

### 4. Submit through Google Form before the deadline

This repo prepares the materials needed for submission:

- [README.md](../README.md)
- [docs/submission-reference.md](submission-reference.md)
- [docs/skills-arena-risk-os-evidence.md](skills-arena-risk-os-evidence.md)
- [docs/mainnet-evidence.md](mainnet-evidence.md)

## Bonus-Point Readiness

### Built on X Layer

Covered by:

- [README.md](../README.md#deployment-addresses)
- [docs/mainnet-evidence.md](mainnet-evidence.md)

### Demo-ready flow

Covered by:

- [docs/judge-demo-script.md](judge-demo-script.md)
- [docs/api-examples.md](api-examples.md)
- [docs/championship-replay-mode.md](championship-replay-mode.md)
- [docs/skills-arena-risk-os-evidence.md](skills-arena-risk-os-evidence.md)
- [examples/external-consumer-quickstart.mjs](../examples/external-consumer-quickstart.mjs)

Current proof surfaces shown in this repo:

- buyer-side `claim-proof` message generation
- evaluator-side `resolve-proof` message generation
- challengeable buy / refund / release / repricing loops
- auth-hardening replay where unauthenticated claimant access is rejected with
  `403` and the authenticated path still completes
- a second lightweight reference adapter for The Square paywalled intel unlocks
- a public canonical proof verifier script:
  [../examples/verify-canonical-proof.mjs](../examples/verify-canonical-proof.mjs)
- machine-readable response and request schemas:
  [../schemas/](../schemas)
- AI-readable reusable skill pack:
  [ai-skill-pack.md](ai-skill-pack.md)

### X post-ready positioning

Covered by:

- [README.md](../README.md#relationship-to-civilis)
- [README.md](../README.md#positioning-in-the-x-layer-ecosystem)

### Multiple official modules integrated

Covered by:

- [README.md](../README.md#how-the-official-stack-is-used)
- [docs/skills-arena-risk-os-evidence.md](skills-arena-risk-os-evidence.md)

### Clean X Layer proof environment

Covered by:

- [README.md](../README.md#clean-proof-environment)
- [reference/server/scripts/stage-risk-os-demo.ts](../reference/server/scripts/stage-risk-os-demo.ts)

## Submission Boundaries

This repo intentionally does **not** claim:

- a generalized insurance protocol
- decentralized arbitration
- wallet-signature-bound universal claimant/evaluator auth across every role and
  surface
- generalized protection across every commerce type

This repo now claims:

- one live mainnet-proved reference integration: Civilis Intel Market
- one lightweight reference adapter: The Square paywalled intel unlocks

See:

- [README.md](../README.md#what-is-not-claimed)
- [docs/protocol-boundaries.md](protocol-boundaries.md)
