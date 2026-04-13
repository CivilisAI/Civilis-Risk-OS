---
name: civilis-risk-os-canonical-replay
description: "Use this skill when an AI agent needs to replay, verify, or explain the canonical Civilis Risk OS protected-commerce loop on X Layer. Covers restaging a fresh replay item, running the external-consumer quickstart actions, interpreting the canonical buyer/seller/evaluator actors and hashes, and reporting captured proof without overclaiming. Do NOT use for designing a new consumer integration from scratch; use civilis-risk-os-external-consumer instead. Do NOT use for broad marketing or README wording without proof discipline; use civilis-risk-os-proof-boundaries instead."
metadata:
  author: CivilisAI
  version: "0.1.0"
  homepage: "https://github.com/CivilisAI/Civilis-Risk-OS"
---

# Civilis Risk OS Canonical Replay

Use this skill to reproduce or explain the strongest public proof path in this
repository.

## Load These References

Always read:

- [references/canonical-replay.md](references/canonical-replay.md)
- [references/proof-rules.md](references/proof-rules.md)

## Use This Skill For

- canonical replay
- fresh replay staging
- quote / buy / claim / resolve / repricing verification
- judge proof walkthroughs
- evidence-backed incident or review writeups

## Do Not Use This Skill For

- designing a new external adapter from scratch
- writing broad submission copy without proof classification
- claiming generic buyer wallet-signature proof for arbitrary claim payloads

## Workflow

1. Start from the canonical actor set in `references/canonical-replay.md`.
2. Treat the historical canonical path as the public anchor, but use a fresh
   staged item for new live replays.
3. Use the quickstart script in this order:
   - `quote`
   - `quote-buy`
   - `claim-proof`
   - `claim`
   - `resolve-proof`
   - `resolve`
   - `quote`
4. Report the result using the proof rules:
   - `canonical captured proof`
   - `historical depth evidence`
   - `proof-prep surface`
   - `not claimed`
5. If a path depends on unavailable private proof-env credentials or a missing
   CLI capability, mark it `UNVERIFIED` instead of guessing.

## Minimal Command Surface

The fastest public replay helper is:

```bash
node examples/external-consumer-quickstart.mjs
```

Typical action form:

```bash
RISK_OS_ACTION=quote-buy node examples/external-consumer-quickstart.mjs
```

## Output Contract

When summarizing a replay, always include:

- actor set used
- whether the replay was canonical historical or fresh staged
- protected purchase id and claim id when available
- on-chain tx hashes when available
- later repricing result
- remaining unverified boundaries
