# NEXUS — Agentic Operating System

NEXUS is a governed Agentic OS for coordinating specialized AI agents through
contracts, skills, verification gates, evidence, and human approvals.

> One founder. 20 specialized agents. Strict execution boundaries. Real skill execution. Parallel phases with blocking verification gates. Central safety governor on every sensitive action.

---

## What Is NEXUS? (30 Seconds)

NEXUS turns founder intent into governed execution. Instead of relying on a
prompt-only loop, it separates planning, implementation, verification,
approvals, evidence, and release control into explicit operating-system layers.

## Why This Matters

Prompt-only agent demos tend to hide authority, skip verification, and blur the
difference between "an agent said it is done" and "the system proved it is
done."

NEXUS is built around:

- contracts
- state machines
- capabilities
- runtime traffic enforcement helpers
- evidence
- gates
- safety boundaries
- cost, batch, and provider policies
- a Command Center operator surface with local read-only visibility

## Current Status Through P104.1

P41.5 through P104.1 are complete. The current NEXUS OS focus has moved from
preview-only foundations to governed local live-runtime state and founder
workflow persistence. P94 wires the founder-to-business workflow to governed
local SQLite CRUD records and shows the DB-backed state in Command Center Lite,
Business Build, and DB Runtime. P95 adds operator-facing local persistence
controls, approved local adapter validation, and docs/readiness evidence for
the founder workflow persistence boundary. P96 makes Business Build readiness
DB-backed and validation-covered: it models local execution readiness, renders
dry-run admission lanes in Business Build, and documents what is live-local
versus still blocked. P97 adds governed local SQLite Business Build records for
sessions, PRD snapshots, execution requests, and agent lane state; Command
Center Lite, Business Build, Agent Flow, and DB Runtime now show that state
without enabling execution. P98 adds the governed live workstream handoff on
top of those DB-backed Business Build records: Command Center Lite, Business
Build, Agent Flow, and DB Runtime show display-safe handoff packets, local
dry-run lane previews, owner capability, next action, blockers, disabled
reason, evidence/activity location, and cost posture while execution stays
blocked. P99 moves that handoff into governed execution admission review:
Business Build now exposes a display-safe admission model, missing approval
envelope, deterministic admission dry-run records, and Command Center Execution
Admission UX across Lite, Business Build, Agent Flow, and DB Runtime. P99.6
updates aggregate validation and docs while executable lane count remains `0`.

Provider/model calls, agent dispatch, tool execution, worker execution, project
source mutation, hosted DB mutation, network calls, deploy/release/export,
package creation, and provider spend remain blocked unless a later phase
explicitly scopes and validates them. P93.4/P94.3 are the current exceptions:
they admit local SQLite CRUD only for allowlisted NEXUS OS runtime/founder
workflow entities and only with explicit operator approval, rollback acceptance,
audit acceptance, validation command acceptance, `sqlite-live` mode, and local
write flags.

The Command Center and local operator surface have:

- route-wide stale phase-label cleanup
- capability-based state messaging
- System / Dark / Light theme support
- Mission Control enterprise cockpit layout
- page-specific UX cleanup across major routes
- route-wide screenshot and visual QA audit under `reports/ui-audit/`
- service manifest, status, and doctor foundation
- localhost-only one-command local boot and shutdown
- a read-only Service Health route for operator guidance
- a simple governed Command Palette plus Mission Control operator actions
- OS roadmap vs project-progress separation, with platform phases tracked separately from private-project progress
- a codebase documentation standard, module registry, and phase module index for future maintainers and coding agents
- route-wide tab metadata and validation for Mission Control, operational pages, platform pages, governance pages, Projects, OS Roadmap, Cost Center, and Batch Queue
- usage guides for local boot, tabbed Command Center operation, mission start, task activation, Agent Workbench review, controlled implementation, evidence/audit, demo/private mode, troubleshooting, and FAQ
- compact route-aware Command Center help links that point operators to the relevant local usage guide without executing actions
- final docs coverage and OS phase status validation for the P41.7 documentation track
- a compact global header, three-tab OS Roadmap, and real Docs & Guides index for usage, codebase, and architecture docs
- activity, diagram, project-registry, scope-boundary, multi-repo, agent,
  memory/context, mesh, skill/hook/tool, trigger, API/batch, test-suite-manager,
  and quality-intelligence foundations through P56.7
- shared utility foundations for result envelopes, report metadata/writing,
  mode guards, redaction, checker formatting, and phase status updates
- preview-only cost governance with provider spend, worker runtime, DB writes,
  and project mutation still disabled
- preview-only worker runtime, concurrency, and conversational command interface
  foundations through P62
- founder-lite workflows for idea intake, local PRD readiness, agent workstream
  planning, activation review, and Business Build visibility
- local SQLite runtime foundation, schema-bound CRUD repository, repository
  reads, governed evidence/audit/activity ledger writes, and maintenance
  closure through P92
- P93 enterprise runtime state: CRUD lane planning, governed mutation request
  envelopes, local CRUD admission for OS runtime records, and DB Runtime UX in
  Command Center
- P94 founder runtime state: local SQLite schema for founder sessions, Q&A
  turns, PRD artifacts, and workstream plans; governed CRUD admission; shared
  display-safe view models; and Command Center Lite, Business Build, and DB
  Runtime UX for saved founder workflow state
- P95 founder persistence controls: display-safe operator control state,
  approved local SQLite create/read/update/upsert/list admission for founder
  workflow records, Command Center visibility in Lite, Business Build, and DB
  Runtime, aggregate validation, and docs/roadmap readiness. Delete, raw SQL,
  hosted DB mutation, project mutation, provider/model calls, agent dispatch,
  worker/tool execution, deploy, release, export, package creation, network
  calls, and provider spend remain blocked.
- P96 Business Build local execution readiness: display-safe readiness model,
  dry-run admission lanes, Business Build Command Center UX, aggregate
  validation, and docs/roadmap readiness for founder workflow records. It does
  not dispatch agents, execute workers/tools, mutate project source, use hosted
  DBs, deploy, package, call providers/models, use network calls, or spend.
- P97 governed Business Build DB CRUD: implementation-grade contract, local
  SQLite schema, governed CRUD model, display-safe Command Center DB UX,
  aggregate validation, and docs/roadmap readiness for Business Build sessions,
  execution requests, PRD snapshots, and agent lane state. It does not dispatch
  agents, execute workers/tools, mutate project source, use hosted DBs, deploy,
  package, call providers/models, use network calls, or spend.
- P98 live workstream handoff readiness: implementation-grade handoff contract,
  display-safe handoff packet model, deterministic local dry-run lane previews,
  Command Center visibility across Lite, Business Build, Agent Flow, and DB
  Runtime, aggregate validation, and docs/roadmap readiness for handing
  DB-backed Business Build records to future governed workstream execution.
  It does not dispatch agents, execute workers/tools, mutate project source,
  use hosted DBs, deploy, package, call providers/models, use network calls, or
  spend.
- P99 governed execution admission readiness: implementation-grade admission
  contract, display-safe admission model, explicit approval envelope,
  deterministic admission dry-run records, Command Center Execution Admission
  UX across Lite, Business Build, Agent Flow, and DB Runtime, aggregate
  validation, and docs/roadmap readiness for future scoped execution admission.
  Approval gates are missing by design, executable lane count remains `0`, and
  provider/model calls, agent dispatch, worker/tool execution, project mutation,
  hosted DB mutation, deploy, release, export, package creation, network calls,
  and provider spend remain blocked.
- P100 full founder Command Center enablement: founder-safe navigation and
  useful page summaries are present across full Command Center routes. The
  primary shell shows founder purpose, current state, next action, blockers,
  owner capability, evidence/activity, and cost posture without turning
  blocked pages into fake live actions.
- P101 founder live-use hardening: local readiness and review packets are now
  modeled, validated, and shown on Command Center Lite, Business Build, Agent
  Flow, and Live Readiness. The cards show six founder workflow lanes,
  checklist state, blockers, disabled reason, owner capability,
  evidence/activity, and cost impact. Executable and dispatchable lane counts
  remain `0`; provider/model calls, agent dispatch, worker/tool execution,
  project mutation, hosted DB mutation, deploy, release, export, package
  creation, network calls, and provider spend remain blocked.
- P102 founder live handoff: local handoff manifest and dry-run work-order rows
  are modeled, validated, and shown on Command Center Lite, Business Build,
  Agent Flow, and Live Readiness. Founders can see the founder idea, PRD
  readiness, proposed agent rows, blockers, owner capability,
  evidence/activity, cost posture, and disabled reason. Work-order creation,
  agent dispatch, worker/tool execution, project mutation, hosted DB mutation,
  deploy, release, export, package creation, network calls, and provider spend
  remain blocked.
- P103 founder live work admission: local work admission model, non-runnable
  approval evidence envelope, Command Center Founder Live Work Admission UX,
  aggregate validation, docs/roadmap readiness, and final validation are
  complete. Business Build, Agent Flow, and Live Readiness show work admission
  rows, approval gates, missing evidence, validation commands, blockers,
  disabled reason, owner capability, evidence/activity, and cost posture.
  Approval and executable counts remain `0`; provider/model calls, agent
  dispatch, worker/tool execution, project mutation, hosted DB mutation,
  deploy, release, export, package creation, network calls, and provider spend
  remain blocked.
- P104.1 founder chat surface consolidation: Chat with NEXUS is now focused on
  the chat thread, founder message composer, Send/Reset controls, prompt
  starters, answered/missing count, and a short planning-only safety note. PRD,
  DB, persistence, live-use, handoff, work-admission, execution-admission, task
  board, and agent detail now stay on their corresponding Business Build,
  Agent Flow, Database, and Live Readiness pages.
- P104.2 execution-boundary schema: local execution-boundary records, required
  evidence, approval predicates, forbidden actions, and blocked execution flags
  are defined for future non-chat execution-boundary UX. P104.2 is schema-only;
  all live execution authority remains blocked.
- P104.3 execution-boundary model: deterministic local boundary rows are built
  from P103 work admissions and P104.2 schema. The model carries founder
  context, evidence gaps, validation commands, blockers, owner capability,
  evidence/activity, cost posture, and all execution flags remain false. P104.4
  is next for non-chat Command Center UX.
- P104.4 execution-boundary UX: Business Build, Agent Flow, and Live Readiness
  now show Founder Live Execution Boundary rows, blocked counts, owner
  capability, evidence/activity, cost posture, missing evidence, validation
  commands, and disabled reasons. Chat with NEXUS and Lite remain chat-only.
  P104.5 is next for aggregate tests and checkers.
- P104.5 execution-boundary aggregate validation: route tests and aggregate
  checker now cover the full P104 path from chat cleanup through non-chat
  execution-boundary UX. P104.6 is next for docs and roadmap closure.
- P104.6 execution-boundary docs: README, platform roadmap, P104 contract,
  P104 plan, OS phase status, and docs checker now align on the completed
  boundary work and final validation handoff. P104.7 is next for final
  validation.
- P104.7 final validation: P104 is complete. Chat with NEXUS and Lite remain
  chat-only; Business Build, Agent Flow, and Live Readiness retain the Founder
  Live Execution Boundary. P105 is next.
- P105.1 approval planning: P105 is in progress. The local approval-planning
  schema and contract now define required gates, blocked runtime transitions,
  validation commands, and safety rules without allowing approvals to unlock
  execution. P105.2 is next.
- P105.2 approval-plan model: deterministic local approval-plan rows now derive
  from P104 execution-boundary rows with review questions, missing gates,
  validation commands, blockers, owner/evidence/activity, and cost posture.
  Approval capture and execution remain blocked. P105.3 is next.
- P105.3 dry-run review packet: local review packet rows now summarize approval
  gates, unresolved evidence, blockers, validation commands, owner/evidence,
  activity, and cost posture without approval submission or execution unlocks.
- P105.4 approval review UX: Business Build, Agent Flow, and Live Readiness now
  show the display-safe approval review packet with state, blockers, disabled
  reason, next action, owner, evidence/activity, validation command, and cost
  impact. Chat with NEXUS and Lite remain chat-only, and approval/execution
  controls remain absent.
- P105.5 aggregate validation: P105 now has aggregate coverage across the
  approval-planning contract, approval-plan model, dry-run review packet,
  Command Center approval review UX, retained route tests, reports, status,
  docs, and safety wording.
- P105.6 docs closure: README, platform roadmap, P105 plan, contract, reports,
  and phase status now record approval-planning scope, Business Build, Agent
  Flow, and Live Readiness placement, Chat with NEXUS and Lite chat-only
  boundaries, blocked runtime admission, and blocked approval/execution
  authority. Provider/model calls, agent dispatch, worker/tool execution,
  project mutation, hosted DB mutation, and provider spend remain blocked.
- P105.7 final validation: P105 is complete across approval-planning contract,
  approval-plan model, dry-run review packet, Command Center approval review UX,
  aggregate validation, docs closure, final route checks, dashboard build,
  reports, and phase status. P106 is next.
- P106.1 approval request boundary: P106 is in progress. The local approval
  request boundary schema now defines request-envelope and decision-boundary
  shapes for future founder/operator approval requests without allowing request
  submission, approval capture, approval persistence, execution unlock, runtime
  admission, provider/model calls, agent dispatch, worker/tool execution,
  project mutation, hosted DB mutation, deploy, release, export, package,
  network calls, or provider spend.
