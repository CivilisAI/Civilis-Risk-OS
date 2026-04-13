# Runtime Deployment Modes

Civilis Risk OS is now packaged so another AI can point the same runtime tool
surface at either:

- a bundled local runtime profile
- or a hosted compatible base URL

## Default Product Path: Bundled Local Profile

The default package path is now:

- install the package
- run `npm run demo` or `npm run runtime -- ...`
- let the package start the bundled local runtime profile
- let the package use the bundled claimant and evaluator auth defaults

In that mode, another AI does **not** need to manually decide:

- which local backend to point at
- which claimant token to copy
- which evaluator token to copy

The package handles that bundle-level wiring itself.

This is the default product path:

- install the package
- run the bundled runtime commands
- get a self-contained local runtime surface immediately

No extra deployment decision is required for the default local use case.

## Optional Deployment Mode: Hosted Runtime

The runtime contract should not change just because the deployment surface
changes.

That means:

- same action names
- same role split
- same request shapes
- same proof expectations
- only `--base-url` changes

## Cloudflare Workers

This repo includes a ready deployment file for Cloudflare Workers:

- [wrangler.toml](../wrangler.toml)

Use these commands:

- `npm install`
- `npm run runtime:cf:deploy`

That deployment publishes the bundled runtime profile as a public hosted Skill
surface with the same public `health` and runtime API paths.

Current public hosted runtime:

- `https://civilis-risk-os-runtime.ceolaexekiel.workers.dev`

## Minimal Hosted Requirements

A hosted Risk OS runtime should expose:

- `POST /api/risk/quote/intel`
- `POST /api/intel/items/:id/buy`
- `GET /api/risk/purchases/:id`
- `GET /api/risk/purchases/:id/claim-proof`
- `POST /api/risk/claims`
- `GET /api/risk/claims/:id/resolve-proof`
- `POST /api/risk/claims/:id/resolve`
- `GET /health`

## Hosted Integrator Inputs

For the public bundled hosted runtime, another AI only needs:

- `base-url`
- commerce item id
- buyer actor id

The package recognizes hosted-bundled mode and supplies bundled claimant and
evaluator auth defaults automatically.

The runtime client also supports hosted access through standard proxy
environment variables and macOS system proxy detection, so the same command
surface works in proxy-routed environments without requiring a separate manual
network setup step.

For a custom hosted-compatible deployment, an external AI or app still needs:

- `base-url`
- buyer actor id
- evaluator proof path
- claimant proof path
- commerce item id

## Product Boundary

This public repo includes two valid ways to use the same Skill:

- bundled local runtime: included, self-contained, and verified
- public hosted bundled runtime: published and supported by the same command
  surface
- hosted-compatible runtime: also supported when another deployment uses the
  same contract

That distinction matters:

- bundled local runtime profile: **yes**
- hosted-ready: **yes**
- public hosted production endpoint claimed in this repo: **yes**

Keep that wording strict in demos and docs.

## Hosted Verification

This repo includes a direct public verification command:

- `npm run verify:hosted-public`

That command checks the published hosted runtime through:

- `GET /health`
- `POST /api/risk/quote/intel`
- `quote -> buy -> purchase -> claim-proof -> claim -> resolve-proof -> resolve -> requote`
