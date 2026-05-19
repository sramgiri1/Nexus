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
  - `P41.9.1` Architecture Diagram Registry Foundation — complete
  - `P41.9.2` Architecture Diagram Rendering + README Follow-through — complete
- `P42` Project Registry + Adapter Framework
  - `P42.1` Project Registry Schema + Policy — complete
  - `P42.2` nexus.project.json Loader + Validator — complete
  - `P42.3` Stack Profile Model — complete
  - `P42.4` Project Onboarding Wizard / nexus:init-project — complete
  - `P42.5` Project Selector in Command Center — complete
  - `P42.6` Project Capability Matrix — complete
  - `P42.7` Project Registry Adapter Final Validation + Roadmap Closure — complete
- `P43` Scope Boundary + Project Packaging Safety
  - `P43.1` Scope Classification Model — complete
  - `P43.2` Project vs OS Mutation Boundary — complete
  - `P43.3` Project Export Safety Rules — complete
  - `P43.4` Redacted Release Manifest — complete
  - `P43.5` Command Center Scope Boundary UX — complete
  - `P43.6` Packaging Safety Checker + Final Validation — complete
- `P44` Multi-Repo Workspace + Git/PR Lifecycle
  - `P44.1` Repo Registry — complete
  - `P44.2` Repo Ownership + Dependency Map — complete
  - `P44.3` Branch / Commit Workflow Model — complete
  - `P44.4` PR Draft + Evidence Link Model — complete
  - `P44.5` Review Comment Ingestion Model — complete
  - `P44.6` Merge Gate + Rollback Branch Model — complete
  - `P44.7` Multi-Repo Git/PR Final Validation — complete
- `P45` Agent Registry + Boundary Compiler
  - `P45.1` Agent Registry Schema — complete
  - `P45.2` Agent Capability Matrix — complete
  - `P45.3` Agent Path / Tool / Data Boundaries — complete
  - `P45.4` Boundary Compiler — complete
  - `P45.5` Command Center Agent Registry UX — complete
  - `P45.6` Agent Boundary Tests + Final Validation — complete
- `P46` Scoped Memory Architecture + Memory Center
  - `P46.1` Memory Scope Model — complete
  - `P46.2` Project / OS / Task / Session Memory Stores — complete
  - `P46.3` Memory Packet Builder — complete
  - `P46.4` Memory Access Policy — complete
  - `P46.5` Memory Freshness + Staleness — complete
  - `P46.6` Command Center Memory Center — complete
  - `P46.7` Tests + Docs + Final Validation — complete
- `P47` Trusted Context + Data Architecture Layer — complete
- `P48` Governed Agentic Mesh — complete
  - `P48.1` Agent Message Contract — complete
  - `P48.2` Agent Message Bus — complete
  - `P48.3` Agent Rooms — complete
  - `P48.4` Handoff Protocol — complete
  - `P48.5` Context Sync Through Policy — complete
  - `P48.6` Command Center Agent Rooms UX — complete
  - `P48.7` Mesh Tests + Docs + Final Validation — complete
  - `P48.8` Projects Page Enterprise UX + Multi-Project Operating Surface Polish — complete
- `P49` Agent Definition Update Workflow — complete
  - `P49.1` Agent Definition Change Proposal — complete
  - `P49.2` Boundary Diff — complete
  - `P49.3` AUDITOR / WARDEN Review — complete
  - `P49.4` Human Approval Gate — complete
  - `P49.5` Versioning + Rollback — complete
  - `P49.6` Agent Regression Tests + Command Center UX — complete
  - `P49.7` Final Validation — complete
  - `P49.8` Projects Page Productization + Portfolio/Project Operating Surface — complete
- `P50` Skill Registry + Skill Authoring Workflow — complete
  - `P50.1` Skill Registry Schema — complete
  - `P50.2` Skill Contract Model — complete
  - `P50.3` Governed Skill Templates — complete
  - `P50.4` Stack-Specific Skill Profiles — complete
  - `P50.5` Skill Test Requirements — complete
  - `P50.6` Command Center Skill Registry View — complete
  - `P50.7` Final Validation — complete