- P106.2 approval request model: deterministic local approval request records
  are now built from P105 review packets and the P106.1 boundary. The records
  carry display-safe labels, founder/operator prompts, required evidence,
  blockers, owner capability, evidence/activity location, validation commands,
  and cost posture while request submission, approval capture, approval
  persistence, execution unlock, runtime admission, provider/model calls, agent
  dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy,
  release, export, package, network calls, and provider spend remain blocked.
- P106.3 request queue preview: deterministic local approval request queue rows
  and queue sections are now assembled from P106.2 request records for later
  Command Center rendering. The preview shows display-safe state, evidence,
  blockers, owner capability, next action, disabled reason, activity/evidence
  location, and cost posture while approval request submission, approval
  capture, approval persistence, approval writes, execution unlock, runtime
  admission, provider/model calls, agent dispatch, worker/tool execution,
  project mutation, hosted DB mutation, deploy, release, export, package,
  network calls, and provider spend remain blocked.
- P106.4 Command Center approval request UX: Business Build, Agent Flow, and
  Live Readiness now show the display-safe approval request queue with current
  state, queue counts, next action, blockers, disabled reason, owner capability,
  evidence/activity location, cost posture, queue rows, and blocked safety
  rows. Chat with NEXUS and Lite stay clean/chat-only. Approval request
  submission, approval capture, approval persistence, approval writes,
  execution unlock, runtime admission, provider/model calls, agent dispatch,
  worker/tool execution, project mutation, hosted DB mutation, deploy, release,
  export, package, network calls, and provider spend remain blocked. P106.5 is
  next.
- P106.5 aggregate validation: P106 now has aggregate coverage across the
  approval request boundary contract, deterministic request model, local queue
  preview, Command Center queue UX, focused route tests, dashboard build,
  reports, docs, status, and safety wording. No runtime behavior changes were
  added; approval request submission, approval capture, approval persistence,
  approval writes, execution unlock, runtime admission, provider/model calls,
  agent dispatch, worker/tool execution, project mutation, hosted DB mutation,
  deploy, release, export, package, network calls, and provider spend remain
  blocked. P106.6 is next.
- P106.6 docs closure: README, platform roadmap, P106 plan, contract, reports,
  and phase status now record the approval request boundary, deterministic
  request model, local queue preview, Command Center queue placement on Business
  Build, Agent Flow, and Live Readiness, Chat with NEXUS and Lite chat-only
  boundaries, blocked approval request submission/capture/persistence/writes,
  blocked execution unlock, blocked runtime admission, and blocked provider,
  dispatch, worker/tool, project, hosted DB, deploy, package, network, and spend
  paths. P106.7 is next.
- P106.7 final validation: P106 is complete. Final validation now checks all
  P106 scripts, reports, docs, roadmap, phase status, focused Command Center
  route coverage, dashboard build, queue UX retention, raw/private ID safety,
  DemoApp absence, and blocked live authority. Approval request submission,
  approval capture, approval persistence, approval writes, execution unlock,
  runtime admission, provider/model calls, agent dispatch, worker/tool
  execution, project mutation, hosted DB mutation, deploy, release, export,
  package, network calls, and provider spend remain blocked. P107 is next and
  planned only.
- P107.1 approval capture boundary: P107 is in progress. The local approval
  capture boundary schema now defines display-safe capture-boundary and
  decision-boundary shapes from the P106 request queue. Approval capture,
  approval persistence, approval writes, execution unlock, runtime admission,
  provider/model calls, agent dispatch, worker/tool execution, project
  mutation, hosted DB mutation, deploy, release, export, package, network
  calls, and provider spend remain blocked. P107.2 is next.
- P107.2 approval capture model: deterministic local approval capture review
  records are now built from the P107.1 boundary and P106 request queue. The
  records carry display-safe labels, decision prompts, required evidence,
  blockers, owner capability, evidence/activity location, validation commands,
  and cost posture while approval capture, approval persistence, approval
  writes, execution unlock, runtime admission, provider/model calls, agent
  dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy,
  release, export, package, network calls, and provider spend remain blocked.
  P107.3 is next.
- P107.3 capture audit preview: deterministic local approval capture audit rows
  and audit sections are now assembled from P107.2 capture records for later
  Command Center rendering. The preview shows display-safe state, evidence,
  blockers, owner capability, next action, disabled reason, activity/evidence
  location, and cost posture while approval capture, approval persistence,
  approval writes, execution unlock, runtime admission, provider/model calls,
  agent dispatch, worker/tool execution, project mutation, hosted DB mutation,
  deploy, release, export, package, network calls, and provider spend remain
  blocked. P107.4 is next.
- P107.4 Command Center capture boundary UX: Business Build, Agent Flow, and
  Live Readiness now show the display-safe approval capture boundary with
  current state, audit counts, next action, blockers, disabled reason, owner
  capability, evidence/activity location, cost posture, audit rows, and blocked
  safety rows. Chat with NEXUS and Lite stay clean/chat-only. Approval capture,
  persistence, writes, execution unlock, runtime admission, provider/model
  calls, dispatch, worker/tool execution, project mutation, hosted DB mutation,
  deploy, release, export, package, network calls, and provider spend remain
  blocked. P107.5 is next.
- P107.5 aggregate validation: P107.1-P107.4 now have aggregate checker
  coverage across the approval capture boundary contract, local model, audit
  preview, Command Center capture boundary UX, retained focused route coverage,
  reports, docs, phase status, forbidden file scope, raw/private ID avoidance,
  and non-runnable safety posture. This subphase is validation-only; approval
  capture, persistence, writes, execution unlock, runtime admission,
  provider/model calls, dispatch, worker/tool execution, project mutation,
  hosted DB mutation, deploy, release, export, package, network calls, and
  provider spend remain blocked. P107.6 is next.
- P107.6 docs closure: P107 docs, README, platform roadmap, contract status,
  and OS phase tracking now record P107.1-P107.6 as complete and P107.7 as the
  final validation step. The docs preserve the Command Center placement on
  Business Build, Agent Flow, and Live Readiness, keep Chat with NEXUS and Lite
  clean, and keep approval capture, persistence, writes, execution unlock,
  runtime admission, provider/model calls, dispatch, worker/tool execution,
  project mutation, hosted DB mutation, deploy, release, export, package,
  network calls, and provider spend blocked. P107.7 is next.
- P107.7 final validation: P107 is complete. Final validation closes the
  approval capture boundary contract, local model, audit preview, Command
  Center capture boundary UX, aggregate validation, docs, reports, OS phase
  status, focused route safety, and P108 handoff. P108 is next and remains
  planned only. Approval capture, persistence, writes, execution unlock,
  runtime admission, provider/model calls, dispatch, worker/tool execution,
  project mutation, hosted DB mutation, deploy, release, export, package,
  network calls, and provider spend remain blocked.
- P108.1 operator review boundary: P108 is now in progress. P108.1 defines the
  local operator-review boundary contract and schema from the P107 capture audit
  preview. P108.2 is next. Operator decisions, approval capture, persistence,
  writes, execution unlock, runtime admission, provider/model calls, dispatch,
  worker/tool execution, project mutation, hosted DB mutation, deploy, release,
  export, package, network calls, and provider spend remain blocked.
- P108.2 local operator-review model: deterministic local review records are
  assembled from the P108.1 boundary and P107 audit rows. P108.3 is next.
  Operator decisions, approval capture, persistence, writes, execution unlock,
  runtime admission, provider/model calls, dispatch, worker/tool execution,
  project mutation, hosted DB mutation, deploy, release, export, package,
  network calls, and provider spend remain blocked.
- P108.3 operator-review audit preview: display-safe local audit preview rows
  are assembled from the P108.2 records for later Command Center display.
  P108.4 is next. Operator decisions, approval capture, persistence, writes,
  execution unlock, runtime admission, provider/model calls, dispatch,
  worker/tool execution, project mutation, hosted DB mutation, deploy, release,
  export, package, network calls, and provider spend remain blocked.
- P108.4 Command Center operator-review UX: Business Build, Agent Flow, and
  Live Readiness now show the display-safe operator-review audit preview while
  Chat with NEXUS and Lite remain clean. P108.5 is next. Operator decisions,
  approval capture, persistence, writes, execution unlock, runtime admission,
  provider/model calls, dispatch, worker/tool execution, project mutation,
  hosted DB mutation, deploy, release, export, package, network calls, and
  provider spend remain blocked.
- P108.5 aggregate validation: P108.1-P108.4 now have aggregate coverage across
  the contract, boundary schema, local model, audit preview, Command Center UX,
  route safety, docs, reports, OS phase status, and forbidden scope. P108.6 is
  next. Operator decisions, approval capture, persistence, writes, execution
  unlock, runtime admission, provider/model calls, dispatch, worker/tool
  execution, project mutation, hosted DB mutation, deploy, release, export,
  package, network calls, and provider spend remain blocked.
- P108.6 docs closure: P108 docs, README, platform roadmap, contract status,
  reports, and OS phase status now reflect the completed operator-review
  contract, model, audit preview, Command Center UX, and aggregate validation.
  P108.7 is next. Operator decisions, approval capture, persistence, writes,
  execution unlock, runtime admission, provider/model calls, dispatch,
  worker/tool execution, project mutation, hosted DB mutation, deploy, release,
  export, package, network calls, and provider spend remain blocked.
- P108.7 final validation: P108 is complete across the operator-review
  contract, local model, audit preview, Command Center UX, aggregate validation,
  docs, reports, OS phase status, and final safety checks. P109 is next as a
  planned handoff placeholder only. Operator decisions, approval capture,
  persistence, writes, execution unlock, runtime admission, provider/model
  calls, dispatch, worker/tool execution, project mutation, hosted DB mutation,
  deploy, release, export, package, network calls, and provider spend remain
  blocked.
- P109.1 decision-ledger boundary: the local operator decision ledger readiness
  contract and schema are defined from the P108 operator-review audit preview.
  P109.2 is next. Operator decision capture, approval capture, persistence,
  ledger writes, DB writes, execution unlock, runtime admission,
  provider/model calls, dispatch, worker/tool execution, project mutation,
  hosted DB mutation, deploy, release, export, package, network calls, and
  provider spend remain blocked.
- P109.2 decision-ledger model: deterministic local decision-ledger candidate
  records are assembled from the P109.1 boundary and P108 audit preview. P109.3
  is next. Operator decision capture, approval capture, persistence, ledger
  writes, DB writes, replay, execution unlock, runtime admission,
  provider/model calls, dispatch, worker/tool execution, project mutation,
  hosted DB mutation, deploy, release, export, package, network calls, and
  provider spend remain blocked.
- P109.3 decision-ledger audit preview: display-safe local audit preview rows
  are assembled from the P109.2 candidates for later Command Center display.
  P109.4 is next. Operator decision capture, approval capture, persistence,
  ledger writes, DB writes, replay, execution unlock, runtime admission,
  provider/model calls, dispatch, worker/tool execution, project mutation,
  hosted DB mutation, deploy, release, export, package, network calls, and
  provider spend remain blocked.
- P109.4 Command Center decision-ledger UX: Business Build, Agent Flow, and
  Live Readiness render display-safe decision-ledger audit preview cards while
  Chat with NEXUS and Lite remain clean. P109.5 is next. Operator decision
  capture, approval capture, persistence, ledger writes, DB writes, replay,
  execution unlock, runtime admission, provider/model calls, dispatch,
  worker/tool execution, project mutation, hosted DB mutation, deploy, release,
  export, package, network calls, and provider spend remain blocked.
- P109.5 aggregate validation: checker coverage now validates P109.1-P109.4
  boundary, model, audit preview, Command Center UX, route safety, reports,
  docs, phase status, and forbidden scope without changing runtime behavior.
  P109.6 is next. Operator decision capture, persistence, ledger writes, DB
  writes, replay, execution unlock, runtime admission, provider/model calls,
  dispatch, worker/tool execution, project mutation, hosted DB mutation,
  deploy, release, export, package, network calls, and provider spend remain
  blocked.
- P109.6 docs closure: P109 plan, contract, README, platform roadmap, OS phase
  status, and validation reports now record P109.1-P109.6 completion while
  keeping P109.4 Command Center placement and P109.5 aggregate validation as
  the behavior evidence. P109.7 is next. Operator decision capture,
  persistence, ledger writes, DB writes, replay, execution unlock, runtime
  admission, provider/model calls, dispatch, worker/tool execution, project
  mutation, hosted DB mutation, deploy, release, export, package, network
  calls, and provider spend remain blocked.
- P109.7 final validation: final checks now close P109 across scripts,
  reports, contract status, docs, Command Center route safety, OS status, and
  phase validation coverage. P109 is complete. P110 is next as a planned
  placeholder only. Operator decision capture, persistence, ledger writes, DB
  writes, replay, execution unlock, runtime admission, provider/model calls,
  dispatch, worker/tool execution, project mutation, hosted DB mutation,
  deploy, release, export, package, network calls, and provider spend remain
  blocked.
- P110.1 decision-ledger persistence contract: P110 is now split into
  implementation-grade subphases for governed local SQLite decision-ledger
  persistence. P110.1 is contract/docs/status/checker only; it does not change
  DB schema, live runtime models, Command Center source, project files, or
  runtime data. P110.2 is next. Hosted DB mutation, raw SQL, runtime admission,
  execution unlock, provider/model calls, dispatch, worker/tool execution,
  project mutation, deploy, release, export, package, network calls, and
  provider spend remain blocked.
