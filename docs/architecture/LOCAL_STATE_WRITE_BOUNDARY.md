# Local State Write Boundary

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose

The local state write boundary defines the only safe filesystem surface that
future local orchestrator integration may use for prototype OS state writes.

## Local runtime files

The boundary writes only inside `local-state/runtime/`.

Current prototype files:

- `tasks.json`
- `evidence.jsonl`
- `audit.jsonl`
- `events.jsonl`
- `approvals.jsonl`
- `incidents.jsonl`

## Append-only prototype stores

The JSONL stores are append-only in this phase:

- evidence
- audit
- runtime events
- approvals
- incidents

`tasks.json` is a local task store prototype, not an append-only log.

## Write guards

The write boundary applies deterministic guard checks before any write:

- path must stay under `local-state/runtime`
- path traversal is blocked
- absolute paths are blocked
- secret-like filenames are blocked
- private project references are blocked
- secret-like content is blocked
- sensitive fields are sanitized before write

## Blocked paths

This phase blocks writes to:

- `projects`
- `memory`
- `config`
- `.git`
- `node_modules`
- `.env` and secret-key files

## Safety rules

- no secrets
- no private project data
- redaction required
- no destructive deletion
- no DB writes
- no API calls
- no provider calls

## Current phase boundary

This phase creates deterministic local helper code only.

Phase 19-LOCAL uses this write boundary in `dryRun: true` mode so the
orchestrator adapter can validate task, audit, evidence, and runtime-event
records without persisting them.

Phase 20-LOCAL adds controlled local execution on top of the same boundary.
That mode may persist real redacted `DemoApp` runtime records under
`local-state/runtime/`, but it still does not execute providers, tools, or
project mutations.

It does not:

- wire `loop.js`
- wire `runner.js`
- add live provider execution
- add a DB
- add an API server
- add mutation endpoints

## Future transition

Later phases can move this write boundary toward:

- DB mirror mode
- DB primary mode
- orchestrator integration before dispatch and state changes
- approval-aware mutation services
- read API snapshots sourced from durable runtime state