- `P51` Hook Registry + Safe Automation Lifecycle — complete
  - `P51.1` Hook Registry Schema — complete
  - `P51.2` Trigger Definition Model — complete
  - `P51.3` Rate Limits, Retry Limits, and Runtime Guard Model — complete
  - `P51.4` Loop-Risk Detector — complete
  - `P51.5` Kill Switch and Safe Disable Model — complete
  - `P51.6` Command Center Hooks UX — complete
  - `P51.7` Final Validation — complete
- `P52` Tool / MCP Registry + Tool Governance — complete
  - `P52.1` Tool Registry Schema — complete
  - `P52.2` MCP Registry Schema — complete
  - `P52.3` Governed Tool Gateway — complete
  - `P52.4` Tool Search + Contract Preview — complete
  - `P52.5` Lazy Tool Contract Loading — complete
  - `P52.6` Tool Permission Matrix — complete
  - `P52.7` Safe Tool Adapter Previews — complete
  - `P52.8` Command Center Tool Gateway View — complete
  - `P52.9` Final Validation — complete
- `P53` Trigger + Integration Gateway — complete
  - `P53.1` Trigger Gateway Schema — complete
  - `P53.2` Manual Command Center Trigger — complete
  - `P53.3` Cron / Scheduled Trigger Preview — complete
  - `P53.4` GitHub Event Trigger Preview — complete
  - `P53.5` Jira / Linear Placeholder Trigger Models — complete
  - `P53.6` Slack / Teams Placeholder Trigger Models — complete
  - `P53.7` Trigger Governance Final Validation — complete
- `P54` API + Batch Execution Adapter — complete
  - `P54.1` Provider Adapter Interface — complete
  - `P54.2` OpenAI API Adapter Skeleton — complete
  - `P54.3` Batch Job Builder — complete
  - `P54.4` JSONL Job Writer — complete
  - `P54.5` Batch Status Tracker Preview — complete
  - `P54.6` Batch Result Reconciler Preview — complete
  - `P54.7` Cost Estimator — complete
  - `P54.8` Command Center API / Batch Jobs UX — complete
  - `P54.9` API + Batch Adapter Final Validation — complete
- `P55` Test Suite Manager: Project + OS
- `P56` Quality Intelligence + Test Gap Detection
- `P57` Cost Center + Budget Enforcement
- `P58` Policy Center + Governance Admin
- `P59` Secrets and Credential Boundary
- `P60` Worker Queue + Runtime Engine — complete
  - `P60.1` Worker Queue Schema — complete
  - `P60.2` Task Lease Model — complete
  - `P60.3` Heartbeats — complete
  - `P60.4` Retry / Timeout — complete
  - `P60.5` Dead-Letter Queue — complete
  - `P60.6` Worker Runtime UX — complete
  - `P60.7` Final Validation — complete
- `P61` Concurrent Execution + Work Deduplication — complete
- `P62` Conversational NEXUS Command Interface — complete
  - `P62.1` Command Intent Schema — complete
  - `P62.2` Scope / Project Detection — complete
  - `P62.3` Plan/Review/QA/Ship/Guard/Freeze Command Mapping — complete
  - `P62.4` Approval Prompt UX Model — complete
  - `P62.5` Command Timeline — complete
  - `P62.6` Command Center Command UX — complete
  - `P62.7` Final Validation — complete
  - `P62.8` Command Center Chat Entry + Conversational UI Fix — complete
- `P63` AI Interaction Snapshot + Granular Recovery Layer — complete
  - `P63.1` Snapshot Contract + Redaction Policy — complete
  - `P63.2` Interaction Capture Points — complete
  - `P63.3` Recovery Point Model — complete
  - `P63.4` Snapshot Store + Retention Preview — complete
  - `P63.5` Command Center Recovery UX — complete
  - `P63.6` Recovery Replay / Resume Preview — complete
  - `P63.7` Recovery Tests + Docs + Final Validation — complete