- P110.2 decision-ledger SQLite schema: local schema entries now exist for
  operator decision ledger entries, events, and evidence references, with
  low-risk redacted retention metadata and safety booleans for replay,
  execution unlock, runtime admission, dispatch, project mutation, hosted DB
  mutation, and spend. P110.3 is next. This is schema-only; no runtime CRUD
  admission, Command Center DB wiring, operator decision capture, project
  mutation, provider/model call, dispatch, worker/tool execution, deploy,
  release, export, package, network call, and provider spend remain blocked.
- P110.3 governed local CRUD model: NEXUS now has an approval-gated local
  SQLite CRUD adapter for allowlisted operator decision ledger entries, events,
  and evidence references. It reuses the existing SQLite runtime and repository
  and only admits create/read/update/upsert/list after explicit operator,
  rollback, audit, validation, `sqlite-live`, and write-enable evidence. P110.4
  is next. Command Center DB wiring, hosted DB mutation, raw SQL, runtime
  admission, execution unlock, project mutation, provider/model call, dispatch,
  worker/tool execution, deploy, release, export, package, network call, and
  provider spend remain blocked.
- P110.4 Command Center decision-ledger persistence UX: Business Build, Agent
  Flow, Live Readiness, and Database DB Runtime now show display-safe local
  decision-ledger persistence state with current state, next action, blockers,
  disabled reason, owner capability, evidence/activity location, and cost
  impact. Chat with NEXUS and Lite remain chat-only. P110.5 is next. This is
  display-only; no mutation buttons, hosted DB mutation, raw SQL, runtime
  admission, execution unlock, project mutation, provider/model call, dispatch,
  worker/tool execution, deploy, release, export, package, network call, or
  provider spend path is available.
- P110.5 aggregate persistence validation: P110.1-P110.4 are now covered by a
  single aggregate checker for contract, schema, governed local CRUD,
  Command Center persistence UX, route safety, reports, docs, and phase status.
  P110.6 is next. This is checker/report/status/docs only; no Command Center
  source, project mutation, hosted DB mutation, raw SQL, runtime admission,
  execution unlock, provider/model call, dispatch, worker/tool execution,
  deploy, release, export, package, network call, or provider spend path is
  available.
- P110.6 docs and roadmap closure: P110 docs, README, platform roadmap,
  contract, reports, and OS phase status now agree that P110.1-P110.6 are
  complete and P110.7 is next for final validation. This is docs/checker/status
  closure only; Command Center source, project mutation, hosted DB mutation,
  raw SQL, runtime admission, execution unlock, provider/model call, dispatch,
  worker/tool execution, deploy, release, export, package, network call, and
  provider spend path remain unavailable.
- P110.7 final validation: P110 is complete with final checker evidence for
  contract, local SQLite schema, approval-gated local CRUD, Command Center
  persistence UX, aggregate validation, docs, OS phase status, and P111
  handoff. P111 is next for founder live agent work order persistence planning.
  This closes validation only; Command Center source, project mutation, hosted
  DB mutation, raw SQL, runtime admission, execution unlock, provider/model
  call, dispatch, worker/tool execution, deploy, release, export, package,
  network call, and provider spend path remain unavailable.
- P111.1 work order persistence contract: P111 is split into seven
  implementation-grade subphases for founder live agent work order
  persistence. P111.1 documents future local SQLite schemas, future exports,
  reuse requirements, safety rules, checker coverage, and OS status while
  leaving DB schema and runtime code untouched. P111.2 is next. No project
  mutation, hosted DB mutation, raw SQL, runtime admission, execution unlock,
  provider/model call, dispatch, worker/tool execution, deploy, release,
  export, package, network call, or provider spend path is available.
- P111.2 work order SQLite schema: local schema metadata, SQL tables, indexes,
  and isolated SQLite validation now exist for founder agent work orders,
  work order events, and work order evidence references. P111.3 is next for the
  governed local CRUD model. This is schema/checker/status/docs only; runtime
  helper code, Command Center source, persistent runtime data writes, project
  mutation, hosted DB mutation, raw SQL interface, runtime admission, execution
  unlock, provider/model call, dispatch, worker/tool execution, deploy,
  release, export, package, network call, and provider spend remain unavailable.
- P111.3 governed local CRUD model: P111 now has approval-gated local SQLite
  CRUD helpers for allowlisted founder agent work order records, validated with
  isolated create/read/update/upsert/list checks. P111.4 is next for Command
  Center UX. Delete, outside entities, unapproved execution, hosted DB
  mutation, raw SQL interface, runtime admission, execution unlock,
  provider/model call, dispatch, worker/tool execution, project mutation,
  deploy, release, export, package, network call, and provider spend remain
  unavailable.
- P111.4 Command Center work order persistence UX: Business Build and Durable
  State now show display-safe founder agent work order persistence state with
  current state, next action, blockers, disabled reason, owner, evidence,
  activity, cost, local CRUD labels, record rows, and safety rows. Chat/Lite
  remains chat-only. P111.5 is next for aggregate validation. Mutation
  controls, hosted DB mutation, raw SQL, runtime admission, execution unlock,
  provider/model call, dispatch, worker/tool execution, project mutation,
  deploy, release, export, package, network call, and provider spend remain
  unavailable.
- P111.5 aggregate validation: P111.1-P111.4 now have aggregate checker
  coverage across the work order persistence contract, SQLite schema, governed
  local CRUD model, Command Center UX, prior reports, route safety, docs, and
  OS status. P111.6 is next for docs and roadmap closure. Runtime behavior,
  DB schema, dashboard source, project files, provider/model calls, dispatch,
  worker/tool execution, hosted DB mutation, raw SQL, deploy, release, export,
  package, network call, and provider spend remain unchanged and unavailable.
- P111.6 docs closure: P111 docs, README, platform roadmap, contract, reports,
  and OS phase status now record the work order persistence path through
  aggregate validation. P111.7 is next for final validation and handoff.
  Runtime behavior, DB schema, dashboard source, project files, provider/model
  calls, dispatch, worker/tool execution, hosted DB mutation, raw SQL, deploy,
  release, export, package, network call, and provider spend remain unchanged
  and unavailable.
- P111.7 final validation: P111 is complete with final checker evidence for
  contract, local SQLite schema, approval-gated local CRUD, Command Center
  persistence UX, aggregate validation, docs, OS phase status, and P112
  handoff. P112 is next and must start with its own implementation-grade
  contract. Command Center source, project mutation, hosted DB mutation, raw
  SQL, runtime admission, execution unlock, provider/model call, dispatch,
  worker/tool execution, deploy, release, export, package, network call, and
  provider spend remain unavailable.
- P112.1 queue admission contract: P112 is split into seven
  implementation-grade subphases for founder live agent work queue admission.
  P112.1 documents future local SQLite schemas, future exports, reuse
  requirements, safety rules, checker coverage, and OS status while leaving DB
  schema, runtime helpers, Command Center source, and runtime data untouched.
  P112.2 is next. Agent dispatch, worker/tool execution, project mutation,
  hosted DB mutation, raw SQL, runtime admission, execution unlock,
  provider/model call, deploy, release, export, package, network call, and
  provider spend remain unavailable.
- P112.2 work queue SQLite schema: local schema metadata, SQL tables, indexes,
  and isolated SQLite validation now exist for founder agent work queue items,
  queue events, and queue evidence references. P112.3 is next for the governed
  local queue CRUD model. Runtime helper code, Command Center source,
  persistent runtime data writes, agent dispatch, worker/tool execution,
  project mutation, hosted DB mutation, raw SQL interface, runtime admission,
  execution unlock, provider/model call, deploy, release, export, package,
  network call, and provider spend remain unavailable.
- P112.3 governed local queue CRUD model: P112 now has approval-gated local
  SQLite CRUD helpers for allowlisted founder agent work queue records,
  validated with isolated create/read/update/upsert/list checks. P112.4 is
  next for queue admission preview and safe dry run. Delete, agent dispatch,
  worker/tool execution, project mutation, hosted DB mutation, raw SQL
  interface, runtime admission, execution unlock, provider/model call, deploy,
  release, export, package, network call, and provider spend remain
  unavailable.
- P112.4 queue admission preview: P112 now builds local-only dry-run queue
  admission candidates from display-safe founder work order context, including
  queue lanes, blockers, owners, evidence, activity location, and cost impact
  for P112.5 Command Center UX. P112.5 is next for display-safe Command Center
  queue admission visibility. Local queue writes, agent dispatch, worker/tool
  execution, project mutation, hosted DB mutation, raw SQL interface, runtime
  admission, execution unlock, provider/model call, deploy, release, export,
  package, network call, and provider spend remain unavailable.
- P112.5 Command Center queue admission UX: Business Build and Agent Flow now
  show display-safe agent work queue admission candidates with lane owners,
  blockers, evidence, activity, cost impact, and blocked write/dispatch/
  execution counts. Chat with NEXUS and Lite remain clean. P112.6 is next for
  validation and docs closure. Local queue writes, provider/model call, agent
  dispatch, worker/tool execution, project mutation, hosted DB mutation, raw
  SQL interface, runtime admission, deploy, release, export, package, network
  call, and provider spend remain unavailable.
- P112.6 validation and docs closure: P112.1-P112.5 are now validated together
  through an aggregate checker that confirms scripts, prior reports, docs,
  README, platform roadmap, OS status, and P112.7 handoff alignment. P112.7 is
  next for final validation. Queue writes, provider/model call, agent dispatch,
  worker/tool execution, project mutation, hosted DB mutation, raw SQL
  interface, runtime admission, deploy, release, export, package, network call,
  and provider spend remain unavailable.
- P112.7 final validation: P112 is complete with final checker evidence for
  contract closure, local queue schema, approval-gated local CRUD, queue
  admission preview, Command Center Business Build and Agent Flow visibility,
  aggregate validation, docs, OS status, and P113 handoff. P113 is next and
  must start with its own implementation-grade contract. Queue writes,
  provider/model call, agent dispatch, worker/tool execution, project mutation,
  hosted DB mutation, raw SQL interface, runtime admission, deploy, release,
  export, package, network call, and provider spend remain unavailable.
- P113.1 work assignment readiness contract: P113 is split into seven
  implementation-grade subphases for moving queue admission candidates toward
  local agent work assignment readiness. P113.1 documents future local SQLite
  schemas, future exports, reuse requirements, safety rules, checker coverage,
  and OS status while leaving DB schema, runtime helpers, dashboard source, and
  runtime data untouched. P113.2 is next for local assignment schema work.
  Assignment writes, provider/model call, agent dispatch, worker/tool
  execution, project mutation, hosted DB mutation, raw SQL interface, runtime
  admission, deploy, release, export, package, network call, and provider spend
  remain unavailable.
- P113.2 work assignment SQLite schema: P113 now has local schema metadata and
  isolated SQLite validation for founder agent work assignments, assignment
  events, and assignment evidence references. P113.3 is next for governed local
  assignment CRUD modeling. Runtime helper code, dashboard source, persistent
  runtime data writes, agent dispatch, worker/tool execution, project mutation,
  hosted DB mutation, raw SQL interface, runtime admission, deploy, release,
  export, package, network call, and provider spend remain unavailable.
- P113.3 governed local assignment CRUD model: P113 now has approval-gated
  local SQLite helpers for allowlisted assignment readiness records and an
  isolated checker covering create/read/update/upsert/list. P113.4 is next for
  a safe assignment readiness preview. Delete, provider/model call, agent
  dispatch, worker/tool execution, project mutation, hosted DB mutation, raw
  SQL interface, runtime admission, deploy, release, export, package, network
  call, and provider spend remain unavailable.
- P113.4 assignment readiness preview: P113 now has a local-only dry-run view
  model for display-safe assignment candidates, assignment sections, source
  queue summary, blockers, next actions, evidence/activity references, and cost
  impact. P113.5 is next for Command Center agent assignment UX. Assignment
  writes, provider/model call, agent dispatch, worker/tool execution, project
  mutation, hosted DB mutation, raw SQL interface, runtime admission, deploy,
  release, export, package, network call, and provider spend remain
  unavailable.
- P113.5 Command Center agent assignment UX: Business Build and Agent Flow now
  show display-safe agent assignment readiness with assignment candidates,
  owner capabilities, blockers, next actions, evidence/activity, cost impact,
  and blocked authority counts. P113.6 is next for validation and docs closure.
  Chat with NEXUS, Lite, and Live Readiness stay clean. Assignment writes,
  provider/model call, agent dispatch, worker/tool execution, project mutation,
  hosted DB mutation, raw SQL interface, runtime admission, deploy, release,
  export, package, network call, and provider spend remain unavailable.
- P113.6 validation and docs closure: P113.1-P113.5 are now validated together
  through an aggregate checker that confirms scripts, prior reports, docs,
  README, platform roadmap, OS status, and P113.7 handoff alignment. P113.7 is
  next for final validation. Assignment writes, provider/model call, agent
  dispatch, worker/tool execution, project mutation, hosted DB mutation, raw
  SQL interface, runtime admission, deploy, release, export, package, network
  call, and provider spend remain unavailable.
- P113.7 final validation: P113 is complete with final checker evidence for
  assignment readiness contract closure, local schema metadata, approval-gated
  local CRUD, assignment preview, Command Center Business Build and Agent Flow
  visibility, aggregate validation, docs, OS status, and P114 handoff. P114 is
  next and must start with its own implementation-grade contract. Assignment
  writes, provider/model call, agent dispatch, worker/tool execution, project
  mutation, hosted DB mutation, raw SQL interface, runtime admission, deploy,
  release, export, package, network call, and provider spend remain
  unavailable.
