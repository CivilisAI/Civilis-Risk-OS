# Civilis Risk OS Evidence

This document collects the judge-facing evidence for the Build X Season 2
Skills Arena submission artifact: **Civilis Risk OS**.

It focuses on one narrow reference integration:

- domain: `intel_purchase`
- buyer actor: `sage`
- seller actor: `fox`
- protection mode: `challengeable`
- evaluator path: staged `arbiter` Agentic Wallet

It should be read together with:

- [Submission Reference](submission-reference.md)
- [Mainnet Evidence](mainnet-evidence.md)
- [Second Adapter: The Square Paywalled Intel Unlock](second-adapter-paywalled-intel-unlock.md)
- [Protocol Boundaries](protocol-boundaries.md)

## Submission Thesis

Civilis Risk OS upgrades an intel transaction from merely payable to:

- risk-quoted
- challengeable
- releasable after evaluator approval
- refundable
- trust-repriced after the outcome

The strongest current proof is now a canonical independent-wallet replay that reaches:

`quote -> challengeable buy -> unauthenticated claim rejected -> authenticated claim -> refund -> later quote repricing`

It also preserves historical complementary depth for:

`quote -> challengeable buy -> claim -> release -> later quote repricing`

It also includes a stricter external-integration proof:

`quote -> challengeable buy -> claim -> resolve-proof message -> evaluator wallet signature -> refund -> later quote repricing`

And a buyer-side proof surface for external integrations:

`quote -> challengeable buy -> claim-proof message -> claim -> evaluator resolution`

It now also includes a pure external-consumer replay:

`public quickstart script -> quote -> challengeable buy -> claim-proof -> claim -> resolve-proof -> refund -> later quote repricing`

And an auth-hardening replay:

`quote -> challengeable buy -> unauthenticated claim rejected -> authenticated claim -> refund -> later quote repricing`

The repo also now includes a second lightweight reference adapter for a
different commerce surface:

`The Square paywalled intel unlock -> adapter normalization -> Risk OS protection pattern`

This second adapter is intentionally not claimed as a second live mainnet-proved
integration.

## Reference Actors

The strongest current replay uses the following staged submission actors:

| Role | Agent | Wallet / Address |
| --- | --- | --- |
| buyer | `sage` | `0x3dba0d4e682be54be41b48cbe9572a81d14e94c9` |
| seller | `fox` | `0x4f5dc690f366116bf6bc22f29e44f8d141bf38de` |
| evaluator | `arbiter` | `0x400ea2f2af2732c4e2af9fb2f8616468ad49023d` |

These are submission-scoped proof actors. They are not presented as replacing
the canonical Season 1 live agent wallets in the broader Civilis world.

## Canonical Independent-Wallet Replay

This is now the strongest single replay path in the repo. It uses the current
submission-scoped buyer, seller, and evaluator Agentic Wallet actors and keeps
the proof on one fresh staged intel item.

### 1. Staged Item And Initial Quote

- intel item id: `16`
- quote id: `34`
- buyer actor: `sage`
- seller actor: `fox`
- evaluator actor: `arbiter`
- seller risk score: `74`
- recommended mode: `challengeable`
- premium amount: `0.012500`
- claim window seconds: `3600`

Quote reasons:

- `seller_has_fake_history`
- `seller_validation_score_low`
- `seller_credit_below_neutral`

### 2. Protected Buy

- protected purchase id: `11`
- local ACP job id: `13`
- on-chain job id: `2030`
- funded principal tx: `0x3626e79f734b6708d357e3556353617d4600bbb5d859ff47d1dc6846b76479fa`
- delivery submit tx: `0x813b673060e0d0f7d88ebd466801049c76b662297820a6f23a066773b32d0260`

Observed protected purchase state before claim:

- status: `challenge_window`
- principal amount: `0.250000`
- premium amount: `0.012500`
- evaluator address: `0x400ea2f2af2732c4e2af9fb2f8616468ad49023d`

### 3. Buyer Claim-Proof And Auth Hardening

The buyer-side claim-proof surface returned a deterministic message for:

- protected purchase id: `11`
- claimant agent: `sage`
- claimant wallet: `0x3dba0d4e682bE54Be41b48cbe9572A81d14E94c9`
- reason text: `authenticated-canonical-claim`
- reason hash:
  `0xeb559304e8deb20ef45a0315b58376b3f84355e402c3e752178b14f491304771`

Then the unauthenticated claimant path was checked and rejected:

- unauthenticated claim status: `403`
- error: `A valid claimant auth token or claimant signature is required`

### 4. Authenticated Claim

- claim id: `10`
- protected purchase id: `11`
- claimant agent: `sage`
- claim type: `misleading_or_invalid_intel`
- reason text: `Seller claim did not match observed outcome`

### 5. Refund Resolution

