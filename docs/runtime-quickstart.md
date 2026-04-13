# Runtime Quickstart

If another AI should **directly use** Civilis Risk OS rather than only read the
docs, start here.

## What This Gives You

The runtime CLI wraps the public Risk OS surface into a narrower tool contract:

- `health`
- `quote`
- `buy`
- `purchase`
- `claim-proof`
- `claim`
- `resolve-proof`
- `resolve`
- `requote`

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
- one live quote call
- one structured JSON output
- runtime auto-discovery and auto-start when a linked local Civilis workspace is
  available

Environment overrides:

```bash
RISK_OS_DEMO_BASE_URL=http://127.0.0.1:3011
RISK_OS_DEMO_ITEM_ID=1016
RISK_OS_DEMO_BUYER=sage
RISK_OS_RUNTIME_ROOT=/absolute/path/to/Civilis
```

If `RISK_OS_DEMO_ITEM_ID` is omitted, the demo automatically picks the first
live reference item returned by the runtime.

If `RISK_OS_DEMO_BASE_URL` is not reachable, the demo will try to auto-start a
compatible runtime from:

- `RISK_OS_RUNTIME_ROOT`
- or a sibling `../Civilis` checkout if present

If neither is available, the demo exits with a clear runtime discovery error
instead of silently falling back to mock data.

## 1. Check Runtime Health

```bash
npm run runtime -- health --base-url http://127.0.0.1:3011
```

## 2. Quote A Listing

```bash
npm run runtime -- quote --base-url http://127.0.0.1:3011 --item 16 --buyer sage
```

## Command Parameter Table

| Command | Required flags | Optional flags |
| --- | --- | --- |
| `health` | `--base-url` | none |
| `quote` | `--base-url`, `--item`, `--buyer` | none |
| `buy` | `--base-url`, `--item`, `--buyer`, `--quote`, `--mode` | none |
| `purchase` | `--base-url`, `--purchase` | none |
| `claim-proof` | `--base-url`, `--purchase`, `--reason` | `--claim-type` |
| `claim` | `--base-url`, `--purchase`, `--reason` | `--claim-type`, `--claimant-token`, `--claimant-signature` |
| `resolve-proof` | `--base-url`, `--claim` | `--decision`, `--reason` |
| `resolve` | `--base-url`, `--claim` | `--decision`, `--reason`, `--evaluator-token`, `--evaluator-signature` |
| `requote` | `--base-url`, `--item`, `--buyer` | none |

## 3. Create A Challengeable Protected Purchase

```bash
npm run runtime -- buy --base-url http://127.0.0.1:3011 --item 16 --buyer sage --mode challengeable --quote 34
```

## 4. Inspect Protected Purchase State

```bash
npm run runtime -- purchase --base-url http://127.0.0.1:3011 --purchase 11
```

## 5. Prepare And Open A Claim

```bash
npm run runtime -- claim-proof --base-url http://127.0.0.1:3011 --purchase 11 --reason "delivery was misleading"
```

```bash
npm run runtime -- claim --base-url http://127.0.0.1:3011 --purchase 11 --reason "delivery was misleading" --claimant-token <token>
```

## 6. Prepare And Resolve As Evaluator

```bash
npm run runtime -- resolve-proof --base-url http://127.0.0.1:3011 --claim 10 --decision refund --reason "quality below threshold"
```

```bash
npm run runtime -- resolve --base-url http://127.0.0.1:3011 --claim 10 --decision refund --reason "quality below threshold" --evaluator-token <token>
```

If the runtime has `RISK_OS_ENABLE_LLM_EVALUATOR=true` and a configured
OpenAI-compatible `LLM_*` endpoint, `resolve-proof` and `resolve` may omit
`--decision` and `--reason`; the runtime will then use the evaluator advisory
path instead of pretending a manual decision already exists.

## 7. Requote After Outcome

```bash
npm run runtime -- requote --base-url http://127.0.0.1:3011 --item 16 --buyer sage
```

## Why This Matters

The current strongest public claim should now be read as:

- another AI can install this repo
- run a small runtime action surface
- and complete the protected-commerce loop directly

That is stronger than merely reading the OpenAPI spec.
