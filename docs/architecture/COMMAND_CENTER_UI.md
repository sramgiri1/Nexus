# Command Center UI Architecture

**Version:** 1.0  
**Date:** 2026-05-05

---

## Purpose

The NEXUS Command Center is the human operator console for the Agentic OS.

It is where founders, operators, reviewers, and later demo-mode viewers understand:

- what the OS is doing
- what is blocked
- what evidence exists
- what needs human attention now
- what risky action needs explicit approval

The Command Center does not bypass the kernel.

Every state-changing UI action goes through:

```text
UI → NEXUS API → Governor → Contracts → State Machine → Memory/DB
```

The UI never mutates runtime files, JSON memory, or database state directly.

---

## Core Principles

- show evidence, not just status
- show blockers clearly
- make state transitions understandable
- prioritize what needs human attention now
- avoid generic SaaS dashboard look
- feel like an operating system and mission control
- every button maps to an API action
- risky actions require approval
- all state-changing actions are audited
- UI must never mutate DB or memory directly

---

## Screen 1 — Mission Control

### Purpose

High-level OS dashboard.

### Must Show

- current founder intent or active mission
- active project
- active sprint or phase
- running tasks
- blocked tasks
- approvals needed
- release readiness
- gate status
- agent activity
- cost overview
- safety alerts
- batch queue status
- evidence summary
- latest major events
- next required human decision

---

## Screen 2 — Projects

### Must Show

- project list
- project stage
- project health
- release status
- active contracts
- active agents
- gates
- evidence count
- top risks
- recent decisions

---

## Screen 3 — Task Queue

### Must Show

- `queued`
- `running`
- `implementation_done`
- `awaiting_verification`
- `deferred_batch`
- `completed`
- `failed`
- `blocked`
- task contract status
- target agent
- project
- risk level
- `dependsOn` relationships
- blocking status
- batch or realtime flag
- retry or remediation status
- evidence links

---

## Screen 4 — Agents

### Must Show

- all 20 agents
- group: control, verification, product, platform, strategy, growth, observability
- current status
- current task
- allowed authority
- model policy
- batch eligibility
- cost
- failure rate
- last evidence
- readiness status

---

## Screen 5 — Contracts

### Must Show

- task contracts
- handoff contracts
- verification contracts
- release contracts
- state transition contracts
- validation status
- linked evidence
- linked tasks
- contract owner
- contract version or status

---

## Screen 6 — Verification Gates

### Must Show

- AUDITOR
- SENTINEL
- WARDEN
- gate status
- required evidence
- existing evidence
- blockers
- issues
- required remediation owner

---

## Screen 7 — Evidence

### Must Show

- skill results
- lint results
- test results
- xcode or `xcresult` artifacts
- log artifacts
- screenshots
- crash logs
- privacy or compliance reports
- release evidence
- evidence classification or redaction status

---

## Screen 8 — Execution Runtime

### Must Show

- `node-local` tasks
- `linux-container` tasks
- `macos-xcode` tasks
- `provider-api` calls
- `batch-provider` jobs
- `mcp-server` calls later
- `human-approval` tasks
- runtime health
- runtime failures
- runtime evidence

---

## Screen 9 — Batch Queue

### Must Show

- `batch_pending`
- `provider_submitted`
- `provider_processing`
- `provider_completed`
- `reconciled`
- `failed`
- provider
- model
- estimated cost
- discounted cost
- reconciliation status
- safety classification

---

## Screen 10 — Cost Center

### Must Show

- daily cost
- weekly cost
- cost by agent
- cost by provider
- cost by project
- batch savings
- budget warnings
- blocked expensive actions

---

## Screen 11 — Safety Center

### Must Show

- governor blocks
- secret scan events
- permission denials
- unsafe command attempts
- file boundary violations
- data classification blocks
- OpenRouter policy blocks
- batch safety blocks
- DB or PII safety blocks later

---

## Screen 12 — Approvals

### Must Show

- deploy approvals
- secrets approvals
- migration approvals
- production data approvals
- release approvals if configured
- requested by
- risk level
- project
- evidence
- approve or reject action

---

## Screen 13 — Release Control

### Must Show

- project release readiness
- AUDITOR, SENTINEL, and WARDEN status
- unresolved blockers
- release contract
- evidence checklist
- GO or NO-GO recommendation
- decision owner
- release history

---

## Screen 14 — Demo and Showcase Mode

### Must Show

- replay mode
- seeded demo data
- investor read-only view
- CareLoop demo scenario later
- evidence timeline
- “NEXUS built this” story

---

## Interaction Model

Every interactive action in Command Center falls into one of these classes:

| Action class | Example | Required handling |
| --- | --- | --- |
| Read-only | inspect gate evidence | API read only |
| Low-risk mutation | enqueue scoped task | API audit + contract validation + governor |
| Transition request | request task retry | API + state machine + audit |
| Risky mutation | deploy approval, migration approval | API + governor + approval + audit |
| Evidence access | open xcresult path | API returns reference, not raw dump by default |

---

## Design Direction

Command Center should look and behave like:

- mission control
- an operating console
- a real-time system supervisor

It should not feel like:

- a generic admin dashboard
- a CRM
- a PM board with cosmetic AI labels

The visual system should prioritize:

- hierarchy
- current state
- blocking path
- decision urgency
- evidence visibility
- runtime awareness

---

## What Phase 7 Does Not Implement

This phase does not:

- implement the UI
- create React routes
- create backend endpoints
- mutate JSON memory
- introduce auth or RBAC
- add demo seeding logic

It only defines the operator-facing architecture and the kernel boundary it must respect.
