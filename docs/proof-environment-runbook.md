# Proof Environment Runbook

This runbook defines the minimum public understanding needed to reason about the
strict proof environment used by the Civilis Risk OS submission.

It does not disclose private credentials. It explains:

- what the environment is for
- what a reviewer can infer from it
- how to validate the environment boundaries without overstating them

## Purpose

The strict proof environment exists to support the submission's strongest live
claim:

**a protected agent-commerce loop on X Layer with authenticated claimant and
evaluator actions.**

## What The Environment Provides

- configured buyer / seller / evaluator Agentic Wallet actors
- a live X Layer-backed ACP / ERC-8004 proof stack
- strict role gates for claimant and evaluator actions
- a health surface that reports the environment mode and protocol readiness

## What It Does Not Mean

The strict proof environment does **not** mean:

- every reviewer can recreate the private environment from scratch
- generic buyer wallet-signature proof is already captured
- every integration path is public and anonymous

## Minimal Health Check

Use the health endpoint:

```bash
curl -s http://127.0.0.1:3020/health
```

In a healthy strict proof environment, the important fields are:

- `mode: strict`
- `network: mainnet:196`
- `acp: live`
- `erc8004: live`
- `riskAuth` configured for claimant and evaluator proof paths

## Public Verification Surface

The public verifier can check document consistency offline:

```bash
node examples/verify-canonical-proof.mjs
```

It can also probe progressively stronger public proof surfaces:

```bash
RISK_OS_VERIFY_MODE=health RISK_OS_BASE_URL=http://127.0.0.1:3020 node examples/verify-canonical-proof.mjs
RISK_OS_VERIFY_MODE=api RISK_OS_BASE_URL=http://127.0.0.1:3020 node examples/verify-canonical-proof.mjs
RISK_OS_VERIFY_MODE=onchain node examples/verify-canonical-proof.mjs
RISK_OS_VERIFY_MODE=full RISK_OS_BASE_URL=http://127.0.0.1:3020 node examples/verify-canonical-proof.mjs
```

If you want a shorter reproducibility entrypoint, the public submission pack now
ships a minimal `package.json` with matching scripts:

```bash
npm run verify:canonical-docs
npm run verify:canonical-api
npm run verify:canonical-onchain
npm run verify:canonical-full
npm run verify:manifest
```

The current canonical read model for live API verification is:

- `GET /api/risk/purchases/{id}`

## Honest Boundary

Use this runbook to describe the proof environment accurately:

- it is a maintained proof surface
- it is live enough to support the canonical submission loop
- it is not a claim that all private environment material is public
