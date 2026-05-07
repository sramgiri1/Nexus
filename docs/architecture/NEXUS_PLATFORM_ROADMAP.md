# NEXUS Platform Roadmap

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose

This roadmap tracks the public platform build-out of NEXUS as an Agentic OS and
clarifies which phases are complete, which are architecture-only, and which are
still future implementation work.

The public repo uses `DemoApp` for showcase material. Private product work
belongs in separate private repos.

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
- Phase 7 Operator platform architecture
- Phase 7A Command Center UI prototype
- Phase 8 Data protection and DB agent security
- Phase 9 Security boundary
- Phase 10 OS reliability
- Phase 11 Tooling and capability model
- Phase 12 Observability, evals, and artifacts
- Phase 13 Demo and showcase mode
- Phase 14 Domain ownership policy
- Phase 15-LOCAL Runtime traffic plane and identity propagation
- Phase 16-LOCAL Command Center live wiring
- Phase 17-LOCAL Local state adapter and read API boundary
- Phase 18-LOCAL Local orchestrator read/write integration plan
- Phase 19-LOCAL Orchestrator adapter dry-run mode
- Phase 20-LOCAL Controlled local execution mode
- Phase 21-LOCAL Command Center runtime file ingestion
- Phase 22-LOCAL State machine enforcement in local executor

---

## Current Phase

### Phase 23-LOCAL — Approval Workflow Wiring for Local Execution

Goal:

- turn `REQUIRE_APPROVAL` into a real local approval workflow with request,
  decision, approval evidence, and guarded transition support

Deliverables:

- append-only local approval request store
- approve and reject CLIs
- approval decision audit and evidence records
- approval evidence support for `awaiting_approval -> running`
- validation for local approval request and decision flow

Non-goals:

- no provider calls
- no external tool execution
- no project mutation
- no DB or API server
- no dispatch rewrite
- no private product execution

Validation checks:

- approval requests append to local runtime state
- approve and reject decisions append audit and approval evidence
- guarded approval transitions respect `approval_granted`
- existing local execution, runtime, and Command Center checks remain green

Risk level:

- medium

---

## Upcoming

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

### Future Public Platform Work

Goal:

- continue turning the public repo into a recruiter-, investor-, and reviewer-
  friendly proof surface without leaking private work

Deliverables:

- replay mode
- stronger public screenshots and walkthrough assets
- future runtime enforcement milestones
- API and DB implementation phases when the boundaries are ready
- public repo separation from old private history when a clean export is ready

Non-goals:

- not exposing private product ideas in the public repo

Validation checks:

- showcase remains public-safe
- proof surfaces remain evidence-first

Risk level:

- medium

---

## Private Product Work Later

Private product delivery should resume only after the public OS foundation,
runtime enforcement, approvals, safety boundaries, and durable execution path
are more mature. That work belongs in private repos, not in the public DemoApp
showcase surface.
