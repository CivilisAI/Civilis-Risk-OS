# Hosted Runtime Onboarding

Civilis Risk OS is now packaged so another AI can point the same runtime tool
surface at either:

- a bundled local runtime profile
- or a hosted compatible base URL

## Bundled Local Profile

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

## Hosted-Ready Principle

The runtime contract should not change just because the deployment surface
changes.

That means:

- same action names
- same role split
- same request shapes
- same proof expectations
- only `--base-url` changes

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

## Integrator Inputs

A hosted external AI or app needs:

- `base-url`
- buyer actor id
- evaluator proof path
- claimant proof path
- commerce item id

## Current Boundary

This public repo is **hosted-ready**, and it now includes a bundled local
runtime path for direct installation and use.

It still does not currently claim that a public production runtime URL has been
published as part of the submission.

That distinction matters:

- bundled local runtime profile: **yes**
- hosted-ready: **yes**
- public hosted production endpoint claimed in this repo: **no**

Keep that wording strict in demos and docs.
