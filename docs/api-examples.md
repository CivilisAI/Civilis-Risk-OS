# Civilis Risk OS API Examples

These examples show the current **judge-facing Skill surface** used in the
reference Intel Market integration.

They are intentionally narrow. The current submission claim is the protection
pattern, not that every commerce surface is already generalized.

## 1. Quote An Intel Purchase Before Buying

`POST /api/risk/quote/intel`

```json
{
  "intelItemId": 7,
  "buyerAgentId": "oracle"
}
```

Typical response shape:

```json
{
  "quote_id": 11,
  "intel_item_id": 7,
  "buyer_agent_id": "oracle",
  "seller_agent_id": "fox",
  "risk_score": 76,
  "recommended_mode": "challengeable",
  "premium_bps": 500,
  "premium_amount": "0.012500",
  "claim_window_seconds": 3600,
  "reasons": [
    "seller_has_fake_history",
    "seller_validation_score_low",
    "seller_credit_below_neutral"
  ],
  "expires_at": "2026-04-13T16:02:54.950Z"
}
```

Important semantic boundary:

- the current challengeable flow protects **seller settlement finality**
- it does **not** claim delayed content reveal as the core protection primitive
- the protected asset in this submission is the principal routed through ACP

## 2. Execute A Challengeable Protected Buy

`POST /api/intel/items/:id/buy`

```json
{
  "buyerAgentId": "oracle",
  "purchaseMode": "challengeable",
  "quoteId": 11
}
```

Typical response shape:

```json
{
  "success": true,
  "settlementMode": "acp_funded",
  "purchaseMode": "challengeable",
  "acpJobId": 8,
  "onChainJobId": 1959,
  "onChainTxHash": "0xf77f8bbc5fa46c6da1f93076857823c5c1759025980f1639fab1f3b7c8086f76",
  "protected_purchase_id": 6,
  "quote_id": 19,
  "intel_item_id": 10,
  "buyer_agent_id": "sage",
  "seller_agent_id": "fox",
  "status": "challenge_window",
  "principal_amount": "0.250000",
  "premium_amount": "0.012500",
  "evaluator_address": "0x9fD22B0A6c66256a9D63bEBcdb9eeB25f34f8D87",
  "challenge_deadline": "2026-04-13T09:19:01.266Z",
  "content": {
    "signal": "counterparty will defect after two apparent cooperation rounds",
    "thesis": "Seller claims a high-confidence behavioral edge in the next arena round.",
    "confidence": 0.81
  },
  "claim": null
}
```

## 3. File A Claim During The Challenge Window

Optional preparation call:

`GET /api/risk/purchases/:id/claim-proof?claimType=misleading_or_invalid_intel`

Typical response shape:

```json
{
  "protected_purchase_id": 7,
  "claimant_agent_id": "sage",
  "claimant_address": "0x3Dba0d4e682bE54Be41b48cbe9572A81d14E94c9",
  "claim_type": "misleading_or_invalid_intel",
  "reason_text": "claim-proof-path",
  "reason_text_hash": "0xa9a34a43cec619554892b582165adb09cc16d72506c7b46ea0b2e8ed46ed3f46",
  "message": "Civilis Risk OS Claim Creation\nprotectedPurchaseId:7\nclaimantAgentId:sage\n..."
}
```

This endpoint exists so an external buyer integration can bind claim creation to
the protected purchase buyer wallet instead of relying only on the proof
environment claimant token.

`POST /api/risk/claims`

```json
{
  "protectedPurchaseId": 3,
  "claimType": "misleading_or_invalid_intel",
  "reasonText": "The delivered intel did not meet the protected quality threshold."
}
```

Typical response shape:

```json
{
  "claim_id": 3,
  "protected_purchase_id": 3,
  "claimant_agent_id": "oracle",
  "claim_type": "misleading_or_invalid_intel",
  "status": "open",
  "reason_text": "The delivered intel did not meet the protected quality threshold.",
  "decision": null,
  "decision_reason": null,
  "evaluator_address": null,
  "created_at": "2026-04-13T16:03:44.244Z",
  "resolved_at": null
}
```

Buyer-side claim proof is required by default. In the strict mainnet-backed
proof environment, send:

- header: `x-civilis-risk-claimant-token: <token>`

Or, for a wallet-bound integration:

- header: `x-civilis-risk-claimant-signature: <signature>`

## 4. Preview A Wallet-Signable Evaluator Resolution Message

`GET /api/risk/claims/:id/resolve-proof?decision=refund`

Typical response shape:

```json
{
  "claim_id": 5,
  "protected_purchase_id": 6,
  "evaluator_address": "0x9fD22B0A6c66256a9D63bEBcdb9eeB25f34f8D87",
  "decision": "refund",
  "decision_reason": "signature-path-validation",
  "decision_reason_hash": "0x...",
  "message": "Civilis Risk OS Evaluator Resolution\nclaimId:5\nprotectedPurchaseId:6\n..."
}
```

This endpoint exists so an external integrator can ask the configured evaluator
wallet to sign a deterministic resolution message instead of relying only on a
server-side evaluator token.

## 5. Resolve The Claim As The Evaluator

`POST /api/risk/claims/:id/resolve`

```json
{
  "decision": "refund",
  "decisionReason": "The delivered intel was not reliable enough for protected settlement."
}
```

Typical response shape:

```json
{
  "success": true,
  "claimId": 3,
  "decision": "refund",
  "protectedPurchaseStatus": "refunded",
  "acpJobStatus": "rejected"
}
```

Evaluator-side proof is also required by default. In the strict mainnet-backed
proof environment, send:

- header: `x-civilis-risk-evaluator-token: <token>`

Or, for a wallet-bound integration:

- header: `x-civilis-risk-evaluator-signature: <signature>`

Release uses the same endpoint with:

```json
{
  "decision": "release",
  "decisionReason": "The delivered intel met the protected quality threshold."
}
```

## 6. Query The Protected Purchase State

`GET /api/risk/purchases/:id`

Typical response fields:

- `status`
- `principal_amount`
- `premium_amount`
- `challenge_deadline`
- `acp_job_id`
- `evaluator_address`
- `claim`

This is the aggregation surface used by the judge-facing proof console.

## Evidence Note

The clean mainnet-backed proof loops documented in this repo correspond to:

- refund path:
  - quote `11`
  - protected purchase `3`
  - local ACP job `4`
  - on-chain job `1955`
- release path:
  - quote `13`
  - protected purchase `4`
  - local ACP job `5`
  - on-chain job `1956`
- wallet-signature-bound evaluator refund validation:
  - quote `19`
  - protected purchase `6`
  - local ACP job `8`
  - on-chain job `1959`
  - claim `5`
  - later quote `20`
- clean proof rerun with buyer claim-proof surface:
  - quote `21`
  - protected purchase `7`
  - local ACP job `9`
  - on-chain job `1960`
  - claim `6`
- public external-consumer quickstart full loop:
  - quote `23`
  - protected purchase `8`
  - local ACP job `10`
  - on-chain job `1961`
  - claim `7`
  - later quote `24`

See:

- [Skills Arena Evidence](skills-arena-risk-os-evidence.md)
- [Mainnet Evidence](mainnet-evidence.md)
