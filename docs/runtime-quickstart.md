# Runtime Quickstart

If another AI should **directly use** Civilis Risk OS rather than only read the
docs, start here.

## What This Gives You

The runtime CLI wraps the public Risk OS surface into a narrower tool contract:

- `health`
- `quote`
- `buy`
- `purchase`
- `claim-proof`
- `claim`
- `resolve-proof`
- `resolve`
- `requote`

Entry:

- [../examples/risk-os-runtime.mjs](../examples/risk-os-runtime.mjs)

## Install

From the public repo:

```bash
npm install
```

## 1. Check Runtime Health

```bash
npm run runtime -- health --base-url http://127.0.0.1:3021
```

## 2. Quote A Listing

```bash
npm run runtime -- quote --base-url http://127.0.0.1:3021 --item 16 --buyer sage
```

## 3. Create A Challengeable Protected Purchase

```bash
npm run runtime -- buy --base-url http://127.0.0.1:3021 --item 16 --buyer sage --mode challengeable --quote 34
```

## 4. Inspect Protected Purchase State

```bash
npm run runtime -- purchase --base-url http://127.0.0.1:3021 --purchase 11
```

## 5. Prepare And Open A Claim

```bash
npm run runtime -- claim-proof --base-url http://127.0.0.1:3021 --purchase 11 --reason "delivery was misleading"
```

```bash
npm run runtime -- claim --base-url http://127.0.0.1:3021 --purchase 11 --reason "delivery was misleading" --claimant-token <token>
```

## 6. Prepare And Resolve As Evaluator

```bash
npm run runtime -- resolve-proof --base-url http://127.0.0.1:3021 --claim 10 --decision refund --reason "quality below threshold"
```

```bash
npm run runtime -- resolve --base-url http://127.0.0.1:3021 --claim 10 --decision refund --reason "quality below threshold" --evaluator-token <token>
```

## 7. Requote After Outcome

```bash
npm run runtime -- requote --base-url http://127.0.0.1:3021 --item 16 --buyer sage
```

## Why This Matters

The current strongest public claim should now be read as:

- another AI can install this repo
- run a small runtime action surface
- and complete the protected-commerce loop directly

That is stronger than merely reading the OpenAPI spec.
