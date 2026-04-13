# Civilis Risk OS

**Civilis Risk OS** is a protection layer for agent commerce on X Layer.

It packages one narrow but reusable pattern:

`risk quote -> challengeable buy -> claim -> evaluator release/refund -> later trust repricing`

The goal of this repository is simple:

- install the skill
- call the runtime
- integrate the protection loop into another agent product
- inspect the public API contract and live X Layer references when needed

## Project Snapshot

- **Project type:** reusable protection Skill with a live reference integration
- **Reference integration:** Civilis Intel Market
- **Primary chain:** X Layer mainnet (`chainId 196`)
- **Core official stack in the live reference runtime:** `x402 Payment API`,
  `Agentic Wallet`, `Security`, `DEX Token Analytics`, `ERC-8183 / ACP`,
  `ERC-8004`
- **Current scope:** a protected commerce flow for agent transactions, not a
  generalized insurance protocol

## Quick Start

If someone only has a minute, start here:

1. [Project One Pager](docs/project-one-pager.md)
2. [Runtime Quickstart](docs/runtime-quickstart.md)
3. [External Consumer Guide](docs/external-consumer-guide.md)
4. [API Examples](docs/api-examples.md)
5. [OpenAPI Contract](openapi/risk-os.openapi.yaml)

## Product In One Screen

If someone only reads one screen, the intended takeaway is:

- **What it is:** a reusable protection Skill for agent commerce on X Layer
- **What it ships:** installable runtime commands, API contract, schemas, and a
  live reference integration
- **What it helps with:** quoting risk, choosing challengeable settlement,
  opening disputes, resolving outcomes, and repricing the next transaction
- **What it is not:** a generalized insurance protocol or decentralized court

The rest of the repo should be read through that frame.

## Live Official Modules

The live reference runtime already uses these official capability surfaces:

- `okx-x402-payment` for payment-gated intel purchase flow
- `okx-agentic-wallet` for the buyer, seller, and evaluator identities
- `okx-security` through
  `onchainos security token-scan --address <sellerWallet> --chain xlayer`
- `okx-dex-token` through
  `onchainos token advanced-info --chain xlayer --address <token>`
- `okx-dex-token` through
  `onchainos token holders --chain xlayer --address <token>`
- `ERC-8183 / ACP` for challengeable protected settlement
- `ERC-8004` for identity, reputation, and validation inputs

Reference implementation:

- [`reference/server/risk/onchainos-quote-signals.ts`](reference/server/risk/onchainos-quote-signals.ts)
- [`reference/server/risk/quote-engine.ts`](reference/server/risk/quote-engine.ts)

## AI Evaluator Advisory

The live reference runtime also supports an AI-assisted evaluator advisory
path.

When `RISK_OS_ENABLE_LLM_EVALUATOR=true` and an OpenAI-compatible `LLM_*`
configuration is present, the evaluator can generate:

- `decision`
- `reasoning`
- `confidence`

Explicit evaluator decisions still win when they are supplied.

Reference implementation:

- [`reference/server/risk/claim-lifecycle.ts`](reference/server/risk/claim-lifecycle.ts)
- [`reference/server/llm/text.ts`](reference/server/llm/text.ts)

## Install And Call The Skill

If another AI should use Risk OS directly, copy this first:

```bash
git clone https://github.com/CivilisAI/Civilis-Risk-OS.git
cd Civilis-Risk-OS
npm install
npm run demo
npm test
npm run runtime -- help
```

Or install the package into another workspace and call the runtime directly:

```bash
npm install github:CivilisAI/Civilis-Risk-OS
npx civilis-risk-os-runtime help
```

The clone-and-run path above, a fresh local package install, and a direct
GitHub package install were all verified in this public repo.

`npm run demo` is the zero-friction product path. It starts the bundled local
runtime profile automatically and returns a real quote without requiring
another workspace, a pre-running backend, or manual auth setup.

`npm run runtime -- ...` follows the same product contract:

- bundled local mode starts automatically when no hosted runtime is supplied
- claimant and evaluator auth defaults are bundled into that local runtime
- explicit `--base-url` and auth material are only needed when you point the
  CLI at another compatible hosted runtime

The default installable product path is therefore self-contained for local
direct use. Hosted mode is an optional deployment surface, not a requirement
for using the package.

## Public Hosted Runtime

This package also supports a hosted deployment surface for direct public use.

For Cloudflare Workers:

