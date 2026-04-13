# Championship Replay Mode

This document turns the submission into a low-friction judge replay path.

The goal is simple:

**let a reviewer reproduce the same protected-commerce story with the smallest
possible number of decisions.**

For the proof-boundary view of this same flow, see
[Proof Surface Matrix](proof-surface-matrix.md).

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
| evaluator | `arbiter` | `0x400ea2f2af2732c4e2af9fb2f8616468ad49023d` |

## Canonical Historical Proof Path

The strongest historical proof path currently captured in this repo is:

- replay intel item: `16`
- initial quote after staging: `34`
- canonical protected purchase after buy: `11`
- canonical authenticated claim after buy: `10`
- local ACP job id: `13`
- on-chain job id: `2030`
- funded principal tx: `0x3626e79f734b6708d357e3556353617d4600bbb5d859ff47d1dc6846b76479fa`
- delivery submit tx: `0x813b673060e0d0f7d88ebd466801049c76b662297820a6f23a066773b32d0260`
- reject + refund tx: `0xc857156addb058461cb0eb04647eb896a3db54185e2fbcd09dd295b1bf236929`
- later quote after refund: `36`
- canonical claim type: `misleading_or_invalid_intel`
- canonical settlement mode: `challengeable`
- seller risk: `74 -> 89`

Those ids are useful for understanding the evidence pack.

For a **fresh replay**, do not assume the same item id still exists in the live
proof environment.

## Replay Sequence

This is the **default judge replay**. Treat everything below as the main
submission path.

1. Quote the seller risk
2. Execute the challengeable protected buy
3. Attempt an unauthenticated claim and confirm it is rejected with `403`
4. Fetch the buyer claim-proof message
5. File an authenticated claim
6. Fetch the evaluator resolve-proof message
7. Resolve to `refund`
8. Refresh the later quote and confirm repricing

## Fastest Local Replay

### Step 1. Restage a fresh replay item

From the working Civilis repo, run the reference staging script and copy the
returned `intelItemId`.

Reference file:

- [../reference/server/scripts/stage-risk-os-demo.ts](../reference/server/scripts/stage-risk-os-demo.ts)

This is the safest path because the strict proof environment may not preserve a
historical replay item forever.

Important boundary:

- this script is intended for the maintained proof environment where the buyer
  and seller Agentic Wallet env vars are already configured
- it is a **reference replay aid**, not a promise that any anonymous reviewer
  can restage the exact same actors without the matching private environment

### Step 2. Set the replay env

Set:

- `RISK_OS_BASE_URL`
- `RISK_OS_INTEL_ITEM_ID=<fresh staged intelItemId>`
- `RISK_OS_BUYER_AGENT_ID=sage`

Then use the quickstart script:

```bash
node examples/external-consumer-quickstart.mjs
```

### Step 3. Run the quote or protected buy

First, capture a fresh quote if you want to see the current seller risk:

```bash
RISK_OS_ACTION=quote node examples/external-consumer-quickstart.mjs
```

For the protected buy:

```bash
RISK_OS_ACTION=quote-buy node examples/external-consumer-quickstart.mjs
```

Copy the returned `protected_purchase_id`.

Canonical historical example:

- `protected_purchase_id = 11`

### Step 4. Fetch the buyer claim-proof

```bash
RISK_OS_ACTION=claim-proof \
RISK_OS_PROTECTED_PURCHASE_ID=<protected_purchase_id_from_quote_buy> \
RISK_OS_CLAIM_REASON=authenticated-canonical-claim \
node examples/external-consumer-quickstart.mjs
```

Canonical historical example:

- `reason_text_hash = 0xeb559304e8deb20ef45a0315b58376b3f84355e402c3e752178b14f491304771`

### Step 5. Confirm the unauthenticated rejection

```bash
RISK_OS_ACTION=claim \
RISK_OS_PROTECTED_PURCHASE_ID=<protected_purchase_id_from_quote_buy> \
RISK_OS_CLAIM_REASON=unauthenticated-claim-check \
node examples/external-consumer-quickstart.mjs
```

Expected result:

- HTTP `403`
- error: `A valid claimant auth token or claimant signature is required`

### Step 6. File the authenticated claim

```bash
RISK_OS_ACTION=claim \
RISK_OS_PROTECTED_PURCHASE_ID=<protected_purchase_id_from_quote_buy> \
RISK_OS_CLAIM_REASON=authenticated-canonical-claim \
RISK_OS_CLAIMANT_TOKEN=<token> \
node examples/external-consumer-quickstart.mjs
```

Copy the returned `claim_id`.

Canonical historical example:

- `claim_id = 10`

### Step 7. Fetch the evaluator resolve-proof

```bash
RISK_OS_ACTION=resolve-proof \
RISK_OS_CLAIM_ID=<claim_id_from_claim> \
RISK_OS_RESOLUTION_DECISION=refund \
RISK_OS_RESOLUTION_REASON=canonical-replay-refund \
node examples/external-consumer-quickstart.mjs
```

### Step 8. Resolve to refund

```bash
RISK_OS_ACTION=resolve \
RISK_OS_CLAIM_ID=<claim_id_from_claim> \
RISK_OS_RESOLUTION_DECISION=refund \
RISK_OS_RESOLUTION_REASON=canonical-replay-refund \
RISK_OS_EVALUATOR_TOKEN=<token> \
node examples/external-consumer-quickstart.mjs
```

## Proof Facts Already Captured

The strongest canonical replay path currently evidenced in this repo is:

- quote `34`
- protected purchase `11`
- local ACP job `13`
- on-chain job `2030`
- funded principal tx `0x3626e79f734b6708d357e3556353617d4600bbb5d859ff47d1dc6846b76479fa`
- delivery submit tx `0x813b673060e0d0f7d88ebd466801049c76b662297820a6f23a066773b32d0260`
- unauthenticated claim rejected with `403`
- authenticated claim `10`
- evaluator refund resolution via `arbiter`
- settlement tx `0xc857156addb058461cb0eb04647eb896a3db54185e2fbcd09dd295b1bf236929`
- later quote `36`
- seller risk `74 -> 89`

This is the shortest path that simultaneously proves:

- protected buy
- independent buyer / seller / evaluator Agentic Wallet actors
- default auth hardening
- buyer-side claim-proof surface
- evaluator resolution
- post-outcome repricing

When replaying locally, prefer a **fresh staged item** over hardcoding `16`.
Treat `16 -> 34 -> 11 -> 10 -> 36` as the strongest historical evidence path,
not as a guaranteed evergreen runtime path.

## Optional Portability Check

If a reviewer wants one extra proof that Risk OS is not trapped inside Intel
Market, run the second adapter example after the default replay:

- [The Square paywalled intel unlock adapter](second-adapter-paywalled-intel-unlock.md)

This is intentionally secondary. The judge should understand the main
submission without needing to run it.

Additional depth already captured in this repo:

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
