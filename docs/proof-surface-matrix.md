# Proof Surface Matrix

This matrix separates what the submission **proves**, what it **prepares**, and
what it **does not claim**.

The goal is to keep the repo technically strict while still showing the full
shape of the protection Skill.

## Canonical Replay Anchor

The primary public submission story is the canonical replay:

- replay item `16`
- quote `34`
- protected purchase `11`
- claim `10`
- later quote `36`

Canonical hashes:

- funded principal:
  `0x3626e79f734b6708d357e3556353617d4600bbb5d859ff47d1dc6846b76479fa`
- delivery submit:
  `0x813b673060e0d0f7d88ebd466801049c76b662297820a6f23a066773b32d0260`
- reject/refund:
  `0xc857156addb058461cb0eb04647eb896a3db54185e2fbcd09dd295b1bf236929`

## Proof Matrix

| Surface | Role / auth mode | Canonical status | Captured proof type | Current claim |
| --- | --- | --- | --- | --- |
| Risk quote | buyer `sage` | canonical | API response + later repricing | fully captured |
| Challengeable protected buy | buyer `sage` | canonical | on-chain funded principal tx + protected purchase state | fully captured |
| Delivery submit | seller `fox` flow | canonical | on-chain submit tx | fully captured |
| Unauthenticated buyer claim rejection | buyer path without proof | canonical | HTTP `403` rejection in strict proof env | fully captured |
| Buyer claim creation | buyer token path | canonical | authenticated API response (`claim 10`) | fully captured |
| Buyer claim-proof message | buyer wallet prep path | canonical | deterministic message payload | fully captured as message-prep surface |
| Generic buyer wallet-signature for arbitrary claim payloads | buyer wallet signature | not canonical | no public mainnet-captured loop | **not claimed** |
| Evaluator resolve-proof message | evaluator wallet prep path | canonical helper | deterministic message payload | fully captured as proof-prep surface |
| Evaluator resolution | evaluator token path | canonical | reject/refund tx + local state transition | fully captured |
| Evaluator wallet-bound resolution | evaluator signature path | historical depth | historical proof loop | captured as historical depth evidence |
| Refund outcome repricing | trust repricing layer | canonical | later quote `36`, risk `74 -> 89` | fully captured |
| Release outcome repricing | trust repricing layer | historical depth | release loop evidence | captured as historical depth evidence |
| Second adapter portability | The Square paywalled intel unlock | portability proof | runnable adapter + normalized shape + optional mirrored quote | captured as adapter evidence, not as second live mainnet loop |

## Reading Rule

Use the matrix this way:

- treat **canonical** rows as the default submission story
- treat **historical depth** rows as supporting strength, not as the primary
  path
- treat **proof-prep** rows as real product surfaces, but do not confuse them
  with captured wallet-signature settlement proof

## Why This Matters

Civilis Risk OS is strongest when it says three things clearly:

1. one protected commerce loop is fully proven on X Layer
2. the reusable skill surface is broader than one UI page
3. wallet capability and captured public proof are not the same thing

That clarity is more valuable than pretending every auth path is already
symmetrically captured.
