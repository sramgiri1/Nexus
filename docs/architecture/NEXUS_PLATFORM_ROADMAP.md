# NEXUS Platform Roadmap

**Version:** 2.0
**Date:** 2026-05-14

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

## Completed (LOCAL phases continued)

- Phase 32-LOCAL Command Center Private Validation View
- Phase 33-LOCAL Command Center V2 Shell + Mission Action Bridge
- Phase 34-LOCAL Mission Composer Governed Kickoff
- Phase 35-LOCAL Mission Action Bridge
- Phase 36-LOCAL Agentic Workspace Home + Workflow Templates
- Phase 37-LOCAL Task Activation + Agent Assignment from UI
- Phase 38-LOCAL Agent Workbench + Human Review Loop
- Phase 39-LOCAL First Controlled Implementation Workflow from UI
- Phase 40-LOCAL Live Local API Backend for Command Center
- Phase 41 DB foundation for durable state
- Phase 41.5 Command Center UX stabilization and docs finalization

---

## Current Phase

### Phase 41.7.3B — Mission Control Tabbed Cockpit

Goal:

- convert Mission Control from a long cockpit into tabbed sections
- add scope-aware Portfolio, Project, and NEXUS OS Mission Control views
- keep project progress separate from OS roadmap state
- preserve local-private project boundaries and DemoApp isolation
- keep Command Center OS roadmap status synchronized with the phase registry

Deliverables:

- scope-aware Mission Control Overview, Workflows, Tasks, Agents, Gates, Evidence, Risks / Approvals, and Cost tabs
- Portfolio project cards and cross-project placeholder states
- NEXUS OS phase, service, docs, and roadmap summary states
- updated Playwright coverage for tabs, scope switching, and DemoApp boundaries
- updated `scripts/check-command-center-ux.js`

Non-goals:

- no full page tab rollout
- no Project Registry implementation
- no backend execution
- no DB writes
- no provider dispatch
- no private project source mutation

Validation checks:

- `npm run check:command-center-ux`
- `cd dashboard && npm run build && npm run test:unit && npm run test:pages`

Risk level:

- low

---

## Expanded OS Roadmap Snapshot

- Completed foundation: `P26-P41`
- Command Center UX stabilization: `P41.5.1` through `P41.5.6`
- Unified NEXUS Local Boot / Service Orchestration:
  - `P41.6.1` complete
  - `P41.6.2` complete
  - `P41.6.3` complete
  - `P41.6.4` complete
  - `P41.6.5` complete
  - `P41.6.6` complete
- `P41.7` Documentation System, Usage Guides, Reuse Audit, Refactor Foundation:
  - `P41.7.1` complete
  - `P41.7.2` complete
  - `P41.7.3` complete
  - `P41.7.3A` complete
  - `P41.7.3B` complete
  - `P41.7.3C` complete
  - `P41.7.3D` complete
  - `P41.7.3E` complete
  - `P41.7.4` complete
  - `P41.7.5` complete
  - `P41.7.6` complete
  - `P41.7.7` complete
