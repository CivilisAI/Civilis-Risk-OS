# Runtime Tool Surface

Civilis Risk OS exposes the following tool-style runtime actions.

## Buyer Actions

| Action | Purpose | Required Inputs |
| --- | --- | --- |
| `quote` | Quote seller risk before purchase | `item`, `buyer` |
| `buy` | Execute an instant or challengeable purchase | `item`, `buyer`, `quote`, `mode` |
| `purchase` | Inspect protected purchase state | `purchase` |
| `claim-proof` | Prepare deterministic buyer-side proof message | `purchase`, `reason` |
| `claim` | Open a claim | `purchase`, `reason`, buyer proof path only when hosted auth is not bundled |
| `requote` | Observe later pricing after outcome | `item`, `buyer` |

## Evaluator Actions

| Action | Purpose | Required Inputs |
| --- | --- | --- |
| `resolve-proof` | Prepare deterministic evaluator proof message | `claim` plus optional `decision`, `reason` |
| `resolve` | Resolve to `release` or `refund` | `claim` plus optional `decision`, `reason`, evaluator proof path only when hosted auth is not bundled |

## Orchestrator Action

| Action | Purpose | Required Inputs |
| --- | --- | --- |
| `full-loop` | Run `quote -> buy -> purchase -> claim-proof -> claim -> resolve-proof -> resolve -> requote` as one protected-commerce acceptance flow | optional `buyer`, `item`, `decision`, `reason` |

## Neutral Action

| Action | Purpose | Required Inputs |
| --- | --- | --- |
| `health` | Check runtime readiness | optional `base-url` |

## Base URL Rule

Every action should work against:

- bundled local runtime mode
- or a hosted compatible runtime

by changing only:

- `--base-url`

In bundled local mode, the CLI can also:

- start the bundled runtime automatically
- use bundled claimant and evaluator auth defaults

## Why This Matters

This turns Risk OS into a **runtime-usable Skill** instead of leaving it as a
collection of proof docs plus a raw OpenAPI contract.