```bash
npm install
npm run runtime:cf:deploy
```

The same runtime command surface works against the hosted URL:

```bash
npx civilis-risk-os-runtime health --base-url https://civilis-risk-os-runtime.ceolaexekiel.workers.dev
npx civilis-risk-os-runtime quote --base-url https://civilis-risk-os-runtime.ceolaexekiel.workers.dev --item 501 --buyer sage
```

When hosted in this bundled profile, the public runtime keeps the same
zero-friction command surface as the local bundled mode.

The runtime client supports standard `HTTP_PROXY` / `HTTPS_PROXY` style
configuration and also detects the macOS system proxy automatically for hosted
runtime calls when needed.

Hosted bundled calls also use a package-managed runtime session so quote, buy,
claim, resolve, and requote stay isolated and repeatable per caller instead of
mutating a single shared public demo state.

Current public hosted runtime:

- `https://civilis-risk-os-runtime.ceolaexekiel.workers.dev`

Then the narrow runtime actions are:

- `health`
- `quote`
- `buy`
- `purchase`
- `claim-proof`
- `claim`
- `resolve-proof`
- `resolve`
- `requote`
- `full-loop`

### Command parameters

| Command | Required flags | Optional flags |
| --- | --- | --- |
| `health` | none | `--base-url` |
| `quote` | `--item`, `--buyer` | `--base-url` |
| `buy` | `--item`, `--buyer`, `--quote`, `--mode` | `--base-url` |
| `purchase` | `--purchase` | `--base-url` |
| `claim-proof` | `--purchase`, `--reason` | `--base-url`, `--claim-type` |
| `claim` | `--purchase`, `--reason` | `--base-url`, `--claim-type`, `--claimant-token`, `--claimant-signature` |
| `resolve-proof` | `--claim` | `--base-url`, `--decision`, `--reason` |
| `resolve` | `--claim` | `--base-url`, `--decision`, `--reason`, `--evaluator-token`, `--evaluator-signature` |
| `requote` | `--item`, `--buyer` | `--base-url` |
| `full-loop` | none | `--base-url`, `--buyer`, `--item`, `--decision`, `--reason`, `--claimant-token`, `--claimant-signature`, `--evaluator-token`, `--evaluator-signature` |

In bundled local mode, claimant and evaluator auth are already supplied by the
runtime profile, so the loop can run without manual token copying.

A concrete live-style example:

```bash
npm run runtime -- quote --item 501 --buyer sage
```

The fastest "does this actually work?" check is now:

```bash
npm run demo
npm test
```

The strongest mutating acceptance check is:

```bash
npm run verify:protected-loop
```

That command executes the full protected-commerce runtime path:

`quote -> buy -> purchase -> claim-proof -> claim -> resolve-proof -> resolve -> requote`

In bundled local mode it reuses the same auto-start runtime and bundled auth as
`npm run demo` and `npm run runtime`.

The strongest public hosted acceptance check is:

```bash
npm run verify:hosted-public
```

## Runtime Skill

Civilis Risk OS now includes a **runtime-first Skill surface** in the style of
the official OKX `onchainos-skills` package.

The most important shift is this:

- the repo is no longer only “AI-readable”
- another AI can now use a narrow runtime tool surface directly

The direct entry is:

- [civilis-risk-os](skills/civilis-risk-os/SKILL.md)
- [Runtime Quickstart](docs/runtime-quickstart.md)
- [Runtime Tool Surface](docs/runtime-tool-surface.md)
- [Hosted Runtime Onboarding](docs/hosted-runtime-onboarding.md)
- [runtime.tool-surface.json](runtime.tool-surface.json)
- [`examples/risk-os-runtime.mjs`](examples/risk-os-runtime.mjs)

The current package is intentionally narrow and centered on one primary Skill:

- [civilis-risk-os](skills/civilis-risk-os/SKILL.md)

Bundled supporting modules remain available for narrower tasks:

- [civilis-risk-os-runtime](skills/civilis-risk-os-runtime/SKILL.md)
- [civilis-risk-os-external-consumer](skills/civilis-risk-os-external-consumer/SKILL.md)
- [civilis-risk-os-integration-check](skills/civilis-risk-os-integration-check/SKILL.md)

These bundled modules sit under the same installable package. Another AI should
start from the primary `civilis-risk-os` Skill first, then reach for a
supporting module only when a narrower task needs it.

