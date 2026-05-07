# Runtime Traffic Plane

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose

The runtime traffic plane is the first local enforcement layer that sits
between an agent and any model, tool, skill, runtime, provider, batch, or MCP
call.

Its job is to make every future execution request carry:

- identity context
- capability context
- policy decision context
- data classification context
- evidence record context
- behavior-baseline context

This phase adds local helper modules only. It does not fully wire the traffic
plane into orchestrator dispatch yet.

---

## Relation To Operational Control Categories

This phase focuses on the three operational categories that can be enforced
locally at runtime:

- privilege
- behavioral
- accountability

The other two categories remain broader architecture and SDLC concerns:

- design and configuration
- structural

NEXUS still documents those broader concerns, but the local traffic plane is the
first deterministic execution helper for the operational set.

---

## Privilege

Privilege means a call should only proceed when the caller can prove:

- who originated the request
- which agent is acting
- which capability is being used
- which action type is being attempted
- which runtime or provider is being targeted
- which data classes are involved
- whether approval is required

The local traffic plane enforces this through:

- identity validation
- capability requirement checks
- policy decision generation
- approval requirement escalation

---

## Behavioral

Behavioral control means NEXUS should notice when an agent begins acting
differently from its established local baseline.

The local helper layer tracks:

- tool call distribution
- action type distribution
- runtime and provider shifts
- chain depth changes
- egress spikes
- cost spikes

This is deterministic local baseline logic only. It is not a telemetry exporter
or anomaly service yet.

---

## Accountability

Accountability means NEXUS should be able to explain:

- which user originated the request
- which delegation path led to it
- which agent version acted
- which capability was invoked
- which policy decision allowed or blocked it
- which classifications were involved
- what hashes identify the input and output surfaces

The local helper layer does this through hashable evidence records rather than
raw prompt or response storage.

---

## Placement

The traffic plane sits between an agent and the following execution targets:

- model calls
- tool calls
- skill calls
- runtime calls
- batch calls
- MCP calls
- approval request creation

Every future call should later pass through the same local sequence:

identity
→ capability
→ policy
→ behavior comparison
→ evidence record
→ local write boundary
→ execution or block

---

## Current Phase Boundary

This phase adds:

- `runtime/identityContext.js`
- `runtime/policyDecision.js`
- `runtime/evidenceRecord.js`
- `runtime/behaviorBaseline.js`
- `runtime/trafficPlane.js`
- `runtime/index.js`

This phase does not:

- rewrite orchestrator dispatch
- add provider execution
- add DB persistence
- add external telemetry
- add runtime network calls
- enforce the traffic plane everywhere yet

Phase 16-LOCAL adds a read-only Command Center surface that can display local
traffic-plane sample status, policy decision posture, and evidence-record
availability. That UI wiring is a bundled snapshot only, not a live execution
adapter.

Phase 18-LOCAL adds the local write-boundary prototype that can persist
redacted task, evidence, audit, approval, incident, and runtime-event records
to `local-state/runtime/`. Dispatch wiring still remains out of scope.
