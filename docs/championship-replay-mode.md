# Championship Replay Mode

This document turns the submission into a low-friction judge replay path.

The goal is simple:

**let a reviewer reproduce the same protected-commerce story with the smallest
possible number of decisions.**

## What Replay Mode Optimizes For

- deterministic proof actors
- one reference intel item
- one protected flow
- one claim type
- one evaluator decision at a time
- one clear post-outcome repricing check

This is intentionally narrower than a production integration guide.

## Canonical Proof Actors

| Role | Actor | Address |
| --- | --- | --- |
| buyer | `sage` | `0x3dba0d4e682be54be41b48cbe9572a81d14e94c9` |
| seller | `fox` | `0x4f5dc690f366116bf6bc22f29e44f8d141bf38de` |
| evaluator | ACP evaluator | `0x9fD22B0A6c66256a9D63bEBcdb9eeB25f34f8D87` |

## Canonical Replay Item

- latest verified replay item: `12`
- canonical claim type: `misleading_or_invalid_intel`
- canonical settlement mode: `challengeable`

## Replay Sequence

1. Quote the seller risk
2. Execute the challengeable protected buy
3. Fetch the buyer claim-proof message
4. File a claim
5. Fetch the evaluator resolve-proof message
6. Resolve to `refund` or `release`
7. Refresh the later quote

## Fastest Local Replay

Set:

- `RISK_OS_BASE_URL`
- `RISK_OS_INTEL_ITEM_ID=12`
- `RISK_OS_BUYER_AGENT_ID=sage`

Then use the quickstart script:

```bash
node examples/external-consumer-quickstart.mjs
```

For the protected buy:

```bash
RISK_OS_ACTION=quote-buy node examples/external-consumer-quickstart.mjs
```

For the buyer claim-proof:

```bash
RISK_OS_ACTION=claim-proof \
RISK_OS_PROTECTED_PURCHASE_ID=8 \
RISK_OS_CLAIM_REASON=claim-proof-path \
node examples/external-consumer-quickstart.mjs
```

For a claimant-token-backed claim:

```bash
RISK_OS_ACTION=claim \
RISK_OS_PROTECTED_PURCHASE_ID=8 \
RISK_OS_CLAIM_REASON=quickstart-token-claim \
RISK_OS_CLAIMANT_TOKEN=<token> \
node examples/external-consumer-quickstart.mjs
```

For evaluator resolve-proof:

```bash
RISK_OS_ACTION=resolve-proof \
RISK_OS_CLAIM_ID=7 \
RISK_OS_RESOLUTION_DECISION=refund \
RISK_OS_RESOLUTION_REASON=quickstart-proof \
node examples/external-consumer-quickstart.mjs
```

For evaluator resolution:

```bash
RISK_OS_ACTION=resolve \
RISK_OS_CLAIM_ID=7 \
RISK_OS_RESOLUTION_DECISION=refund \
RISK_OS_RESOLUTION_REASON=quickstart-proof \
RISK_OS_EVALUATOR_TOKEN=<token> \
node examples/external-consumer-quickstart.mjs
```

## Proof Facts Already Captured

The strongest clean loops currently evidenced in this repo are:

- refund loop:
  - quote `11`
  - protected purchase `3`
  - on-chain job `1955`
- release loop:
  - quote `13`
  - protected purchase `4`
  - on-chain job `1956`
- evaluator signature depth:
  - quote `19`
  - protected purchase `6`
  - on-chain job `1959`
- buyer claim-proof depth:
  - quote `21`
  - protected purchase `7`
  - on-chain job `1960`
- public quickstart depth:
  - quote `23`
  - protected purchase `8`
  - on-chain job `1961`

See:

- [Skills Arena Evidence](skills-arena-risk-os-evidence.md)
- [Mainnet Evidence](mainnet-evidence.md)
- [API Examples](api-examples.md)