- `P41.8.1` Centralized Activity Log + Observability Ledger Foundation
- `P41.8` Centralized Activity Log + Observability Ledger
- `P41.9` README + Architecture Diagram Registry
- `P42` Project Registry + Adapter Framework
- `P43` Scope Boundary + Project Packaging Safety
- `P44` Multi-Repo Workspace + Git/PR Lifecycle
- `P45` Agent Registry + Boundary Compiler
- `P46` Scoped Memory Architecture + Memory Center
- `P47` Trusted Context + Data Architecture Layer
- `P48` Governed Agentic Mesh
- `P49` Agent Definition Update Workflow
- `P50` Skill Registry + Skill Authoring Workflow
- `P51` Hook Registry + Safe Automation Lifecycle
- `P52` Tool / MCP Registry + Tool Governance
- `P53` Trigger + Integration Gateway
- `P54` API + Batch Execution Adapter
- `P55` Test Suite Manager: Project + OS
- `P56` Quality Intelligence + Test Gap Detection
- `P57` Cost Center + Budget Enforcement
- `P58` Policy Center + Governance Admin
- `P59` Secrets and Credential Boundary
- `P60` Worker Queue + Runtime Engine
- `P61` Concurrent Execution + Work Deduplication
- `P62` Conversational NEXUS Command Interface
- `P63` AI Interaction Snapshot + Granular Recovery Layer
- `P64` Provider + Tool Dispatch Through Governance
- `P64.1` Code Mode Runtime + Lazy Tool Loading
- `P65` Batch Intelligence Jobs for Large-Scale Analysis
- `P66` Self-Healing Failure Loop
- `P67` Controlled Source Mutation Expansion
- `P68` Self-Update Workflow for NEXUS OS
- `P69` Release / Deploy Loop
- `P70` Deploy Monitoring + Incident Mitigation
- `P71` Project Shipping Boundary + Export Pipeline
- `P72` DB-backed Runtime Primary
- `P73` Auth, RBAC, Multi-user Governance
- `P74` Observability, Telemetry, SLOs
- `P75` Backup, Restore, Disaster Recovery
- `P76` Tenant / Project Isolation
- `P77` Compliance and Audit Pack
- `P78` Self-Healing Enterprise Developer Preview

---

## Next Phases

- Phase 41.7.4 — OS Usage Documentation Foundation
- Phase 41.7.5 — Command Center Help Links
- Phase 41.7.6 — Docs Coverage Checker + Final Validation
- Phase 41.8 — Centralized Activity Log + Observability Ledger
- Phase 41.9 — README + Architecture Diagram Registry
- Phase 42 — Project Registry + Adapter Framework

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

### P39-LOCAL — First Controlled Implementation Workflow from UI

Goal:

- UI-driven workflow that applies a narrow, governed source change via the action bridge
- Target: `projects/careloop/docs/NEXUS_IMPLEMENTATION_LOG.md` (documentation only)
- CORE agent applies a governance log entry with proposal → apply → evidence/audit/runtime records
- Command Center shows patch summary, rollback note, validation result, and next action

Deliverables:

- `policy/controlled-implementation-workflow-policy.json` — P39 boundary (documentationMutationAllowed: true, sourceMutationAllowed: false)
- `implementation-actions/implementationStore.js` — append-only implementation action store
- `implementation-actions/implementationPlan.js` — createImplementationProposal, createPatchPlan, createRollbackPlan, writeImplementationProposalReports
- `implementation-actions/implementationBridge.js` — validate → propose → patch → evidence → audit → runtime event; validationStatus: SKIPPED for doc-only
- `implementation-actions/index.js` — re-exports all implementation functions
- Action server routes: POST /actions/implementation/propose, POST /actions/implementation/apply, GET /actions/implementation, GET /actions/implementation/:actionId
- `dashboard/src/api/implementationActions.js` — browser fetch-only client
- Implementation Workflow page at /command-center/implementation: task selector, proposal details, action buttons, result panels
- OS Roadmap: P38 COMPLETE, P39 IN_PROGRESS
- `scripts/check-controlled-implementation-workflow.js` — 15-section validator (87/87 checks)

Non-goals:

- no source, test, schema, iOS, or production code mutations in P39
- no provider calls, network calls, or DB access
- validation deferred (SKIPPED status) — doc-only change does not require backend validation gate

Validation checks:

- `npm run check:controlled-implementation-workflow` passes 87/87 checks
- 42/42 E2E route tests pass
- Propose → apply → evidence + audit + runtime event recorded
- Action bridge offline → action buttons disabled with clear message
- Forbidden paths include src/, test/, prisma/, ios/ (multi-layer enforcement)
- Patch summary, rollback note, and validation status shown in result panels

Risk level:

- low

---

### P40-LOCAL — Live Local API Backend for Command Center

Goal:

- Move Command Center from generated snapshots toward live local API-driven data
- Local-only HTTP server (port 4321, 127.0.0.1) serving read + action endpoints
- No DB, no providers, no external network — reads existing JSON/JSONL runtime files
- Command Center TopBar shows Live API online/offline + refresh state
- Source badges on Mission Control, Evidence, and Safety pages

