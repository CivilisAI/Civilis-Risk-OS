# Civilis Risk OS API Examples

These examples show the current **judge-facing Skill surface** used in the
reference Intel Market integration.

They are intentionally narrow. The current submission claim is the protection
pattern, not that every commerce surface is already generalized.

Before using the examples below, read:

- [Proof Surface Matrix](proof-surface-matrix.md)
- [Championship Replay Mode](championship-replay-mode.md)

## Canonical Replay Contract

The default replay contract for this repo is:

- use the canonical actors `sage`, `fox`, and `arbiter`
- prefer the canonical replay path `16 -> 34 -> 11 -> 10 -> 36` when citing the
  strongest historical proof
- use claimant and evaluator tokens in the strict proof environment unless a
  role-specific wallet-signature capture is explicitly available

In other words:

- token-gated claim / resolve is the current canonical replay path
- deterministic `claim-proof` and `resolve-proof` messages are real product
  surfaces
- generic buyer wallet-signature proof is **not** claimed as captured public
  proof

## 1. Quote An Intel Purchase Before Buying

`POST /api/risk/quote/intel`

```json
{
  "intelItemId": 16,
  "buyerAgentId": "sage"
}
```

Typical response shape:

```json
{
  "quote_id": 34,
  "intel_item_id": 16,
  "buyer_agent_id": "sage",
  "seller_agent_id": "fox",
  "risk_score": 74,
  "recommended_mode": "challengeable",
  "premium_bps": 500,
  "premium_amount": "0.012500",
  "claim_window_seconds": 3600,
  "reasons": [
    "seller_has_fake_history",
    "seller_validation_score_low",
    "seller_credit_below_neutral"
  ],
  "expires_at": "2026-04-13T10:59:48.506Z"
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
  "buyerAgentId": "sage",
  "purchaseMode": "challengeable",
  "quoteId": 34
}
```

Typical response shape:

```json
{
  "success": true,
  "settlementMode": "acp_funded",
  "purchaseMode": "challengeable",
  "acpJobId": 13,
  "onChainJobId": 2030,
  "onChainTxHash": "0x3626e79f734b6708d357e3556353617d4600bbb5d859ff47d1dc6846b76479fa",
  "protected_purchase_id": 11,
  "quote_id": 34,
  "intel_item_id": 16,
  "buyer_agent_id": "sage",
  "seller_agent_id": "fox",
  "status": "challenge_window",
  "principal_amount": "0.250000",
  "premium_amount": "0.012500",
  "evaluator_address": "0x400ea2f2af2732c4e2af9fb2f8616468ad49023d",
  "challenge_deadline": "2026-04-13T11:45:18.000Z",
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
  "protected_purchase_id": 11,
  "claimant_agent_id": "sage",
  "claimant_address": "0x3Dba0d4e682bE54Be41b48cbe9572A81d14E94c9",
  "claim_type": "misleading_or_invalid_intel",
  "reason_text": "authenticated-canonical-claim",
  "reason_text_hash": "0xeb559304e8deb20ef45a0315b58376b3f84355e402c3e752178b14f491304771",
  "message": "Civilis Risk OS Claim Creation\nprotectedPurchaseId:11\nclaimantAgentId:sage\n..."
}
```

This endpoint exists so an external buyer integration can bind claim creation to
the protected purchase buyer wallet instead of relying only on the proof
environment claimant token.

`POST /api/risk/claims`

```json
{
  "protectedPurchaseId": 11,
  "claimType": "misleading_or_invalid_intel",
  "reasonText": "Seller claim did not match observed outcome"
}
```

Typical response shape:

```json
{
  "claim_id": 10,
  "protected_purchase_id": 11,
  "claimant_agent_id": "sage",
  "claim_type": "misleading_or_invalid_intel",
  "status": "open",
  "reason_text": "Seller claim did not match observed outcome",
  "decision": null,
  "decision_reason": null,
  "evaluator_address": "0x400ea2f2af2732c4e2af9fb2f8616468ad49023d",
  "created_at": "2026-04-13T10:45:55.000Z",
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
  "claim_id": 10,
  "protected_purchase_id": 11,
  "evaluator_address": "0x400ea2f2af2732c4e2af9fb2f8616468ad49023d",
  "decision": "refund",
  "decision_reason": "canonical-replay-refund",
  "decision_reason_hash": "0x...",
  "message": "Civilis Risk OS Evaluator Resolution\nclaimId:10\nprotectedPurchaseId:11\n..."
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
  "claimId": 10,
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

The current canonical replay path documented in this repo corresponds to:

- staged intel item `16`
- quote `34`
- protected purchase `11`
- local ACP job `13`
- on-chain job `2030`
- funded principal tx `0x3626e79f734b6708d357e3556353617d4600bbb5d859ff47d1dc6846b76479fa`
- delivery submit tx `0x813b673060e0d0f7d88ebd466801049c76b662297820a6f23a066773b32d0260`
- claim `10`
- reject + refund tx `0xc857156addb058461cb0eb04647eb896a3db54185e2fbcd09dd295b1bf236929`
- later quote `36`

Historical complementary loops remain documented elsewhere in this repo:

- clean refund loop `11 -> 3 -> 1955`
- clean release loop `13 -> 4 -> 1956`
- evaluator wallet-signature validation loop `19 -> 6 -> 1959`

See:

- [Skills Arena Evidence](skills-arena-risk-os-evidence.md)
- [Mainnet Evidence](mainnet-evidence.md)
