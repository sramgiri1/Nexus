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

## Future flow

```text
task request
  → identity context
  → capability check
  → runtime traffic plane policy decision
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
