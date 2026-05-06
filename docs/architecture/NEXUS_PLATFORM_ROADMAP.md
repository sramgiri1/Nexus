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
- Phase 6 Execution runtime and Xcode Runner architecture

---

## Current Phase

### Phase 7 — Operator Platform Architecture

Goal:

- define the human operator layer for NEXUS
- define the UI, API, and database boundaries
- define the migration path from JSON memory to durable storage

Deliverables:

- Command Center architecture
- NEXUS API architecture
- durable DB architecture
- platform roadmap

Non-goals:

- no UI implementation
- no API implementation
- no DB implementation

Validation checks:

- architecture docs exist
- docs stay aligned with governor, contracts, state machine, and runtime-awareness principles

Risk level:

- medium

---

## Upcoming

### Phase 7A — Command Center UI Prototype

Goal:

- build the first operator-facing Command Center prototype

Deliverables:

- Mission Control shell
- project, queue, gate, evidence, runtime, and approval views
- read-only operator flows first

Non-goals:

- no production-grade RBAC
- no direct DB migration yet

Validation checks:

- screens map to architecture
- evidence-first operator flows
- no direct mutation around kernel boundary

Risk level:

- medium

### Phase 8 — Data Protection and DB Agent Security

Goal:

- define and implement safe handling for personal, confidential, restricted, and secret data before DB primary mode

Deliverables:

- data classification enforcement
- DB and agent access policy
- PII handling rules
- artifact redaction policy

Non-goals:

- not full production hardening yet

Validation checks:

- restricted data blocked from unsafe model or batch paths
- DB access design does not leak raw PII to agents

Risk level:

- high

### Phase 9 — Security Boundary

Goal:

- harden platform security around approvals, runtime boundaries, tool access, and data egress

Deliverables:

- tighter approval model
- runtime access policies
- external integration boundaries
- secret and artifact handling rules

Non-goals:

- not worker autoscaling yet

Validation checks:

- clear blocked-by paths
- no unsafe bypass around governor or policy boundaries

Risk level:

- high

### Phase 10 — OS Reliability

Goal:

- make NEXUS durable and recoverable under failure

Deliverables:

- retries and remediation architecture
- durable leases and heartbeats
- stuck-task handling
- replay and recovery patterns

Non-goals:

- not broad feature expansion

Validation checks:

- failure scenarios modeled
- task and evidence recovery path defined

Risk level:

- high

### Phase 11 — Tooling and Capability Model

Goal:

- formalize capabilities, tool grants, and integration boundaries

Deliverables:

- capability registry
- runtime and tool authorization model
- MCP registration policy

Non-goals:

- no arbitrary plugin sprawl

Validation checks:

- capabilities are explicit
- no hidden authority expansion

Risk level:

- medium

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
