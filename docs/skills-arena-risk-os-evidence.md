# Civilis Risk OS Evidence

This document collects the judge-facing evidence for the Build X Season 2
Skills Arena submission artifact: **Civilis Risk OS**.

It focuses on one narrow reference integration:

- domain: `intel_purchase`
- buyer actor: `oracle`
- seller actor: `fox`
- protection mode: `challengeable`
- evaluator path: shared ACP evaluator

It should be read together with:

- [Submission Reference](submission-reference.md)
- [Mainnet Evidence](mainnet-evidence.md)
- [Protocol Boundaries](protocol-boundaries.md)

## Submission Thesis

Civilis Risk OS upgrades an intel transaction from merely payable to:

- risk-quoted
- challengeable
- releasable after evaluator approval
- refundable
- trust-repriced after the outcome

The strongest current proof is now a paired mainnet-backed set that reaches:

`quote -> challengeable buy -> claim -> refund -> later quote repricing`

and

`quote -> challengeable buy -> claim -> release -> later quote repricing`

## Reference Actors

The clean proof loops used the following staged submission actors:

| Role | Agent | Wallet / Address |
| --- | --- | --- |
| buyer | `oracle` | `0x12cbe62954e39b7149534edd41822e3daca7d6ba` |
| buyer | `sage` | `0x3dba0d4e682be54be41b48cbe9572a81d14e94c9` |
| seller | `fox` | `0x4f5dc690f366116bf6bc22f29e44f8d141bf38de` |
| evaluator | ACP evaluator | `0x9fD22B0A6c66256a9D63bEBcdb9eeB25f34f8D87` |

These are submission-scoped proof actors. They are not presented as replacing
the canonical Season 1 live agent wallets in the broader Civilis world.

## Clean Mainnet Proof Loops

### Refund Loop

### 1. Risk Quote

- intel item id: `7`
- quote id: `11`
- seller risk score: `76`
- recommended mode: `challengeable`
- premium amount: `0.012500`
- claim window seconds: `3600`

Quote reasons:

- `seller_has_fake_history`
- `seller_validation_score_low`
- `seller_credit_below_neutral`

### 2. Protected Buy

The challengeable protected purchase succeeded on mainnet.

- protected purchase id: `3`
- local ACP job id: `4`
- on-chain job id: `1955`
- funded / submitted tx: `0xac33ab277d289ec08a8f202e766c6394840aadbaee3cf3b5e290bd5e7ca58ecc`

Resulting protected purchase state:

- status: `challenge_window`
- principal amount: `0.250000`
- premium amount: `0.012500`

### 3. Claim

A claim was filed during the challenge window.

- claim id: `3`
- claim type: `misleading_or_invalid_intel`
- claimant: `oracle`

### 4. Refund Resolution

The evaluator resolved the claim to `refund`.

- resolution tx: `0x0d943594e006228b83f2fc45fdab1f6322e36ee1e6143d593f6c6b63b5175263`
- local claim status: `resolved`
- local protected purchase status: `refunded`
- local ACP job status: `rejected`

### 5. On-Chain ACP State

The on-chain `getJob(1955)` read confirms:

- client: `0x12cbe62954e39b7149534edd41822e3daca7d6ba`
- provider: `0x4f5dc690f366116bf6bc22f29e44f8d141bf38de`
- evaluator: `0x9fD22B0A6c66256a9D63bEBcdb9eeB25f34f8D87`
- description: `intel_buy_7_behavior_pattern`
- budget: `0.25`
- status: `4` (`rejected`)

### 6. Event Evidence

The same resolution tx emitted:

- `JobRejected` for job `1955`
- `Refunded` for job `1955`

Observed `Refunded` event semantics:

- client topic matches `0x12cbe62954e39b7149534edd41822e3daca7d6ba`
- refund amount data decodes to `250000` base units, i.e. `0.25` USDT

### 7. Buyer Balance Check

The buyer wallet used for the clean rerun returned to its clean starting balance
after the refund:

- buyer wallet: `0x12cbe62954e39b7149534edd41822e3daca7d6ba`
- final balance after the loop: `2.0` USDT

This matters because it distinguishes the clean proof loop from earlier test
runs that were affected by pre-fix local persistence bugs.

### 8. Repricing Proof

After the refund was resolved, a later quote for the same seller returned:

- quote id: `12`
- seller risk score: `91`

The reasons now include:

- `seller_claim_refund_rate_elevated`

This is the core proof that a protected-commerce outcome changes future risk
pricing rather than remaining a one-off refund event.

