# Proof Classification Reference

## Canonical Captured Proof

Primary submission path:

- item `16`
- quote `34`
- purchase `11`
- claim `10`
- later quote `36`

Canonical tx hashes:

- funded principal:
  `0x3626e79f734b6708d357e3556353617d4600bbb5d859ff47d1dc6846b76479fa`
- delivery submit:
  `0x813b673060e0d0f7d88ebd466801049c76b662297820a6f23a066773b32d0260`
- reject/refund:
  `0xc857156addb058461cb0eb04647eb896a3db54185e2fbcd09dd295b1bf236929`

## Historical Depth Evidence

Historical loops can strengthen the repo, but they are not the default
submission story.

Use them only as supporting depth.

## Proof-Prep Surface

Real product surface, but not the same as a captured wallet-signature loop.

Examples:

- buyer claim-proof message generation
- evaluator resolve-proof message generation

## Capability Exists But Public Capture Is Incomplete

Current accurate example:

- Agentic Wallet off-chain signing capability exists
- x402 signing path is verified
- but generic buyer wallet-signature proof for arbitrary claim payloads is not
  publicly captured in this repo
