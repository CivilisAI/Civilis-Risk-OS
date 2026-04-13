---
name: civilis-risk-os-integration-check
description: "Use this skill when an AI agent needs to decide whether a proposed Civilis Risk OS integration is a live challengeable settlement integration, a quote-only consumer, or only a portability adapter. Covers role completeness, endpoint surface, proof requirements, repricing expectations, and honest classification before claiming the integration is complete."
metadata:
  author: CivilisAI
  version: "0.1.0"
  homepage: "https://github.com/CivilisAI/Civilis-Risk-OS"
---

# Civilis Risk OS Integration Check

Use this skill before calling a new consumer integration “complete”.

## Load These References

Always read:

- [references/integration-check.md](references/integration-check.md)
- [references/integration-classes.md](references/integration-classes.md)

## Use This Skill For

- pre-integration review
- adapter classification
- consumer readiness checks
- proof-gap identification

## Do Not Use This Skill For

- canonical replay execution
- broad README or demo wording without proof classification

## Review Workflow

1. Check role completeness:
   - buyer
   - seller
   - evaluator
2. Check endpoint completeness.
3. Check proof path completeness.
4. Check whether settlement is truly challengeable.
5. Check whether repricing is included.
6. Classify the integration as:
   - live challengeable settlement
   - quote-only consumer
   - portability adapter
   - UNVERIFIED

## Output Contract

Always produce:

- classification
- blocking gaps
- what may be claimed now
- what may not be claimed now