- settlement tx: `0xc857156addb058461cb0eb04647eb896a3db54185e2fbcd09dd295b1bf236929`
- local protected purchase status: `refunded`
- local claim status: `resolved`
- local ACP job status: `rejected`
- evaluator wallet actor: `0x400ea2f2af2732c4e2af9fb2f8616468ad49023d`

### 6. Repricing Proof

After the refund outcome was written back, a later quote returned:

- quote id: `36`
- seller risk score: `89`

New quote reason:

- `seller_claim_refund_rate_elevated`

The protected purchase metadata also records:

- `repricingState = synced`

This is the strongest concise proof that:

- the buyer, seller, and evaluator are independent Agentic Wallet actors
- protected settlement does not end at payment
- unauthenticated claims are rejected by default
- authenticated claims and evaluator resolution change later pricing

## Historical Mainnet Proof Loops

### Historical Clean Refund Loop

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

### Historical Clean Release Loop

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

## Historical Wallet-Signature Evaluator Resolution Proof

This third loop exists to prove that evaluator resolution is not limited to the
server-side evaluator token in the proof environment.

### 1. Risk Quote

- buyer actor: `sage`
- intel item id: `10`
- quote id: `19`
- seller risk score: `71`
- recommended mode: `challengeable`
- premium amount: `0.012500`

### 2. Protected Buy

- protected purchase id: `6`
- local ACP job id: `8`
- on-chain job id: `1959`
- funded / submitted tx: `0xf77f8bbc5fa46c6da1f93076857823c5c1759025980f1639fab1f3b7c8086f76`

### 3. Claim

- claim id: `5`
- claimant: `sage`
- claim type: `misleading_or_invalid_intel`

### 4. Resolve-Proof Message

The submission exposes a deterministic evaluator message through:

- `GET /api/risk/claims/5/resolve-proof?decision=refund&decisionReason=signature-path-validation`

The proof payload identifies:

- claim id: `5`
- protected purchase id: `6`
- evaluator address: `0x9fD22B0A6c66256a9D63bEBcdb9eeB25f34f8D87`
- decision: `refund`

### 5. Wallet-Bound Evaluator Resolution

The returned message was signed with the ACP evaluator wallet key, and the
signature-backed resolve request succeeded without sending the evaluator token
header.

Observed proof facts:

- signing wallet: `0x9fD22B0A6c66256a9D63bEBcdb9eeB25f34f8D87`
- proof evaluator address: `0x9fD22B0A6c66256a9D63bEBcdb9eeB25f34f8D87`
- signature length: `132`
- resolve response status: `200`
- resolved decision: `refund`

### 6. Resulting State

After the signature-backed evaluator resolution:

- protected purchase `6` moved to `refunded`
- claim `5` moved to `resolved`
- local ACP job `8` moved to `rejected`

### 7. Repricing Proof

After the refund outcome was written back, a later quote for the same seller
returned:

- quote id: `20`
- seller risk score: `87`

This proves that the external-integration path still feeds the same risk
repricing loop as the core refund and release paths.

## Historical Buyer Claim-Proof Surface

This fourth proof does not yet claim a captured buyer wallet signature, but it
does prove that the submission now exposes a deterministic buyer-side
claim-preparation surface for an external integration.

### 1. Risk Quote

- buyer actor: `sage`
- intel item id: `11`
- quote id: `21`
- seller risk score: `72`
- recommended mode: `challengeable`

### 2. Protected Buy

- protected purchase id: `7`
- local ACP job id: `9`
- on-chain job id: `1960`
- funded / submitted tx: `0x8b0d5ffc9977b857e192a24f95fc9b7ea44b1d399bb328896f59d00fa5a9e2d1`

### 3. Claim-Proof Message

The submission now exposes:

- `GET /api/risk/purchases/7/claim-proof?claimType=misleading_or_invalid_intel&reasonText=claim-proof-path`

Observed proof facts:

- claimant agent: `sage`
- claimant wallet: `0x3dba0d4e682be54be41b48cbe9572a81d14e94c9`
- claim type: `misleading_or_invalid_intel`
- deterministic reason hash:
  `0xa9a34a43cec619554892b582165adb09cc16d72506c7b46ea0b2e8ed46ed3f46`

### 4. Claim Creation Regression Check

After the claim-proof surface was added, the strict token-gated claimant path
still succeeded for the same protected purchase:

- claim id: `6`
- protected purchase id: `7`
- claim type: `misleading_or_invalid_intel`
- claimant: `sage`

This matters because it shows the new buyer-side proof surface did not break the
existing strict proof environment.

## Historical Public External-Consumer Quickstart Proof

This fifth proof uses the standalone public script:

- `examples/external-consumer-quickstart.mjs`

It demonstrates that another agent application can drive the protected-commerce
loop without using the Civilis dashboard.

This section records the **historical quickstart capture**. For the freshest
canonical replay path, use [Championship Replay Mode](championship-replay-mode.md),
which now starts from a fresh staging step and anchors to the stronger
auth-hardened `27 -> 9 -> 8 -> 28` path.

