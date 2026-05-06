# NEXUS Platform Roadmap

**Version:** 1.0  
**Date:** 2026-05-05

---

## Purpose

This roadmap tracks the platform build-out of NEXUS as an Agentic OS and clarifies which phases are complete, which are architectural, and which are still implementation work.

CareLoop remains parked until the OS foundation and UI direction are clearer.

---

## Completed

- Phase 1 Agentic OS PRD and positioning
- Phase 2 Contracts layer
- Phase 3 State machine layer
- Phase 4A Shared agent operating standards
- Phase 4A.1 Coding agent tooling alignment
- Phase 4B.1 Control agent retrofit
- Phase 4B.2 Verification agent retrofit
- Phase 4B.3 Product or build agent retrofit
- Phase 4B.4 Platform agent retrofit
- Phase 4B.5 Growth, strategy, and observability agent retrofit
- Phase 4C Agent OS readiness checker
- Phase 4D Agent task context adapter
- Phase 7 Operator platform architecture
- Phase 7A Command Center UI prototype
- Phase 8 Data protection and DB agent security
- Phase 9 Security boundary
- Phase 6 Execution runtime and Xcode Runner architecture
- Phase 10 OS reliability

---

## Current Phase

### Phase 11 — Tooling and Capability Model

Goal:

- formalize the capability bridge between agents, contracts, tools, skills,
  runtimes, providers, approvals, evidence, and policies

Deliverables:

- capability model architecture
- capability registry and schema
- tool and skill governance model
- capability policy and validation
- platform roadmap update

Non-goals:

- no runtime capability enforcement
- no new MCP servers
- no new tools or skills
- no dispatch changes

Validation checks:

- registry is machine-readable
- capability policy parses
- no hidden authority expansion
- docs stay aligned with runtime, security, approvals, and data protection

Risk level:

- medium

---

## Upcoming

### Phase 12 — Observability, Evals, Artifacts

Goal:

- make execution quality and system behavior measurable

Deliverables:

- runtime metrics
- evaluation harnesses
- artifact indexing
- evidence analytics

Non-goals:

- not demo polish first

Validation checks:

- measurable success and failure signals
- evaluator outputs tied to evidence

Risk level:

- medium

### Phase 13 — Demo and Showcase Mode

Goal:

- create replayable operator demos and investor-facing showcase paths

Deliverables:

- seeded scenarios
- read-only investor mode
- evidence timeline replay
- “NEXUS built this” narrative path

Non-goals:

- not production operations tooling expansion

Validation checks:

- demo is deterministic
- read-only guarantees are clear

Risk level:

- medium

### Phase 14 — Domain Ownership Policy

Goal:

- harden domain-level authority and artifact ownership across the OS

Deliverables:

- explicit ownership policy
- conflict rules
- artifact and decision ownership refinements

Non-goals:

- not new execution runtimes

Validation checks:

- no ambiguous ownership paths
- domain writes are explainable and auditable

Risk level:

- medium

### Phase 15 — Containerization and Worker Scaling

Goal:

- scale execution beyond local host while preserving kernel boundaries

Deliverables:

- linux worker strategy
- queue and lease architecture
- runtime scheduling policy
- eventual container execution path

Non-goals:

- not replacing `macos-xcode`

Validation checks:

- container workers do not claim iOS capability
- worker leases and evidence path are durable

Risk level:

- high

### Phase 16 — Production Hardening

Goal:

- make NEXUS safe for long-running production use

Deliverables:

- retention and backup design
- audit hardening
- operational runbooks
- reliability and safety completion pass

Non-goals:

- not early feature experimentation

Validation checks:

- backup and recovery story exists
- audit and approval paths are complete

Risk level:

- high

### Phase 5 — CareLoop Agent-Built MVP

Goal:

- resume CareLoop as a flagship product once OS and operator platform direction are stable

Deliverables:

- CareLoop execution on top of the hardened NEXUS operator platform
- product delivery using the OS constraints rather than parallel ad hoc workflows

Non-goals:

- not before the operator platform and safety model are clearer

Validation checks:

- CareLoop work uses the operator platform
- agent execution is evidence-backed and runtime-aware

Risk level:

- medium

---

## Parking Note

CareLoop is parked until:

- OS foundation is clearer
- operator platform direction is clearer
- UI, API, runtime, and durable-state boundaries are more mature

This avoids building product complexity on top of incomplete operating-system foundations.
