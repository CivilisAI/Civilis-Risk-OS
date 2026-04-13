# External Consumer Schema

This is the shortest possible schema summary for an external integrator.

Use it when you want to understand the Risk OS contract **without** reading the
full evidence pack first.

## Canonical Roles

| Role | Purpose | Canonical actor |
| --- | --- | --- |
| buyer | requests quote, executes protected buy, files claim | `sage` |
| seller | delivers the protected intel item | `fox` |
| evaluator | resolves the claim to `release` or `refund` | `arbiter` |

## Canonical Flow

`quote -> challengeable buy -> claim-proof -> claim -> resolve-proof -> resolve -> later re-quote`

## Core Endpoints

| Endpoint | Actor | Purpose |
| --- | --- | --- |
| `POST /api/risk/quote/intel` | buyer | quote seller risk before purchase |
| `POST /api/intel/items/:id/buy` | buyer | execute `challengeable` protected buy |
| `GET /api/risk/purchases/:id/claim-proof` | buyer | prepare deterministic buyer claim message |
| `POST /api/risk/claims` | buyer | create claim during challenge window |
| `GET /api/risk/claims/:id/resolve-proof` | evaluator | prepare deterministic evaluator resolution message |
| `POST /api/risk/claims/:id/resolve` | evaluator | resolve to `release` or `refund` |
| `GET /api/risk/purchases/:id` | any consumer | fetch aggregated protected purchase state |

## Required Inputs

### Quote

```json
{
  "intelItemId": 16,
  "buyerAgentId": "sage"
}
```

### Protected buy

```json
{
  "buyerAgentId": "sage",
  "purchaseMode": "challengeable",
  "quoteId": 34
}
```

### Claim

```json
{
  "protectedPurchaseId": 11,
  "claimType": "misleading_or_invalid_intel",
  "reasonText": "Seller claim did not match observed outcome"
}
```

### Resolve

```json
{
  "decision": "refund",
  "decisionReason": "The delivered intel was not reliable enough for protected settlement."
}
```

## Auth Surfaces

| Action | Canonical replay auth | Optional proof-prep surface |
| --- | --- | --- |
| buyer claim | `x-civilis-risk-claimant-token` | `x-civilis-risk-claimant-signature` |
| evaluator resolve | `x-civilis-risk-evaluator-token` | `x-civilis-risk-evaluator-signature` |

## Canonical Evidence Anchor

The strongest historical public replay currently anchored in this repo is:

- `16 -> 34 -> 11 -> 10 -> 36`
- funded principal:
  `0x3626e79f734b6708d357e3556353617d4600bbb5d859ff47d1dc6846b76479fa`
- delivery submit:
  `0x813b673060e0d0f7d88ebd466801049c76b662297820a6f23a066773b32d0260`
- reject/refund:
  `0xc857156addb058461cb0eb04647eb896a3db54185e2fbcd09dd295b1bf236929`

## Boundaries

- This schema proves one live protected commerce pattern on Intel Market.
- It also supports a second portability adapter, but does **not** claim a
  second live mainnet settlement loop.
- Generic buyer wallet-signature capture for arbitrary claim payloads is still
  **not claimed** as captured public proof.
