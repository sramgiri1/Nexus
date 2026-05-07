# Orchestrator Adapter Dry-Run

**Version:** 1.0  
**Date:** 2026-05-07

---

## Purpose

Create a local orchestrator adapter that proves the OS path without executing
real work.

## Why dry-run first

Dry-run mode lets NEXUS prove orchestration structure before any live execution
is allowed.

It exercises identity, capability, policy, evidence, and local write-boundary
checks without:

- provider calls
- tool calls
- project mutation
- DB access
- API access

## Flow

```text
task input
  → identity context
  → agent context
  → traffic plane
  → local write boundary dry-run
  → evidence and audit simulation
  → dry-run result
```

## Included scenarios

- Demo release review
- Demo backend task
- Demo QA gate task
- Approval required deploy
- Secret data blocked

## Current phase boundary

- no provider calls
- no tool calls
- no project mutation
- no DB/API
- no private product execution yet
- not wired into `loop.js` or `runner.js`

## Future transition

Later phases can move from dry-run to controlled local execution by routing the
same adapter path into:

- real task dispatch
- controlled tool execution
- controlled provider execution
- local durable state updates
- Command Center read surfaces backed by live local state
