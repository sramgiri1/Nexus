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

Phase 25-LOCAL builds on this by introducing guarded local agent-task
execution for deterministic local checks. That path still uses the same
identity, traffic-plane, state-machine, and local write boundary layers, but
it allows a narrow set of read-only local validation actions to emit governed
evidence.

## Flow

```text
task input
  → identity context
  → agent context
  → traffic plane
  → task state-machine validation
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

- local task transitions are validated through the existing task state machine
  before writes
- approval-required work now creates real local approval requests and waits for
  approval evidence before it can proceed
- guarded local agent tasks can now execute deterministic local checks and emit
  evidence through the governed path
- Command Center can surface those approval records only through regenerated
  read-only runtime snapshots
- no provider calls
- no tool calls
- no project mutation
- no DB/API
- no private product execution yet
- not wired into `loop.js` or `runner.js`

## Future transition

Later phases can build on this mode by:

- wiring the adapter into controlled dispatch checkpoints
- introducing controlled tool execution
- introducing controlled provider execution
- exposing read endpoints backed by the same local runtime state

## P28 — First governed private-project validation task

P28-LOCAL used the controlled local execution path to route the first governed
private-project task through the local write boundary. The SHEPHERD validation
plan task was committed to tasks.json, with evidence, audit, and event records
appended through the same write-guarded runtime path. No source mutation or
execution occurred.

## P29 — Private-project backend command classification

P29-LOCAL used the same controlled local execution path for the AUDITOR command
classification task. Backend package scripts were classified by safety category
without executing any of them. Evidence, audit, and runtime event records were
appended through the write-guarded path. No commands were executed.
