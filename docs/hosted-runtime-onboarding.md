# Hosted Runtime Onboarding

Civilis Risk OS is now packaged so another AI can point the same runtime tool
surface at either:

- a local strict proof environment
- or a hosted compatible base URL

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

An external AI or app needs:

- `base-url`
- buyer actor id
- evaluator proof path
- claimant proof path
- commerce item id

## Current Boundary

This public repo is **hosted-ready**, but it does not currently claim that a
public production runtime URL has been published as part of the submission.

That distinction matters:

- hosted-ready: **yes**
- public hosted production endpoint claimed in this repo: **no**

Keep that wording strict in demos and docs.
