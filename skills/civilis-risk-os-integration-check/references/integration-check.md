# Integration Check Reference

Use these questions in order.

## 1. Roles

Does the consumer define:

- buyer
- seller
- evaluator

## 2. Endpoint Surface

Can the consumer map to:

- quote
- buy
- claim
- resolve

## 3. Proof Surface

Does the consumer have:

- claimant token or claimant signature path
- evaluator token or evaluator signature path

## 4. Settlement Reality

Is principal actually routed through challengeable settlement?

If not, classify as quote-only or portability adapter.

## 5. Repricing

Does the integration consume later repriced quotes after outcomes?

If not, it is partial even if claim and resolve exist.