Deliverables:

- `local-api/server.js` — createLocalApiServer, startLocalApiServer, stopLocalApiServer
- `local-api/safeResponse.js` — sendJson, sendError, redactApiPayload, buildEnvelope
- `local-api/routes/{health,status,missions,tasks,agents,evidence,audit,runtime,contracts,projects,roadmap,actions}.js`
- `local-api/index.js` — re-exports all functions
- `policy/live-local-api-policy.json` — P40 boundary (localOnly, dbBacked: false, governed_bridges_only)
- `scripts/start-local-api.js` — npm run local-api:start entry point
- `dashboard/src/api/localApiClient.js` — browser fetch-only client with offline fallback
- LiveApiPage at /command-center/liveapi: connection status, endpoint coverage, page coverage, safety boundary
- TopBar: API status indicator (Online/Offline), snapshot fallback badge, refresh button
- Source badges on Mission Control, Evidence, Safety Center pages
- `scripts/check-live-local-api.js` — 14-section validator (147/147 checks)

Non-goals:

- no DB-backed state (P41)
- no real agent execution (P42)
- no external provider calls
- no arbitrary file reads (enforced by safeFileReader boundary)

Validation checks:

- `npm run check:live-local-api` passes 147/147 checks
- 50/50 E2E route tests pass
- All 11 read endpoints return ok with metadata envelope
- Health endpoint returns dbBacked:false, providerCallsEnabled:false, externalNetworkEnabled:false
- Action routes delegate to existing governed bridges only

Risk level:

- low

---

### P41-LOCAL — DB Foundation + Durable State

Goal:

- Introduce a local DB-backed state layer, additive to the working file-backed state
- DB is disabled-by-default in P41 — schema artifacts only, no real DB connections
- File fallback remains the source of truth throughout P41
- `db/` module defines schema, health, repository, import plan, snapshot mapper

Deliverables:

- `db/schema.json` — 18 NEXUS durable state entity definitions
- `db/schema.sql` — portable SQL schema artifact (not executed in P41)
- `db/dbConfig.js` — loadDbConfig, validateDbConfig, getDbMode (defaults to "disabled")
- `db/dbHealth.js` — getDbHealth, getDbReadiness, summarizeDbStatus
- `db/dbRepository.js` — file-backed reads for all 18 entities; writeNotSupportedYet
- `db/dbImportPlan.js` — buildDbImportPlan, validateDbImportPlan, summarizeImportReadiness, writeImportPlanReport
- `db/dbSnapshotMapper.js` — mapLocalStateToDbEntities, createDbSeedPreview, writeDbFoundationStatus
- `db/index.js` — re-exports all db functions
- `policy/db-foundation-policy.json` — P41 boundary (dbWritesEnabled: false, productionDbAllowed: false)
- `local-api/routes/db.js` — GET /db returns DB health, entity list, import plan
- `local-api/server.js` — GET /db route added
- `dashboard/src/api/localApiClient.js` — getDbStatus() added
- DurableStatePage at /command-center/database: DB mode, entity table, import plan, next phase
- Durable State nav item with P41 badge
- DB Foundation Boundary in Safety Center
- Persistence badge in TopBar
- /db in Live API Status endpoint list
- OS Roadmap: P40 COMPLETE, P41 IN_PROGRESS, P42 PLANNED/next
- `scripts/check-db-foundation.js` — 13-section validator
- `scripts/db-foundation-status.js` — status printer with import plan

Non-goals:

- no DB writes in P41
- no real DB connections or migrations
- no provider calls, network calls, or source mutations

Validation checks:

- `npm run check:db-foundation` passes all checks
- GET /db returns ok with dbBacked: false, entityCount: 18, fileFallbackRequired: true
- All 18 entity sources mapped in import plan
- Policy enforces dbWritesEnabled: false and productionDbAllowed: false
- No DB connections in any P41 module

Risk level:

- low

---

## Upcoming

