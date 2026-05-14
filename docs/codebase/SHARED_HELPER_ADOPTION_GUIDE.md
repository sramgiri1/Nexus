# Shared Helper Adoption Guide

## Purpose

This guide explains how future phases should decide whether to reuse an
existing helper, create a new helper, or keep a duplicated pattern phase-local
until a safer refactor phase exists.

## Reuse Before Creating

Before adding helper code, check:

- [Code Documentation Standard](CODE_DOCUMENTATION_STANDARD.md)
- [Module Registry](MODULE_REGISTRY.md)
- [Phase Module Index](PHASE_MODULE_INDEX.md)
- [Reuse and Refactor Guide](REUSE_AND_REFACTOR_GUIDE.md)
- [Shared Helper Catalog](SHARED_HELPER_CATALOG.md)
- [Refactor Candidate Plan](REFACTOR_CANDIDATE_PLAN.md)
- `reports/reuse-audit-report.md`

## When to Reuse

Reuse an existing helper when:

- the helper already owns the same boundary
- tests cover the behavior you need
- reuse does not broaden runtime authority
- reuse does not change public/private or local-private behavior

## When to Create a New Helper

Create a new helper only when:

- no existing helper owns the boundary
- the helper removes real duplication
- the phase explicitly allows adding that helper
- docs and checkers can validate the new helper contract

## How to Document New Shared Helpers

When a helper becomes real, update:

- `docs/codebase/SHARED_HELPER_CATALOG.md`
- `docs/codebase/MODULE_REGISTRY.md`
- `docs/codebase/PHASE_MODULE_INDEX.md`
- any checker or report that validates the helper

Mark its status as `existing` and list its tests.

## How to Avoid Unsafe Refactors

- Do not move high-risk code during docs or catalog phases.
- Do not extract mode, redaction, file boundary, or write guard behavior without
  dedicated validation.
- Do not change local API, DB, action bridge, or runtime behavior as part of a
  helper catalog update.
- Keep public/private and demo/local-private boundaries explicit.

## Checker, Report, and Test Updates

Any helper extraction phase must include:

- checker coverage for the helper contract
- targeted tests for affected call sites
- report updates with Validation HEAD wording
- rollback notes in the refactor plan

## Helper Status Values

- `planned`: cataloged but not implemented
- `existing`: currently available and should be reused
- `future`: depends on later platform phases
- `do_not_refactor_yet`: known candidate but blocked by safety or runtime risk

## Before Writing New Code

1. Check module registry.
2. Check shared helper catalog.
3. Check reuse audit report.
4. Reuse existing helper if safe.
5. If not safe, document phase-local duplication reason.
6. Add refactor candidate if repeated pattern appears.
