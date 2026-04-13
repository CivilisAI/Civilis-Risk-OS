# Judge One Pager

## What It Is

**Civilis Risk OS** is a reusable protection Skill for agent commerce on X
Layer.

It upgrades a payment flow into:

`quote -> challengeable buy -> claim -> evaluator resolution -> later repricing`

## Why It Matters

Agent commerce already has payment and execution rails.

What usually remains weak is what happens **after payment**:

- was the output misleading?
- who can challenge it?
- who resolves it?
- how does that outcome affect the next transaction?

Civilis Risk OS is the narrow protection layer for that problem.

## Canonical Actors

- buyer: `sage` / `0x3dba0d4e682be54be41b48cbe9572a81d14e94c9`
- seller: `fox` / `0x4f5dc690f366116bf6bc22f29e44f8d141bf38de`
- evaluator: `arbiter` / `0x400ea2f2af2732c4e2af9fb2f8616468ad49023d`

## Canonical Proof Path

- replay item: `16`
- quote: `34`
- protected purchase: `11`
- claim: `10`
- later repriced quote: `36`

Canonical hashes:

- funded principal:
  `0x3626e79f734b6708d357e3556353617d4600bbb5d859ff47d1dc6846b76479fa`
- delivery submit:
  `0x813b673060e0d0f7d88ebd466801049c76b662297820a6f23a066773b32d0260`
- reject/refund:
  `0xc857156addb058461cb0eb04647eb896a3db54185e2fbcd09dd295b1bf236929`

## What Is Proven

- one live protected-commerce loop on X Layer
- independent buyer / seller / evaluator Agentic Wallet actors
- challengeable settlement through `ERC-8183`
- deterministic buyer claim-proof generation
- evaluator-driven refund / release
- later quote repricing after protected outcomes
- one second portability adapter for another commerce surface

## What Is Not Claimed

- generalized insurance protocol
- decentralized arbitration
- partial refunds
- a second live mainnet settlement loop from the portability adapter
- generic buyer wallet-signature proof for arbitrary claim payloads

## Why It Is A Skills Arena Project

- it is a reusable Skill, not just a page feature
- it is grounded in official Onchain OS capability boundaries
- it includes AI-readable skills, example scripts, schemas, replay guidance, and
  external consumer integration guidance

## Read Next

1. [Proof Surface Matrix](proof-surface-matrix.md)
2. [Integration Checklist](integration-checklist.md)
3. [External Consumer Schema](external-consumer-schema.md)
4. [AI Skill Pack](ai-skill-pack.md)
