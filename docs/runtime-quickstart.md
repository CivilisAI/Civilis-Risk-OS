# Runtime Quickstart

If another AI should **directly use** Civilis Risk OS rather than only read the
docs, start here.

Civilis Risk OS is an installable skill with two product paths:

- bundled local runtime
- public hosted bundled runtime

## What This Gives You

The runtime CLI wraps the public Risk OS surface into a narrow tool contract:

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

Entry:

- [../examples/risk-os-runtime.mjs](../examples/risk-os-runtime.mjs)

## Install

From the public repo:

```bash
git clone https://github.com/CivilisAI/Civilis-Risk-OS.git
cd Civilis-Risk-OS
npm install
npm run demo
npm test
npm run runtime -- help
```

From another workspace:

```bash
npm install github:CivilisAI/Civilis-Risk-OS
npx civilis-risk-os-runtime help
```

The local clone path, a fresh local package install, and a direct GitHub
package install were all verified for this public repo.

## Fastest Demo

If someone only wants to prove that the package is executable, start with:

```bash
npm run demo
npm test
```

This performs:

- runtime health
- one bundled quote call
- one structured JSON output
- bundled local runtime start
- bundled claimant and evaluator auth

Environment overrides:

```bash
RISK_OS_DEMO_BASE_URL=<compatible-runtime-url>
RISK_OS_DEMO_ITEM_ID=501
RISK_OS_DEMO_BUYER=sage
```

If `RISK_OS_DEMO_ITEM_ID` is omitted, the demo automatically picks the first
live reference item returned by the runtime.

If `RISK_OS_DEMO_BASE_URL` is not reachable and points to a local address, the
package starts the bundled runtime automatically instead of falling back to mock
data.

## 1. Check Runtime Health

```bash
npm run runtime -- health
```

## 2. Quote A Listing

```bash
npm run runtime -- quote --item 501 --buyer sage
```

## Command Parameter Table

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
local profile.

## 3. Create A Protected Purchase

```bash
npm run runtime -- buy --item 501 --buyer sage --mode challengeable --quote 1
```

## 4. Inspect Protected Purchase State

```bash
npm run runtime -- purchase --purchase 1
```

## 5. Prepare And Open A Claim

```bash
npm run runtime -- claim-proof --purchase 1 --reason "delivery was misleading"
```

```bash
npm run runtime -- claim --purchase 1 --reason "delivery was misleading"
```

## 6. Prepare And Resolve As Evaluator

```bash
npm run runtime -- resolve-proof --claim 1 --decision refund --reason "quality below threshold"
```

```bash
npm run runtime -- resolve --claim 1 --decision refund --reason "quality below threshold"
```

If the runtime has `RISK_OS_ENABLE_LLM_EVALUATOR=true` and a configured
OpenAI-compatible `LLM_*` endpoint, `resolve-proof` and `resolve` may omit
`--decision` and `--reason`; the runtime will then use the evaluator advisory
path instead of pretending a manual decision already exists.

## 7. Requote After Outcome

```bash
npm run runtime -- requote --item 501 --buyer sage
```

## 8. Verify The Full Protected-Commerce Loop

```bash
npm run verify:protected-loop
```

This command runs:

- `quote`
- `buy`
- `purchase`
- `claim-proof`
- `claim`
- `resolve-proof`
- `resolve`
- `requote`

In bundled local mode, it reuses the same auto-start runtime and bundled auth
path as the rest of the runtime CLI.

## Why This Matters

The current strongest public claim should now be read as:

- another AI can install this repo
- run a narrow runtime action surface
- and complete `quote -> buy -> claim -> resolve -> requote` directly

That is stronger than merely reading the OpenAPI spec.
