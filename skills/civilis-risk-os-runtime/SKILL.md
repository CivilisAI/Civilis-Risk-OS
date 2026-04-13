---
name: civilis-risk-os-runtime
description: "Use this skill when an AI agent should directly call Civilis Risk OS as a runtime tool rather than only reading docs. Covers the quote -> protected buy -> purchase view -> claim-proof -> claim -> resolve-proof -> resolve -> requote flow, the runtime CLI wrapper, auth/header expectations, and honest boundaries for hosted or local proof environments. Do NOT use this skill for replay evidence narration only; use civilis-risk-os-canonical-replay instead. Do NOT use it for claim-discipline or README wording without proof discipline; use civilis-risk-os-proof-boundaries instead."
metadata:
  author: CivilisAI
  version: "0.1.0"
  homepage: "https://github.com/CivilisAI/Civilis-Risk-OS"
---

# Civilis Risk OS Runtime

Use this skill when another AI should **directly use** Civilis Risk OS as a
runtime protection primitive.

## Load These References

Always read:

- [references/runtime-surface.md](references/runtime-surface.md)
- [references/runtime-auth.md](references/runtime-auth.md)
- [references/runtime-modes.md](references/runtime-modes.md)

## Use This Skill For

- direct runtime invocation
- protected-commerce tool usage
- local proof-environment usage
- hosted runtime usage
- buyer / evaluator role execution

## Do Not Use This Skill For

- canonical replay narration without running tools
- broad README / marketing claims without proof discipline
- presenting generic buyer wallet-signature proof as already captured

## Runtime Workflow

1. Start with `health` to confirm the runtime is reachable.
2. Run `quote` before any purchase.
3. If the quote recommends `challengeable`, run `buy`.
4. Query `purchase` after buy to inspect protected state.
5. Use `claim-proof` if buyer-side proof preparation is needed.
6. Run `claim` only when delivery quality fails the protected threshold.
7. Use `resolve-proof` if evaluator-side proof preparation is needed.
8. Run `resolve` with `release` or `refund`.
9. Run `requote` to observe later pricing after the outcome.

## Direct Runtime Entry

The fastest direct runtime surface is:

```bash
npm run demo
npm run runtime -- help
```

## Direct Command Contract

Use these commands as the primary runtime contract:

```bash
npm run runtime -- health --base-url http://127.0.0.1:3021
npm run runtime -- quote --item 16 --buyer sage --base-url http://127.0.0.1:3021
npm run runtime -- buy --item 16 --buyer sage --mode challengeable --quote 34 --base-url http://127.0.0.1:3021
npm run runtime -- purchase --purchase 11 --base-url http://127.0.0.1:3021
npm run runtime -- claim --purchase 11 --reason "delivery was misleading" --claimant-token <token> --base-url http://127.0.0.1:3021
npm run runtime -- resolve --claim 10 --decision refund --reason "quality below threshold" --evaluator-token <token> --base-url http://127.0.0.1:3021
npm run runtime -- requote --item 16 --buyer sage --base-url http://127.0.0.1:3021
```

## Minimal Usage Rule

Another AI should not need to replay the full proof pack before using this skill.

Default order:

1. `npm run demo`
2. `npm run runtime -- help`
3. call the runtime action that matches the current role:
   - buyer: `quote`, `buy`, `purchase`, `claim-proof`, `claim`
   - evaluator: `resolve-proof`, `resolve`
   - follow-up: `requote`

## Output Contract

When another AI uses this skill, always return:

- which runtime mode was used: local proof env or hosted runtime
- which actor is acting: buyer or evaluator
- which command was called
- the structured JSON response
- any remaining `UNVERIFIED` proof boundaries
