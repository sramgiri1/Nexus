# Command Center Live Wiring

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose

Move Command Center from a pure static mock UI toward local NEXUS visibility.

## Current phase

This phase adds read-only local snapshot wiring.

Phase 21-LOCAL extends that wiring with a generated runtime snapshot built from
`local-state/runtime` so the Command Center can show real local runtime record
totals and recent rows without any API or DB layer.

## What is wired

- local validation status summary
- local demo reports summary
- runtime traffic plane sample
- evidence and report references
- a bundled snapshot that mirrors the local state adapter output
- generated runtime-file summaries from `local-state/runtime`
- explicit not-wired-yet status

## What is not wired

- API server
- DB
- orchestrator dispatch
- live task queue
- live provider calls
- real Xcode runner
- private product execution
- mutation actions

## Why read-only first

- avoids unsafe mutation
- preserves the zero-key deterministic demo path
- lets the UI surface OS truth before executing work
- aligns with the security boundary and runtime traffic plane model

## Future phases

- local state adapter bridge
- API read endpoints
- DB mirror mode
- live task state
- live evidence ingestion
- approval actions
- future private product execution visibility
- future API read endpoints that replace the generated snapshot
