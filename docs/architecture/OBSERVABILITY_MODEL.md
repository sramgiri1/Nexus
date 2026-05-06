# Observability Model

**Version:** 1.0  
**Date:** 2026-05-06

---

## Core Principle

NEXUS must be observable by design.

Every important action should produce:

- trace event
- evidence item
- audit event where appropriate
- artifact reference where appropriate
- telemetry record where appropriate

Agent claims are not observability.

Observable facts come from:

- contracts
- state transitions
- tool or skill results
- runtime events
- evidence artifacts
- model usage
- safety events
- approvals
- incident records
- eval results

---

## Observability Goals

- know what happened
- know who or what caused it
- know why it happened
- know which contract allowed it
- know which capability allowed it
- know which runtime executed it
- know which evidence supports it
- know which policy blocked it
- know cost and provider usage
- know whether output was validated
- know what is stuck, risky, or release-blocking

---

## Observability Surfaces

### 1. Command Center

- Mission Control
- Task queue
- Agent fleet
- Gates
- Evidence
- Runtime
- Safety
- Cost
- Approvals
- Release Control

### 2. Reports

- readiness reports
- data protection reports
- security boundary reports
- reliability reports
- capability reports
- eval reports

### 3. Artifacts

- logs
- screenshots
- `xcresult`
- test output
- reports
- diff summaries
- model responses
- approval results

### 4. Audit Trail

- state-changing actions
- approvals
- policy blocks
- tool execution
- provider usage
- capability usage

---

## What Must Be Observable

- task lifecycle
- agent execution
- tool or skill execution
- state transitions
- batch lifecycle
- provider calls
- runtime execution
- Xcode runner output
- safety or governor blocks
- data protection blocks
- approvals
- retries
- DLQ events
- incidents
- release decisions
- capability checks
- cost

---

## Proof Surfaces

Observability in NEXUS is built around proof surfaces rather than status-only UI.

The core proof surfaces are:

- traces that explain causality
- artifacts that preserve output references
- evidence that supports gates and release decisions
- telemetry that quantifies system behavior
- eval results that prove policy and OS-level correctness scenarios

Artifacts and evidence are proof surfaces. Telemetry is an operational surface.
Evals are a quality and safety surface. Together they make the OS explainable.

---

## Non-goals

This phase does not implement runtime telemetry exporters or a live observability
pipeline.

It defines models, policies, examples, and validation only.
