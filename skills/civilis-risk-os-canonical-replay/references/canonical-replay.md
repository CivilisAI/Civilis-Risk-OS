# Canonical Replay Reference

## Canonical Proof Actors

| Role | Actor | Address |
| --- | --- | --- |
| buyer | `sage` | `0x3dba0d4e682be54be41b48cbe9572a81d14e94c9` |
| seller | `fox` | `0x4f5dc690f366116bf6bc22f29e44f8d141bf38de` |
| evaluator | `arbiter` | `0x400ea2f2af2732c4e2af9fb2f8616468ad49023d` |

## Canonical Historical Path

- replay intel item: `16`
- initial quote: `34`
- protected purchase: `11`
- authenticated claim: `10`
- later quote after refund: `36`

Canonical tx hashes:

- funded principal:
  `0x3626e79f734b6708d357e3556353617d4600bbb5d859ff47d1dc6846b76479fa`
- delivery submit:
  `0x813b673060e0d0f7d88ebd466801049c76b662297820a6f23a066773b32d0260`
- reject/refund:
  `0xc857156addb058461cb0eb04647eb896a3db54185e2fbcd09dd295b1bf236929`

## Fresh Replay Rule

For a new replay, do not assume historical ids are still live.

Instead:

1. restage a fresh intel item with the reference staging script
2. set `RISK_OS_INTEL_ITEM_ID` to the new item id
3. run the quickstart actions in order

Reference sources:

- [../../../docs/championship-replay-mode.md](../../../docs/championship-replay-mode.md)
- [../../../examples/external-consumer-quickstart.mjs](../../../examples/external-consumer-quickstart.mjs)
