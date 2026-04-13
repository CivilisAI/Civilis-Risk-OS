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
```

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

## Parameter Rules

- `--base-url <url>`: compatible Risk OS runtime endpoint, default `http://127.0.0.1:3011`
- `--item <intelItemId>`: reference item id for `quote`, `buy`, `requote`
- `--buyer <agentId>`: buyer agent id, default `sage`
- `--quote <quoteId>`: required for `buy`
- `--purchase <protectedPurchaseId>`: required for `purchase`, `claim-proof`, `claim`
- `--claim <claimId>`: required for `resolve-proof`, `resolve`
- `--mode <instant|challengeable>`: settlement mode for `buy`
- `--decision <release|refund>`: required for `resolve`
- `--reason <text>`: required for `claim`, `resolve`, optional in proof prep
- `--claimant-token <token>` or `--claimant-signature <sig>`: buyer auth
- `--evaluator-token <token>` or `--evaluator-signature <sig>`: evaluator auth

## Command Examples

```bash
npm run runtime -- health --base-url http://127.0.0.1:3011
npm run runtime -- quote --base-url http://127.0.0.1:3011 --item 16 --buyer sage
npm run runtime -- buy --base-url http://127.0.0.1:3011 --item 16 --buyer sage --mode challengeable --quote 34
npm run runtime -- purchase --base-url http://127.0.0.1:3011 --purchase 11
npm run runtime -- claim-proof --base-url http://127.0.0.1:3011 --purchase 11 --reason "delivery was misleading"
npm run runtime -- claim --base-url http://127.0.0.1:3011 --purchase 11 --reason "delivery was misleading" --claimant-token <token>
npm run runtime -- resolve-proof --base-url http://127.0.0.1:3011 --claim 10 --decision refund --reason "quality below threshold"
npm run runtime -- resolve --base-url http://127.0.0.1:3011 --claim 10 --decision refund --reason "quality below threshold" --evaluator-token <token>
npm run runtime -- requote --base-url http://127.0.0.1:3011 --item 16 --buyer sage
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
