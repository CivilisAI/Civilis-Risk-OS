# Runtime Auth

Civilis Risk OS uses explicit role proof for mutation actions in the strict
proof environment.

## Buyer-side

For claim creation, the buyer currently has two proof paths:

- claimant token
- deterministic `claim-proof` message + buyer wallet signature

### Captured proof boundary

This repo captures:

- deterministic buyer-side `claim-proof` message generation
- strict proof-environment claimant-token claim creation

This repo does **not** claim:

- captured generic buyer wallet-signature proof for arbitrary claim payloads

That boundary must be preserved in every runtime explanation.

## Evaluator-side

For resolution, the evaluator currently has two proof paths:

- evaluator token
- deterministic `resolve-proof` message + evaluator wallet signature

This repo captures:

- evaluator token path
- evaluator wallet-bound `resolve-proof` authorization path

## Public Runtime Rule

When another AI is using the runtime:

- use token paths when the local strict proof environment is configured that way
- use wallet-signature paths when the integrator has bound its own evaluator or
  claimant wallet flow
- do not silently downgrade a missing proof path into an unauthenticated call
