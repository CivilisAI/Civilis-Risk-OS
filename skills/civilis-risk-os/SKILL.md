---
name: civilis-risk-os
description: "Use this skill when an AI agent needs to directly use Civilis Risk OS as a protection primitive for agent commerce on X Layer. Covers risk quoting, challengeable protected purchases, protected purchase inspection, buyer claim preparation and filing, evaluator resolution preparation and filing, and repricing after outcome. Do NOT use this skill for broad README or marketing wording; use the product docs instead. Do NOT use it to overclaim generalized insurance, decentralized arbitration, or universal wallet-signature coverage."
license: MIT
metadata:
  author: CivilisAI
  version: "0.1.0"
  homepage: "https://github.com/CivilisAI/Civilis-Risk-OS"
---

# Civilis Risk OS

Installable protection skill for agent commerce on X Layer.

## Quickstart

```bash
git clone https://github.com/CivilisAI/Civilis-Risk-OS.git
cd Civilis-Risk-OS
npm install
npm run demo
npm run runtime -- help
```

Or from another workspace:

```bash
npm install github:CivilisAI/Civilis-Risk-OS
npx civilis-risk-os-runtime help
npx civilis-risk-os-runtime health --base-url https://civilis-risk-os-runtime.ceolaexekiel.workers.dev
```

When the package is used in bundled local mode, the runtime command surface
starts the bundled local runtime profile automatically and uses bundled
claimant and evaluator auth defaults.

The same package also supports the public hosted bundled runtime at:

- `https://civilis-risk-os-runtime.ceolaexekiel.workers.dev`

## Use This Skill For

- quoting seller risk before payment
- selecting `instant` or `challengeable` settlement
- creating protected purchases
- preparing and filing buyer claims
- preparing and filing evaluator resolutions
- querying post-outcome repricing

## Do Not Use This Skill For

- generalized insurance workflows
- decentralized arbitration flows
- partial refund logic
- overclaiming generic buyer wallet-signature proof

## Runtime Commands

The primary runtime command surface is:

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

## Parameter Rules

- `--base-url <url>`: compatible Risk OS runtime endpoint, optional in bundled local mode and defaulting to `http://127.0.0.1:3401`
- the public hosted bundled runtime is `https://civilis-risk-os-runtime.ceolaexekiel.workers.dev`
- `--item <intelItemId>`: reference item id for `quote`, `buy`, `requote`
- `--buyer <agentId>`: buyer agent id, default `sage`
- `--quote <quoteId>`: required for `buy`
- `--purchase <protectedPurchaseId>`: required for `purchase`, `claim-proof`, `claim`
- `--claim <claimId>`: required for `resolve-proof`, `resolve`
- `--mode <instant|challengeable>`: settlement mode for `buy`
- `--decision <release|refund>`: explicit evaluator outcome; optional for `resolve-proof` and `resolve` when the runtime has LLM evaluator advisory enabled
- `--reason <text>`: required for `claim`, optional for `resolve-proof` and `resolve` when proof or advisory generation supplies it
- `--claimant-token <token>` or `--claimant-signature <sig>`: buyer auth
- `--evaluator-token <token>` or `--evaluator-signature <sig>`: evaluator auth
- in bundled local mode, claimant and evaluator auth are already supplied by
  the package
- in the public hosted bundled runtime, the package also auto-supplies bundled
  claimant and evaluator auth after the runtime identifies itself as bundled
- in the public hosted bundled runtime, the package also auto-manages a runtime
  session so protected-commerce state stays isolated per caller

## Command Examples

```bash
npm run runtime -- health
npm run runtime -- quote --item 501 --buyer sage
npm run runtime -- buy --item 501 --buyer sage --mode challengeable --quote 1
npm run runtime -- purchase --purchase 1
npm run runtime -- claim-proof --purchase 1 --reason "delivery was misleading"
npm run runtime -- claim --purchase 1 --reason "delivery was misleading"
npm run runtime -- resolve-proof --claim 1 --decision refund --reason "quality below threshold"
npm run runtime -- resolve --claim 1 --decision refund --reason "quality below threshold"
npm run runtime -- resolve-proof --claim 1
npm run runtime -- requote --item 501 --buyer sage
npm run verify:protected-loop
```

## Output Contract

Always return:

- the command executed
- the acting role
- the structured JSON response
- any remaining `UNVERIFIED` boundary that affects the result

## References

- [../../docs/runtime-quickstart.md](../../docs/runtime-quickstart.md)
- [../../docs/runtime-tool-surface.md](../../docs/runtime-tool-surface.md)
- [../../docs/external-consumer-guide.md](../../docs/external-consumer-guide.md)
- [../../runtime.tool-surface.json](../../runtime.tool-surface.json)

## Bundled Supporting Modules

The primary install surface is this Skill. Bundled supporting modules are also
available for narrower tasks:

- `civilis-risk-os-runtime`
- `civilis-risk-os-canonical-replay`
- `civilis-risk-os-external-consumer`
- `civilis-risk-os-proof-boundaries`
- `civilis-risk-os-integration-check`
