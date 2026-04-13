---
name: civilis-risk-os-proof-boundaries
description: "Use this skill when an AI agent needs to review, write, or tighten Civilis Risk OS claims so they remain evidence-backed. Covers canonical vs historical evidence, proof-prep vs captured proof, current Agentic Wallet and x402 capability boundaries, and how to avoid overclaiming a second adapter, decentralized arbitration, generalized insurance, or generic buyer wallet-signature proof. Do NOT use for replay execution or adapter design; use the replay or external-consumer skills instead."
metadata:
  author: CivilisAI
  version: "0.1.0"
  homepage: "https://github.com/CivilisAI/Civilis-Risk-OS"
---

# Civilis Risk OS Proof Boundaries

Use this skill whenever the task involves wording, reviews, evidence
classification, or submission tightening.

## Load These References

Always read:

- [references/proof-classification.md](references/proof-classification.md)
- [references/submission-claims.md](references/submission-claims.md)

## Use This Skill For

- README review
- demo script review
- evidence pack review
- submission form wording
- code or docs review focused on overclaim risk

## Do Not Use This Skill For

- live replay execution
- designing a new consumer adapter
- replacing a security or protocol audit

## Core Rule

Every statement must fit one of these categories:

- canonical captured proof
- historical depth evidence
- proof-prep surface
- capability exists but captured proof is incomplete
- not claimed

If it does not clearly fit, mark it `UNVERIFIED`.

## Required Guardrails

Never present Risk OS as:

- generalized insurance
- decentralized arbitration
- universal wallet-signature-bound auth across every role and surface
- a second live mainnet-proved settlement loop from the portability adapter

## Required Positive Framing

Do present Risk OS as:

- a protection layer for agent commerce
- a reusable skill with one live reference integration
- a system that upgrades payment into challengeable settlement and later
  repricing

## Output Contract

A good proof-boundary review should always state:

- what is captured now
- what is only prepared now
- what is intentionally not claimed
- what remaining boundary comes from official tool exposure, not product logic