- P114.1 dispatch readiness contract: P114 is split into seven
  implementation-grade subphases for moving assignment readiness toward
  governed local dispatch readiness. P114.1 documents future local schema work,
  future exports, reuse requirements, safety rules, checker coverage, and OS
  status while leaving DB schema, runtime helpers, dashboard source, and
  runtime data untouched. P114.2 is next for local dispatch schema work. Agent
  dispatch, provider/model call, worker/tool execution, project mutation,
  hosted DB mutation, raw SQL interface, runtime admission, deploy, release,
  export, package, network call, and provider spend remain unavailable.

## CareLoop Project Progress

CareLoop is the active private project under `projects/careloop` and
`projects/careloop-ios`. The current work is tracked on branch
`project/careloop-phase-2-nexus-start` and is separate from the NEXUS platform
roadmap.

Current CareLoop progress:

- PRD decisions have been captured for personas, circles, care receivers,
  invite behavior, task visibility, recurring tasks, reminder/snooze/escalation,
  premium limits, and pay-per-care-receiver monetization.
- Backend coverage now includes auth, circle/invite/member lifecycle, receiver
  activation, scoped task visibility, recurring task behavior, reminder
  scheduling, snooze, escalation, push/email simulation, premium entitlement
  rules, delete scenarios, 50-user simulation, and multi-circle/multi-role
  isolation.
- iOS coverage now includes onboarding contracts, circle directory, organizer
  dashboard, caregiver dashboard, care receiver home, task board deep links,
  receiver task completion, task detail snooze, paywall entry, and role
  recalculation.
- Visual QA screenshots and notes exist for circle directory, organizer home,
  caregiver home, and care receiver home under
  `projects/careloop/docs/qa/visual-qa-careloop.md`.
- Focused test suites are runnable through
  `scripts/careloop-test-runner.sh`, including `smoke`, `full`,
  `backend:auth`, `backend:circles`, `backend:reminders`, `backend:scale`,
  `ios:onboarding`, `ios:personas`, `ios:tasks`, `ios:reminders`, and
  `ios:payments`.
- Receiver-scoped premium subphases P1-P8 are implemented on
  `codex/careloop-premium-phases`, including the single-command room demo,
  premium/free/expired/request-pending demo data, and local StoreKit product
  configuration.
- The CareLoop room demo launches from the repo root with
  `npm run careloop:demo`; first-time simulator setup can use
  `CARELOOP_DEMO_FORCE_BUILD=1 CARELOOP_DEMO_FORCE_INSTALL=1 npm run careloop:demo`.

Recent validation:

- `scripts/careloop-test-runner.sh smoke` passed.
- Full Xcode regression passed on iPhone 17 Pro simulator.
- Backend `npm test` previously passed with the expanded reminder, escalation,
  50-user, and multi-role coverage.
- `npm run check:careloop-demo-readiness` validates the demo command, showcase
  seed, and StoreKit product ID contract.

Known remaining CareLoop blockers:

- Real APNs delivery, notification tap behavior, and universal links require a
  physical-device/TestFlight pass.
- Google/Facebook/Apple provider credentials and redirect URIs are still needed
  for real social-auth validation.
- App Store Connect StoreKit products, sandbox testers, and physical-device
  purchase/restore validation still need external setup.
- UI automation is still missing for delete circle/member/receiver destructive
  flows, full create-recurring-task form submission, invite email delivery, and
  some empty/error/offline states.

## Command Center Overview

Command Center is the current operator surface for:

- Mission Control
- Workspace
- Task Queue
- Agent Workbench
- Implementation Workflow
- Live API Status
- Durable State
- Evidence
- Safety Center
- Projects
- OS Roadmap
- supporting governance and platform routes

## Current Capabilities

- governed local planning and task activation
- human review through Agent Workbench
- evidence, audit, and runtime record visibility
- local approval workflow
- controlled implementation summaries
- live local API read surfaces
- durable state foundation with file-backed persistence and local SQLite
  runtime support
- approved local SQLite CRUD admission for NEXUS OS runtime records
- visual QA screenshots and route-wide UX checks
- founder idea intake, local PRD readiness, and agent workstream planning
- Command Center Lite / Founder workflow surfaces for Chat with NEXUS, Agent
  Flow, OS Roadmap, Activity, Live Readiness, Founder Intake, Business Build,
  Docs, and Durable State

## What Is Not Enabled Yet

- provider/model calls
- agent dispatch and worker/tool execution
- project source mutation
- hosted DB mutation and migrations
- release/deploy action bridge
- broad autonomous source mutation
- package/export/release automation
- provider spend

Local SQLite CRUD is available only through governed P93.4/P94.3/P95.3
admission paths for allowlisted NEXUS OS runtime and founder workflow records.
It is not a general-purpose DB mutation surface.

Centralized activity log work is planned for P41.8. Project Registry + Adapter Framework is planned for P42.

## Local boot commands

P41.6.2 adds one-command local boot and shutdown on top of the service
manifest foundation:

- `npm run nexus:up`
- `npm run nexus:down`
- `npm run nexus:status`
- `npm run nexus:doctor`

Services remain local/private, localhost-only, and DB writes remain disabled.

Command Center now includes a read-only **Service Health** route at `/command-center/services` so operators can inspect service state, doctor findings, and troubleshooting guidance without executing services from the UI.

Command Center now also includes a **Command Palette** for simple governed operator actions such as Plan, Review, QA, Fix, Ship, Retro, Guard, Freeze, and Explain. Commands only route to existing safe capabilities or show disabled reasons.

P62 adds a preview-only **Conversational NEXUS Command Interface** for simple
operator intent. It classifies commands such as Plan, Review, QA, Fix, Ship,
Retro, Guard, Freeze, and Explain, then shows scope, route, risk, approval,
blocker, cost, and timeline previews. Command Center exposes this through
`Ask NEXUS` at `/command-center/command`. It does not enable providers, tools,
workers, DB writes, project mutation, or release execution.

P93 adds **Enterprise Runtime CRUD** visibility under
`/command-center/database` -> **DB Runtime**. Operators can see local CRUD
admission readiness, request-envelope state, allowed local records, owner
capability, next action, disabled reason, evidence/activity location, and cost
impact. The UI remains display-only and does not expose raw JSON, raw logs, raw
policy dumps, raw DB URLs, private project IDs, DemoApp, or mutation buttons.

P41.6.5 also tightens the local operator docs around:

- `nexus:up`
- `nexus:down`
- `nexus:status`
- `nexus:doctor`
- Service Health route interpretation
- project-progress vs OS-roadmap separation

## Local Development and Running Current Services

Use the existing commands in `package.json`. Common entry points include:

```bash
npm run dashboard
npm run local-api:start
npm run mission:action-server
```

Common local boot commands now include:

```bash
npm run nexus:up
npm run nexus:status
npm run nexus:doctor
npm run nexus:down
```

## Documentation Map

- Usage guides: [docs/usage](docs/usage/README.md)
- Command Center guide: [docs/usage/COMMAND_CENTER_GUIDE.md](docs/usage/COMMAND_CENTER_GUIDE.md)
- Command Center help links: route-aware local guide pointers in the Command Center top bar
- Codebase guides: [docs/codebase](docs/codebase/README.md)
- Architecture docs: [docs/architecture](docs/architecture/AGENTIC_OS_ARCHITECTURE.md)
- Architecture diagrams: [docs/architecture/diagrams](docs/architecture/diagrams/README.md)
- Roadmap: [docs/architecture/NEXUS_PLATFORM_ROADMAP.md](docs/architecture/NEXUS_PLATFORM_ROADMAP.md)
- Product requirements: [docs/prd/NEXUS_AGENTIC_OS_PRD.md](docs/prd/NEXUS_AGENTIC_OS_PRD.md)
- P93 Enterprise Live Runtime Expansion: [docs/architecture/P93_ENTERPRISE_LIVE_RUNTIME_EXPANSION_PLAN.md](docs/architecture/P93_ENTERPRISE_LIVE_RUNTIME_EXPANSION_PLAN.md)
- P94 Founder Runtime DB CRUD Workflow Wiring: [docs/architecture/P94_FOUNDER_RUNTIME_DB_CRUD_WORKFLOW_WIRING_PLAN.md](docs/architecture/P94_FOUNDER_RUNTIME_DB_CRUD_WORKFLOW_WIRING_PLAN.md)
- P98 Founder Business Build Live Workstream Handoff: [docs/architecture/P98_FOUNDER_BUSINESS_BUILD_LIVE_WORKSTREAM_HANDOFF_PLAN.md](docs/architecture/P98_FOUNDER_BUSINESS_BUILD_LIVE_WORKSTREAM_HANDOFF_PLAN.md)
- P99 Founder Business Build Governed Execution Admission Handoff: [docs/architecture/P99_FOUNDER_BUSINESS_BUILD_GOVERNED_EXECUTION_ADMISSION_PLAN.md](docs/architecture/P99_FOUNDER_BUSINESS_BUILD_GOVERNED_EXECUTION_ADMISSION_PLAN.md)
- Conversational command interface: [docs/architecture/CONVERSATIONAL_NEXUS_COMMAND_INTERFACE.md](docs/architecture/CONVERSATIONAL_NEXUS_COMMAND_INTERFACE.md)
- Visual QA audit: [reports/ui-audit](reports/ui-audit/visual-qa-report.md)

## Next Steps

P99.7 is next. It should run final P99 validation, stamp real commits, close
the parent P99 phase, and prepare the next scoped handoff while preserving the
execution admission safety boundary:

- keep provider/model calls, agent dispatch, worker/tool execution, project
  mutation, hosted DB mutation, deploy/release/export/package, and spend blocked
  until explicitly scoped
- keep local founder CRUD limited to allowlisted OS records and explicit
  approval/write gates
- add focused Playwright and checker coverage for every Command Center UX change
- keep OS Roadmap status current after each subphase

## Codebase Documentation

- [Codebase docs landing page](docs/codebase/README.md)
- [Module registry](docs/codebase/MODULE_REGISTRY.md)
- [Phase module index](docs/codebase/PHASE_MODULE_INDEX.md)
- [Shared utilities](docs/codebase/SHARED_UTILITIES.md)
- [Module ownership](docs/codebase/MODULE_OWNERSHIP.md)
- [Dependency rules](docs/codebase/DEPENDENCY_RULES.md)
- [Design system](docs/codebase/DESIGN_SYSTEM.md)
- [Testing strategy](docs/codebase/TESTING_STRATEGY.md)

## Architecture Diagrams

- [Diagram registry guide](docs/architecture/diagrams/README.md)
- [Machine-readable diagram registry](docs/architecture/diagrams/diagram-registry.json)
- [Enterprise Architecture](docs/architecture/diagrams/rendered/nexus-enterprise-architecture.svg):
  NEXUS system layers and boundaries.
- [Command Center Flow](docs/architecture/diagrams/rendered/command-center-flow.svg):
  operator navigation and governed action flow.
- [Project / OS Boundary](docs/architecture/diagrams/rendered/project-os-boundary.svg):
  separation between NEXUS OS state, project progress, and demo-only data.
- [Agent Governance](docs/architecture/diagrams/rendered/agent-governance.svg):
  agent roles, gates, evidence, and policy flow.
- [Runtime Self-Healing](docs/architecture/diagrams/rendered/runtime-self-healing.svg):
  planned validation and recovery loop.
- [Roadmap](docs/architecture/diagrams/rendered/nexus-roadmap.svg):
  grouped phase progression only.

Architecture and roadmap diagrams are separate. Rendered PNGs are optional and
planned; README links only existing SVG artifacts.

## Safety and Governance Boundaries

- public/demo surfaces remain public-safe
- local-private work stays governed and redacted
- DB writes remain disabled by policy
- provider calls are not enabled
- project mutation remains governed and intentionally constrained

## Project / Private Data Boundary

Public-facing README sections use “private project” wording. Private-project implementation details stay out of the public-safe operator and docs surfaces unless a private-mode-only artifact explicitly requires them.

## Roadmap Summary

- P41.5: Command Center UX, theme, screenshot audit, and docs finalization
- P41.6: Unified NEXUS Local Boot / Service Orchestration
- P41.6.4: Command palette + simple operator actions
- P41.6.5: OS roadmap/project-progress separation, boot docs, troubleshooting, and final validation
- P41.6.6: Command Center boundary polish and Mission Control consistency
- P41.7.1: codebase documentation standard + module registry
- P41.7.2: reuse audit + duplicate pattern inventory
- P41.7.3: shared helper catalog + refactor candidate plan
- P41.7.3A: Command Center tab foundation + multi-project scope shell
- P41.7.3B: Mission Control tabbed cockpit
- P41.7.3C: tabbed Workspace, Task Queue, Agent Workbench, and Implementation pages
- P41.7.3D: remaining Command Center page tab rollout
- P41.7.3E: route-wide tab tests, docs, and OS phase status finalization
- P41.7.4: OS usage documentation foundation
- P41.7.5: Command Center help links + docs navigation
- P41.7.6: docs coverage checker + final validation
- P41.7.7: Command Center header, OS Roadmap, and Docs page polish
- P41.8.1: Centralized Activity Log + Observability Ledger Foundation (next)
- P41.8: Centralized Activity Log + Observability Ledger
- P42: Project Registry + Adapter Framework
- P43: Scope Boundary + Project Packaging Safety
- P44.1: Multi-Repo Workspace repo registry model
- P44.2: repo ownership + dependency map
- P44.3: branch / commit workflow model
- P44.4: PR draft + evidence link model
- P44.5: review comment ingestion model
- P56.8: codebase maintainability guardrails + shared utility foundation
- P57: Cost Center + Budget Enforcement
- P58: Policy Center + Governance Admin
- P59: Secrets and Credential Boundary
- P59.8: Command Center OS / Multi-Project Identity Cleanup
- P60: Worker Queue + Runtime Engine (complete; preview-only runtime primitives)
- P61: Concurrent Execution + Work Deduplication (complete; preview-only governance models)
- P44.6: merge gate + rollback branch model
- P44.7: multi-repo Git/PR final validation

