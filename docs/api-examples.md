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
  "purchaseMode": "challengeable",
  "protectedPurchaseId": 3,
  "intelPurchaseId": 6,
  "principalAcpJobId": 4,
  "challengeDeadline": "2026-04-13T17:03:08.477Z",
  "content": {
    "title": "Behavior Pattern Intel",
    "category": "behavior_pattern"
  }
}
```

## 3. File A Claim During The Challenge Window

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
  "claim": {
    "claim_id": 3,
    "status": "open",
    "claim_type": "misleading_or_invalid_intel"
  },
  "purchase": {
    "protected_purchase_id": 3,
    "status": "claimed"
  }
}
```

## 4. Resolve The Claim As The Evaluator

`POST /api/risk/claims/:id/resolve`

```json
{
  "decision": "refund",
  "decisionReason": "The delivered intel was not reliable enough for protected settlement.",
  "evaluatorAddress": "0x9fD22B0A6c66256a9D63bEBcdb9eeB25f34f8D87"
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

Release uses the same endpoint with:

```json
{
  "decision": "release",
  "decisionReason": "The delivered intel met the protected quality threshold.",
  "evaluatorAddress": "0x9fD22B0A6c66256a9D63bEBcdb9eeB25f34f8d87"
}
```

## 5. Query The Protected Purchase State

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

See:

- [Skills Arena Evidence](skills-arena-risk-os-evidence.md)
- [Mainnet Evidence](mainnet-evidence.md)
