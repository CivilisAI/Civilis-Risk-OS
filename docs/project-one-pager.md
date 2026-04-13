# Project One Pager

## What It Is

**Civilis Risk OS** is an installable skill for protected agent commerce on X
Layer.

It upgrades a payment flow into:

`quote -> buy -> claim -> resolve -> requote`

It is packaged in three complementary forms:

- a direct runtime surface another AI can call
- a public hosted bundled runtime
- a live reference integration that shows the protection loop end to end

## Why It Matters

Agent commerce already has payment and execution rails.

What usually remains weak is what happens **after payment**:

- was the output misleading?
- who can challenge it?
- who resolves it?
- how does that outcome affect the next transaction?

Civilis Risk OS is the narrow protection layer for that problem.

## Runtime Roles

- buyer: `sage` / `0x3dba0d4e682be54be41b48cbe9572a81d14e94c9`
- seller: `fox` / `0x4f5dc690f366116bf6bc22f29e44f8d141bf38de`
- evaluator: `arbiter` / `0x400ea2f2af2732c4e2af9fb2f8616468ad49023d`

## Primary Live Reference

- reference item: `16`
- quote: `34`
- protected purchase: `11`
- claim: `10`
- later repriced quote: `36`

Primary transaction references:

- funded principal:
  `0x3626e79f734b6708d357e3556353617d4600bbb5d859ff47d1dc6846b76479fa`
- delivery submit:
  `0x813b673060e0d0f7d88ebd466801049c76b662297820a6f23a066773b32d0260`
- reject/refund:
  `0xc857156addb058461cb0eb04647eb896a3db54185e2fbcd09dd295b1bf236929`

## What It Ships

- one live protected-commerce loop on X Layer
- one installable skill package
- one public hosted bundled runtime
- independent buyer / seller / evaluator Agentic Wallet actors
- live `okx-security` seller-wallet token scanning in the quote path
- live `okx-dex-token` concentration and holder analytics in the quote path
- challengeable settlement through `ERC-8183`
- deterministic buyer claim preparation
- evaluator-driven refund / release
- optional AI evaluator advisory with `decision`, `reasoning`, and `confidence`
- `requote` after protected outcomes
- one second portability adapter for another commerce surface

## What Is Not Claimed

- generalized insurance protocol
- decentralized arbitration
- partial refunds
- a second live mainnet settlement loop from the portability adapter
- generic buyer wallet-signature proof for arbitrary claim payloads
- on-chain premium collection
- Uniswap integration in this public release
- a fully multi-tenant production SaaS

## Why It Matters

- it is a reusable protection layer, not just a page feature
- it sits on top of payment, wallet, escrow, and trust primitives already used
  in agent commerce
- it gives another AI a direct runtime interface instead of forcing every
  integrator to re-derive the workflow from raw API calls

## Read Next

1. [Runtime Quickstart](runtime-quickstart.md)
2. [Runtime Tool Surface](runtime-tool-surface.md)
3. [External Consumer Guide](external-consumer-guide.md)
4. [Integration Checklist](integration-checklist.md)
5. [External Consumer Schema](external-consumer-schema.md)
6. [API Examples](api-examples.md)
