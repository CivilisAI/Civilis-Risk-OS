# Replay Lanes

This document separates the canonical replay into two role-scoped lanes so the
submission reads more like a reusable Skill and less like a single operator
console.

## Canonical Actors

- buyer: `sage` / `0x3dba0d4e682be54be41b48cbe9572a81d14e94c9`
- seller: `fox` / `0x4f5dc690f366116bf6bc22f29e44f8d141bf38de`
- evaluator: `arbiter` / `0x400ea2f2af2732c4e2af9fb2f8616468ad49023d`

## Buyer Replay

The buyer lane owns:

1. quote the seller risk
2. choose `challengeable`
3. execute the protected buy
4. fetch `claim-proof`
5. file the authenticated claim

Minimal buyer-facing env:

- `RISK_OS_BASE_URL`
- `RISK_OS_INTEL_ITEM_ID`
- `RISK_OS_BUYER_AGENT_ID=sage`
- `RISK_OS_CLAIMANT_TOKEN` in the strict proof environment

Typical commands:

```bash
RISK_OS_ACTION=quote node examples/external-consumer-quickstart.mjs
RISK_OS_ACTION=quote-buy node examples/external-consumer-quickstart.mjs
RISK_OS_ACTION=claim-proof node examples/external-consumer-quickstart.mjs
RISK_OS_ACTION=claim node examples/external-consumer-quickstart.mjs
```

Buyer lane canonical anchor:

- item `16`
- quote `34`
- purchase `11`
- claim `10`

## Evaluator Replay

The evaluator lane starts only after a buyer claim exists.

The evaluator lane owns:

1. fetch `resolve-proof`
2. decide `release` or `refund`
3. trigger the final settlement outcome
4. confirm the later repriced quote

Minimal evaluator-facing env:

- `RISK_OS_BASE_URL`
- `RISK_OS_CLAIM_ID`
- `RISK_OS_EVALUATOR_TOKEN` in the strict proof environment

Typical commands:

```bash
RISK_OS_ACTION=resolve-proof node examples/external-consumer-quickstart.mjs
RISK_OS_ACTION=resolve node examples/external-consumer-quickstart.mjs
RISK_OS_ACTION=quote node examples/external-consumer-quickstart.mjs
```

Evaluator lane canonical anchor:

- claim `10`
- later quote `36`
- reject/refund tx:
  `0xc857156addb058461cb0eb04647eb896a3db54185e2fbcd09dd295b1bf236929`

## Why This Split Matters

This role split helps reviewers see:

- the buyer does not also act as evaluator
- proof preparation and proof execution are separate
- the same Skill can be understood as two cooperating agent lanes

That is the correct way to read Civilis Risk OS as agent infrastructure.