## Worker Runtime Preview

Command Center includes a Worker Runtime page at `/command-center/workers`.
It models queue, lease, heartbeat, retry/timeout, and dead-letter primitives but
does not execute agents, providers, tools, DB writes, shell commands, or project
mutations. Run `npm run check:worker-runtime` to validate the preview model.

## Concurrent Execution Preview

P61 adds preview-only concurrency governance: policy limits, lock proposals,
duplicate work detection, queue priority previews, and cancellation previews.
These models are visible from the Worker Runtime page and validated with:

```bash
npm run check:concurrency-policy
npm run check:concurrency-locks
npm run check:work-deduplication
npm run check:queue-priority
```

The task cancellation preview checker is also part of final P61 validation.
P61 does not enable true parallel execution, lock enforcement, task merging,
worker cancellation, provider/tool dispatch, DB writes, or project mutation.

## Known Limitations

- `check:public-safety` still has known pre-existing roadmap-doc false positives
- screenshot audit is a visual baseline, not a pixel-diff regression system
- planned routes are intentionally marked skipped, not fabricated
- the dashboard can use snapshot/file-backed fallbacks when live services are offline

## Zero-Key Demo

```bash
npm run demo
npm run check:demo-showcase
npm run check:public-safety
```

## Command Center

Command Center local read-only wiring is now available. It surfaces bundled
validation status, demo evidence, and runtime traffic-plane sample status, but
there is no API, DB, or mutation path yet.

Phase 17-LOCAL adds a local state adapter and read-only file boundary behind
that surface. The dashboard still uses a bundled mirror of the normalized local
snapshot. It does not read files directly in the browser, and there is still no
API, DB, or mutation path yet.

Phase 18-LOCAL adds a local write boundary and append-only prototype runtime
state under `local-state/runtime`. It prepares safe local task, evidence,
audit, approval, incident, and runtime-event writes without wiring orchestrator
dispatch yet.

Phase 19-LOCAL adds an orchestrator adapter dry-run mode. It proves the local
OS path through identity, agent context, traffic policy, dry-run local writes,
and dry-run evidence simulation without executing real agents, tools, or
providers.

Phase 20-LOCAL adds controlled local execution mode. It writes real redacted
runtime records for `DemoApp` under `local-state/runtime/`, but it still does
not execute providers, tools, project mutations, or dispatch wiring.

Phase 21-LOCAL adds Command Center runtime file ingestion. The dashboard now
reads a generated browser-safe snapshot derived from `local-state/runtime/`
files, while staying read-only and without adding API, DB, mutation, provider,
or tool execution.

Phase 22-LOCAL adds local state-machine enforcement for controlled local task
transitions. Before a local task state changes, the executor now validates the
transition through the existing task state machine. This is still local
prototype enforcement only, and it is not wired into `loop.js` or `runner.js`
yet.

Phase 23-LOCAL adds a local approval workflow. Approval-required local work now
creates real approval requests, supports approve and reject decisions through a
CLI, and produces approval evidence that can unlock guarded
`awaiting_approval -> running` transitions. It is still local only and does not
add API, DB, provider, tool, or project execution.

Phase 24-LOCAL adds Command Center approval runtime refresh. The dashboard now
shows approval workflow counts, approval evidence summaries, blocked-by-
approval task visibility, and snapshot refresh metadata from the generated
runtime snapshot. It is still read-only and still does not add API, DB,
provider, tool, or project execution.

Phase 25-LOCAL adds guarded local agent-task execution. Selected agents can now
run deterministic local checks through the governed NEXUS path, including
identity context, agent context, capability checks, traffic-plane policy,
state-machine validation, local evidence, audit, runtime events, and Command
Center snapshot refresh. This still does not add providers, external tools,
project mutation, API, or DB execution.

Phases 26–31-LOCAL add the private project mode boundary, readiness snapshot,
first governed validation task, backend command classification, controlled
backend execution, and test failure remediation. Phase 31 investigates and
fixes the one failing test surfaced by P30: a narrow 1-line patch to the
private-project backend source resolves a `date_window_boundary_bug` with high
confidence. All 58 tests pass. All phases run only under `local-private` mode.

Phase 32-LOCAL adds a read-only private-project validation view in Command
Center. The dashboard consumes a generated local-private snapshot so operators
can see validation state, remediation posture, and redacted runtime evidence
without adding API, DB, UI mutation, provider, network, or test execution from
the browser.

After local approval or execution changes, refresh the browser-safe snapshot
with `npm run generate:command-center-snapshot`.

Validate it with:

```bash
cd dashboard && npm run build
cd dashboard && npm run test:unit
cd dashboard && npm run test:pages
```

## Docs Navigation

- [Demo walkthrough](docs/demo-walkthrough.md)
- [Safety model](docs/safety-model.md)
- [Use cases](docs/use-cases.md)
- [Public roadmap](docs/roadmap.md)
- [Public repo boundary](docs/PUBLIC_REPO_BOUNDARY.md)
- [Private project boundary](docs/PRIVATE_PROJECT_BOUNDARY.md)
- [Demo and Showcase Mode architecture](docs/architecture/DEMO_SHOWCASE_MODE.md)
- [Command Center live wiring](docs/architecture/COMMAND_CENTER_LIVE_WIRING.md)
- [Local state adapter](docs/architecture/LOCAL_STATE_ADAPTER.md)
- [Local state write boundary](docs/architecture/LOCAL_STATE_WRITE_BOUNDARY.md)
- [Local orchestrator integration](docs/architecture/LOCAL_ORCHESTRATOR_INTEGRATION.md)
- [Orchestrator adapter dry-run](docs/architecture/ORCHESTRATOR_ADAPTER_DRY_RUN.md)
- [Controlled local execution](docs/architecture/CONTROLLED_LOCAL_EXECUTION.md)
- [Command Center runtime ingestion](docs/architecture/COMMAND_CENTER_RUNTIME_INGESTION.md)
- [Command Center approval runtime refresh](docs/architecture/COMMAND_CENTER_APPROVAL_RUNTIME_REFRESH.md)
- [Local state machine enforcement](docs/architecture/LOCAL_STATE_MACHINE_ENFORCEMENT.md)
- [Local approval workflow](docs/architecture/LOCAL_APPROVAL_WORKFLOW.md)
- [Guarded local agent task execution](docs/architecture/GUARDED_LOCAL_AGENT_TASK_EXECUTION.md)
- [Read API boundary](docs/architecture/READ_API_BOUNDARY.md)
- [Runtime traffic plane](docs/architecture/RUNTIME_TRAFFIC_PLANE.md)
- [Identity propagation](docs/architecture/IDENTITY_PROPAGATION.md)
- [Accountability evidence record](docs/architecture/ACCOUNTABILITY_EVIDENCE_RECORD.md)
- [Behavior baseline model](docs/architecture/BEHAVIOR_BASELINE_MODEL.md)
- [Domain ownership policy](docs/architecture/DOMAIN_OWNERSHIP_POLICY.md)
- [Agent authority matrix](docs/architecture/AGENT_AUTHORITY_MATRIX.md)
- [Handoff ownership model](docs/architecture/HANDOFF_OWNERSHIP_MODEL.md)
- [Escalation and conflict resolution](docs/architecture/ESCALATION_AND_CONFLICT_RESOLUTION.md)
- [Architecture docs](docs/architecture/AGENTIC_OS_ARCHITECTURE.md)
- [Demo contracts](demo/contracts)
- [Demo reports](demo/reports)
- [Architecture placeholder](docs/images/nexus-architecture.svg)
- [Dashboard placeholder](docs/images/dashboard-screenshot-placeholder.svg)

## Verification Commands

```bash
npm run check:demo-showcase
npm run check:public-safety
npm run generate:command-center-snapshot
npm run check:command-center-runtime-ingestion
npm run generate:private-validation-snapshot
npm run check:command-center-private-validation
npm run orchestrator:local-execute
npm run check:controlled-local-execution
npm run check:local-state-machine
npm run approvals:list
npm run approvals:approve -- <approvalId> --reason "approved locally"
npm run approvals:reject -- <approvalId> --reason "rejected locally"
npm run check:local-approval-workflow
npm run check:command-center-approval-runtime
npm run guarded-task:execute
npm run check:guarded-task-execution
npm run orchestrator:dry-run
npm run check:orchestrator-dry-run
npm run check:local-state-boundary
npm run check:local-write-boundary
npm run check:runtime-traffic-plane
npm run check:domain-ownership
npm run check:observability-evals-artifacts
npm run check:capabilities
npm run check:os-reliability
npm run check:security-boundary
npm run check:format-readability
npm run check:data-protection
npm run check:agent-os-readiness
npm run check:agent-context
```

## Public Safety

This public repo uses `DemoApp` only. Private projects should live in separate
private repos.

---

## What NEXUS Is

NEXUS is an agentic operating system for turning founder intent into verified software delivery.

It is not 20 agents chatting. It is an OS with:

- **Control plane** — NEXUS + SHEPHERD + governor + scheduler + state machine + memory
- **Execution plane** — domain agents that produce artifacts within typed contracts
- **Verification plane** — AUDITOR + SENTINEL + WARDEN running deterministic skills
- **Observability plane** — hooks, RELAY, safety events, cost tracking, batch lifecycle
- **Contracts** — typed task and handoff contracts; no work moves without one
- **State machine** — agents propose transitions; the state machine commits them
- **Skills** — deterministic procedures that run real tools; gates are not prompts
- **Hooks** — lifecycle enforcement at every transition point
- **Governor** — single authorization point for every sensitive action
- **Memory** — typed evidence store; every gate pass produces a file artifact
- **Model router** — routes each task to the lowest-cost capable model
- **Batch queue** — async batch for non-blocking work; isolated from real-time gates

**High-level flow:**

```text
Founder intent
  → NEXUS decision
  → SHEPHERD execution plan
  → typed task contracts
  → domain agents (execution plane)
  → deterministic skills (verification plane)
  → state machine gate commit
  → NEXUS release decision
```

> *Intent in. Verified execution out.*

---

## Why NEXUS Is Not Agentic Soup

Loose multi-agent systems degenerate into agentic soup: vague handoffs, unclear ownership, agents self-certifying their own work, untyped memory, and enforcement that exists only in documentation.

NEXUS prevents this structurally:

- **No free-form handoffs** — every delegation is a typed handoff contract with scope, skills, and acceptance criteria
- **No unbounded task spawning** — permission tiers enforce who can enqueue for whom; queue size cap is 50
- **No self-certified completion** — the agent that builds the work cannot gate the work; verifiers are a separate plane
- **No batch gates** — batch output is async and deferred; it cannot satisfy synchronous gate evidence requirements
- **No direct unsafe actions** — the governor authorizes every file write, task enqueue, skill invocation, and LLM call before execution
- **No code release without evidence** — a release decision requires AUDITOR + SENTINEL + WARDEN gate reports as artifacts
- **No prompt-only enforcement** — every policy has a runtime guard in `safety/governor.js`; documentation alone is not enforcement