- `P64` Provider + Tool Dispatch Through Governance — complete
  - `P64.1` Execution Contract + Governance Split — complete
  - `P64.2` Dispatch Policy Envelope — complete
  - `P64.3` Provider / Tool Readiness Matrix — complete
  - `P64.4` Dispatch Dry Run — complete
  - `P64.5` Command Center Dispatch UX — complete
  - `P64.6` Dispatch Tests / Checkers / Docs — complete
  - `P64.7` Final Validation — complete
- `P64.8` Code Mode Runtime + Lazy Tool Loading — complete
  - `P64.8.1` Execution Contract + Guardrails — complete
  - `P64.8.2` Code Mode Session Contract — complete
  - `P64.8.3` Lazy Tool Selection Packet — complete
  - `P64.8.4` Command Center Code Mode Readiness UX — complete
  - `P64.8.5` Final Validation — complete
- `P65` Batch Intelligence Jobs for Large-Scale Analysis — complete
  - `P65.1` Execution Contract + Safety Split — complete
  - `P65.2` Batch Intelligence Job Contract — complete
  - `P65.3` Workload Selection Preview — complete
  - `P65.4` Cost + Safety Gate — complete
  - `P65.5` Command Center Batch Intelligence UX — complete
  - `P65.6` Tests / Checkers / Docs — complete
  - `P65.7` Final Validation — complete
- `P66` Self-Healing Failure Loop — complete
  - `P66.1` Execution Contract + Safety Split — complete
  - `P66.2` Failure Classification Contract — complete
  - `P66.3` Recovery Plan Preview — complete
  - `P66.4` Healing Gate + Loop Guard — complete
  - `P66.5` Command Center Self-Healing UX — complete
  - `P66.6` Tests / Checkers / Docs — complete
  - `P66.7` Final Validation — complete
- `P67` Controlled Source Mutation Expansion — in progress
  - `P67.1` Execution Contract + Mutation Boundary — complete
  - `P67.2` Mutation Intent Contract — next
  - `P67.3` Patch Plan Preview
  - `P67.4` Approval + Scope Gate
  - `P67.5` Command Center Controlled Mutation UX
  - `P67.6` Tests / Checkers / Docs
  - `P67.7` Final Validation
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
- `P79` Live Execution Mode — complete
  - `P79.1` Live Mode Gate — complete
  - `P79.2` Live Command Intent — complete
  - `P79.3` Action Bridge Admission — complete
  - `P79.4` Command Center Live Readiness UX — complete
  - `P79.5` Tests / Checkers / Docs — complete
  - `P79.6` Final Validation — complete
  - `P79.7` P80 Founder Intake Handoff — complete
- `P80` Founder Intake Runtime — complete
  - `P80.1` Schema / Policy / Contract — complete
  - `P80.2` Core Intake Session Model — complete
  - `P80.3` Guided Q&A Comprehension Loop — complete
  - `P80.4` Command Center Founder Intake UX — complete
  - `P80.5` Tests / Checkers / Docs — complete
  - `P80.6` Docs / Roadmap — complete
  - `P80.7` Final Validation — complete
- `P81` Business Build Orchestration Contract — in progress
  - `P81.1` Execution Contract + Business Build Boundary — complete
  - `P81.2` Founder Idea to PRD Schema — complete
  - `P81.3` Agent Role / Workstream Planner — complete
  - `P81.4` Safe Dry-Run Business Build Plan — complete
  - `P81.5` Command Center Business Build UX — complete
  - `P81.6` Tests / Checkers / Docs — complete
  - `P81.7` Final Validation — next

