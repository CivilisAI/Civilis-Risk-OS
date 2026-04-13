# Mainnet Evidence

This document collects the mainnet facts that are safe to cite publicly.

## Contract Addresses

| Contract | Address |
| --- | --- |
| `ACPV2` | `0xBEf97c569a5b4a82C1e8f53792eC41c988A4316e` |
| `CivilisCommerceV2` | `0x7bac782C23E72462C96891537C61a4C86E9F086e` |
| `ERC8004IdentityRegistryV2` | `0xC9C992C0e2B8E1982DddB8750c15399D01CF907a` |
| `ERC8004ReputationRegistryV2` | `0xD8499b9A516743153EE65382f3E2C389EE693880` |
| `ERC8004ValidationRegistryV2` | `0x0CC71B9488AA74A8162790b65592792Ba52119fB` |

## Verified Evidence Categories

The project currently has public-safe evidence for:

- x402 social / payment activity
- ERC-8183 arena job anchors
- ERC-8183 funded intel purchases
- ERC-8183 protected intel refund resolution
- ERC-8183 protected intel release resolution
- wallet-signature-bound evaluator resolution against a mainnet-backed protected intel purchase
- buyer-side claim-proof surface against a mainnet-backed protected intel purchase
- ERC-8004 identity usage

## Representative Mainnet TX Examples

### x402

- post: `0x039f96eab2d94d62899bd4d8342e57d3c44432f8a994e1694677dda4134c01ae`
- tip: `0x4a00fdd91d392b043db1b00f3ffc2ccde6a35c4500c2c22aa06f98e7d40a00b5`

### ERC-8183 arena anchor

- arena ACP anchor / `JobCreated`: `0x6d00929596ab9e3d8fc9685eb9e13577379ef0cca8863a2370302b1390ba5ac9`

### ERC-8183 funded intel purchase

- funded intel purchase 1: `0x27cb7eda9bf90c6a56c6c7fa10f515dd8bda02b4a5520423e4ffa45ea3d72a06`
- funded intel purchase 2: `0xddb14433d31fad2e24e2a5cfbb574fff8c752c85cc1274cdd7549d3f546bcdb5`

### Skills Arena protected intel commerce proof

- challengeable funded purchase / on-chain job `1955`: `0xac33ab277d289ec08a8f202e766c6394840aadbaee3cf3b5e290bd5e7ca58ecc`
- reject + refund for job `1955`: `0x0d943594e006228b83f2fc45fdab1f6322e36ee1e6143d593f6c6b63b5175263`
- challengeable funded purchase / on-chain job `1956`: `0x092af96f5cd02bd7690103b0dbbd5681b6057dc7ec7ed5b34bc3d854ab324535`
- complete + payment release for job `1956`: `0x3d6a7cc98592ff9b814dc315fd23458998c54b2a89795c7ad1f26939b85f5d1c`
- challengeable funded purchase / on-chain job `1959`: `0xf77f8bbc5fa46c6da1f93076857823c5c1759025980f1639fab1f3b7c8086f76`
- challengeable funded purchase / on-chain job `1960`: `0x8b0d5ffc9977b857e192a24f95fc9b7ea44b1d399bb328896f59d00fa5a9e2d1`
- challengeable funded purchase / on-chain job `1961`: `0xe2ec46b808757e6cbb2cc716bf13608e6e9246859a4dad4b0edaa477ec7889de`

## Evidence Boundary

These examples are intentionally selected because they support concrete public
claims without overstating the current runtime:

- arena currently proves `ERC-8183` job-anchor usage
- intel purchase proves funded `ERC-8183` usage
- protected intel proof currently demonstrates clean `challengeable -> claim -> refund -> repricing` and `challengeable -> claim -> release -> repricing` loops
- wallet-signature proof currently demonstrates the evaluator authorization path, but this repo does not yet claim a captured settlement tx hash for that specific proof loop
- buyer-side claim-proof currently demonstrates deterministic claimant message generation on top of a mainnet-backed protected purchase, but this repo does not yet claim a captured buyer wallet signature proof loop
- public quickstart proof currently demonstrates that a standalone external-consumer script can drive the protected buy and claim/resolution flow, but this repo does not yet claim a second generalized commerce adapter beyond the intel reference integration
- funded intel examples do **not** imply every intel purchase is funded
- protected intel proof does **not** imply a generalized insurance pool or decentralized arbitration layer
- identity usage does **not** imply every reputation update is fully on-chain
