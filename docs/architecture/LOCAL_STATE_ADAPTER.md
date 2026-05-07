# Local State Adapter

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose

The local state adapter creates a safe, read-only state surface for local NEXUS
development, demo, and Command Center visibility.

## Local read-only state

This phase reads approved local files and returns a normalized snapshot.

Phase 18-LOCAL adds a matching local write boundary and local runtime prototype
files under `local-state/runtime/`. The read adapter remains read-only, but it
is now positioned to consume those append-only task, evidence, audit, and
runtime records later.

It does not add:

- DB access
- no API
- API server behavior
- no mutation
- mutation actions
- write endpoints

## Safe file reader

The adapter uses a fail-closed safe file reader.

It resolves all paths under the repo root, blocks path traversal, and rejects
secret-like files and blocked directories before any file content is read.

## Approved directories

- `reports`
- `demo`
- `artifacts`
- `capabilities`
- `policy`
- `docs/architecture` when only selected metadata is needed

## Blocked directories

- `node_modules`
- `.git`
- `projects`
- `private`
- `memory/private`

## Normalized validation reports

Validation reports are read from local markdown files and normalized into a
stable report list plus an aggregate summary.

## Normalized demo artifacts

Demo contracts, reports, and the DemoApp scenario are read from local JSON
files and summarized into release posture, gate posture, and evidence counts.

## Normalized runtime status

Runtime status is derived from local traffic-plane reports, capability registry
data, and policy presence checks.

## Normalized runtime files

Phase 21-LOCAL adds normalized summaries for the local runtime prototype files
under `local-state/runtime/`. The adapter now summarizes:

- tasks
- evidence
- audit events
- runtime events
- approvals
- incidents

Those summaries feed a generated browser-safe Command Center snapshot.

## Current phase boundary

This is a local adapter only. There is still no DB, API, or mutation path in
this phase.

## Future bridge

This adapter is the bridge toward:

- API read endpoints
- local write-boundary output
- generated Command Center runtime snapshots
- DB mirror mode
- live evidence ingestion
- future redacted status snapshots for the Command Center
