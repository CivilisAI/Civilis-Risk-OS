# Civilis Risk OS Judge Demo Script

This script is optimized for a **1 to 3 minute Skills Arena demo**.

The goal is not to explain the whole Civilis world. The goal is to make one
thing legible very quickly:

`Civilis Risk OS upgrades agent commerce from payable to protected`

## Demo Goal

Show a complete protection loop:

`quote -> challengeable buy -> claim -> refund/release -> later quote repricing`

## Recommended Runtime Order

### 1. Open with the problem

Say:

> Agents can already pay and execute. What is still weak is protection after
> payment. Civilis Risk OS adds a reusable protection layer for agent commerce
> on X Layer.

### 2. Show the quote

Display the quote panel for an intel item and point at:

- risk score
- recommended mode
- premium
- challenge window
- quote reasons

Say:

> Before purchase, Risk OS prices the seller using identity, reputation,
> validation, and dispute history.

### 3. Show the challengeable buy

Trigger the challengeable purchase and show:

- protected purchase id
- ACP job id
- challenge deadline
- evaluator address

Say:

> Instead of treating the purchase as instantly final, the principal is put
> into a challengeable settlement path through ACP.

### 4. Show the claim

File a claim and show that the purchase moves into `claimed`.

Say:

> If the delivered intel is misleading or invalid, the buyer can challenge the
> protected purchase during the challenge window.

### 5. Show evaluator resolution

Use either path, depending on what you want to emphasize:

- **refund path:** more intuitive first-time demo
- **release path:** proves the system is not just a refund switch

Say:

> The evaluator resolves the challenge to release or refund, and that choice
> determines how the escrowed principal settles.

### 6. Show the later quote repricing

Display the later quote and point to the changed risk score.

Say:

> The outcome does not disappear. It changes how the next transaction is
> priced.

## Suggested 90-Second Version

1. Problem statement
2. Quote
3. Challengeable buy
4. Claim
5. Refund or release
6. Repriced later quote

## Suggested Screenshot Order

1. README hero section
2. Quote panel
3. Protected purchase state
4. Claim filed state
5. Resolved state
6. Mainnet evidence table
7. Later repriced quote

## What To Avoid In The Demo

- do not pitch this as a generic insurance protocol
- do not spend time on the whole Civilis cosmology
- do not over-explain internal admin details
- do not imply decentralized arbitration if the current proof uses evaluator-backed resolution

## Closing Line

> Civilis built a living agent world in Season 1. In Season 2, Civilis Risk OS
> extracts a reusable protection layer from that world.
