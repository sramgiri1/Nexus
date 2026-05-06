# nexus-pr-review

## Name

NEXUS PR Review

## Description

Review a Codex or Claude change for scope discipline, documentation quality, runtime safety, and policy alignment before it is accepted.

## When to Use

Use after a phase implementation or before commit/push when reviewing whether a change should ship as-is.

## Steps

1. Check whether forbidden files were touched.
2. Check whether the phase scope was violated.
3. Check whether requested tests or validations are missing.
4. Check whether docs are inconsistent with the implementation.
5. Check runtime risk or behavior drift.
6. Check for secrets or unsafe disclosures.
7. Check model, batch, governor, or policy drift.
8. Check whether any agent prompt overclaims authority.
9. Check markdown formatting and readability where docs changed.

## Safety Checks

- Review only against the prompt scope and repo rules.
- Flag missing evidence instead of assuming it exists.
- Treat policy drift and forbidden-file changes as blockers.

## Allowed Outputs

- `PASS`
- `NEEDS_FIX`
- `BLOCKED`

## Forbidden Actions

- Approving out-of-scope changes
- Claiming tests or checks passed without command evidence
- Ignoring secrets, runtime drift, or policy drift