### P41.5 — Command Center UX Stabilization Complete

P41.5 is now complete. It covers:

- route-wide stale phase-label cleanup
- capability-state cleanup
- System / Dark / Light theme support
- Mission Control enterprise layout
- page-specific Command Center UX cleanup
- route-wide screenshot audit
- usage docs, codebase docs, README finalization, and docs coverage checks

### P41.6 — Unified NEXUS Local Boot / Service Orchestration

Goal:

- provide a clean local boot flow for the dashboard, local API, and action bridge

Notes:

- this follows P41.5
- current manual service start commands remain the supported model until P41.6 lands

### P41.7 — Documentation System, Usage Guides, Reuse Audit, and Refactor Foundation

P41.7 now breaks down into explicit documentation-system subphases:

- `P41.7.1` — Codebase Documentation Standard + Module Registry
- `P41.7.2` — Reuse Audit + Duplicate Pattern Inventory
- `P41.7.3` — Shared Helper Catalog + Refactor Candidate Plan
- `P41.7.3A` — Command Center Tab System Foundation + Multi-Project Scope Shell
- `P41.7.3B` — Mission Control Tabbed Cockpit
- `P41.7.3C` — Page Tab Rollout - Workspace / Tasks / Workbench / Implementation
- `P41.7.3D` — Page Tab Rollout - Live API / Durable State / Evidence / Safety / Projects / Roadmap / Cost / Batch
- `P41.7.3E` — Tabbed UX Tests, Docs, and OS Phase Status Finalization
- `P41.7.4` — OS Usage Documentation Foundation
- `P41.7.5` — Command Center Help Links + Docs Navigation
- `P41.7.6` — Docs Coverage Checker + Final Validation
- `P41.7.7` — Command Center Header, OS Roadmap, and Docs Page Polish

P41.7 is complete after the final docs and Command Center polish sweep. The
track now includes codebase documentation standards, module and phase
registries, reuse/refactor planning, route-wide tab documentation, operator
usage guides, route-aware local help links, docs coverage checks, OS phase
status validation, a compact Command Center header, a three-tab OS Roadmap, and
a real Docs & Guides index. P41.8.1 starts the NEXUS OS activity and
observability track.

#### P41.7.7 — Command Center Header, OS Roadmap, and Docs Page Polish

P41.7.7 simplifies the Command Center top bar, reduces read-only/planned badge
noise, collapses OS Roadmap to Completed / In Progress / Planned, and makes
Docs & Guides a real usage/codebase/architecture documentation index. It does
not add backend execution, provider dispatch, DB writes, worker runtime, local
API behavior changes, action bridge behavior changes, or private project
mutation.

The goal of the track is to improve repo understanding, reduce documentation
drift, and prepare later safe refactor work without expanding runtime scope.

### P41.8 — Centralized Activity Log + Observability Ledger

Goal:

- unify evidence, audit, runtime events, and operator activity surfaces

Planned subphases:

- `P41.8.1` — Activity Event Schema + Correlation ID Model
- `P41.8.2` — Central Activity Logger
- `P41.8.3` — API/UI/Action Bridge Activity Capture
- `P41.8.4` — Command Center Activity Log Page
- `P41.8.5` — Trace View by Correlation ID
- `P41.8.6` — Activity Tests + Docs + Final Validation

#### P41.8.1 — Activity Event Schema + Correlation ID Model

P41.8.1 defines a redaction-safe activity event schema, activity categories,
correlation IDs, parent/child activity linkage, validation helpers, and the
first centralized activity log architecture document. It is foundation-only: it
does not instrument runtime paths, add logger writes, add Activity Log UI, add
activity API routes, call providers, start workers, write to a DB, or mutate
project source.

### P41.9 — README + Architecture Diagram Registry Follow-through

Goal:

- extend the diagram registry and any remaining architecture visualization
  follow-through that was not finished during P41.5.6

### P42 — Project Registry + Adapter Framework

Goal:

- formalize project registration and adapter posture after the current runtime,
  governance, and operator layers stabilize

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