P80 provides live-local founder intake for structured startup idea capture,
guided Q&A, comprehension readiness, and Command Center visibility. Provider
calls, project mutation, DB writes, deploy, and provider spend remain blocked
until a later explicitly approved execution phase.

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
- task activation bridge policy — P37 boundary (execution: false, agent dispatch: false)
- `dashboard/src/api/taskActions.js` — browser API client for task activation
- Task Queue page: 6 planned mission tasks with per-task Activate buttons and state display
- Agent Fleet page: mission task assignments table (planned/activated counts per agent)
- Mission Control: NBA updated to point to task activation in Task Queue
- OS Roadmap: P36 COMPLETE, P37 IN_PROGRESS
- task activation bridge checker — 12-section validator
- `docs/architecture/TASK_ACTIVATION_AND_AGENT_ASSIGNMENT.md` — architecture doc

Non-goals:

- no agent execution in P37
- no provider calls, network calls, or command execution
- no project mutation

Validation checks:

- task activation bridge validation passes 12/12 sections
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
- Target: private project implementation log (documentation only)
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

#### P41.8.2 — Central Activity Logger

P41.8.2 adds a central activity logger, append-only local JSONL store at
`local-state/runtime/activity.jsonl`, dry-run logging, redaction before
persistence, and activity/correlation lookup helpers. It intentionally stops
short of broad runtime instrumentation, Command Center Activity Log UI,
`/activity` API routes, provider/tool/worker logging, DB-backed activity
storage, and project mutation.

#### P41.8.3 — API / UI / Action Bridge Activity Capture

P41.8.3 adds selected redacted capture points for local API reads and governed
action bridge outcomes. It also exposes a local read-only `/activity` endpoint
for summarized records and lets Command Center show captured activity when the
local API is online. Browser-only UI click persistence, provider/tool/worker
capture, DB-backed activity, and trace drilldown remain future work.

### P41.9 — README + Architecture Diagram Registry Follow-through

Goal:

- extend the diagram registry and any remaining architecture visualization
  follow-through that was not finished during P41.5.6

Subphases:

- `P41.9.1` — Architecture Diagram Registry Foundation
- `P41.9.2` — Architecture Diagram Rendering + README Follow-through

#### P41.9.1 — Architecture Diagram Registry Foundation

P41.9.1 adds a maintained machine-readable diagram registry, source-only
Mermaid diagrams, registry documentation, README links, and a validation
checker. The phase is documentation and validation only: it does not generate
final PNG artifacts, redesign Command Center, change local API or action bridge
behavior, call providers, write to a database, or mutate project source.

#### P41.9.2 — Architecture Diagram Rendering + README Follow-through

P41.9.2 renders public-safe SVG artifacts from the diagram registry, updates
README and diagram docs to link existing outputs, repairs phase-status/report
metadata, and keeps enterprise architecture separate from the roadmap diagram.
Mermaid CLI was not available without installing dependencies in this
environment, so deterministic fallback SVG artifacts were generated and marked
as `fallback-svg`. PNG outputs remain optional and planned.

### P42 — Project Registry + Adapter Framework

Goal:

- formalize project registration and adapter posture after the current runtime,
  governance, and operator layers stabilize

Subphases:

- `P42.1` — Project Registry Schema + Policy
- `P42.2` — nexus.project.json Loader + Validator
- `P42.3` — Stack Profile Model
- `P42.4` — Project Onboarding Wizard / nexus:init-project
- `P42.5` — Project Selector in Command Center
- `P42.6` — Project Capability Matrix
- `P42.7` — Project Registry Adapter Final Validation + Roadmap Closure

#### P42.1 — Project Registry Schema + Policy

P42.1 adds the Project Registry foundation: registry schema, future
`nexus.project.json` schema, safe baseline project metadata, project type
metadata, policy, checker, report, and minimal Projects page visibility.

This subphase is schema and policy only. It does not implement project loader
runtime, project selector behavior, onboarding, adapter execution, project
mutation, provider calls, DB writes, workers, or MCP/tool dispatch.

#### P42.2 — nexus.project.json Loader + Validator

