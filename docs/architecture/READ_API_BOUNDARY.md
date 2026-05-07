# Read API Boundary

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose

Define the future read boundary between the Command Center and a real NEXUS API.

## Current phase

The current phase adds a local adapter only.

The UI should eventually read from an API, not local files, but that API does
not exist yet in this phase.

## Future read boundary

Future read endpoints should expose redacted snapshots instead of raw local
files or raw database access.

Those snapshots should eventually come from the local write boundary first and
then from DB mirror or DB primary storage later.

Candidate read routes later:

- `GET /status`
- `GET /reports`
- `GET /demo`
- `GET /runtime`
- `GET /capabilities`
- `GET /evidence`

## Mutation boundary

Mutation endpoints remain separate.

They must stay governor-protected, approval-aware, and isolated from read-only
status routes.

The current phase does not add those mutation endpoints.

## Rules

- no secrets in read responses
- no raw private project data in read responses
- no DB direct access by the UI
- no mutation path in this phase
- no API server in this phase

## Why this boundary matters

The Command Center should eventually consume a trustworthy read surface that is
consistent, redacted, and auditable without gaining write authority.
