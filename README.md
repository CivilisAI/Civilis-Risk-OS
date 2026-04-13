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
- `POST /api/risk/claims`
- `POST /api/risk/claims/:id/resolve`
- `GET /api/risk/purchases/:id`

The route names are intel-scoped in the current working implementation. The
reusable claim is the **protection pattern**, not that every market type is
already generalized.

## Official Stack Used

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
included dashboard files are a **judge-facing proof console** used to make the
flow legible during review, not a claim that production role separation is
already fully packaged as a standalone front-end product.

## Mainnet Deployment Surfaces

| Contract | Address |
| --- | --- |
| `ACPV2` | `0xBEf97c569a5b4a82C1e8f53792eC41c988A4316e` |
| `CivilisCommerceV2` | `0x7bac782C23E72462C96891537C61a4C86E9F086e` |
| `ERC8004IdentityRegistryV2` | `0xC9C992C0e2B8E1982DddB8750c15399D01CF907a` |
| `ERC8004ReputationRegistryV2` | `0xD8499b9A516743153EE65382f3E2C389EE693880` |
| `ERC8004ValidationRegistryV2` | `0x0CC71B9488AA74A8162790b65592792Ba52119fB` |
| `USDT payment token` | `0x779Ded0c9e1022225f8E0630b35a9b54bE713736` |

## Agentic Wallet Roles Used In Proof

The clean submission proof loops use staged Agentic Wallet actors:

| Role | Agent | Wallet |
| --- | --- | --- |
| buyer | `oracle` | `0x12cbe62954e39b7149534edd41822e3daca7d6ba` |
| buyer | `sage` | `0x3dba0d4e682be54be41b48cbe9572a81d14e94c9` |
| seller | `fox` | `0x4f5dc690f366116bf6bc22f29e44f8d141bf38de` |
| evaluator | ACP evaluator | `0x9fD22B0A6c66256a9D63bEBcdb9eeB25f34f8D87` |

These are **submission-scoped proof actors**. They do not replace the broader
live wallet map of the original Civilis world.

## X Layer Ecosystem Positioning

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

This repository currently includes two clean mainnet-backed proof loops.

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

The strongest current proof claim is:

`quote -> challengeable buy -> claim -> release/refund -> later quote repricing`

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
- wallet-signature-bound evaluator auth
- on-chain premium collection
- a fully capitalized underwriting reserve

Those are future extension directions, not current submission facts.

## Team

- `kb / CivilisAI`: product, architecture, submission direction
- `Codex`: implementation, review, packaging, and evidence support

## Recommended Reading Order

1. [PRD](specs/PRD.md)
2. [Skills Arena Evidence](docs/skills-arena-risk-os-evidence.md)
3. [Mainnet Evidence](docs/mainnet-evidence.md)
4. [Submission Reference](docs/submission-reference.md)
5. [API Examples](docs/api-examples.md)
6. [Judge Demo Script](docs/judge-demo-script.md)
7. [Implementation Plan](specs/IMPLEMENTATION_PLAN.md)
8. [Reference Pack Notes](reference/README.md)

## License

This submission pack is released under the [MIT License](LICENSE).