See [`docs/architecture/AGENTIC_OS_ARCHITECTURE.md`](docs/architecture/AGENTIC_OS_ARCHITECTURE.md) for the full architecture.
See [`docs/prd/NEXUS_AGENTIC_OS_PRD.md`](docs/prd/NEXUS_AGENTIC_OS_PRD.md) for the product requirements.
See [`docs/architecture/CONTROL_EXECUTION_VERIFICATION_PLANES.md`](docs/architecture/CONTROL_EXECUTION_VERIFICATION_PLANES.md) for plane definitions.
See [`docs/architecture/NEXUS_OS_GLOSSARY.md`](docs/architecture/NEXUS_OS_GLOSSARY.md) for term definitions.
See [`docs/architecture/COMMAND_CENTER_UI.md`](docs/architecture/COMMAND_CENTER_UI.md),
[`docs/architecture/NEXUS_API_ARCHITECTURE.md`](docs/architecture/NEXUS_API_ARCHITECTURE.md),
and [`docs/architecture/NEXUS_DATABASE_ARCHITECTURE.md`](docs/architecture/NEXUS_DATABASE_ARCHITECTURE.md)
for the planned operator platform.
See [`docs/architecture/DATA_PROTECTION_AND_PII.md`](docs/architecture/DATA_PROTECTION_AND_PII.md)
and [`docs/architecture/DATABASE_AGENT_SECURITY.md`](docs/architecture/DATABASE_AGENT_SECURITY.md)
for the Phase 8 data-protection boundary.
See [`docs/architecture/SECURITY_BOUNDARY.md`](docs/architecture/SECURITY_BOUNDARY.md),
[`docs/architecture/RUNTIME_SANDBOX_MODEL.md`](docs/architecture/RUNTIME_SANDBOX_MODEL.md),
[`docs/architecture/NETWORK_SECURITY_MODEL.md`](docs/architecture/NETWORK_SECURITY_MODEL.md),
[`docs/architecture/SECRET_BOUNDARY.md`](docs/architecture/SECRET_BOUNDARY.md),
[`docs/architecture/MCP_SECURITY_MODEL.md`](docs/architecture/MCP_SECURITY_MODEL.md),
[`docs/architecture/HUMAN_APPROVAL_WORKFLOW.md`](docs/architecture/HUMAN_APPROVAL_WORKFLOW.md),
and [`docs/architecture/PROVIDER_SECURITY_MODEL.md`](docs/architecture/PROVIDER_SECURITY_MODEL.md)
for the Phase 9 security boundary.
See [`docs/architecture/CAPABILITY_MODEL.md`](docs/architecture/CAPABILITY_MODEL.md),
[`docs/architecture/CAPABILITY_REGISTRY.md`](docs/architecture/CAPABILITY_REGISTRY.md),
and [`docs/architecture/TOOL_AND_SKILL_GOVERNANCE.md`](docs/architecture/TOOL_AND_SKILL_GOVERNANCE.md)
for the Phase 11 capability model and registry.
See [`docs/architecture/OBSERVABILITY_MODEL.md`](docs/architecture/OBSERVABILITY_MODEL.md),
[`docs/architecture/TRACE_MODEL.md`](docs/architecture/TRACE_MODEL.md),
[`docs/architecture/EVALS_MODEL.md`](docs/architecture/EVALS_MODEL.md),
[`docs/architecture/ARTIFACT_REGISTRY.md`](docs/architecture/ARTIFACT_REGISTRY.md),
[`docs/architecture/EVIDENCE_LINEAGE.md`](docs/architecture/EVIDENCE_LINEAGE.md),
and [`docs/architecture/TELEMETRY_MODEL.md`](docs/architecture/TELEMETRY_MODEL.md)
for the Phase 12 observability, evals, and artifact model.
See [`docs/architecture/DEMO_SHOWCASE_MODE.md`](docs/architecture/DEMO_SHOWCASE_MODE.md),
[`docs/demo-walkthrough.md`](docs/demo-walkthrough.md),
[`docs/safety-model.md`](docs/safety-model.md),
[`docs/use-cases.md`](docs/use-cases.md),
and [`docs/roadmap.md`](docs/roadmap.md)
for the Phase 13 public-safe demo and showcase mode.
See [`docs/architecture/DOMAIN_OWNERSHIP_POLICY.md`](docs/architecture/DOMAIN_OWNERSHIP_POLICY.md),
[`docs/architecture/AGENT_AUTHORITY_MATRIX.md`](docs/architecture/AGENT_AUTHORITY_MATRIX.md),
[`docs/architecture/HANDOFF_OWNERSHIP_MODEL.md`](docs/architecture/HANDOFF_OWNERSHIP_MODEL.md),
and [`docs/architecture/ESCALATION_AND_CONFLICT_RESOLUTION.md`](docs/architecture/ESCALATION_AND_CONFLICT_RESOLUTION.md)
for the Phase 14 domain ownership, authority, handoff, and escalation model.
See [`docs/architecture/RUNTIME_TRAFFIC_PLANE.md`](docs/architecture/RUNTIME_TRAFFIC_PLANE.md),
[`docs/architecture/COMMAND_CENTER_LIVE_WIRING.md`](docs/architecture/COMMAND_CENTER_LIVE_WIRING.md),
[`docs/architecture/IDENTITY_PROPAGATION.md`](docs/architecture/IDENTITY_PROPAGATION.md),
[`docs/architecture/ACCOUNTABILITY_EVIDENCE_RECORD.md`](docs/architecture/ACCOUNTABILITY_EVIDENCE_RECORD.md),
and [`docs/architecture/BEHAVIOR_BASELINE_MODEL.md`](docs/architecture/BEHAVIOR_BASELINE_MODEL.md)
for the Phase 15-LOCAL runtime traffic plane and the Phase 16-LOCAL
Command Center live-wiring layer.

See [`docs/architecture/LOCAL_STATE_ADAPTER.md`](docs/architecture/LOCAL_STATE_ADAPTER.md)
and [`docs/architecture/READ_API_BOUNDARY.md`](docs/architecture/READ_API_BOUNDARY.md)
for the Phase 17-LOCAL local state read boundary.

---

## Agent Enablement Layer

Contracts and state machine rules enforce the OS boundaries at runtime. But agents are LLM-based processes — they must be explicitly taught to use those boundaries correctly.

The agent enablement layer is a set of shared standards that every agent must follow:

| Standard | What it covers |
| --- | --- |
| [Operating Standard](agents/_shared/agent-operating-standard.md) | OS process model, role discipline, the core rule: *Agents propose. Skills execute. State machines commit. Verifiers certify. NEXUS decides.* |
| [Contract Usage](agents/_shared/contract-usage-standard.md) | How to read task contracts, produce handoffs, handle invalid or missing contracts |
| [State Machine](agents/_shared/state-machine-standard.md) | What each tier may propose, forbidden transitions, per-lifecycle diagrams |
| [Model Routing](agents/_shared/model-routing-standard.md) | Provider policy, fallback rules, task type → execution mode mapping |
| [Batch Usage](agents/_shared/batch-usage-standard.md) | Batch-eligible tasks, never-batch list, gate isolation |
| [Skill Usage](agents/_shared/skill-usage-standard.md) | Mandatory skills, skill-first verification, result format |
| [Evidence](agents/_shared/evidence-standard.md) | Evidence types, attachment rules, release evidence requirements |
| [Handoff](agents/_shared/handoff-standard.md) | Handoff schema, validity rules, canonical chains |
| [Etiquette](agents/_shared/agent-etiquette.md) | Communication tone, fabrication prohibition, blocker resolution |

**Current status:** Shared standards are in place, all 20 agents have been retrofitted,
the agent OS readiness checker passes, the task-context adapter exists, and the
Command Center now has read-only local wiring for validation, evidence, and
traffic-plane sample visibility. There is still no API, DB, or mutation path yet.

Phase 15-LOCAL adds the first local runtime traffic-plane helpers for privilege,
behavioral monitoring, accountability evidence records, and identity
propagation. Those helpers exist as local modules and validation logic only.
They are not wired into orchestrator dispatch yet.

Phase 17-LOCAL adds the local state adapter that reads approved local files and
builds a normalized read-only snapshot for the Command Center and future API
read endpoints. It still does not add DB or mutation behavior.

Phase 18-LOCAL adds the local state write boundary that can safely persist
prototype task and append-only runtime records under `local-state/runtime`.
This is still local helper code only; it does not wire orchestrator dispatch,
providers, DB, or API mutation paths.

Phase 19-LOCAL adds a dry-run orchestrator adapter that exercises the local OS
path without executing real work. It is still not wired into `loop.js` or
`runner.js`, and it does not add provider calls, tool execution, DB access, or
project mutation.

Phase 20-LOCAL adds controlled local execution mode for `DemoApp` only. It
writes redacted task, audit, evidence, runtime-event, approval, and incident
records to `local-state/runtime/`, but it still does not execute providers,
tools, project mutations, or dispatch wiring.

Phase 21-LOCAL adds a generated runtime snapshot for Command Center. The
dashboard can now display real local runtime record summaries from
`local-state/runtime/`, but it still does not use a live API, DB, mutation
actions, provider calls, or tool execution.

---

## Architecture

```text
FOUNDER
  ↓
NEXUS  (Decision Engine — DECIDE)
  ↓
loop.js  (Program Orchestrator — ORCHESTRATE)
  ↓
┌──────────────────────────────────────────────────────────────────┐
│  STRATEGY TEAM        │  PRODUCT TEAM         │  PLATFORM TEAM   │
│  RADAR  MERIDIAN      │  ATLAS  PRISM          │  FORGE  STREAM   │
│                       │  CORE   SWIFT          │  SYNAPSE         │
│                       │  PIXEL  CANVAS         │                  │
│                       │  (SHEPHERD orchestrates)                  │
├───────────────────────┴───────────────────────┴──────────────────┤
│  VERIFICATION — Global blocking gates (run after every build)    │
│  AUDITOR → SENTINEL → WARDEN                                     │
├──────────────────────────────────────────────────────────────────┤
│  OBSERVABILITY — RELAY (non-blocking feedback)                   │
├──────────────────────────────────────────────────────────────────┤
│  GROWTH TEAM — BEACON  COMPASS  ORACLE                           │
└──────────────────────────────────────────────────────────────────┘
  ↓ all gates pass
NEXUS final decision (decide.release skill)
```

Every sensitive action — file writes, task enqueues, skill invocations, LLM calls — passes through `safety/governor.js` before it executes.

NEXUS is also runtime-aware. Execution is expected to route through one of:

- `node-local`
- `linux-container`
- `macos-xcode`
- `provider-api`
- `batch-provider`
- `mcp-server`
- `human-approval`

iOS and simulator execution require a macOS Xcode Runner. Containerization is useful
later for backend and web execution, but it does not replace macOS runtime for iOS
validation. These runtimes produce evidence that future state transitions and release
decisions will consume. This phase defines the architecture only; it does not implement
the Xcode Runner yet.

Phase 9 adds the security boundary model across runtime sandboxing, network egress,
secret handling, MCP lifecycle, provider routing safety, and human approvals. These
are documentation, policy, and validation artifacts only in the current phase.

See:

- [`docs/architecture/EXECUTION_RUNTIME_ARCHITECTURE.md`](docs/architecture/EXECUTION_RUNTIME_ARCHITECTURE.md)
- [`docs/architecture/XCODE_RUNNER_ARCHITECTURE.md`](docs/architecture/XCODE_RUNNER_ARCHITECTURE.md)
- [`docs/architecture/SKILL_RUNTIME_MAPPING.md`](docs/architecture/SKILL_RUNTIME_MAPPING.md)
- [`docs/architecture/EXECUTION_EVIDENCE_MODEL.md`](docs/architecture/EXECUTION_EVIDENCE_MODEL.md)

The planned operator platform follows the same kernel boundary:

```text
Command Center UI
  → NEXUS API
  → Governor
  → Contracts
  → State machine
  → JSON memory now / PostgreSQL later
```

The UI, API, and durable database are not implemented yet. JSON memory remains the
runtime source of truth today. PostgreSQL is planned later for durable state. Read-only
demo and investor modes are also planned later. Obsidian is not runtime memory; it is
only for optional human planning notes. Data protection must be implemented before DB
mirror or DB primary mode contains personal information. Batch and OpenRouter are
restricted to `public` or `internal` data by default.

Security posture for the operator platform is default deny by design:

- network and MCP access require explicit approval and scoping
- secrets are referenced by name only
- UI actions flow through API, governor, contracts, and state machine
- provider payloads must be classified, redacted, and scanned
- approvals do not replace verification evidence

Phase 10 adds the reliability architecture across durable execution, leases,
heartbeats, retries, dead-letter handling, recovery, rollback, and incidents. These
are documentation, policy, and validation artifacts only in the current phase.

Phase 11 adds the capability model that bridges agents, contracts, tools, skills,
runtimes, providers, approvals, evidence, and policies. Every future tool, skill,
provider, or MCP action is expected to require a capability. This phase adds
architecture, registry, policy, and validation only; it does not enforce
capabilities at runtime yet.

The capability validator is available as `npm run check:capabilities`.

Phase 12 adds the observability model: traces, offline and deterministic evals by
default, artifact metadata, evidence lineage, and telemetry policy. Artifacts and
evidence are treated as proof surfaces. This phase adds models, policies, example
data, and validation only; it does not implement live telemetry exporters or a
runtime observability pipeline.

The observability validator is available as
`npm run check:observability-evals-artifacts`.

---

## File Structure

