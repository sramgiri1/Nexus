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

---

## Current Phase

### Phase 15-LOCAL — Runtime Traffic Plane and Identity Propagation

Goal:

- add the first deterministic local enforcement layer for privilege,
  behavioral monitoring, and accountability without rewriting dispatch yet

Deliverables:

- runtime traffic-plane helper modules
- identity propagation model
- per-call policy decision model
- accountability evidence record model
- local behavior-baseline model
- validation against capability, security, observability, and public-safety
  layers

Non-goals:

- no runtime enforcement changes
- no agent prompt changes
- no dashboard behavior changes
- no real provider calls
- no dispatch rewrite

Validation checks:

- traffic plane modules exist and export correctly
- policy sample cases behave deterministically
- accountability records hash and verify
- public-safe demo surface remains intact

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