P42.2 adds the safe loader and validator for per-project profile files while
preserving the demo/local-private/public-safe boundaries established in P42.1.
It also adds bounded discovery, safe example profiles, profile readiness
summaries, policy, checker, report, and minimal Projects page visibility.

This phase does not enable project selector behavior, project onboarding,
adapter runtime execution, project mutation, provider calls, DB writes, worker
runtime, or MCP/tool execution.

#### P42.3 — Stack Profile Model

P42.3 defines the stack profile model that later adapters will use without
enabling adapter runtime execution in this phase.

#### P42.4 — Project Onboarding Wizard / nexus:init-project

P42.4 adds dry-run project onboarding and `nexus:init-project`. The command
writes only local reports and never creates project folders or mutates project
source files.

#### P42.5 — Project Selector in Command Center

P42.5 adds a Command Center project selector backed by safe registry metadata.
Selection is local UI state only and does not enable adapters, project writes,
provider calls, workers, or DB writes.

#### P42.6 — Project Capability Matrix

P42.6 adds a read-only selected-project capability matrix. It shows which
capabilities are available through existing governed NEXUS surfaces and which
remain gated or disabled by policy. Provider dispatch, worker runtime,
MCP/tools, Adapter Runtime, project mutation, and DB writes remain disabled.

#### P42.7 — Project Registry Adapter Final Validation + Roadmap Closure

P42.7 closes the Project Registry + Adapter Framework foundation. P42 is now a
read-only, policy-governed foundation: project selector state is local UI-only,
adapter runtime is disabled, project mutation is disabled, provider/tool/worker
execution is disabled, and DB writes are disabled.

P43 is next: Scope Boundary + Project Packaging Safety. Project progress remains
separate from the NEXUS OS Roadmap.

#### P43.1 — Scope Classification Model

P43.1 adds a classification-only model for NEXUS OS, project, cross-cutting,
demo, and unknown changes. It adds scope constants, path/file-set/task/action
classification, policy evaluation, and a scope classification report.

P43.1 does not enable project mutation, packaging/export, provider/tool/worker
execution, runtime enforcement, or DB writes. P43.2 is next and will define the
Project vs OS Mutation Boundary.

#### P43.2 — Project vs OS Mutation Boundary

P43.2 adds dry-run path boundary rules and mutation boundary decisions for
NEXUS OS, project, iOS project, docs, demo, runtime state, generated report,
policy, dashboard, and unknown paths.

P43.2 keeps mutation disabled. Cross-cutting and unknown changes require review,
but no runtime enforcement, packaging/export, provider/tool/worker execution, or
DB writes are enabled. P43.3 is next and defines project export safety rules.

#### P43.3 — Project Export Safety Rules

P43.3 defines dry-run project export allow/deny rules. Project-owned source,
docs, tests, build config, redacted manifests, and redacted validation summaries
can be considered for future packaging. NEXUS agents, policies, tools,
providers, orchestrator/runtime files, Command Center source, raw
evidence/audit/activity ledgers, local-state runtime files, secrets, demo data,
and unredacted reports are blocked.

P43.3 does not create a package or enable project mutation. P43.4 is next and
generates a redacted release manifest.

#### P43.4 — Redacted Release Manifest

P43.4 generates a redacted release manifest artifact for the selected private
project. The manifest records dry-run release posture, excluded unsafe content,
redaction status, and validation posture without embedding project source files,
NEXUS agents, policies, runtime files, ledgers, secrets, or demo data.

P43.4 still creates no project package and enables no release execution. P43.5
is next and adds Command Center visibility for scope boundary and packaging
safety.

#### P43.5 — Command Center Scope Boundary UX

P43.5 adds Command Center visibility for project/OS boundaries, export safety,
blocked package content, and redacted manifest availability. It keeps the UI
read-only and makes clear that project export is dry-run only, project mutation
is disabled unless governed, and NEXUS control-plane internals must not ship
with project packages.