```text
nexus/
├── CLAUDE.md                    ← Claude Code reads this first
│
├── guardrails/                  ← Safety policy configs (edit to tune limits, no code change)
│   ├── budget.json              ← Token/cost limits per day, month; zero-cost local models
│   ├── agent-permissions.json   ← Tier definitions + skill ownership + queue size cap (50)
│   ├── command-policy.json      ← Shell command allowlist + blocked patterns
│   ├── file-scope.json          ← Protected paths + verifier write restrictions
│   ├── loop-policy.json         ← Max iterations, retry limits
│   ├── model-policy.json        ← Allowed models + max tokens per call
│   └── approval-policy.json     ← Headless auto-approve threshold
│
├── safety/                      ← Governor modules (additive — no existing code removed)
│   ├── governor.js              ← authorizeAction() — single entry point for all checks
│   ├── budgetGuard.js           ← Daily token/cost enforcement + recordUsage()
│   ├── loopGuard.js             ← Self-enqueue + circular-handoff detection (in-memory)
│   ├── permissionGuard.js       ← Agent tier enforcement + skill ownership map
│   ├── commandGuard.js          ← Shell command allowlist
│   ├── fileScopeGuard.js        ← Path traversal + verifier write-path restrictions
│   ├── secretGuard.js           ← Regex scan for API keys/tokens before write_file
│   ├── approvalGate.js          ← Log approvals; auto-approve in headless mode
│   ├── safeQueue.js             ← Governor-authorized queue write for internal loop ops
│   ├── safetyLogger.js          ← Appends to memory/safety-events.json
│   └── config.js                ← Loads + caches guardrail JSON configs
│
├── orchestrator/
│   ├── loop.js                  ← Parallel loop + dependsOn + skill tasks + hooks
│   └── runner.js                ← One agent: loads prompt, calls Claude/Ollama, tool loop
│
├── skills/                      ← Real executable functions (no Claude needed)
│   ├── index.js                 ← Registry: executeSkill(agent, skill, input)
│   ├── auditor/                 ← code.lint | code.static_analysis | code.test_coverage | code.diff_review
│   ├── sentinel/                ← qa.simulator.run | qa.tests.execute | qa.logs.analyze | qa.security.scan
│   ├── warden/                  ← compliance.privacy.check | compliance.permissions.validate | compliance.appstore.check
│   ├── nexus/                   ← decide.priority | decide.release | read.system_state
│   └── orchestrator/            ← flow.plan | flow.dispatch | flow.monitor | flow.aggregate
│
├── hooks/
│   └── index.js                 ← on_goal_received | on_step_completed | on_failure
│
├── tools/
│   └── index.js                 ← MCP-style tools (12 tools, incl. run_skill)
│
├── agents/                      ← System prompt .md files (20 agents)
│   └── [nexus|atlas|core|...]
│
├── memory/                      ← SOURCE OF TRUTH (all state lives here)
│   ├── portfolio.json
│   ├── agent-status.json
│   ├── task-queue.json
│   ├── founder-actions.json
│   ├── safety-events.json       ← Append-only log of all blocked actions + approvals
│   └── system-usage.json        ← Token + cost usage tracked per day / month / agent
│
├── scripts/
│   ├── sprint.js                ← Enqueue sprint with gate phases built in
│   ├── skill.js                 ← Run any skill directly from CLI
│   ├── task.js                  ← Add single task to queue
│   ├── run-agent.js             ← Run one agent directly (bypass queue)
│   ├── status.js                ← Print system status
│   └── check-safety.js          ← Safety governor smoke tests (42 tests)
│
└── projects/
    └── [private-product-work]/  ← Keep private app code in separate private repos
```

---

## Agent Roster

### Core Engine

| Agent     | Layer   | Role                                                        |
|-----------|---------|-------------------------------------------------------------|
| **NEXUS** | DECIDE  | Strategic brain — goals, priorities, release decisions      |

### Strategy Team

| Agent        | Layer   | Role                                              |
|--------------|---------|---------------------------------------------------|
| **RADAR**    | EXECUTE | Market scanning, TAM validation, threat detection |
| **MERIDIAN** | EXECUTE | Business strategy, pricing, revenue modeling      |

### Product Team (SHEPHERD orchestrates)

| Agent        | Layer       | Role                                              |
|--------------|-------------|---------------------------------------------------|
| **SHEPHERD** | ORCHESTRATE | Sprint scope, exit criteria, release gating       |
| **ATLAS**    | EXECUTE     | PRD, API contracts, sprint scope locking          |
| **PRISM**    | EXECUTE     | Design system, screen specs, component layouts    |
| **CORE**     | EXECUTE     | Fastify API, Prisma schema, auth, event logging   |
| **SWIFT**    | EXECUTE     | SwiftUI screens, API client, session restore      |
| **PIXEL**    | EXECUTE     | Web frontend, NEXUS dashboard                     |
| **CANVAS**   | EXECUTE     | Static assets, privacy policy HTML, landing pages |

### Platform Team

| Agent       | Layer   | Role                                              |
|-------------|---------|---------------------------------------------------|
| **FORGE**   | EXECUTE | Railway/Render deploy, secrets, CI/CD             |
| **STREAM**  | EXECUTE | Data pipelines, external data ingestion           |
| **SYNAPSE** | EXECUTE | AI feature integration (Sprint 3+)                |

### Verification — Global Blocking Gates

| Agent | Layer | Skills |
| --- | --- | --- |
| **AUDITOR** | VERIFY | `code.lint` `code.static_analysis` `code.test_coverage` `code.diff_review` |
| **SENTINEL** | VERIFY | `qa.simulator.run` `qa.tests.execute` `qa.logs.analyze` `qa.security.scan` |
| **WARDEN** | VERIFY | `compliance.privacy.check` `compliance.permissions.validate` `compliance.appstore.check` |

Verifier agents can only write to their own report paths (`reports/<agent>/`) and project QA/compliance subdirectories. They are blocked from writing to `src/`, `app/`, `lib/`, and all system directories.

### Observability

| Agent     | Layer   | Role                                                    |
|-----------|---------|---------------------------------------------------------|
| **RELAY** | OBSERVE | Tester feedback synthesis, bug clustering, QA routing   |

### Growth Team

| Agent       | Layer   | Role                                              |
|-------------|---------|---------------------------------------------------|
| **BEACON**  | EXECUTE | App Store copy, launch emails, marketing          |
| **COMPASS** | EXECUTE | ASO keywords, SEO meta tags                       |
| **ORACLE**  | EXECUTE | Analytics event schema, PostHog funnels           |

---

## Sprint Execution Flow

Every sprint auto-inserts verification gates between the build phase and the QA docs phase. All task enqueues during auto-heal pass through the safety governor.

```text
Phase 2:   CORE + SWIFT  ← build in parallel (Claude Sonnet)
  ↓
Phase 2.1: AUDITOR gate  ← 4 skills run in parallel (no Claude)
           code.diff_review | code.lint | code.static_analysis | code.test_coverage
  ↓ all PASS
Phase 2.2: SENTINEL gate ← 3 skills (no Claude)
           qa.security.scan | qa.simulator.run | qa.tests.execute
  ↓ all PASS
Phase 2.3: WARDEN gate   ← 2 skills (no Claude)
           compliance.privacy.check | compliance.permissions.validate
  ↓ all PASS
Phase 3:   SENTINEL writes QA checklist doc (Claude Haiku)
```

If any gate FAILs, the next phase's tasks remain blocked by `dependsOn`. Loop auto-heals by enqueuing a remediation task through `safeQueue.js` (governor-checked). Fix the issue, re-run the gate skill, re-enqueue.

---

## Safety Governor

All sensitive actions are intercepted by `safety/governor.js` before executing.

### What is enforced

| Action | Guards |
| --- | --- |
| `write_file` tool | Path-traversal check + secret scan + verifier path restrictions |
| `enqueue_task` tool | Permission tier + self-enqueue block + circular-handoff block + queue size cap (50) |
| `run_skill` tool | Skill ownership — agent can only invoke skills it owns |
| `write_memory` tool | Blocks writes to `safety-events` and `system-usage` (audit integrity) |
| LLM call (Anthropic) | Daily token/cost budget check; actual usage recorded after every call |
| Local model (Ollama) | Max 3 iterations, 8 000 prompt tokens, 120 s timeout; $0 usage logged |
| Auto-heal enqueue | `safeEnqueueTask` in `safeQueue.js` — same governor path as the tool |

### Permission tiers

| Tier | Agents | Can enqueue for |
| --- | --- | --- |
| ORCHESTRATOR | nexus, loop | anyone |
| SHEPHERD | shepherd | all engineering agents |
| STRATEGY | atlas, radar, meridian, prism, beacon, compass, oracle | nexus only |
| ENGINEER | core, swift, pixel, canvas | nobody |
| PLATFORM | forge, stream, synapse | nobody |
| VERIFIER | auditor, sentinel, warden | nobody |
| OBSERVER | relay | nexus, shepherd |

### Audit logs

```bash
cat memory/safety-events.json   # all blocked actions + approvals
cat memory/system-usage.json    # token + cost usage by day / agent
```

### Tune limits — no code change needed

```bash
# Daily spend cap
guardrails/budget.json → limits.daily_cost_usd

# Queue size cap
guardrails/agent-permissions.json → max_queue_size

# Verifier allowed write paths
guardrails/file-scope.json → verifier_write_restrictions

# Local model limits
LOCAL_MAX_ITER=3  LOCAL_MAX_PROMPT_TOKENS=8000  LOCAL_TIMEOUT_SECONDS=120
```

### Run smoke tests

```bash
node scripts/check-safety.js    # 42 tests — all 6 guard types + bypass regressions
```

---

## Quick Start

### Run a sprint

```bash
npm install
cp .env.example .env   # add ANTHROPIC_API_KEY

npm run sprint 2 --dry-run   # preview task graph (gates shown)
npm run sprint 2             # enqueue all tasks

npm run orchestrator         # start processing (terminal 1)
npm run dashboard            # watch live (terminal 2, optional)
```

### Run any skill directly

```bash
npm run skill -- --list                        # all available skills

npm run skill auditor code.lint                # ESLint + SwiftLint
npm run skill auditor code.diff_review         # git diff risk analysis
npm run skill sentinel qa.tests.execute        # xcodebuild test
npm run skill sentinel qa.simulator.run        # boot simulator
npm run skill warden compliance.privacy.check
npm run skill nexus read.system_state          # full system snapshot
npm run skill nexus decide.release             # GO / NO-GO
npm run skill orchestrator flow.monitor        # queue status
```

### Talk to NEXUS

```bash
npm run agent nexus "What's blocking Sprint 2?"
npm run agent nexus "Brief me for an investor meeting"
npm run agent nexus "Which agents should be working right now?"
```

### Queue a single task

```bash
npm run task core "Add reminder scheduling" demoapp critical
npm run task atlas "Review Sprint 2 contracts" demoapp high
npm run task beacon "Write App Store description" demoapp normal
```

### Check status

```bash
npm run status
npm run skill nexus read.system_state
npm run skill orchestrator flow.monitor
```

---

## How the Loop Works

```text
1.  sprint.js enqueues tasks in phases with dependsOn wiring + gate skill tasks
2.  loop.js polls task-queue.json every 10s (file watcher triggers instantly)
3.  For each runnable task (dependsOn satisfied):
      type === "skill"  →  executeSkill(agent, skill, input)  [no Claude]
      type === (LLM)    →  runAgent(agentId, task, context)   [Claude API]
4.  Governor authorizes every write_file / enqueue_task / run_skill / LLM call
5.  Hooks fire: on_goal_received → on_step_completed / on_failure
6.  Results written to queue.completed or queue.failed
7.  Gate FAIL → auto-heal via safeEnqueueTask (governor-checked) → blocks next phase
8.  taskId passed through context so loopGuard detects circular handoffs
```

---

## Skills System

Skills are deterministic Node.js functions that shell out to real tools. They return:

```json
{ "result": "PASS | FAIL | INFO", "issues": [], "summary": "one-line" }
```

Every verification agent (AUDITOR, SENTINEL, WARDEN) uses `run_skill` via the tool registry. Claude agents can call skills too — they never fabricate lint/test/compliance results. The governor checks skill ownership: agents can only invoke skills they own.

---

## MCP-Style Tools

| Tool | What It Does |
| --- | --- |
| `read_memory` | Read any memory JSON file |
| `write_memory` | Write/merge into a memory JSON file (safety-events and system-usage are write-protected) |
| `update_agent_status` | Update agent status, task, progress |
| `enqueue_task` | Add a task to the queue — governor checks tier + queue size (≤ 50) |
| `read_project` | Read a project from portfolio.json |
| `update_project` | Update project fields (stage, gate, score...) |
| `update_gate` | Update a single gate status for a project |
| `read_file` | Read a file from projects/ |
| `write_file` | Write a file to projects/ — governor checks scope + secrets |
| `list_files` | List files in a projects/ directory |
| `log_event` | Append to agent's activity log |
| `run_skill` | Execute a real skill — governor checks skill ownership |

---

## Hooks

| Event               | Fires when                    | Built-in behavior                             |
|---------------------|-------------------------------|-----------------------------------------------|
| `on_goal_received`  | Task picked up by loop        | Logs to memory/conversations/orchestrator.log |
| `on_step_completed` | Task or skill finishes        | Logs result, tool calls, iterations           |
| `on_failure`        | Task or skill returns FAIL    | Logs error summary                            |

Register custom hooks in `hooks/index.js` via `registerHook(event, asyncFn)`.

---

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY                 # private env var name for Claude Sonnet + Haiku

# Orchestrator tuning
LOOP_INTERVAL=10                  # seconds between queue polls (default 10)
MAX_TOKENS=2048                   # max output tokens per LLM call

# Model overrides (default: Haiku for fast agents, Sonnet for code agents)
AGENT_MODEL=                      # global override for all agents
NEXUS_MODEL=                      # per-agent override example
CORE_MODEL=
SWIFT_MODEL=

# Local model fallback (Ollama)
OLLAMA_HOST=http://localhost:11434
LOCAL_FAST_MODEL=qwen3:4b
LOCAL_CODE_MODEL=qwen2.5-coder:7b

# Local model safety limits
LOCAL_MAX_ITER=3                  # max agentic loop iterations for Ollama models
LOCAL_MAX_PROMPT_TOKENS=8000      # estimated prompt token cap before Ollama call
LOCAL_TIMEOUT_SECONDS=120         # per-call timeout for Ollama

