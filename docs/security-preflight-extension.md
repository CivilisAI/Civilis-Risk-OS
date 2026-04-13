# Security Preflight Extension

This document defines the most natural next-step hardening layer for Civilis
Risk OS using the official `okx-security` capability boundary.

It is a design extension, not a claim that the current canonical replay already
depends on live security scans.

## Why This Is The Right Next Security Layer

Risk OS is already strong on:

- protected settlement
- role-gated claim / resolve flows
- repricing after outcomes

The next most valuable hardening step is to scan the **dangerous edges** before
they finalize:

- evaluator resolution proof requests
- settlement transaction payloads
- optional external consumer signature requests

This matches the official `okx-security` skill boundary:

- tx scan
- signature scan
- token scan
- dapp scan

## Suggested Preflight Surfaces

### A. Evaluator resolve-proof signing request

Potential future step:

1. generate deterministic `resolve-proof`
2. run `okx-security` signature scan on the message/signing request
3. only allow wallet-bound resolution if the scan is acceptable

### B. Settlement transaction preflight

Potential future step:

1. prepare settlement payload
2. run `okx-security` tx scan
3. record the scan result alongside settlement evidence

### C. Consumer-side signature safety

Potential future step:

1. prepare buyer claim-proof message
2. present the proof surface
3. optionally security-scan the signing request before buyer signature

Constraint:

- this does not remove the current official CLI boundary around generic buyer
  message signing

## Suggested Output Shape

If this extension is later implemented, the minimal useful record would be:

```json
{
  "scan_surface": "resolve-proof-signature",
  "tool": "okx-security",
  "status": "pass",
  "risk_flags": [],
  "scanned_at": "2026-04-13T00:00:00Z"
}
```

## Current Submission Boundary

Current repo claim:

- **future hardening extension, not current canonical proof requirement**