P43.6 is next and performs final packaging safety validation and roadmap
closure.

#### P43.6 — Packaging Safety Checker + Final Validation

P43.6 validates and closes the scope boundary and project packaging safety
sequence. It confirms that P43 remains dry-run/read-only, no project package is
created, redacted manifest generation is safe, and P44 is the next NEXUS OS
phase.

#### P44.1 — Repo Registry

P44.1 starts the Multi-Repo Workspace + Git/PR Lifecycle track with a
metadata-only repo registry. It records NEXUS OS, private project backend,
private project iOS, and demo-only repository references with ownership, scope,
path boundary, branch metadata, and package-boundary fields.

The registry is read-only. It does not create git branches, commits, pull
requests, merges, pushes, release packages, provider calls, DB writes, project
source mutations, or private source detailed scans. P44.2 is next and adds the
repo ownership and dependency map.

#### P44.2 — Repo Ownership + Dependency Map

P44.2 adds read-only repository ownership, dependency, and blast-radius metadata.
It maps owner teams and owner agents for NEXUS OS and project repository
references, then records safe relationships such as `consumes-api` and
`documentation-reference`.

The dependency map remains metadata-only. It does not scan private project source
contents, run git commands, mutate files, call providers, use external network
APIs, or write to a DB. P44.3 is next and adds the governed branch / commit
workflow model.

#### P44.3 — Branch / Commit Workflow Model

P44.3 adds a plan-only git workflow model. It records the change ID, scope,
project ID, target repositories, base branch, proposed branch name, commit
message template, allowed plan actions, forbidden git actions, review/evidence
requirements, and rollback branch plan.

The model does not create branches, commits, pull requests, merges, pushes, or
rollback branches. Direct main commits, unreviewed merges, force pushes, and
branch deletion remain forbidden. P44.4 is next and adds PR draft metadata plus
local evidence-link modeling.

#### P44.4 — PR Draft + Evidence Link Model

P44.4 adds local PR draft metadata and evidence-link modeling. Drafts include the
source branch plan, target branch, linked mission and task IDs, evidence IDs,
audit IDs, activity correlation IDs, validation summary, risk summary, rollback
plan, human-review requirement, and draft metadata-only status.

This phase makes no GitHub or GitLab API calls and creates no pull requests.
P44.5 is next and models review comment ingestion.

#### P44.5 — Review Comment Ingestion Model

P44.5 models review comments from future GitHub, GitLab, local-review, manual,
or future sources. It classifies comments as bug, style, security, test-gap,
architecture, product, or unknown and assigns an owner agent plus required
capability.

The ingestion model remains metadata-only. It does not fetch external comments,
call GitHub/GitLab APIs, mutate project files, or create tasks. P44.6 is next
and adds the merge gate and rollback branch model.

#### P44.6 — Merge Gate + Rollback Branch Model

P44.6 adds metadata-only merge gate and rollback branch planning. The gate checks
scope classification, project/OS boundary cleanliness, evidence links, tests,
reviews, approvals, rollback plan, package safety, and cost/risk status.

The model never performs a merge, push, release, package creation, rollback
branch creation, or project mutation. P44.7 is next and performs final
multi-repo Git/PR lifecycle validation.

#### P44.7 — Multi-Repo Git/PR Final Validation

P44.7 validates and closes the Multi-Repo Workspace + Git/PR Lifecycle track.
The final checker runs the P44 registry, dependency, workflow, PR draft, review
ingestion, merge gate, P43 scope boundary, P42 project registry, Command Center
UX, docs coverage, architecture diagram, and public-safety checks.

P44 remains dry-run and metadata-only. It creates no branches, commits, pull
requests, merges, pushes, releases, deployments, project packages, rollback
branches, provider calls, DB writes, or private project source mutations.

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

## P47 - Trusted Context + Data Architecture Layer

P47 adds a metadata-only trusted context layer between Project Registry, Scoped
Memory, Tool/MCP governance, and future provider or worker execution.

