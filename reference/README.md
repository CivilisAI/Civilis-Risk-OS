# Reference Implementation Pack

This directory contains **extracted reference implementation files** from the
working Civilis Risk OS build.

The goal of this pack is reviewability, not full standalone deployment.

## What This Pack Is

- a judge-facing code reference for the submission
- a focused subset of the implementation that proves how the Skill works
- a way to inspect the core Risk OS surfaces without exposing the full private
  working repository

## What This Pack Is Not

- a one-command runnable monorepo
- a complete clone of the internal Civilis repository
- a claim that every adapter in the original environment is included here

## Directory Guide

- [`server/risk/`](server/risk) contains the protection-specific logic:
  - quote engine
  - protected purchase orchestration
  - claim lifecycle
  - risk routes
  - challenge window worker
- [`server/intel/`](server/intel) contains the Intel Market adapter route used
  by the reference integration
- [`server/erc8183/`](server/erc8183) and [`server/erc8004/`](server/erc8004)
  contain the protocol client surfaces the Skill builds on
- [`server/db/`](server/db) contains the relevant schema and persistence layer
- [`dashboard/`](dashboard) contains the judge-facing reference UI surfaces

The dashboard files should be read as a **proof console** for the review flow.
The reusable Skill claim in this repo is anchored in the protected-commerce API
surface and orchestration logic, not in a claim that a fully generalized
multi-role front-end package is already complete.

For a non-dashboard consumer path, see:

- [`../examples/external-consumer-quickstart.mjs`](../examples/external-consumer-quickstart.mjs)
- [`../examples/paywalled-intel-unlock-adapter.mjs`](../examples/paywalled-intel-unlock-adapter.mjs)
- [`../docs/championship-replay-mode.md`](../docs/championship-replay-mode.md)

Reviewers should treat these files as the extracted implementation evidence for
the submission claim:

`quote -> challengeable buy -> claim -> evaluator release/refund -> later quote repricing`
