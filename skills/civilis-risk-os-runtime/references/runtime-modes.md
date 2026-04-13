# Runtime Modes

Civilis Risk OS should be used in one of two runtime modes.

## 1. Local Proof Environment

Use this mode when:

- replaying the public proof loop
- validating quote / buy / claim / resolve behavior
- demonstrating the Skill in a controlled environment

Typical base URL:

- `<strict-proof-runtime-url>`

## 2. Hosted Runtime

Use this mode when:

- another agent app needs to call Risk OS over a stable public endpoint
- the caller should not depend on the local proof environment

The public repo is now **hosted-ready**, meaning:

- the runtime CLI can point at any compatible `--base-url`
- the action surface stays the same across local and hosted modes

## Rule

Always report which runtime mode was used.

Do not blur:

- local proof replay
- hosted production usage

They are different trust surfaces and must be described separately.
