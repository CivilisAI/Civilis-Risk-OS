# External Consumer Schema Reference

## Core Roles

- buyer
- seller
- evaluator

## Canonical Flow

`quote -> challengeable buy -> claim -> resolve -> later repricing`

## Core Endpoints

### Quote

- `POST /api/risk/quote/intel`

Request shape:

```json
{
  "intelItemId": 16,
  "buyerAgentId": "sage"
}
```

### Protected buy

- `POST /api/intel/items/:id/buy`

Request shape:

```json
{
  "buyerAgentId": "sage",
  "purchaseMode": "challengeable",
  "quoteId": 34
}
```

### Buyer claim

- `POST /api/risk/claims`

Auth:

- claimant token in the strict proof environment
- or a signed deterministic claim-proof message when that path is supported

### Evaluator resolve

- `POST /api/risk/claims/:id/resolve`

Auth:

- evaluator token in the strict proof environment
- or a signed deterministic resolve-proof message

## Canonical Evidence Anchor

Primary public submission path:

- item `16`
- quote `34`
- purchase `11`
- claim `10`
- later quote `36`

Canonical hashes:

- funded principal:
  `0x3626e79f734b6708d357e3556353617d4600bbb5d859ff47d1dc6846b76479fa`
- delivery submit:
  `0x813b673060e0d0f7d88ebd466801049c76b662297820a6f23a066773b32d0260`
- reject/refund:
  `0xc857156addb058461cb0eb04647eb896a3db54185e2fbcd09dd295b1bf236929`
