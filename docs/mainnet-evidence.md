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

## Evidence Boundary

These examples are intentionally selected because they support concrete public
claims without overstating the current runtime:

- arena currently proves `ERC-8183` job-anchor usage
- intel purchase proves funded `ERC-8183` usage
- protected intel proof currently demonstrates clean `challengeable -> claim -> refund -> repricing` and `challengeable -> claim -> release -> repricing` loops
- funded intel examples do **not** imply every intel purchase is funded
- protected intel proof does **not** imply a generalized insurance pool or decentralized arbitration layer
- identity usage does **not** imply every reputation update is fully on-chain
