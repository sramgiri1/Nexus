# Guarded Local Agent Task Execution

**Version:** 1.0  
**Date:** 2026-05-07

---

## Purpose

Start executing deterministic local agent-task steps through the governed
NEXUS path without providers, external tools, project mutation, DB access, API
layers, or private product execution.

## Difference from controlled local execution

Controlled local execution proves that local runtime records can be written
safely.

Guarded local agent task execution goes one step further by allowing a narrow
set of deterministic local agent actions to run through:

```text
task contract
  → identity context
  → agent context
  → capability check
  → runtime traffic plane
  → task state machine
  → deterministic local step
  → evidence
  → audit
  → runtime event
  → Command Center snapshot refresh later
```

## Deterministic local actions only

This phase allows only these local actions:

- `validate_demo_contracts`
- `validate_demo_reports`
- `validate_runtime_snapshot`
- `validate_public_safety_surface`

Each action reads only approved local files through the safe local read
boundary.

## Evidence generation

Every guarded local task must produce redacted runtime records:

- task record
- evidence record
- audit record
- runtime event

Verification-plane tasks may also complete the local state-machine path when
their deterministic evidence supports the transition.

## Current phase boundary

- no provider calls
- no external tool calls
- no project mutation
- no API server
- no DB
- no private product execution
- no `loop.js` or `runner.js` wiring

## Future bridge

Later phases can build on this guarded local mode by:

- exposing governed local execution visibility in the Command Center
- adding controlled real tool execution
- adding controlled provider execution
- wiring the adapter into orchestrator dispatch checkpoints
- bridging the same path toward future private product execution only after the
  safety boundary allows it
