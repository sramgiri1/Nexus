# Local Approval Workflow

**Version:** 1.0  
**Date:** 2026-05-07

---

## Purpose

Turn `REQUIRE_APPROVAL` into a real local workflow for `DemoApp` tasks:

```text
approval request
  → local approval record
  → approve or reject decision
  → approval evidence
  → allowed or blocked task transition
```

## Local approval lifecycle

1. A controlled local execution path determines that work requires approval.
2. NEXUS writes a local approval request to `local-state/runtime/approvals.jsonl`.
3. A local operator reviews pending approvals through the CLI.
4. The operator approves, rejects, or expires the approval request.
5. The decision appends:
   - an approval decision record
   - an audit record
   - approval evidence
6. State transitions such as `awaiting_approval -> running` may proceed only
   when `approval_granted` evidence is present.
7. Regenerating the Command Center snapshot makes the updated approval records
   and approval evidence visible in the read-only dashboard.

## Decision outcomes

- `requested`
- `approved`
- `rejected`
- `expired`

## Evidence relationship

Approval decisions create evidence records:

- `approval_granted`
- `approval_rejected`
- `approval_expired`

The local task state machine uses `approval_granted` evidence to allow
`awaiting_approval -> running`.

## Audit requirements

Every approval decision must append an audit record.

Local approval decisions are append-only and redacted:

- no project mutation
- no secret storage
- no private project references
- no direct DB or API activity

## Current phase boundary

- no UI mutation yet
- no API server
- no DB
- no provider calls
- no tool execution
- no private product execution yet
- no `loop.js` or `runner.js` wiring

Approval decisions are visible in the Command Center only after:

```bash
npm run generate:command-center-snapshot
```

## Relationship to state-machine enforcement

Local approval wiring sits on top of Phase 22 local task state-machine
enforcement:

- approval-required tasks remain in `awaiting_approval`
- rejected or expired approvals do not unlock execution
- only approval evidence allows the guarded transition forward

## Future path

Later phases can extend the same workflow with:

- Command Center approval actions under governor control
- read API routes for pending approvals
- DB-backed approval history
- release and gate approval wiring
