# Scorecard

This document maps Civilis Risk OS directly to the official Skills Arena scoring
categories.

## 1. Onchain OS / Uniswap Integration And Innovation (25%)

### What We Use

- `okx-agentic-wallet`
- `okx-x402-payment`
- `ERC-8183`
- `ERC-8004`

### What Is Innovative

- not just payment, but **protected** agent commerce
- claim and evaluator resolution attached to a paid workflow
- later repricing after protected outcomes
- an AI-readable skill pack that teaches replay, integration, and proof
  discipline

### Strongest Evidence

- [README.md](../README.md#onchain-os-skill-usage)
- [OnchainOS Skills Application Map](onchainos-skills-application-map.md)
- [Mainnet Evidence](mainnet-evidence.md)

## 2. X Layer Ecosystem Integration (25%)

### Why It Is Native To X Layer

- canonical proof runs on X Layer mainnet
- protected settlement is anchored in the live ACP / ERC-8004 stack
- independent Agentic Wallet actors are part of the canonical loop

### Strongest Evidence

- [Deployment Addresses](../README.md#deployment-addresses)
- [Mainnet Evidence](mainnet-evidence.md)
- [Proof Environment Runbook](proof-environment-runbook.md)

## 3. AI Interaction Experience (25%)

### Why The Experience Is Strong

- role-scoped replay lanes:
  - buyer replay
  - evaluator replay
- deterministic proof surfaces:
  - `claim-proof`
  - `resolve-proof`
- AI-readable skills that tell another agent what to do and what not to claim

### Strongest Evidence

- [Replay Lanes](replay-lanes.md)
- [AI Skill Pack](ai-skill-pack.md)
- [Judge Demo Script](judge-demo-script.md)

## 4. Product Completeness (25%)

### Why The Product Feels Complete

- one live canonical protected-commerce loop
- one portability adapter beyond the reference integration
- one canonical proof verifier
- one OpenAPI contract
- machine-readable schemas
- clear proof boundaries and non-goals

### Strongest Evidence

- [Judge One Pager](judge-one-pager.md)
- [Canonical Proof Verifier](../examples/verify-canonical-proof.mjs)
- [OpenAPI Contract](../openapi/risk-os.openapi.yaml)
- [Integration Checklist](integration-checklist.md)
- [Proof Surface Matrix](proof-surface-matrix.md)

## Honest Scoring Boundary

The submission should not overstate these areas:

- generic buyer wallet-signature captured proof
- decentralized arbitration
- generalized insurance reserve
- second live mainnet settlement loop

Those are boundaries, not hidden failures.
