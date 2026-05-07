# Local Orchestrator Integration

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose

Define how local NEXUS execution will eventually connect the orchestrator to the
runtime traffic plane, local write boundary, and Command Center read boundary.

## Current phase

This phase does not wire `loop.js` or `runner.js`.

It prepares the deterministic local helpers needed first.

Phase 19-LOCAL adds an orchestrator adapter dry-run mode on top of those
helpers. That adapter proves the local OS path end to end without executing
agents, tools, providers, or project mutations.

Phase 20-LOCAL adds controlled local execution on top of the same path. It
uses the traffic plane and local write boundary to create real local runtime
records for `DemoApp` only, while still keeping providers, tools, project
mutation, DB, and API layers disabled.

Phase 22-LOCAL adds local state-machine enforcement to the same path. Task
state changes now validate against the existing task state machine before the
local write boundary commits them.

Phase 23-LOCAL adds a local approval workflow. Approval-required work now
creates append-only approval requests and uses approval evidence to unlock
guarded `awaiting_approval -> running` transitions.

## Future flow

```text
task request
  → identity context
  → capability check
  → runtime traffic plane policy decision
  → local approval workflow when required
  → task state-machine transition validation
  → local write boundary
  → task, evidence, and audit update
  → Command Center read boundary
```

## Integration points

Future orchestrator wiring should use these checkpoints:

- before dispatch
- before tool call
- before model call
- before state transition
- after skill result
- after evidence record

## Why this layer is needed first

Local execution should not write arbitrary files or mutate OS state directly.

The local write boundary gives the orchestrator a constrained path for:

- task creation
- task state changes
- evidence append
- audit append
- runtime event append
- approval record append
- incident record append

## Private product readiness

This layer is needed before later private product execution because the OS must
be able to explain who acted, what was written, what policy allowed it, and
where evidence and audit records landed.

## Current non-goals

- no dispatch wiring yet
- no provider calls
- no DB
- no API server
- no mutation API
- no private product execution in this phase

## Dry-run proof path

The dry-run adapter now proves:

- task input normalization
- identity propagation
- agent context construction
- runtime traffic-plane policy evaluation
- dry-run local write-boundary validation
- dry-run evidence and audit simulation
- structured dry-run result reporting

## Controlled local proof path

Controlled local execution now proves:

- task creation through the local write boundary
- append-only audit recording
- append-only evidence recording
- append-only runtime-event recording
- approval-request recording for blocked high-risk work
- blocked-attempt audit and incident recording for secret-data paths
