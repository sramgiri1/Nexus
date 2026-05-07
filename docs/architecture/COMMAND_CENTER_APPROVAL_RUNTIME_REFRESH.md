# Command Center Approval Runtime Refresh

**Version:** 1.0  
**Date:** 2026-05-07

---

## Purpose

Make the Command Center show real local approval workflow state and refreshed
runtime summaries while staying read-only.

## Current phase

This phase still uses a generated browser-safe snapshot.

- no API
- no DB
- no mutation
- no provider execution

## What is displayed

- approval workflow totals for requested, approved, rejected, and expired
- recent approval records with task and risk context
- linked approval evidence such as `approval_granted` and `approval_rejected`
- tasks currently blocked by approval
- runtime snapshot refresh metadata

## How snapshot generation works

1. Local runtime files under `local-state/runtime/` are normalized.
2. A browser-safe module is generated at `dashboard/src/data/runtimeSnapshot.js`.
3. The Command Center imports that generated module as read-only data.

Refresh the snapshot with:

```bash
npm run generate:command-center-snapshot
```

## Why the UI stays read-only

The browser cannot safely read arbitrary local files or mutate local state
without an API boundary.

Approval decisions remain CLI-driven in this phase:

```bash
npm run approvals:list
npm run approvals:approve -- <approvalId> --reason "approved locally"
npm run approvals:reject -- <approvalId> --reason "rejected locally"
```

After a CLI decision, regenerate the snapshot so the updated approval state is
visible in the Command Center.

## What is not implemented

- live API reads
- DB reads
- UI mutation actions
- provider execution
- tool execution
- real Xcode execution
- private product execution

## Future path

- replace generated snapshot refresh with `GET /status` and `GET /runtime`
- add live read endpoints for approvals and evidence
- add DB mirror mode
- expose governed approval actions through an API boundary
- surface private product execution only after the safety boundary allows it