### Release Loop

### 1. Risk Quote

- buyer actor: `sage`
- quote id: `13`
- seller risk score: `91`
- recommended mode: `challengeable`
- premium amount: `0.012500`
- claim window seconds: `3600`

Quote reasons:

- `seller_has_fake_history`
- `seller_validation_score_low`
- `seller_claim_refund_rate_elevated`
- `seller_credit_below_neutral`

### 2. Protected Buy

The second challengeable protected purchase also succeeded on mainnet.

- protected purchase id: `4`
- local ACP job id: `5`
- on-chain job id: `1956`
- funded tx: `0x092af96f5cd02bd7690103b0dbbd5681b6057dc7ec7ed5b34bc3d854ab324535`

Resulting protected purchase state before resolution:

- status: `challenge_window`
- principal amount: `0.250000`
- premium amount: `0.012500`

### 3. Claim

A second claim was filed and then resolved to demonstrate the clean release
path.

- claim id: `4`
- claim type: `misleading_or_invalid_intel`
- claimant: `sage`

### 4. Release Resolution

The evaluator resolved the claim to `release`.

- resolution tx: `0x3d6a7cc98592ff9b814dc315fd23458998c54b2a89795c7ad1f26939b85f5d1c`
- local claim status: `resolved`
- local protected purchase status: `released`
- local ACP job status: `completed`

### 5. On-Chain ACP State

The on-chain `getJob(1956)` read confirms:

- client: `0x3dba0d4e682be54be41b48cbe9572a81d14e94c9`
- provider: `0x4f5dc690f366116bf6bc22f29e44f8d141bf38de`
- evaluator: `0x9fD22B0A6c66256a9D63bEBcdb9eeB25f34f8D87`
- description: `intel_buy_7_behavior_pattern`
- budget: `0.25`
- status: `3` (`completed`)

### 6. Event Evidence

The release resolution tx emitted:

- `JobCompleted` for job `1956`
- `PaymentReleased` for job `1956`

Observed `PaymentReleased` semantics:

- provider topic matches `0x4f5dc690f366116bf6bc22f29e44f8d141bf38de`
- provider amount decodes to `250000` base units, i.e. `0.25` USDT
- fee amount decodes to `0`

### 7. Balance Check

The release-path buyer and seller balances align with the protected-settlement
story:

- buyer wallet: `0x3dba0d4e682be54be41b48cbe9572a81d14e94c9`
- buyer balance moved from `9.75` USDT to `9.5` USDT
- seller wallet: `0x4f5dc690f366116bf6bc22f29e44f8d141bf38de`
- seller balance moved from `10.0` USDT to `10.25` USDT

### 8. Repricing Proof

After the release was resolved, a later quote for the same seller returned:

- quote id: `14`
- seller risk score: `79`

This matters because it shows the release path does not erase the prior refund
history, but it does move pricing back down after a clean successful outcome.

## Local Persistence Proof

After the refund path completed:

- `purchase_claims.id = 3` shows `status = resolved`, `decision = refund`
- `protected_intel_purchases.id = 3` shows `status = refunded`
- `acp_jobs.id = 4` shows `status = rejected`

After the release path completed:

- `purchase_claims.id = 4` shows `status = resolved`, `decision = release`
- `protected_intel_purchases.id = 4` shows `status = released`
- `acp_jobs.id = 5` shows `status = completed`

That local state is aligned with the on-chain job states and event evidence for
jobs `1955` and `1956`.

## Evidence Boundary

This document supports these claims:

- challengeable protected intel purchases are implemented
- clean refund and release paths have mainnet-backed proof
- resolved refund and release outcomes both change later pricing

This document does **not** support stronger claims such as:

- generalized protection for every market type
- partial refunds
- decentralized arbitration
- premium-backed underwriting reserves
- a fully wallet-signature-bound evaluator authorization model

## Recommended Public Citation Pair

If only two tx hashes can be shown for the Skills Arena Risk OS loop, use:

- protected buy: `0xac33ab277d289ec08a8f202e766c6394840aadbaee3cf3b5e290bd5e7ca58ecc`
- protected refund: `0x0d943594e006228b83f2fc45fdab1f6322e36ee1e6143d593f6c6b63b5175263`

If four tx hashes can be shown, add:

- protected buy: `0x092af96f5cd02bd7690103b0dbbd5681b6057dc7ec7ed5b34bc3d854ab324535`
- protected release: `0x3d6a7cc98592ff9b814dc315fd23458998c54b2a89795c7ad1f26939b85f5d1c`
