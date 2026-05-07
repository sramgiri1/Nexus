# Command Center Runtime File Ingestion

**Version:** 1.0  
**Date:** 2026-05-07

---

## Purpose

Make the Command Center show real local runtime file summaries while staying
read-only.

## Current phase

Generated static snapshot from local-state/runtime.

Phase 24-LOCAL extends the generated snapshot with approval workflow totals,
linked approval evidence, and refresh metadata so the dashboard can reflect CLI
approval activity after the snapshot is regenerated.

- no API
- no DB
- no mutation

## Why generated snapshot

The browser UI cannot safely read arbitrary local files without an API.

Until a read API exists, NEXUS generates a browser-safe snapshot module for the
Command Center.

## Sources

- `local-state/runtime/tasks.json`
- `local-state/runtime/evidence.jsonl`
- `local-state/runtime/audit.jsonl`
- `local-state/runtime/events.jsonl`
- `local-state/runtime/approvals.jsonl`
- `local-state/runtime/incidents.jsonl`

## What is displayed

- task counts and recent tasks
- evidence counts and recent evidence
- audit event counts and recent audit rows
- runtime event counts
- approvals and approval workflow totals
- linked approval evidence
- incidents
- snapshot metadata and refresh guidance
- not-wired-yet limits

## What is not implemented

- live API
- DB
- mutation actions
- provider execution
- tool execution
- real Xcode execution
- private product execution

## Future path

- replace the generated snapshot with `GET /status` and `GET /runtime`
  read endpoints
- add DB mirror mode
- live runtime updates
- approval actions under governor
- private product execution visibility
