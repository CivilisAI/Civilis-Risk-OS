# Runtime Surface

Civilis Risk OS should be read here as a **directly callable runtime**.

The public runtime actions are:

- `health`
- `quote`
- `buy`
- `purchase`
- `claim-proof`
- `claim`
- `resolve-proof`
- `resolve`
- `requote`

## Core Principle

Another AI should not need to manually reconstruct the low-level HTTP sequence
from scratch every time. The runtime wrapper exists to turn the public API into
a narrower tool surface with predictable action names and role boundaries.

## Action Sequence

1. `health`
2. `quote`
3. `buy`
4. `purchase`
5. `claim-proof` (optional prep)
6. `claim`
7. `resolve-proof` (optional prep)
8. `resolve`
9. `requote`

## Role Split

- buyer actions:
  - `quote`
  - `buy`
  - `purchase`
  - `claim-proof`
  - `claim`
  - `requote`
- evaluator actions:
  - `resolve-proof`
  - `resolve`

## What Makes This A Skill Runtime

The reusable claim is no longer just:

- “here is an API spec”

The reusable claim becomes:

- “another AI can directly invoke a small runtime tool surface and complete the
  protected-commerce loop.”
