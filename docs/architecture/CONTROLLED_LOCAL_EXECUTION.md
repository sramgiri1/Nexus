# Controlled Local Execution

**Version:** 1.0  
**Date:** 2026-05-07

---

## Purpose

Add a narrowly scoped local execution mode that can write governed runtime
records for `DemoApp` tasks without executing providers, tools, or project
mutations.

## Why controlled local before private product execution

NEXUS should prove that real local OS records can be created safely before any
later private product execution path is attempted.

Controlled local execution shows that the system can:

- validate identity and agent context
- apply runtime traffic-plane decisions
- write only to approved local runtime files
- create redacted task, audit, evidence, runtime, approval, and incident
  records
- summarize the result without performing real work

## Flow

```text
task input
  → identity context
  → agent context
  → traffic plane
  → local write boundary
  → local task, evidence, audit, and runtime writes
  → execution result
```

## Included scenarios

- Controlled DemoApp task
- Approval required deploy
- Secret data blocked

## What may be written

Controlled local execution may write only to:

- `local-state/runtime/tasks.json`
- `local-state/runtime/evidence.jsonl`
- `local-state/runtime/audit.jsonl`
- `local-state/runtime/events.jsonl`
- `local-state/runtime/approvals.jsonl`
- `local-state/runtime/incidents.jsonl`

## Current phase boundary

- no provider calls
- no tool calls
- no project mutation
- no DB/API
- no private product execution yet
- not wired into `loop.js` or `runner.js`

## Future transition

Later phases can build on this mode by:

- surfacing generated local runtime-record summaries in Command Center
- wiring the adapter into controlled dispatch checkpoints
- introducing controlled tool execution
- introducing controlled provider execution
- exposing read endpoints backed by the same local runtime state