P47.1 adds a read-only data source registry for OS, project, runtime, and safety
sources. It records source ownership, scope, classification, freshness policy,
redaction requirements, and lineage requirements without reading raw private
content or enabling runtime agent injection.

P47.2 through P47.7 add system-of-record mapping, source trust scoring,
freshness and lineage, trusted context packet previews, Command Center Data &
Context Center visibility, and final validation. P47 remains metadata-only and
does not enable provider/tool/worker dispatch, DB writes, or runtime agent
context injection.

## P55 - Test Suite Manager: Project + OS

P55 adds a registry and visibility layer for all NEXUS OS and active project
test suites. It catalogs suites by scope (project, os, cross_cutting), layer,
tool, risk, and evidence type. No test execution, no commands run, no provider
calls, no DB writes in P55.

P55.1 defines the canonical test suite registry schema and field set.
P55.2 adds preview-only project-scoped test suite records for the active private project.
P55.3 adds 15 preview-only OS-scoped test suite records for NEXUS OS layers.
P55.4 maps changed file paths to relevant test suites by pattern.
P55.5 defines the test result record and evidence preview schema.
P55.6 adds the /command-center/tests route with 6 tabs in the Command Center.
P55.7 is comprehensive final validation of all P55 outputs.

## P56 - Quality Intelligence + Test Gap Detection

P56 adds preview-only quality intelligence on top of the P55 test suite
registry. It maps PRD and requirement signals to test coverage, identifies
metadata-only coverage gaps, tracks flaky-test signals from existing evidence,
recommends suites for changed-file patterns, and creates governed test proposal
metadata. P56 does not execute tests, generate test files, mutate project
source, call providers/tools/MCP, start workers, write to DB, or scan private
source content.

P56.1 maps PRD signals to project and OS test suites.
P56.2 classifies coverage gaps and recommended follow-up actions.
P56.3 models flaky-test signals without running or quarantining tests.
P56.4 recommends suites based on risk and changed-file metadata.
P56.5 creates governed test proposals as approval-ready metadata only.
P56.6 adds the /command-center/quality route with six preview tabs.
P56.7 completes final validation for all P56 outputs.
P56.8 adds codebase maintainability guardrails and shared utility foundations
for result envelopes, report metadata/writing, mode guards, redaction, checker
formatting, and OS phase status updates. It also records module ownership,
dependency rules, design-system guidance, testing strategy guidance, shared
helper inventory, and refactor candidates. P56.8 is additive only; broad
refactors and runtime behavior changes are deferred.

## P57 - Cost Center + Budget Enforcement

P57 adds a governed Cost Center foundation. It introduces redacted cost ledger
records, budget policies, estimate-before-run previews, preview actual-cost
records, budget block/approval decisions, and a read-only Command Center Cost
Center UX. P57 does not call providers, upload batches, execute tools, start
workers, write to DB, mutate project files, or claim real spend.

P58 - Policy Center + Governance Admin follows P57.

## P58 - Policy Center + Governance Admin

P58 adds a read-only governance administration layer for policies. It introduces
policy registry metadata, version summaries, diff risk previews, policy
simulation scenarios, exception workflow previews, a disabled-by-default
break-glass model, and a Command Center Policy Center route.

P58 does not enable runtime policy enforcement changes, live overrides,
provider/tool dispatch, worker execution, DB writes, release execution, or
project mutation. P59 - Secrets and Credential Boundary is next.

## P59 - Secrets and Credential Boundary

P59 adds reference-only credential governance for future provider, DB, deploy,
mobile signing, and integration phases. It introduces secret reference metadata,
metadata-only access decisions, redaction scanning, provider credential
references, project credential references, and a Command Center Secrets Boundary
route.

P59 does not read secret values, resolve environment values, call providers or
tools, write to DB, deploy, sign mobile artifacts, start workers, or mutate
project files. P60 - Worker Queue + Runtime Engine is next.

### P59.8 - Command Center OS / Multi-Project Identity Cleanup