### 1. Quote

The public quickstart script was run with:

- `RISK_OS_ACTION=quote`
- `RISK_OS_INTEL_ITEM_ID=12`
- `RISK_OS_BUYER_AGENT_ID=sage`

Observed result:

- quote id: `22`
- seller risk score: `72`
- recommended mode: `challengeable`

### 2. Challengeable Buy

The same quickstart script was then run with:

- `RISK_OS_ACTION=quote-buy`

Observed result:

- quote id: `23`
- protected purchase id: `8`
- local ACP job id: `10`
- on-chain job id: `1961`
- funded / submitted tx: `0xe2ec46b808757e6cbb2cc716bf13608e6e9246859a4dad4b0edaa477ec7889de`

### 3. Buyer Claim-Proof

The same public script was then used to fetch:

- `RISK_OS_ACTION=claim-proof`

Observed result:

- protected purchase id: `8`
- claimant agent: `sage`
- claimant wallet: `0x3dba0d4e682be54be41b48cbe9572a81d14e94c9`
- reason hash:
  `0x068f1edde1221da1ace9f3c24a0d55f0b63f3269f1c100020ebb557b7dae71ad`

### 4. Claim

The same public quickstart script then filed the claim with the strict proof
environment claimant token:

- claim id: `7`
- protected purchase id: `8`
- claimant agent: `sage`

### 5. Resolve-Proof And Refund Resolution

The same public quickstart script then fetched:

- evaluator resolve-proof for claim `7`

and completed a refund resolution through the evaluator token path.

Observed result:

- claim id: `7`
- decision: `refund`
- claim status: `resolved`

### 6. Later Quote Repricing

After the public quickstart refund loop completed, a later quote returned:

- quote id: `24`
- seller risk score: `88`

and the reasons now include:

- `seller_claim_refund_rate_elevated`

## Historical Auth-Hardened Replay

This sixth proof is now the strongest single replay path for judging because it
combines protected settlement, default auth hardening, and repricing.

Observed result:

- quote id: `27`
- protected purchase id: `9`
- on-chain job id: `1962`
- unauthenticated claim attempt: `403`
- authenticated claim id: `8`
- refund resolution completed
- later quote id: `28`
- seller risk moved from `73` to `89`

This is the shortest path that simultaneously proves:

- a live protected buy
- buyer-side claim-proof availability
- default rejection of unauthenticated buyer claims
- successful authenticated claimant path
- evaluator-driven refund
- post-outcome repricing with persisted sync state

## Local Persistence Proof

After the canonical independent-wallet replay completed:

- `purchase_claims.id = 10` shows `status = resolved`, `decision = refund`
- `protected_intel_purchases.id = 11` shows `status = refunded`
- `protected_intel_purchases.id = 11` records `metadata.repricingState = synced`
- `acp_jobs.id = 13` shows `status = rejected`
- `acp_jobs.id = 13` records:
  - `on_chain_job_id = 2030`
  - `on_chain_tx_hash = 0x3626e79f734b6708d357e3556353617d4600bbb5d859ff47d1dc6846b76479fa`
  - `metadata.submitTxHash = 0x813b673060e0d0f7d88ebd466801049c76b662297820a6f23a066773b32d0260`
  - `metadata.settlementTxHash = 0xc857156addb058461cb0eb04647eb896a3db54185e2fbcd09dd295b1bf236929`

That state aligns with the canonical replay path `16 -> 34 -> 11 -> 10 -> 36`.

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
- evaluator resolution can also be driven through a deterministic wallet-signature proof path
- resolved refund and release outcomes both change later pricing
- the current canonical replay uses independent buyer / seller / evaluator Agentic Wallet actors
- one live reference integration is mainnet-proved, and a second lightweight
  adapter is packaged for The Square paywalled intel unlocks

This document does **not** support stronger claims such as:

- generalized protection for every market type
- partial refunds
- decentralized arbitration
- premium-backed underwriting reserves
- a fully universal wallet-signature authorization model across every role and surface

## Recommended Public Citation Pair

If only two tx hashes can be shown for the Skills Arena Risk OS loop, use:

- funded principal: `0x3626e79f734b6708d357e3556353617d4600bbb5d859ff47d1dc6846b76479fa`
- protected refund: `0xc857156addb058461cb0eb04647eb896a3db54185e2fbcd09dd295b1bf236929`

If three tx hashes can be shown, add:

- delivery submit: `0x813b673060e0d0f7d88ebd466801049c76b662297820a6f23a066773b32d0260`

If four tx hashes can be shown, add historical release depth:

- protected buy / release loop: `0x092af96f5cd02bd7690103b0dbbd5681b6057dc7ec7ed5b34bc3d854ab324535`
- protected release: `0x3d6a7cc98592ff9b814dc315fd23458998c54b2a89795c7ad1f26939b85f5d1c`
