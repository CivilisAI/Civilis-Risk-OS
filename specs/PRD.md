# Civilis Risk OS

## One-Line Definition

Civilis Risk OS is a protection layer for intel commerce on X Layer, designed
to turn a merely payable flow into one that can become challengeable,
refundable, and trust-repriced as the submission evidence is completed.

## Product Positioning

Civilis Risk OS is the protection layer for agent commerce on X Layer.

For Build X Season 2, it is packaged specifically as a **Skills Arena**
submission, not as a replacement for the Civilis product.

It is not:
- a wallet
- a generic payment SDK
- an insurance protocol
- a generic marketplace
- a decentralized court

It is:
- a risk quote engine
- a protected purchase coordinator
- a claim and resolution flow
- a trust repricing layer that feeds the next transaction

## Skills Arena Submission Contract

This submission must read as a **reusable skill** with a clear reference
integration, not as a generic idea attached to the Civilis app.

The submission contract is:

- **skill claim:** reusable protection logic for agent commerce
- **reference integration:** Civilis Intel Market
- **submission surface:** quote, protected buy, claim, resolution, purchase
  state retrieval
- **evidence standard:** claim only what is implemented, locally verified, or
  backed by current mainnet evidence

The submission should not claim that generic multi-market reuse is already
complete. It should claim that the Intel Market integration demonstrates the
skill in a live agent economy reference environment.

## Why This Exists

Agent commerce already has payment rails and execution rails.

What is still missing is protection after payment:
- If a seller under-delivers, what happens?
- If the result is low quality or misleading, who resolves it?
- How does one bad transaction change future pricing and trust?

Civilis Risk OS answers that question for one concrete commerce surface first:
- the Civilis Intel Market

## Champion Thesis

This project is optimized for Build X Season 2, Skills Arena.

Its core advantage is not novelty alone. It combines:
- strong reuse of live Civilis mainnet protocol surfaces
- a narrow but high-value infrastructure problem
- a demoable closed loop
- clear alignment with x402, Agentic Wallet, ERC-8183, and ERC-8004

The judge-facing thesis is:

- payment and execution rails already exist
- protection after payment is still weak
- Civilis Risk OS fills that gap with a reusable protection flow
- Civilis demonstrates the flow in a live multi-agent environment

## MVP Scope

The MVP is intentionally narrow.

### Included

- One domain: intel purchases
- Two modes: `instant` and `challengeable`
- One claim reason: `misleading_or_invalid_intel`
- One evaluator path: trusted evaluator
- Two outcomes: `release` and `refund`
- One repricing loop: claim outcomes affect future quote results

### Submission Surface

The reusable submission surface is intentionally small:

- `POST /api/risk/quote/intel`
- `POST /api/intel/items/:id/buy`
- `POST /api/risk/claims`
- `POST /api/risk/claims/:id/resolve`
- `GET /api/risk/purchases/:id`

Those routes are intel-scoped in this repo. The reusable claim is the
protection pattern they embody, not that the route names are already generalized
to every commerce domain.

### Not Included

- partial refunds
- multi-party arbitration
- seller collateral
- premium pools
- generic multi-market integration
- governance or token economics

## Core User Flow

1. Buyer selects an intel item.
2. System produces a risk quote.
3. System recommends `instant` or `challengeable`.
4. Buyer confirms purchase mode.
5. For `challengeable`, principal is escrowed through ACP.
6. Seller delivery is submitted.
7. Challenge window opens.
8. Buyer may file a claim.
9. Evaluator decides `release` or `refund`.
10. Reputation and future pricing update.

## Required Acceptance Criteria

The MVP is considered complete only if all of the following are true:

1. A buyer can request a quote before purchase.
2. A higher-risk seller is recommended as `challengeable`.
3. A challengeable purchase reaches ACP `submitted` instead of auto-`completed`.
4. A claim can be filed during the challenge window.
5. An evaluator can resolve a claim to `release` or `refund`.
6. Resolution affects a later quote for the same seller.

## Verified In This Iteration

The following are now implemented and evidenced in the current repo snapshot:

1. `GET /health` succeeds with the Risk OS router mounted in strict mainnet mode.
2. A buyer can request a risk quote before purchase.
3. The quote returns:
   - risk score
   - recommended mode
   - premium
   - challenge window
   - reasons
4. A challengeable purchase creates a funded ACP job and stops in `submitted`.
5. A protected purchase view can be retrieved through `GET /api/risk/purchases/:id`.
6. A buyer can file a claim during the challenge window.
7. An evaluator can resolve a claim to `refund`.
8. The corresponding ACP job reaches `rejected` onchain and emits `Refunded`.
9. An evaluator can resolve a claim to `release`.
10. The corresponding ACP job reaches `completed` onchain and emits `PaymentReleased`.
11. Later quotes for the same seller change after resolved refund and release outcomes.

Concrete clean proof loops captured in this iteration:

- refund loop:
  - quote id `11`
  - protected purchase id `3`
  - local ACP job id `4`
  - on-chain job id `1955`
  - funded / submitted tx `0xac33ab277d289ec08a8f202e766c6394840aadbaee3cf3b5e290bd5e7ca58ecc`
  - reject / refund tx `0x0d943594e006228b83f2fc45fdab1f6322e36ee1e6143d593f6c6b63b5175263`
  - repriced quote id `12` with seller risk score moving from `76` to `91`
- release loop:
  - quote id `13`
  - protected purchase id `4`
  - local ACP job id `5`
  - on-chain job id `1956`
  - funded tx `0x092af96f5cd02bd7690103b0dbbd5681b6057dc7ec7ed5b34bc3d854ab324535`
  - complete / release tx `0x3d6a7cc98592ff9b814dc315fd23458998c54b2a89795c7ad1f26939b85f5d1c`
  - repriced quote id `14` with seller risk score moving from `91` to `79`

## Evidence Boundaries

To stay submission-safe, Civilis Risk OS should currently be described this way:

- **implemented:** risk quote, protected purchase state, claim creation,
  evaluator-token-gated resolution path, and protected purchase status APIs
- **verified now:** strict mainnet quote, challengeable funded purchase,
  claim creation, evaluator-backed refund and release resolution, on-chain
  rejected/completed job states, on-chain refunded/payment-released events, and
  later quote repricing
- **future extension work:** wallet-signature-bound evaluator auth, premium
  collection, and broader multi-market adapters

It should **not** currently be described as:

- fully generalized protection infra for every agent market
- a decentralized arbitration system
- a live insurance reserve or underwriting pool
- a premium-funded insurance reserve

## Mainnet Proof Captured

The current clean proof set includes:

- one challengeable funded intel purchase
- one ACP job that reaches `rejected`
- one ACP job that reaches `completed`
- one `Refunded` event for job `1955`
- one `PaymentReleased` event for job `1956`
- later quotes that reprice the same seller after refund and release outcomes

Additional proof still worth capturing before final submission packaging:

- one explicit reputation or validation write cited alongside the repricing loop

## Delivery Strategy

We use Civilis as the reference integration, but the architecture must stay reusable.

The project story is:
- live trust and identity history from Civilis
- packaged into a reusable protection layer
- demonstrated through Intel Market protected commerce

The submission story should explicitly avoid this weaker framing:

- "Civilis added one more feature to the Intel page"

It should instead use this stronger framing:

- "Civilis Risk OS extracts a reusable protection layer from the Civilis agent
  economy and demonstrates it through Intel Market."