P59.8 is a cleanup phase after P59 final validation. It keeps the full Command
Center focused on NEXUS OS, Portfolio, Selected Project, and No project selected
states. Demo data is reserved for a future separate Lite/demo surface, and raw
private placeholder identifiers stay out of primary Command Center UX.

This phase does not add backend execution, provider/tool dispatch, DB writes,
workers, project mutation, or Command Center Lite implementation.

## P60 - Worker Queue + Runtime Engine

P60 defines preview-only worker runtime primitives: queue items, leases,
heartbeats, retry/timeout classification, dead-letter records, runtime summary,
and a Command Center Worker Runtime page at `/command-center/workers`.

P60 does not execute agents, tools, providers, shell commands, DB writes, or
project mutations.

## P61 - Concurrent Execution + Work Deduplication

P61 defines preview-only concurrency governance for future parallel work. It
adds a concurrency policy, project/repo/path/agent/capability lock previews,
deterministic duplicate work detection, queue priority previews, cancellation
previews, and Command Center visibility on the Worker Runtime page.

P61 does not enforce locks, reorder queues, merge tasks, cancel workers, execute
agents, call providers, dispatch tools, write DB records, or mutate project
files. P62 - Conversational NEXUS Command Interface is next.

## P62 - Conversational NEXUS Command Interface

P62 adds a preview-only conversational command layer for simple operator intent.
It classifies commands such as Plan, Review, QA, Fix, Ship, Guard, Freeze, and
Explain, resolves portfolio/project/NEXUS OS scope, maps each command to a
governed route preview, shows risk and approval posture, and records redacted
local command timeline entries.

P62.8 adds the visible `Ask NEXUS` Command Center route and chat-style preview
entry points. P62 does not execute providers, tools, workers, DB writes, project
mutation, or release/deploy actions. The Command Center command UX is
route-first and preview-only. P63 - AI Interaction Snapshot + Granular Recovery
Layer is next.

## P63 - AI Interaction Snapshot + Granular Recovery Layer

P63 adds a preview-only recovery layer for AI-assisted work. It defines redacted
AI interaction snapshots, maps capture points across governed preview surfaces,
models recovery points, adds a local snapshot retention preview, exposes
Command Center recovery inspection, and builds replay/resume plan previews.

P63 completed seven implementation-grade subphases:

- `P63.1` Snapshot Contract + Redaction Policy
- `P63.2` Interaction Capture Points
- `P63.3` Recovery Point Model
- `P63.4` Snapshot Store + Retention Preview
- `P63.5` Command Center Recovery UX
- `P63.6` Recovery Replay / Resume Preview
- `P63.7` Recovery Tests + Docs + Final Validation

The detailed plan lives in
[`P63_AI_INTERACTION_SNAPSHOT_RECOVERY_PLAN.md`](P63_AI_INTERACTION_SNAPSHOT_RECOVERY_PLAN.md).
Implementation must follow
[`p63-execution-contracts.json`](../../contracts/os-roadmap/p63-execution-contracts.json);
the contracts define allowed files, forbidden files, safety rules, reuse checks,
UX updates, theme and Playwright requirements, tests, docs, phase status
updates, validation commands, git commands, and final response checklists for
each subphase.
P63 does not execute providers, tools, workers, DB writes, project mutation,
restore, replay, resume, or release/deploy actions. P64 - Provider + Tool
Dispatch Through Governance is now in progress as a contract-first governance
split. The detailed plan lives in
[`P64_PROVIDER_TOOL_DISPATCH_GOVERNANCE_PLAN.md`](P64_PROVIDER_TOOL_DISPATCH_GOVERNANCE_PLAN.md).
Implementation must follow
[`p64-execution-contracts.json`](../../contracts/os-roadmap/p64-execution-contracts.json).
P64.1 does not enable provider dispatch, tool execution, worker execution, DB
writes, project mutation, external network calls, release, or deploy actions.