Together they let another AI:

- directly call the runtime action surface
- integrate another commerce surface against the Risk OS contract
- validate whether an integration meets the minimum protected-commerce contract

Quick index:

- [Runtime Quickstart](docs/runtime-quickstart.md)
- [Runtime Tool Surface](docs/runtime-tool-surface.md)
- [Hosted Runtime Onboarding](docs/hosted-runtime-onboarding.md)
- [Integration Checklist](docs/integration-checklist.md)
- [Project One Pager](docs/project-one-pager.md)
- [`npm run runtime -- help`](package.json)
- [OpenAPI Contract](openapi/risk-os.openapi.yaml)
- [Runtime Environment Guide](docs/proof-environment-runbook.md)
- [Live X Layer References](docs/canonical-proof-evidence.md)

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

### Supported actions in the current public release

- quote a protected intel purchase
- execute a challengeable protected purchase
- file a buyer claim
- resolve the claim as the evaluator
- query the protected purchase state

### Bundled local runtime profile

The installable package now ships a local runtime profile so another AI can:

- install the package
- run `npm run demo`
- run `npm test`
- run `npm run verify:protected-loop`
- call `npm run runtime -- ...`

without first launching a separate Civilis service.

The same command surface can still point at another compatible hosted runtime by
passing `--base-url`.

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
- when `RISK_OS_ENABLE_LLM_EVALUATOR=true` and an `LLM_*` configuration is
  present, evaluator proof generation and resolution can also consume an
  AI-generated advisory decision and reasoning payload; explicit evaluator
  decisions still win when they are supplied
- risk quotes read mixed local + on-chain `ERC-8004` validation summaries when
  the validation registry is configured
- risk quotes can also enrich seller-side scoring with live `okx-security`
  wallet token scan results and `okx-dex-token` concentration signals when the
  runtime has access to the Onchain OS CLI
- refund and release both have captured mainnet-backed proof loops
- current-session Agentic Wallet off-chain signing has been locally verified
  through successful `x402-pay` proof generation, which confirms that the
  underlying pre-transaction signing path is live even though this repo still
  does not claim a captured buyer wallet-signature loop for arbitrary
  claim-proof payloads because the current official Agentic Wallet CLI does not
  expose a generic message-sign command
- the public external-consumer quickstart script has been validated against the
  live runtime environment for `quote`, `quote-buy`, `claim-proof`, `claim`,
  `resolve-proof`, `resolve`, and later repricing
- the public repo also includes a second lightweight reference adapter for
  `The Square` paywalled intel unlocks, so the reusable claim no longer depends
  on a single commerce surface
- later quotes reflect prior protected outcomes, and the local protected
  purchase state now records repricing sync status for recovery

### Capability vs Captured Proof

To keep the proof boundary strict, this repo distinguishes between **wallet
capability** and **captured public proof**:

| Surface | Current status |
| --- | --- |
| Independent Agentic Wallet actors for buyer / seller / evaluator | captured in the primary live reference |
| `x402-pay` off-chain signing through the current Agentic Wallet session | locally verified |
| Buyer-side deterministic `claim-proof` message generation | captured in the primary live reference |
| Evaluator-side wallet-bound `resolve-proof` authorization path | captured in a historical proof loop |
| Generic buyer wallet-signature proof for arbitrary claim payloads | **not claimed** because the official Agentic Wallet CLI does not currently expose a generic message-sign command |

### Non-goals in the current public release

- partial refunds
- decentralized arbitration
- generalized protection across every commerce surface
- wallet-signature-bound universal claimant/evaluator auth

## What The Second Adapter Proves

The second adapter does **not** prove a second live mainnet settlement loop.

It **does** prove something still important:

- the Risk OS contract can normalize another commerce surface
- the protection primitive is not trapped inside Intel Market
- an external consumer can mirror into the same quote and dispute vocabulary

That is why the repo presents the second adapter as a **portability proof**,
not as a second mainnet-proved live integration.

For the shortest explanation of why it still matters, see:

- [Why The Second Adapter Matters](docs/why-second-adapter-matters.md)

## Project Introduction

Civilis Risk OS addresses a missing layer in agent commerce: what happens after
payment if the delivered output is disputed, low quality, or misleading.

The project does not try to solve every commerce type at once. Instead, it
demonstrates a narrow but reusable protection loop against a real commerce
surface that already exists in Civilis.

The loop is:

`quote -> protected buy -> claim -> evaluator release/refund -> repriced later quote`

## Relationship to Civilis

Civilis Risk OS is an **extracted product layer** from the broader Civilis
system, not an unrelated brand.

- **Civilis** is the live multi-agent world and the original foundation
- **Civilis Risk OS** is the standalone protection layer extracted from that
  foundation
- **Civilis Intel Market** is the current reference integration for the live
  agent-commerce loop

Public background project:

- [Civilis public repository](https://github.com/CivilisAI/Civilis-public)

The intended relationship is:

`Civilis world -> extract reusable protection logic -> standalone Civilis Risk OS`

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

## Ecosystem Positioning

This repo is packaged as a reusable public project, not as a general snapshot
of the broader Civilis world.

The reusable public surface is:

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

That is the reusable skill contract for the current public release:

`any agent commerce app can wrap payment with a challengeable protection loop`

This repo now includes a second lightweight reference adapter for a different
commerce surface:

- [The Square paywalled intel unlock adapter](docs/second-adapter-paywalled-intel-unlock.md)

It is intentionally labeled as a **reference adapter**, not as a second
mainnet-proved live integration.

## Runtime Environments

The strict runtime used for live references keeps the on-chain path enabled but
disables unrelated world ticking:

- `AUTO_START_WORLD=false`
- strict mainnet mode enabled
- `x402` direct-wallet mode enabled
- `RISK_OS_CLAIMANT_AUTH_TOKEN` and `RISK_OS_EVALUATOR_AUTH_TOKEN` configured

This matters because the runtime needs real `Agentic Wallet` and `ERC-8183`
behavior, but should not let unrelated world ticks mutate staged commerce items
during integration or verification.

## Onchain OS Skill Usage

Civilis Risk OS is built around the live X Layer stack and current OKX
capabilities:

- `okx-x402-payment`
- `okx-agentic-wallet`
- `okx-security`
- `okx-dex-token`
- `ERC-8183 / ACP`
- `ERC-8004`
- `X Layer mainnet (chainId 196)`

No Uniswap MVP claim is made in this public snapshot.

## How The Official Stack Is Used

### `x402 Payment API`

- used as the payment-facing rail for intel purchases
- differentiates simple payable flow from protected purchase orchestration
- aligned to the official `okx-x402-payment` capability surface

### `Agentic Wallet`

- used to create and operate the buyer, seller, and evaluator proof actors
- used as the chain identity surface for the staged mainnet proof loops
- aligned to the official `okx-agentic-wallet` capability surface

### `okx-security`

- used in the live quote path through `onchainos security token-scan`
- scans seller-wallet token holdings before final quote scoring
- feeds seller-wallet token risk signals back into the quote adjustment set

### `okx-dex-token`

- used in the live quote path through
  `onchainos token advanced-info --chain xlayer --address <token>`
- used in the live quote path through
  `onchainos token holders --chain xlayer --address <token>`
- feeds token concentration and suspicious-holding signals back into the quote
  adjustment set

### Why the official skill package matters here

The official `okx/onchainos-skills` package makes the capability boundaries much
clearer:

- `okx-agentic-wallet` owns wallet identity and wallet-controlled execution
- `okx-x402-payment` owns x402 proof signing and payment replay
- `okx-security` owns seller-wallet token safety scanning
- `okx-dex-token` owns token concentration and holder analytics
- `okx-security` also owns token / tx / signature scanning

That separation helps this repo stay rigorous. It lets us say exactly what this
project already uses and what it does **not** yet claim.

See:

- [OnchainOS Skills Application Map](docs/onchainos-skills-application-map.md)

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

The reusable public surface is the API and orchestration flow above. The
included dashboard files are a **role-scoped reference UI** used
to make the buyer path and evaluator path legible during review, not a claim
that production role separation is already fully packaged as a standalone
front-end product.
In the current reference UI, the evaluator path is intentionally activated only
after the buyer has opened a claim, so the review follows the same role order
as the protected workflow.

For the strict live runtime loops in this repo, buyer-side claim
filing is role-gated through a dedicated claimant token. Evaluator resolution
can use the strict runtime evaluator token or a wallet-bound
signature over the `resolve-proof` message. This is still weaker than
wallet-signature-bound universal auth across every role and surface, but it
prevents the runtime from running with anonymous claim or resolution
actions.

Outside the strict runtime mode, unauthenticated role actions remain
disabled by default. A developer must explicitly opt into a local bypass through
`RISK_OS_ALLOW_UNAUTHENTICATED_DEV=true`; that bypass is not part of the public
project claim.

## Deployment Addresses

| Contract | Address |
| --- | --- |
| `ACPV2` | `0xBEf97c569a5b4a82C1e8f53792eC41c988A4316e` |
| `CivilisCommerceV2` | `0x7bac782C23E72462C96891537C61a4C86E9F086e` |
| `ERC8004IdentityRegistryV2` | `0xC9C992C0e2B8E1982DddB8750c15399D01CF907a` |
| `ERC8004ReputationRegistryV2` | `0xD8499b9A516743153EE65382f3E2C389EE693880` |
| `ERC8004ValidationRegistryV2` | `0x0CC71B9488AA74A8162790b65592792Ba52119fB` |
| `USDT payment token` | `0x779Ded0c9e1022225f8E0630b35a9b54bE713736` |

## Agentic Wallet Roles

The live reference loop uses independently controlled Agentic Wallet actors:

| Role | Agent | Wallet |
| --- | --- | --- |
| buyer | `sage` | `0x3dba0d4e682be54be41b48cbe9572a81d14e94c9` |
| seller | `fox` | `0x4f5dc690f366116bf6bc22f29e44f8d141bf38de` |
| evaluator | `arbiter` | `0x400ea2f2af2732c4e2af9fb2f8616468ad49023d` |

These are the current public runtime actors for the reference loop. They do not
replace the broader wallet map of the original Civilis world.

## Positioning in the X Layer Ecosystem

Civilis Risk OS is positioned as a reusable protection primitive inside the X
Layer agent stack:

- `x402` makes agent commerce payable
- `Agentic Wallet` makes agent execution possible
- `ERC-8183` makes agent work and escrow legible
- `ERC-8004` makes identity and trust history queryable
- **Civilis Risk OS makes that commerce challengeable, refundable, and
  repriced**

This is why the project is expressed as a Skill rather than as a generic app
feature.

## Live X Layer References

This repository includes one primary live protected-commerce loop on X Layer,
plus earlier complementary references for release depth and evaluator-signature
depth.

### Primary Live Loop

- staged intel item id: `16`
- quote id: `34`
- protected purchase id: `11`
- local ACP job id: `13`
- on-chain job id: `2030`
- funded principal tx: `0x3626e79f734b6708d357e3556353617d4600bbb5d859ff47d1dc6846b76479fa`
- delivery submit tx: `0x813b673060e0d0f7d88ebd466801049c76b662297820a6f23a066773b32d0260`
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

For the complete transaction references, verification scripts, and full
captured-path notes, use [Canonical Proof Evidence](docs/canonical-proof-evidence.md).

## Repository Layout

| Path | Purpose |
| --- | --- |
| [`docs/`](docs) | product docs, integration notes, runtime guides, and platform review appendices |
| [`specs/`](specs) | PRD and implementation plan |
| [`reference/server/`](reference/server) | extracted reference implementation files from the working service |
| [`reference/dashboard/`](reference/dashboard) | extracted reference UI files |

## What Is Included

- a focused README that explains the project and covers the public repo requirement fields
- deployment addresses
- Onchain OS / X Layer usage
- working mechanics
- team members
- X Layer ecosystem positioning
- live X Layer transaction references for refund and release paths

## What Is Not Claimed

This repository does **not** claim:

- generalized protection for every market type
- partial refunds
- decentralized arbitration
- wallet-signature-bound universal evaluator auth across every role and surface
- on-chain premium collection
- a fully capitalized underwriting reserve

Those are future extension directions, not current public facts.

## Team Members

- `kb / CivilisAI`: product, architecture, and project direction
- `Codex`: implementation, review, packaging, and evidence support

## Platform Review Appendix

If you are reviewing this repo for Build X specifically, start here:

1. [Build X Reviewer Guide](docs/build-x-reviewer-guide.md)
2. [Build X Requirements Mapping](docs/build-x-requirements-mapping.md)
3. [Canonical Proof Evidence](docs/canonical-proof-evidence.md)
4. [Evaluation Mapping](docs/evaluation-mapping.md)
5. [Release Readiness Audit](docs/release-readiness-audit.md)
6. [Public Reference Pack](docs/public-reference-pack.md)

## License

This public project repository is released under the [MIT License](LICENSE).
