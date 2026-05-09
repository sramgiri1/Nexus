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
- Phase 23-LOCAL Approval workflow wiring for local execution
- Phase 24-LOCAL Command Center approval and runtime refresh
- Phase 25-LOCAL Guarded local agent task execution
- Phase 26-LOCAL Private project mode boundary
- Phase 27-LOCAL Private project inventory and readiness snapshot
- Phase 28-LOCAL Private project first governed validation task
- Phase 29-LOCAL Private project backend command classification
- Phase 30-LOCAL Private project backend controlled validation
- Phase 31-LOCAL Private project test failure remediation

---

## Current Phase

### Phase 32-LOCAL — Command Center Private Validation View

Goal:

- surface private-project validation status in Command Center through a
  generated local-private snapshot without adding API, DB, or UI mutation

Deliverables:

- local-private private validation snapshot builder
- generated browser-safe dashboard data module
- Command Center private validation summary and timeline
- evidence, audit, and runtime reference visibility
- known validation hygiene note for restoring the public-safety baseline before
  guarded-task checks when private branch metadata leaks into the generated
  report
- mode boundary: `local-private` or `test` only

Non-goals:

- no live API
- no DB
- no UI mutation
- no provider or network calls
- no test execution from the UI
- no private project mutation

Validation checks:

- snapshot generation succeeds in `local-private` mode
- Command Center shows private validation panels with read-only language
- backend validation status remains 58/58 PASS in the generated view
- evidence, audit, and runtime references remain redacted
- public/demo surfaces remain DemoApp-only or generic private-project wording
- no private project tree mutation from the checker
- public-safety baseline remains restorable when private branch metadata leaks

Risk level:

- low

---

---

### Phase 36-LOCAL — Agentic Workspace Home + Workflow Templates

Goal:

- transform Command Center from a reports dashboard into an Agentic Workspace where the founder chooses what NEXUS should do next

Deliverables:

- `workspace/workflowTemplates.js` — 8 workflow template metadata objects
- `workspace/workflowRecommendations.js` — next-best action and workspace summary logic
- `workspace/index.js` — re-exports all workspace functions
- `policy/agentic-workspace-policy.json` — P36 boundary (execution: false)
- WorkflowCard, WorkspaceBand, WorkspacePage components in CommandCenterV2.jsx
- `agenticWorkspace` field in commandCenterViewModel.js with full workspace state
- Granular OSRoadmap entries P36–P45 + Enterprise Release Candidate
- `scripts/check-agentic-workspace.js` — 12-section workspace validator

Non-goals:

- no workflow execution in P36
- no task activation (arrives in P37)
- no provider calls, network calls, or project mutation

Validation checks:

- `npm run check:agentic-workspace` passes 12/12 sections
- 25/25 E2E route tests pass
- all 8 workflow template IDs present and structurally valid
- nextBestAction targets P37 (task activation)
- public-safety baseline unchanged
- no private project file mutations

Risk level:

- low

---

### Phase 37-LOCAL — Task Activation + Agent Assignment from UI

Goal:

- allow the operator to activate planned mission tasks from the Command Center UI, converting them into governed runtime tasks without executing agents

Deliverables:

- `task-actions/taskActivationBridge.js` — validates, activates, and records mission tasks
- `task-actions/taskActivationStore.js` — append-only store for activation action records
- `task-actions/index.js` — re-exports all task activation functions
- `policy/task-activation-bridge-policy.json` — P37 boundary (execution: false, agent dispatch: false)
- `dashboard/src/api/taskActions.js` — browser API client for task activation
- Task Queue page: 6 planned mission tasks with per-task Activate buttons and state display
- Agent Fleet page: mission task assignments table (planned/activated counts per agent)
- Mission Control: NBA updated to point to task activation in Task Queue
- OS Roadmap: P36 COMPLETE, P37 IN_PROGRESS
- `scripts/check-task-activation-bridge.js` — 12-section validator
- `docs/architecture/TASK_ACTIVATION_AND_AGENT_ASSIGNMENT.md` — architecture doc

Non-goals:

- no agent execution in P37
- no provider calls, network calls, or command execution
- no project mutation

Validation checks:

- `npm run check:task-activation-bridge` passes 12/12 sections
- 30/30 E2E route tests pass
- runtime task created with state=queued, redacted=true
- evidence, audit, runtime event records created per activation
- duplicate activation returns idempotent response
- action bridge offline → buttons disabled with clear reason
- no private project file mutations

Risk level:

- low

---

### Phase 38-LOCAL — Agent Workbench + Human Review Loop

Goal:

- make each activated task feel like a real agent work item the operator can inspect and review; record approve / reject / request_changes decisions in an append-only review store without executing any agent

Deliverables:

- `workbench/reviewStore.js` — append-only review record store (local-state/runtime/reviews.jsonl)
- `workbench/agentWorkbench.js` — builds workbench views: runtimeTaskId, assignedAgent, capability, riskLevel, mutationAllowed=false, executionAllowed=false, expected output, review status
- `workbench/reviewBridge.js` — validates and records review decisions; writes evidence, audit, and runtime events; does NOT update task state machine (no supported transitions)
- `workbench/index.js` — re-exports all workbench functions
- `policy/agent-workbench-policy.json` — P38 boundary (taskExecutionAllowed: false, reviewActionsAllowed: true)
- Action server routes: POST /actions/workbench/review, GET /workbench, GET /workbench/:taskId, GET /workbench/:taskId/reviews
- `dashboard/src/api/workbenchActions.js` — browser fetch-only client for all workbench routes
- Agent Workbench page at /command-center/workbench: task selector, workbench view, review panel with Approve / Request Changes / Reject buttons
- Task Queue page: "Open Workbench" button appears after task activation
- OS Roadmap: P37 COMPLETE, P38 IN_PROGRESS
- `scripts/check-agent-workbench.js` — 13-section validator (89/89 checks)

Non-goals:

- no agent execution in P38
- no provider calls, network calls, or command execution
- no project mutation
- task state machine not updated (review states tracked separately in reviews.jsonl)

Validation checks:

- `npm run check:agent-workbench` passes 89/89 checks
- 36/36 E2E route tests pass
- review decision recorded with evidence, audit, and runtime event
- approve → PASS evidence, reject → FAIL evidence, request_changes → INFO evidence
- action bridge offline → review buttons disabled with clear message
- no private project file mutations
- `mutationAllowed: false` and `executionAllowed: false` enforced in all workbench views

Risk level:

- low

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