# Retry / auto-heal
MAX_AUTO_HEAL_ATTEMPTS=2          # max remediation tasks per failed gate
TASK_RETRY_DELAY_MS=15000         # base delay before retry (exponential backoff)
```

---

## Setup

```bash
npm install
cd dashboard && npm install && cd ..
cp .env.example .env
# Add ANTHROPIC_API_KEY to .env
```

---

## Coding Agent Tooling

NEXUS uses [AGENTS.md](AGENTS.md) for Codex and repo-level operating rules. Local Codex
skills exist for branch safety, phase implementation, agent retrofit, PR review,
security review, and UI concept work. Claude Code's official `frontend-design` plugin
may be used for UI concepts only. Community plugins are intentionally not part of core
NEXUS. Tooling assists workflow but does not replace contracts, governor, state
machine, skills, or verification gates.

---

## Command Center Prototype

A Command Center prototype now exists in [`dashboard/`](dashboard/) as the first
visual operator console for the NEXUS Agentic OS. It now includes command
center local read-only wiring for Mission Control, validation status, evidence,
runtime traffic-plane sample status, cost, safety, approvals, release control,
and honest not-wired-yet messaging. It is not wired to API, DB, auth, provider
execution, or runtime dispatch yet. The prototype uses local snapshot data from
`dashboard/src/data/studio.js`, `dashboard/src/data/localReports.js`, and
`dashboard/src/hooks/useStudioData.js`.

---

## Data Protection

Phase 8 defines the classification, redaction, scan, policy, hook, and audit model for
personal information, logs, evidence, model context, batch payloads, and future DB-agent
behavior. It does not implement runtime DB enforcement yet. DB agents must later use
safe gateway tools and safe views, never raw unrestricted access.

---

## OS Reliability

Phase 10 defines the durable execution and OS reliability model for NEXUS:

- durable task and transition history
- lease and heartbeat expectations
- bounded retries and dead-letter handling
- evidence-linked recovery and rollback
- incident response and runbooks

The reliability layer is documented and validated in this phase, but it does not
change runtime dispatch or implement live worker leases yet.

---

## Validation Report Metadata

Validation reports are generated during the validation step, before the final commit for
that phase is created. They record the validation branch and validation HEAD at report
generation time. That means a report's `Validation HEAD` may differ from the final Git
commit that contains the report. Kanban and phase summaries remain the source of truth
for final phase commit IDs, and the reports should be treated as validation artifacts,
not authoritative Git release metadata.

---

## Activity Observability Foundation

P41.8.1 adds the first centralized activity log foundation: a redaction-safe
activity event schema, correlation ID model, event type taxonomy, policy, and
checker. This is schema/model work only. It does not instrument runtime paths,
write activity records, add an Activity Log UI, call providers, enable worker
runtime, write to a DB, or mutate project source.

P41.8.2 adds the Central Activity Logger and append-only local activity store at
`local-state/runtime/activity.jsonl`. It supports dry-run logging, redaction
before persistence, and correlation lookup. It still does not add broad runtime
instrumentation, Activity Log UI, `/activity` API routes, provider/tool/worker
logging, DB-backed storage, or project mutation.

P41.8.3 adds selected activity capture for local API reads and governed action
bridge outcomes, plus a local read-only `/activity` endpoint for summarized
records. Provider, tool, worker, DB-backed activity, and release/deploy
execution remain disabled.

P41.8.4 adds the Command Center Activity Log page with tabs, filters, grouped
views, status cards, and correlation previews for summarized local activity
records.

P41.8.5 adds redacted trace drilldown by correlation ID. Activity Log operators
can open a trace timeline for connected UI/API/action/evidence/audit records
without exposing raw logs, raw payloads, secrets, or private project content.
Provider/tool/worker traces and DB-backed activity storage remain disabled.

P41.8 complete: the centralized activity log track now has schema/correlation
modeling, a central local logger, selected UI/API/action bridge capture,
Command Center Activity Log, correlation trace drilldown, final observability
checks, refreshed reports, and operator/codebase docs. Activity remains local,
file-backed, redacted, and read-focused in the UI. Provider/tool/worker
instrumentation, DB-backed activity storage, retention, export, telemetry, SLOs,
and production observability remain future work.

P41.9.1 starts the README and architecture diagram registry follow-through. It
adds source-only Mermaid diagram entries, a registry validation checker, and
public-safe diagram documentation.

P41.9.2 renders public-safe SVG artifacts, updates README and diagram docs to
link existing outputs, and keeps the roadmap diagram separate from the
architecture diagram. Mermaid CLI was not available without dependency
installation in this environment, so deterministic fallback SVGs were generated
and marked as `fallback-svg`.

P42 is complete through final validation. The Project Registry + Adapter
Framework is now a read-only, policy-governed foundation with project profile
loading, stack profiles, dry-run onboarding via `nexus:init-project`, a local
UI-only Command Center project selector, and a selected-project capability
matrix. Adapter runtime, project mutation, provider calls, DB writes, workers,
and tool dispatch remain disabled.

P43 starts Scope Boundary + Project Packaging Safety. P43.1 adds classification
only for NEXUS OS, project, cross-cutting, demo, and unknown changes. P43.2 adds
dry-run project vs OS mutation boundary decisions. P43.3 adds dry-run project
export safety rules that allow-list project content and block NEXUS internals,
raw evidence/audit/activity ledgers, local-state runtime files, secrets, and
demo data. P43.4 adds a redacted release manifest artifact while still creating
no package. P43.5 adds Command Center visibility for scope boundary, export
safety, blocked package content, and redacted manifest availability. P43.6
closes the sequence with final packaging safety validation. These phases do not
enable mutation, package creation, providers, tools, workers, or DB writes.

P44 starts Multi-Repo Workspace + Git/PR Lifecycle. P44.1 adds a read-only
repo registry model for NEXUS OS and project repositories. P44.2 adds a
metadata-only repo ownership and dependency map, including blast-radius summaries
for cross-repo review. P44.3 adds a governed branch and commit workflow model
that remains plan-only. P44.4 adds local PR draft metadata and evidence links
without creating a PR or calling GitHub/GitLab APIs. P44.5 models review
comment ingestion and triage without external review-system calls or task
creation. P44.6 models merge readiness and rollback branch planning without
merge, push, release, package, or rollback branch execution. P44.7 closes the
track with final validation. No branch creation, commits, pull requests, merges,
pushes, provider calls, DB writes, project source mutation, or private source
detailed scanning are enabled. See
[docs/architecture/MULTI_REPO_WORKSPACE.md](docs/architecture/MULTI_REPO_WORKSPACE.md).

P45 starts Agent Registry + Boundary Compiler. P45.1 adds a metadata-only
agent registry schema for NEXUS, SHEPHERD, CORE, SWIFT, SENTINEL, AUDITOR,
WARDEN, PRISM, and FORGE. It grants no runtime permissions and does not enable
tool dispatch, provider calls, DB writes, worker execution, or source mutation.

P45.2 adds a metadata-only agent capability matrix. It maps registered agents
to stable capability IDs and validates separation-of-duties rules without
wiring runtime enforcement.

P45.3 adds metadata-only path, tool, data, project-scope, change-scope, and
approval boundaries for registered agents. MCP/tool dispatch, provider
execution, DB writes, worker runtime, and private project mutation remain
disabled.

P45.4 adds a dry-run boundary compiler that produces agent boundary envelopes
from agent registry metadata, project registry metadata, scope classification,
capability ID, and task intent. Envelopes are not used for runtime enforcement.

P45.5 adds the read-only Command Center Agent Registry page. It shows registry
tabs, known agents, capability counts, boundary summaries, evidence
requirements, and a dry-run boundary envelope preview. It does not add agent
editing or runtime permission changes.

P45.6 closes Agent Registry + Boundary Compiler with final validation across
the registry schema, capability matrix, agent boundaries, dry-run compiler,
Command Center Agent Registry UX, docs, roadmap status, and safety posture.

P45 remains metadata-only. Runtime enforcement, tool/provider dispatch, worker
execution, DB writes, release execution, source mutation, and agent self-update
remain disabled.

P46 starts Scoped Memory Architecture + Memory Center. P46.1 defines the
canonical memory scopes, change scopes, memory item schema, and forbidden memory
classes. Memory remains metadata-only: no runtime injection, provider dispatch,
tool dispatch, worker runtime, DB writes, or project mutation is allowed.

P46.2 adds safe local JSONL memory stores for NEXUS OS, project, task, and
session memory metadata. Stores contain redacted summaries only and reject
secret-like content.

P46.3 adds deterministic scoped memory packet building with inclusion reasons,
exclusion reasons, freshness and trust warnings, token budget estimates, and
classification summaries. Packets remain read-only previews and are not sent to
providers or injected into agents.

P46.4 adds policy-only memory access decisions: ALLOW, DENY, REDACT, and
REQUIRE_APPROVAL. Demo/public modes cannot access private project memory, and
unrelated project memory remains blocked by default.

P46.5 adds freshness, staleness, invalidation planning, and promotion-candidate
rules. Stale and promotion states are proposals only; no automatic memory
rewrite or runtime injection is enabled.

P46.6 adds the read-only Command Center Memory Center at
`/command-center/memory`, with scoped memory tabs, freshness summaries,
promotion proposals, and packet previews. Memory editing and runtime injection
remain disabled.

P46.7 closes Scoped Memory Architecture + Memory Center with final validation
across the scope model, stores, packet builder, access policy, freshness model,
Memory Center UI, OS phase status, docs, public safety, and dashboard tests.

P47 starts the Trusted Context + Data Architecture Layer. P47.1 adds a
metadata-only data source registry so future context packets can identify source
ownership, scope, freshness policy, redaction, and lineage requirements before
any runtime use.

P47.2 maps trusted context domains to system-of-record sources for project
requirements, task state, evidence, audit, activity, validation results,
policies, agent capability metadata, and scoped memory.

P47.3 adds deterministic source trust scoring for registered sources. Scores
explain high, medium, low, and unavailable trust bands without external calls or
runtime permissions.

P47.4 adds freshness and lineage models for trusted context sources. Freshness
and lineage remain metadata-only and do not rewrite files or inject context into
runtime agents.

P47.5 adds read-only trusted context packet previews. Packets include source
summaries, trust/freshness/lineage summaries, and exclusion reasons, but no raw
source content and no runtime agent injection.

P47.6 adds the read-only Command Center Data & Context Center at
`/command-center/context`, showing data source registry summaries,
system-of-record mapping, trust scores, freshness/lineage, packet previews, and
exclusions without raw private content.

P47.7 closes Trusted Context + Data Architecture with final validation across
the registry, source-of-record map, trust scoring, freshness/lineage, packet
preview, and Command Center Data & Context Center.

P48 adds the Governed Agentic Mesh: scoped redacted agent messages, append-only
message records, agent rooms, governed handoffs, policy-scoped context sync, and
the read-only Command Center Agent Rooms route. P48.8 additionally polishes the
Projects route into a tabbed enterprise project operating surface for portfolio,
active project, stack profile, capabilities, milestones, gaps, and adapter
settings. It does not enable direct agent chat, provider/tool/worker dispatch,
DB writes, task ownership mutation, adapter runtime, or project mutation.

P49 adds the Agent Definition Update Workflow: proposal-first change records,
boundary diff classification, AUDITOR/WARDEN review records, human approval
gates, dry-run versioning, rollback planning, Command Center read-only
visibility, and final validation. It does not mutate `agents/*.md` or grant
runtime provider/tool/worker/DB/project permissions.

P49.8 productizes the Projects page as a Portfolio / Selected Project operating
surface with stack, capabilities, milestones, gaps, evidence, and Settings /
Adapter tabs. It remains read-only: no project mutation, adapter runtime,
provider/tool/worker dispatch, or DB writes are enabled.

P50 adds the Skill Registry + Skill Authoring Workflow: schema, contracts,
governed templates, stack-specific profiles, skill test requirements, and a
read-only Command Center Skill Registry route. It does not enable skill
execution, provider/tool/worker dispatch, DB writes, release execution, or
project mutation.

P51 adds the Hook Registry + Safe Automation Lifecycle: disabled hook schemas,
trigger metadata, rate/retry guard decisions, loop-risk detection, kill switch
previews, and a read-only Command Center Hook Registry route. It does not enable
hook execution, schedulers, webhooks, workers, provider/tool/MCP dispatch, DB
writes, release execution, or project mutation.

P52 starts the Tool / MCP Registry + Tool Governance layer. It defines one
governed tool gateway with metadata-only tool records, disabled MCP
placeholders, decision-only gateway checks, search summaries, selected lazy
contracts, execution previews, context budget guards, and a default-deny
permission matrix, safe adapter previews, and a read-only Command Center Tool
Gateway view, not a fleet of active MCP servers. Real tool execution, provider
calls, external network, DB writes, shell execution through the gateway, workers,
and project mutation remain disabled.

P53 completes the Trigger + Integration Gateway as preview-only schema,
integration mapping, Command Center visibility, and governance work. Trigger
execution, webhooks, schedulers, provider calls, external network, DB writes,
worker runtime, credentials, and project mutation remain disabled.

P54 completes the API + Batch Execution Adapter as a preview-only provider
request, batch packaging, JSONL preview, status, reconciliation, cost estimate,
and Command Center visibility layer. Provider calls, external network, API key
reads, DB writes, worker runtime, batch uploads, and project mutation remain
disabled.

P55 adds the Test Suite Manager — a registry and visibility layer for all NEXUS OS
and active project test suites. It surfaces suite records, changed-file mappings,
evidence-ready metadata, and a Test Center route in the Command Center. No test
execution, no commands run, no provider calls, no DB writes in P55.

---

> See [CLAUDE.md](CLAUDE.md) for agent instructions, safety architecture, and key decisions.
> See [REFERENCE.md](REFERENCE.md) for portfolio status and token cost estimates.
