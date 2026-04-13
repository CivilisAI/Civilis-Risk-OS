# Adapter Patterns

## Pattern A: Live Challengeable Consumer

Use this when the external surface truly wants protected settlement.

Requirements:

- buyer and seller roles are clear
- evaluator path exists
- later repricing matters

This is the pattern proven by Intel Market.

## Pattern B: Mirrored Quote Consumer

Use this when the external surface wants to reuse risk language without routing
principal through a live protected settlement loop yet.

Good for:

- exploratory integrations
- portability proofs
- lightweight consumer demos

## Pattern C: Paywalled Unlock Portability Adapter

Use this when another commerce surface wants to normalize into Risk OS terms
without claiming a second live settlement loop.

This is the strongest current secondary pattern in the public repo:

- [../../../docs/second-adapter-paywalled-intel-unlock.md](../../../docs/second-adapter-paywalled-intel-unlock.md)

## Rules

- Do not call Pattern B or C a second live mainnet integration.
- Do not claim claim-resolution or repricing proof if the adapter only mirrors
  the quote vocabulary.
- Always keep Intel Market as the canonical live-settlement anchor unless a new
  live loop is actually captured.
