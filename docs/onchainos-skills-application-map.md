# OnchainOS Skills Application Map

This note records what we learned from the official
`okx/onchainos-skills` package and how that learning applies to
**Civilis Risk OS**.

It is intentionally split into:

- what the current submission already uses
- what the package clarifies about official capability boundaries
- what would still be worth integrating next

## Research Basis

This mapping is grounded in three sources:

1. the official install flow requested via:
   - `npx skills add okx/onchainos-skills`
   - `npx skills add okx/onchainos-skills -y -g`
2. the local skill bundle already present in the Civilis working tree:
   - `/Users/kb/Desktop/Civilis/skills/*`
3. the currently installed `onchainos` CLI help surface, including:
   - `onchainos wallet --help`
   - `onchainos payment --help`
   - `onchainos payment x402-pay --help`
   - `onchainos security --help`
   - `onchainos gateway --help`

## The Most Important Takeaway

`okx/onchainos-skills` is not one monolithic “OKX integration.”

It is a **capability map** with clear boundaries:

- `okx-agentic-wallet` = wallet identity, auth, balance, transfers,
  contract-call
- `okx-x402-payment` = x402 proof signing and payment replay
- `okx-onchain-gateway` = gas, simulation, broadcast, transaction tracking
- `okx-security` = token / dapp / tx / signature safety
- `okx-wallet-portfolio` = public-address asset inspection
- `okx-dex-market` / `okx-dex-token` = market and token analytics

That boundary map is valuable for this submission because it helps us say
exactly:

- what Civilis Risk OS already uses
- what it could integrate next
- what it should **not** overclaim

It also shaped how this repo now packages its own reusable AI-readable skills:

- [AI Skill Pack](ai-skill-pack.md)

## What Civilis Risk OS Already Uses

### 1. `okx-agentic-wallet`

Current submission value:

- independent buyer / seller / evaluator Agentic Wallet actors
- wallet-backed identity for the canonical replay
- staged mainnet proof actors for protected commerce

Why it matters:

- this is what makes the submission feel like agent infrastructure rather than
  a static mock
- it grounds the “independent actor” claim in wallet reality

### 2. `okx-x402-payment`

Current submission value:

- `x402-pay` proof generation is already part of the evidence boundary
- it proves the current-session off-chain signing path is live
- it supports the payable side of the protected commerce story

Why it matters:

- it makes Risk OS clearly compatible with the official payment rail rather than
  describing a custom payment shell

### 3. Official protocol surface alignment

Even though `ERC-8183` and `ERC-8004` are not “skills” in the same packaging
sense, the OnchainOS skill docs make the runtime boundary clearer:

- payments are one surface
- wallets are one surface
- settlement and proof orchestration are separate concerns

That helps keep the submission claim narrow and honest.

## What The Official Skill Package Clarifies

### 1. Why generic buyer wallet-signature proof is still an honest boundary

The `onchainos` public CLI surface currently exposes:

- wallet login / verify / add / switch / status / send / contract-call
- payment / `x402-pay`
- security scans
- gateway simulation / broadcast / tracking

It does **not** currently expose a public generic `message-sign` command for
arbitrary buyer claim payloads.

So the repo should continue to say:

- Agentic Wallet signing capability is real
- `x402` signing proof is real
- deterministic buyer `claim-proof` generation is real
- but a captured **generic buyer message-sign proof loop** is not yet claimed

That is the technically correct reading of the package.

### 2. Why `okx-onchain-gateway` is different from wallet execution

The official skill docs make this distinction explicit:

- wallet skill = controlled wallet actions
- gateway skill = raw transaction simulation / gas / broadcast / order tracking

This matters for Risk OS because it tells us not to blur:

- protected agent-wallet execution
- generic broadcast infrastructure

### 3. Why `okx-security` is a meaningful next-step hardening layer

The official skill docs treat security scanning as a distinct preflight surface:

- token scan
- tx scan
- signature scan
- approval scan

That means a future Risk OS hardening claim can be very concrete:

- preflight the resolver signature request
- preflight settlement txs before release/refund
- optionally attach security posture to a claim or resolution decision

## Best Next Integrations

These are the highest-value future integrations suggested by the official skill
package.

### A. `okx-security` for protected-resolution hardening

Best use:

- scan evaluator signature requests before a wallet-bound resolve path
- scan settlement transaction payloads before `release` / `refund`

Why it helps:

- strengthens the “safe protected commerce” story
- adds a security layer without widening the product scope too much

### B. `okx-onchain-gateway` for replay-grade transaction observability

Best use:

- simulate settlement paths before broadcasting
- capture gas and broadcast tracking as secondary proof

Why it helps:

- makes the infrastructure story stronger
- improves replay credibility for technical judges

### C. `okx-wallet-portfolio` for external consumer preflight

Best use:

- let an external consumer check whether a buyer or evaluator wallet has enough
  assets before entering the protected flow

Why it helps:

- improves operational clarity for a reusable skill
- fits the “external consumer” story well

### D. `okx-dex-market` / `okx-dex-token` for quote enrichment

Best use:

- enrich future intel-risk quotes with token or market context when the item is
  asset-related

Why it helps:

- creates a stronger data-analysis story
- may help if we later want to target a “best data analysis” style narrative

Constraint:

- do not mix this into the current canonical submission unless it is actually
  implemented and proven

## What We Should Not Do

The package also makes a few anti-patterns obvious.

Do **not**:

- claim that every payment or settlement action is “just x402”
- blur wallet execution and gateway broadcasting into one fake layer
- imply that buyer generic message signing is already available when the public
  CLI does not expose it
- widen the submission into a generic market analytics product just because the
  package contains market and token skills

## Recommended Submission Language

The safest strong wording is:

> Civilis Risk OS is built on top of the official Onchain OS capability stack,
> especially Agentic Wallet and x402 payment, and is designed to extend
> naturally toward security scanning, gateway-grade observability, and
> external-consumer wallet preflight as the next infrastructure layers.

That wording is accurate, ambitious, and still evidence-backed.
