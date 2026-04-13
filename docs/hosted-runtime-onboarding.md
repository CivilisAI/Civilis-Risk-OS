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

## Render Web Service

This repo includes a ready deployment file for Render:

- [render.yaml](../render.yaml)

Use these settings if you configure the service manually:

- build command: `npm install`
- start command: `npm run runtime:hosted`
- health check path: `/health`
- runtime: Node 20

That deployment publishes the bundled runtime profile as a public hosted Skill
surface.

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

A hosted external AI or app needs:

- `base-url`
- buyer actor id
- evaluator proof path
- claimant proof path
- commerce item id

## Product Boundary

This public repo includes two valid ways to use the same Skill:

- bundled local runtime: included, self-contained, and verified
- hosted-compatible runtime: supported by the same command surface

It still does not currently claim that a public production runtime URL has been
published as part of the submission.

That distinction matters:

- bundled local runtime profile: **yes**
- hosted-ready: **yes**
- public hosted production endpoint claimed in this repo: **no**

Keep that wording strict in demos and docs.
