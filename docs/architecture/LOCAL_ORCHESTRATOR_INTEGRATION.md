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

Phase 25-LOCAL adds guarded local agent-task execution. Deterministic local
checks can now move through contract, identity, agent context, capability,
traffic-plane, state-machine, and local write-boundary layers while emitting
evidence, audit, and runtime events.

## Future flow

```text
task request
  → task contract
  → identity context
  → agent context
  → capability check
  → runtime traffic plane policy decision
  → local approval workflow when required
  → task state-machine transition validation
  → deterministic local skill or check when explicitly allowed
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

## Guarded local proof path

Guarded local agent-task execution now proves:

- deterministic local checks can execute without providers or external tools
- capability checks happen before deterministic execution
- governed evidence, audit, and runtime records are emitted for successful
  checks
- blocked local actions stay inside the same bounded runtime path

## P28 — First governed private-project validation task

P28-LOCAL created the first governed private-project task through NEXUS in
`local-private` mode. A SHEPHERD validation plan was routed through the local
identity, capability, and state machine layers and transitioned `queued →
running → implementation_done`. No source mutation, build/test execution, or
provider/network/DB calls were made.

## P29 — Private-project backend command classification

P29-LOCAL classified private-project backend package scripts by execution safety
in `local-private` mode. The AUDITOR `verification.code_quality_gate` task was
routed through the same governed local path. No commands were executed.
Recommended first controlled validation command: `test` (P30).

## P30 — Private-project backend controlled validation

P30-LOCAL executed the first approved backend command in `local-private` mode.
The AUDITOR `verification.code_quality_gate` task ran `npm test` through the
controlled local execution path: allowlist check → preflight → `spawnSync` with
minimal env. Output was captured, redacted, and hashed. No mutation detected.

## P31 — Private-project test failure remediation

P31-LOCAL investigated and remediated one failing test from P30. Root cause
was classified as a `date_window_boundary_bug` with high confidence. A narrow
1-line patch was applied to the private-project backend source. All tests now
pass (58/58). Evidence, audit, and runtime event records appended through
write-guarded path.
