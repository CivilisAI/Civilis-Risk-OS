# Civilis Risk OS

**Civilis Risk OS** is the Build X Season 2 **Skills Arena** submission from
CivilisAI.

It is a protection layer for agent commerce on X Layer. The current submission
focuses on one narrow but reusable pattern:

`risk quote -> challengeable buy -> claim -> evaluator release/refund -> later trust repricing`

This repository is a **standalone public submission repo** for the hackathon.
It intentionally contains only the materials needed to review this Skill:

- project introduction and architecture
- X Layer deployment addresses
- Onchain OS / protocol usage
- mainnet proof and claim boundaries
- PRD and implementation plan
- extracted reference implementation files
- demo-wallet staging script used to reproduce the proof loops

## Submission Snapshot

- **Arena:** Skills Arena
- **Project type:** reusable protection Skill with a live reference integration
- **Reference integration:** Civilis Intel Market
- **Primary chain:** X Layer mainnet (`chainId 196`)
- **Core official stack:** `x402 Payment API`, `Agentic Wallet`,
  `ERC-8183 / ACP`, `ERC-8004`
- **Submission claim:** a protected commerce flow for agent transactions, not a
  generalized insurance protocol

## README Compliance Snapshot

This README explicitly includes the fields requested by the Skills Arena
submission rules:

- **Project Introduction:** see [Project Introduction](#project-introduction)
- **Architecture Overview:** see [Architecture Overview](#architecture-overview)
- **Deployment Addresses:** see [Deployment Addresses](#deployment-addresses)
- **Onchain OS Skill or Uniswap Skill Usage:** see
  [Onchain OS Skill Usage](#onchain-os-skill-usage)
- **Working Mechanism:** see [Working Mechanism](#working-mechanism)
- **Team Members:** see [Team Members](#team-members)
- **Positioning in the X Layer Ecosystem:** see
  [Positioning in the X Layer Ecosystem](#positioning-in-the-x-layer-ecosystem)

## Judge Quick Path

If a reviewer only has a minute, read in this order:

1. [Skills Arena Checklist](docs/skills-arena-checklist.md)
2. [External Consumer Guide](docs/external-consumer-guide.md)
3. [Submission Reference](docs/submission-reference.md)
4. [Second Adapter: The Square Paywalled Intel Unlock](docs/second-adapter-paywalled-intel-unlock.md)
5. [Skills Arena Evidence](docs/skills-arena-risk-os-evidence.md)
6. [Mainnet Evidence](docs/mainnet-evidence.md)
7. [API Examples](docs/api-examples.md)
8. [Championship Replay Mode](docs/championship-replay-mode.md)
9. [Judge Demo Script](docs/judge-demo-script.md)

## Skill Contract

Civilis Risk OS is submitted as a **reusable protection Skill** with one narrow,
live reference integration.

### Inputs

- buyer agent identity
- seller agent identity
- commerce item and price context
- `ERC-8004` reputation and validation summaries
- prior protected outcome history

### Outputs

- `risk score`
- `recommended mode`
- `premium`
- `claim window`
- `release` or `refund` resolution outcome
- later quote repricing

### Supported actions in this submission

- quote a protected intel purchase
- execute a challengeable protected purchase
- file a buyer claim
- resolve the claim as the evaluator
- query the protected purchase state

### Current guarantees

- protected principal is routed through a challengeable `ERC-8183` path
- claim and evaluator actions are role-gated in the strict mainnet-backed proof
  environment
- unauthenticated claim and evaluator actions are disabled by default; a local
  bypass requires explicit opt-in through `RISK_OS_ALLOW_UNAUTHENTICATED_DEV=true`
- buyer claim creation can be prepared through a deterministic `claim-proof`
  message that binds the request to the protected purchase buyer wallet
- evaluator resolution can be authorized either through the strict proof
  environment token gate or through a wallet-bound signature over a deterministic
  resolution-proof message
- risk quotes read mixed local + on-chain `ERC-8004` validation summaries when
  the validation registry is configured
- refund and release both have captured mainnet-backed proof loops
- current-session Agentic Wallet off-chain signing has been locally verified
  through successful `x402-pay` proof generation, which confirms that the
  underlying pre-transaction signing path is live even though this repo still
  does not claim a captured buyer wallet-signature loop for arbitrary
  claim-proof payloads because the current official Agentic Wallet CLI does not
  expose a generic message-sign command
- the public external-consumer quickstart script has been validated against the
  live proof environment for `quote`, `quote-buy`, `claim-proof`, `claim`,
  `resolve-proof`, `resolve`, and later repricing
- the submission repo also includes a second lightweight reference adapter for
  `The Square` paywalled intel unlocks, so the reusable claim no longer depends
  on a single commerce surface
- later quotes reflect prior protected outcomes, and the local protected
  purchase state now records repricing sync status for recovery

### Non-goals in this submission

- partial refunds
- decentralized arbitration
- generalized protection across every commerce surface
- wallet-signature-bound universal claimant/evaluator auth

## Project Introduction

Civilis Risk OS addresses a missing layer in agent commerce: what happens after
payment if the delivered output is disputed, low quality, or misleading.

The submission does not try to solve every commerce type at once. Instead, it
demonstrates a narrow but reusable protection loop against a real commerce
surface that already exists in Civilis.

The loop is:

`quote -> protected buy -> claim -> evaluator release/refund -> repriced later quote`

## Relationship to Civilis

Civilis Risk OS should be read as an **extracted Skill layer** from the broader
Civilis project, not as an unrelated new brand.

- **Civilis** is the live multi-agent world and the Season 1 foundation
- **Civilis Risk OS** is the Season 2 Skills Arena submission built from that
  foundation
- **Civilis Intel Market** is the current reference integration that proves the
  Skill in a live agent economy

Public background project:

- [Civilis public repository](https://github.com/CivilisAI/Civilis-public)

The intended relationship is:

`Season 1 Civilis world -> extract reusable protection logic -> Season 2 Civilis Risk OS`

## Why This Skill Exists

Agent commerce already has payment rails and execution rails.

What is still weak is protection after payment:

- if an agent under-delivers, what happens?
- if the output is misleading, who decides?
- how does that outcome change the next transaction?

Civilis Risk OS answers that question for one concrete reference integration:
the Civilis Intel Market.

It is **not** presented as:

- a wallet
- a generic payment SDK
- a generic marketplace
- a decentralized court
- a full insurance reserve

It **is** presented as:

- a risk quote engine
- a protected settlement selector
- a claim and evaluator resolution flow
- a repricing layer that feeds later transactions

## Architecture Overview

Civilis Risk OS is composed of four layers:

1. **Risk input layer**
   - seller reputation summary from `ERC-8004`
   - seller validation summary from `ERC-8004`
   - local dispute and refund history
   - intel credit score context
2. **Protected settlement layer**
   - `x402` / payment-triggered purchase flow
   - `ERC-8183` funded job for challengeable principal escrow
   - challenge window before final settlement
3. **Resolution layer**
   - buyer claim creation
   - evaluator-driven `release` or `refund`
   - aligned local purchase and claim state
4. **Trust repricing layer**
   - resolved outcomes change later risk scores
   - future quote recommendations reflect prior protected outcomes

## Skills Arena Positioning

This repo is packaged specifically for **Skills Arena**, not as a general
snapshot of the broader Civilis world.

The reusable submission surface is:

- `POST /api/risk/quote/intel`
- `POST /api/intel/items/:id/buy`
- `GET /api/risk/purchases/:id/claim-proof`
- `POST /api/risk/claims`
- `POST /api/risk/claims/:id/resolve`
- `GET /api/risk/claims/:id/resolve-proof`
- `GET /api/risk/purchases/:id`

The route names are intel-scoped in the current working implementation. The
reusable claim is the **protection pattern**, not that every market type is
already generalized.

## Quickstart For Another Agent App

This repo includes a minimal external consumer script:

- [examples/external-consumer-quickstart.mjs](examples/external-consumer-quickstart.mjs)

It lets another agent app or operator walk the same reusable flow without
depending on the Civilis dashboard:

- quote
- challengeable buy
- buyer claim-proof
- claim
- evaluator resolve-proof
- release or refund

## External Consumer Story

The reference integration in this repo is Civilis Intel Market, but the skill is
packaged so that another agent application could reuse the same pattern without
adopting the rest of Civilis.

An external consumer would:

1. call `POST /api/risk/quote/intel` before settling an agent commerce action
2. choose `instant` or `challengeable` based on the returned risk output
3. create the protected purchase through `POST /api/intel/items/:id/buy`
4. optionally fetch a deterministic `claim-proof` message for the buyer and sign
   it with the buyer wallet before filing a claim
5. open a claim only if delivery quality fails the protected threshold
6. optionally fetch a deterministic `resolve-proof` message for the evaluator
   and sign it with the evaluator wallet
7. let the evaluator resolve to `release` or `refund`
8. reuse the next repriced quote for the same seller

That is the reusable skill claim for this submission:

`any agent commerce app can wrap payment with a challengeable protection loop`

This repo now includes a second lightweight reference adapter for a different
commerce surface:

- [The Square paywalled intel unlock adapter](docs/second-adapter-paywalled-intel-unlock.md)

It is intentionally labeled as a **reference adapter**, not as a second
mainnet-proved live integration.

## Clean Proof Environment

The cleanest runtime used for the strict mainnet-backed proof loops keeps the
full on-chain boot enabled but disables the world tick engine:

- `AUTO_START_WORLD=false`
- strict mainnet mode enabled
- `x402` direct-wallet mode enabled
- `RISK_OS_CLAIMANT_AUTH_TOKEN` and `RISK_OS_EVALUATOR_AUTH_TOKEN` configured

This matters because the proof environment needs real `Agentic Wallet` and
`ERC-8183` behavior, but it should not let unrelated world ticks expire or
mutate the staged intel item during judge validation.

## Onchain OS Skill Usage

Civilis Risk OS is built around the live X Layer stack and current OKX
capabilities:

- `x402 Payment API`
- `Agentic Wallet`
- `ERC-8183 / ACP`
- `ERC-8004`
- `X Layer mainnet (chainId 196)`

No Uniswap MVP claim is made in this submission snapshot.

## How The Official Stack Is Used

### `x402 Payment API`

- used as the payment-facing rail for intel purchases
- differentiates simple payable flow from protected purchase orchestration

### `Agentic Wallet`

- used to create and operate the buyer, seller, and evaluator proof actors
- used as the chain identity surface for the staged mainnet proof loops

### `ERC-8183 / ACP`

- used to fund challengeable principal escrow
- used to hold the transaction in `submitted`
- used to finalize a protected purchase through `complete` or `reject`

### `ERC-8004`

- used as the identity, reputation, and validation input surface
- used to derive quote reasoning and later repricing

## Working Mechanism

1. Buyer requests a quote before purchase.
2. Risk OS computes the seller risk score and recommends `instant` or
   `challengeable`.
3. For `challengeable`, principal is funded into ACP instead of being treated as
   instantly final.
4. Seller delivery is submitted and the purchase enters a challenge window.
5. Buyer may file a claim if the intel is misleading or invalid.
6. Evaluator resolves the claim to `release` or `refund`.
7. The outcome changes later quote results for the same seller.

The reusable submission surface is the API and orchestration flow above. The
included dashboard files are a **judge-facing role-scoped proof console** used
to make the buyer path and evaluator path legible during review, not a claim
that production role separation is already fully packaged as a standalone
front-end product.
In the current proof console, the evaluator path is intentionally activated only
after the buyer has opened a claim, so the review follows the same role order
as the protected workflow.

For the strict mainnet-backed proof loops in this submission, buyer-side claim
filing is role-gated through a dedicated claimant token. Evaluator resolution
can use the strict proof-environment evaluator token or a wallet-bound
signature over the `resolve-proof` message. This is still weaker than
wallet-signature-bound universal auth across every role and surface, but it
prevents the proof environment from running with anonymous claim or resolution
actions.

Outside the strict proof environment, unauthenticated role actions remain
disabled by default. A developer must explicitly opt into a local bypass through
`RISK_OS_ALLOW_UNAUTHENTICATED_DEV=true`; that bypass is not part of the public
submission claim.

## Deployment Addresses

| Contract | Address |
| --- | --- |
| `ACPV2` | `0xBEf97c569a5b4a82C1e8f53792eC41c988A4316e` |
| `CivilisCommerceV2` | `0x7bac782C23E72462C96891537C61a4C86E9F086e` |
| `ERC8004IdentityRegistryV2` | `0xC9C992C0e2B8E1982DddB8750c15399D01CF907a` |
| `ERC8004ReputationRegistryV2` | `0xD8499b9A516743153EE65382f3E2C389EE693880` |
| `ERC8004ValidationRegistryV2` | `0x0CC71B9488AA74A8162790b65592792Ba52119fB` |
| `USDT payment token` | `0x779Ded0c9e1022225f8E0630b35a9b54bE713736` |

## Agentic Wallet Roles Used In Proof

The strongest current submission replay uses staged Agentic Wallet actors that
are independently controlled by the maintained proof session:

| Role | Agent | Wallet |
| --- | --- | --- |
| buyer | `sage` | `0x3dba0d4e682be54be41b48cbe9572a81d14e94c9` |
| seller | `fox` | `0x4f5dc690f366116bf6bc22f29e44f8d141bf38de` |
| evaluator | `arbiter` | `0x400ea2f2af2732c4e2af9fb2f8616468ad49023d` |

These are **submission-scoped proof actors**. They do not replace the broader
live wallet map of the original Civilis world.

## Positioning in the X Layer Ecosystem

Civilis Risk OS is positioned as a reusable protection primitive inside the X
Layer agent stack:

- `x402` makes agent commerce payable
- `Agentic Wallet` makes agent execution possible
- `ERC-8183` makes agent work and escrow legible
- `ERC-8004` makes identity and trust history queryable
- **Civilis Risk OS makes that commerce challengeable, refundable, and
  repriced**

This is why the project is submitted as a Skill rather than as a generic app
feature.

## Verified Mainnet Proof

This repository currently includes one canonical independent-wallet replay on
the latest staged actor set, plus earlier complementary proof loops that add
historical release depth and evaluator wallet-signature depth.

### Canonical Independent-Wallet Replay

- staged intel item id: `16`
- quote id: `34`
- protected purchase id: `11`
- local ACP job id: `13`
- on-chain job id: `2030`
- funded principal tx: `0x3626e79f734b6708d357e3556353617d4600bbb5d859ff47d1dc6846b76479fa`
- delivery submit tx: `0x813b673060e0d0f7d88ebd466801049c76b662297820a6f23a066773b32d0260`
- buyer claim-proof actor: `sage` / `0x3dba0d4e682be54be41b48cbe9572a81d14e94c9`
- unauthenticated claim status: `403`
- authenticated claim id: `10`
- reject + refund tx: `0xc857156addb058461cb0eb04647eb896a3db54185e2fbcd09dd295b1bf236929`
- repriced quote id: `36`
- seller risk: `74 -> 89`
- protected purchase metadata repricing state: `synced`

### Refund Loop

- quote id: `11`
- protected purchase id: `3`
- local ACP job id: `4`
- on-chain job id: `1955`
- buy tx: `0xac33ab277d289ec08a8f202e766c6394840aadbaee3cf3b5e290bd5e7ca58ecc`
- refund tx: `0x0d943594e006228b83f2fc45fdab1f6322e36ee1e6143d593f6c6b63b5175263`
- repriced quote id: `12`
- seller risk: `76 -> 91`

### Release Loop

- quote id: `13`
- protected purchase id: `4`
- local ACP job id: `5`
- on-chain job id: `1956`
- buy tx: `0x092af96f5cd02bd7690103b0dbbd5681b6057dc7ec7ed5b34bc3d854ab324535`
- release tx: `0x3d6a7cc98592ff9b814dc315fd23458998c54b2a89795c7ad1f26939b85f5d1c`
- repriced quote id: `14`
- seller risk: `91 -> 79`

### Wallet-Signature Evaluator Validation Loop

- quote id: `19`
- protected purchase id: `6`
- local ACP job id: `8`
- on-chain job id: `1959`
- buy tx: `0xf77f8bbc5fa46c6da1f93076857823c5c1759025980f1639fab1f3b7c8086f76`
- claim id: `5`
- signature-backed resolve status: `200`
- repriced quote id: `20`
- seller risk: `71 -> 87`

The strongest current proof claim is:

`quote -> challengeable buy -> claim -> release/refund -> later quote repricing`

The strongest auth-depth add-on is:

`claim -> resolve-proof message -> evaluator wallet signature -> refund -> later repricing`

And the strongest current actor-independence claim is:

`independent buyer/seller/evaluator Agentic Wallet actors -> challengeable buy -> default claimant gating -> authenticated claim -> evaluator refund -> later repricing`

## Repository Layout

| Path | Purpose |
| --- | --- |
| [`docs/`](docs) | submission-safe evidence, proof references, and boundaries |
| [`specs/`](specs) | PRD and implementation plan |
| [`reference/server/`](reference/server) | extracted reference implementation files from the working service |
| [`reference/dashboard/`](reference/dashboard) | extracted judge-facing reference UI files |

## What Is Included

- a focused README that satisfies the hackathon submission requirements
- deployment addresses
- Onchain OS / X Layer usage
- working mechanics
- team members
- X Layer ecosystem positioning
- mainnet evidence for both refund and release paths

## What Is Not Claimed

This repository does **not** claim:

- generalized protection for every market type
- partial refunds
- decentralized arbitration
- wallet-signature-bound universal evaluator auth across every role and surface
- on-chain premium collection
- a fully capitalized underwriting reserve

Those are future extension directions, not current submission facts.

## Team Members

- `kb / CivilisAI`: product, architecture, submission direction
- `Codex`: implementation, review, packaging, and evidence support

## Recommended Reading Order

1. [Skills Arena Checklist](docs/skills-arena-checklist.md)
2. [External Consumer Guide](docs/external-consumer-guide.md)
3. [PRD](specs/PRD.md)
4. [Skills Arena Evidence](docs/skills-arena-risk-os-evidence.md)
5. [Mainnet Evidence](docs/mainnet-evidence.md)
6. [Submission Reference](docs/submission-reference.md)
7. [API Examples](docs/api-examples.md)
8. [Judge Demo Script](docs/judge-demo-script.md)
9. [Implementation Plan](specs/IMPLEMENTATION_PLAN.md)
10. [Reference Pack Notes](reference/README.md)

## License

This submission pack is released under the [MIT License](LICENSE).
