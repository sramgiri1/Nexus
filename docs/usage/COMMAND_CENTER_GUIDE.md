# Command Center Guide

## Purpose

Command Center is the operator surface for governed local NEXUS work.
It summarizes what is active, what is blocked, what evidence exists, and what is
not enabled yet.

## NEXUS Command Palette

- Purpose: expose a simple operator command surface for governed local work
  without requiring operators to memorize internal scripts or roadmap phases
- How to open it: use the `Command Palette` button in the top bar or `Cmd/Ctrl+K`
- Available commands now: `Plan Mission`, `Review Work`, `Run Retro`,
  `Guard Scope`, and `Explain Current State` when the underlying local state
  exists
- Disabled commands: `Run QA Gate`, `Propose Fix`, `Prepare Ship`, and
  `Freeze Workspace` stay disabled until their required governed capabilities
  exist
- Safety rule: no unsafe action executes directly from the palette; commands
  either open an existing governed route, show a read-only summary, or explain
  why they are not enabled

## Ask NEXUS

- Route: `/command-center/command`
- Purpose: conversational entry point for operating NEXUS without memorizing
  internal scripts or phase labels.
- How to open it: use the `Ask NEXUS` sidebar item, the compact top-bar
  `Ask NEXUS` button, or the Mission Control `Ask NEXUS` entry.
- Composer placeholder: `Ask NEXUS to plan, review, QA, fix, ship, guard,
  freeze, or explain...`
- Suggested prompts: `Plan the next milestone`, `Review current project
  readiness`, `Run QA readiness check`, `Explain blockers`, `Freeze project
  scope`, `Show release readiness`, `Summarize latest activity`, and
  `What should I do next?`
- Preview result: shows intent, scope, target, route, owner/capability, risk,
  approval posture, cost status, blockers, next governed action, and redacted
  command history context.
- Safety posture: preview-only. Provider dispatch, tool/MCP execution, worker
  execution, DB writes, project mutation, and release/deploy actions are not
  enabled from this page.
- Project boundary: local-private UX shows the selected private project or
  `No project selected`. DemoApp appears only on demo-specific surfaces.

## Founder Persistence Controls

- Routes: `/command-center/lite`, `/command-center/business-build`, and
  `/command-center/database` on the DB Runtime tab.
- Purpose: show whether founder workflow records can be persisted locally after
  the founder idea, Q&A, PRD artifact, and workstream plan are understood.
- Current live-local scope: approved local SQLite create, read, update, upsert,
  and list paths for founder workflow records only.
- Required gates: operator approval, rollback acceptance, audit acceptance,
  validation command acceptance, `sqlite-live` mode, and local write flags.
- Shown state: saved founder workflow summary, approval posture, local
  read/write posture, rollback and audit state, blockers, next action, owner
  capability, evidence/activity location, and cost impact.
- Still blocked: delete, raw SQL, hosted DB mutation, project mutation,
  provider/model calls, agent dispatch, tool execution, worker execution,
  network calls, deploy, release, export, package creation, and provider spend.
- UX safety: primary cards must stay display-safe. They should not show raw DB
  table names, raw private project IDs, raw JSON/log/policy dumps, secrets, or
  DemoApp in full Command Center.

## Business Build Local Execution Readiness

- Route: `/command-center/business-build`.
- Purpose: show whether the founder workflow has enough DB-backed local
  evidence for later governed execution review.
- Current live-local scope: Business Build reads display-safe founder session,
  Q&A, PRD artifact, and workstream plan state and shows dry-run admission lanes.
- Current P96 posture: readiness and dry-run admission only. Admitted execution
  count remains `0`.
- Shown state: DB source state, current readiness state, future review lane
  count, lane owner capability, blockers, next action, disabled reason,
  evidence/activity label, and cost impact.
- Admission state: `Admitted execution` remains `0`; the primary evidence label
  is `Dry-run admission report`.
- Still blocked: live execution, agent dispatch, worker/tool execution, project
  mutation, hosted DB mutation, provider/model calls, network calls, deploy,
  release, export, package creation, and provider spend.
- UX safety: Business Build should show useful founder/operator language, not
  raw table names, raw private IDs, raw JSON/log/policy dumps, internal phase
  labels, or fake working actions. Primary cards use friendly labels such as
  `Dry-run admission report` and `OS activity report`.

## Business Build DB CRUD Visibility

- Routes: `/command-center/lite`, `/command-center/business-build`,
  `/command-center/agent-flow`, and Durable State / DB Runtime.
- Purpose: show display-safe Business Build DB records after P97.4 without
  exposing raw SQLite table names or enabling execution.
- Current P97 posture: governed local SQLite CRUD state is visible for
  Business Build sessions, execution requests, agent lanes, and PRD snapshots.
  Delete,
  raw SQL, hosted DB mutation, project mutation, provider/model calls, agent
  dispatch, worker/tool execution, deploy, release, export, package creation,
  network calls, and provider spend remain blocked.
- Operator workflow: review owner capability, next action, disabled reason,
  evidence, activity, and cost impact before any later phase can admit a
  specific local CRUD request.
- UX safety: primary cards use labels such as `Business Build session`,
  `Execution requests`, `Agent lanes`, and `PRD snapshots`; do not show raw
  project/private IDs, raw JSON/log/policy dumps, or fake runnable actions.

## Using Command Center Tabs

- Tabs split high-density routes into focused operator sections without changing backend behavior.
- The first tab on each route is the default overview or recommended action surface.
- Secondary tabs expose drilldowns such as tasks, evidence, gates, diagnostics, policy blocks, and developer details.
- Non-roadmap tabs use capability language such as `Ready`, `Read-only`, `Not enabled`, or `Disabled by policy`.
- OS phase labels belong only on OS Roadmap.
- If a tab shows an empty state, follow its next-action guidance instead of assuming the service or project is broken.

## Trigger + Integrations

- Route: `/command-center/triggers`
- Purpose: show preview-only trigger and integration readiness for manual
  commands, scheduled triggers, GitHub events, Jira/Linear tickets, and
  Slack/Teams chat commands.
- Current status: dry-run preview only. Trigger execution, webhook listeners,
  schedulers, credentials, external network calls, provider/tool/worker
  execution, DB writes, and project mutation are disabled.
- Use this page to understand future integration mappings and safety posture,
  not to run external integrations.

## Scope and Project Shell

- Active Project is the primary work context when a project is selected; mode
  and environment badges are secondary metadata.
- Project scope shows the active project, active mission, project tasks, evidence, gates, and cost posture when available.
- Portfolio scope is a placeholder until future multi-project adapters are enabled.
- NEXUS OS scope is for platform progress, service posture, docs/tests readiness, and roadmap status.
- If no project is selected, Command Center should guide the operator to create
  or import a project, add a project profile, define stack and test commands,
  create a mission, generate a plan, and activate the first task.
- DemoApp is demo mode only and must not be treated as the local-private fallback.

## Roadmap Separation

- OS Roadmap tracks NEXUS OS phases and subphases only.
- Project progress, project milestones, adapters, and open project gaps belong on the Projects route.
- Project Registry is planned for P42; until then, multi-project views use honest placeholders instead of fabricated live project data.

## Mission Control

- Purpose: enterprise cockpit for the active mission and current platform posture
- Shows: mission hero, next best action, system status, gates, tasks, safety, evidence, and readiness
- Available actions: mission planning, review, explain, and operator action
  previews through the command palette and Mission Control action row
- Disabled actions: show user-facing reasons such as `Requires governed action bridge`, worker runtime requirements, or
  `Requires release action bridge`
- Evidence/activity: summarized from runtime records and snapshots
- Known limitations: does not execute providers or worker runtime

## Workspace

- Purpose: plan and choose governed workflows
- Shows: workflow groups, capability states, owner agents, and blocked reasons
- Available actions: planning-oriented workflow entry points
- Disabled actions: explain missing capability such as release bridge, provider dispatch, or iOS runner
- Evidence/activity: workflow expectations only; evidence appears after governed actions
- Known limitations: no broad autonomous execution

## Task Queue

- Purpose: view planned tasks and activated/runtime tasks
- Shows: task state, owner agent, risk, evidence count, and next action
- Available actions: task activation when supported by the activation bridge
- Disabled actions: explain activation constraints instead of phase labels
- Evidence/activity: evidence counts and next-action guidance
- Known limitations: runtime execution remains governed and scoped

## Agent Workbench

- Purpose: inspect activated tasks and capture human review decisions
- Shows: selected task details, owner agent, state, review posture, blockers, evidence, and activity
- Available actions: review output, request changes, approve plan, open evidence when the bridge is online
- Disabled actions: show bridge or workflow limitations clearly
- Evidence/activity: linked evidence and audit counts
- Known limitations: no free agent execution from this page

## Implementation Workflow

- Purpose: review controlled implementation state
- Shows: status, scope, owner, validation, rollback posture, and developer details
- Available actions: scoped implementation review flows only
- Disabled actions: explain when broader implementation or mutation is not enabled
- Evidence/activity: validation and implementation review context
- Known limitations: documentation-only or scoped implementation boundaries remain active

## Live API Status

- Purpose: show local API availability and data-source posture
- Shows: online/offline state, mode, data source, endpoint groups, and dependency context
- Available actions: refresh and operator inspection only
- Disabled actions: no API mutation flows are exposed here
- Evidence/activity: route-level health rather than task evidence
- Known limitations: the local API may still be offline, in which case Command Center falls back to snapshot or file-backed data

## Durable State

- Purpose: explain persistence posture
- Shows: file-backed persistence, DB foundation readiness, DB write policy, and import preview
- Available actions: inspection only
- Disabled actions: DB writes remain disabled by policy
- Evidence/activity: source mapping and readiness context
- Known limitations: runtime DB primary is not enabled yet

## Evidence

- Purpose: show what governed actions produced
- Shows: evidence summary, timeline, linked task/action context, redaction status
- Available actions: inspection only
- Disabled actions: raw payload access is intentionally withheld from primary UX
- Evidence/activity: evidence-first view
- Known limitations: raw confidential payloads are not displayed

## Safety Center

- Purpose: explain current safety and governance posture
- Shows: mode boundary, provider status, network policy, DB write posture, approvals, and policy blocks
- Available actions: inspection only
- Disabled actions: mutation and unsafe actions remain governed or disabled
- Evidence/activity: safety posture rather than action history
- Known limitations: no raw policy JSON in primary UX

## Projects

- Purpose: operate the selected project context without mixing project work into
  the NEXUS OS Roadmap
- Shows: Portfolio, Selected Project, Stack, Capabilities, Milestones, Gaps,
  Evidence, and Settings / Adapter tabs
- Portfolio mode: all known workloads, project readiness totals, setup
  guidance, and a project selector shell without fabricating multi-project data
- Selected Project mode: project label, project type, active mission, profile
  state, release readiness, available actions, and a health strip for Project
  Registry, Profile, Stack Profile, Capability Matrix, Adapter Runtime, Project
  Mutation, Provider Dispatch, and DB Writes
- Stack: operator-friendly backend, database, mobile, web, test, and tooling
  readiness; raw paths and commands belong in Developer Details
- Capabilities: user-facing project capability cards with status, owner,
  required runner/capability, and next action
- Gaps: action-oriented cards explaining why each gap matters and what enables
  the next step
- Evidence: project-scoped evidence summaries only; no raw JSON or payload
  dumps in primary UX
- Settings / Adapter: profile source, adapter posture, runtime status, mutation
  posture, provider dispatch, DB writes, allowed/forbidden boundary summaries,
  and Developer Details for raw IDs/paths
- Available actions: inspection only
- Disabled actions: adapter runtime, project mutation, provider/tool/worker
  execution, and DB writes remain disabled
- Evidence/activity: validation posture and readiness context
- Demo boundary: DemoApp appears only on the Demo Mode route or demo-only
  artifacts, never as a local-private Projects fallback
- Known limitations: Project Registry + Adapter Framework is a read-only,
  policy-governed foundation. Project selector persistence is local UI-only.
  Scope classification and project export safety are read-only. Project vs OS
  mutation boundary decisions are dry-run only and do not enable mutation.
  Project export safety shows which paths would be allowed or blocked, but does
  not create a package.
  If no project is selected, use the no-project guidance to create or import a
  project, add a project profile, define stack/test commands, create a mission,
  generate a plan, and activate the first task.

### CareLoop Phase 2

CareLoop can be selected in local-private mode as a real project mission. The
Projects page shows CareLoop Phase 2, the active Phase 2 task plan, project
milestones, readiness gaps, and redacted evidence summaries.

CARELOOP-P2 has moved beyond planning into controlled local implementation and
validation:

- PRD decisions are captured for personas, care circles, invites, care receiver
  activation, task visibility, reminders, escalation, premium limits, and
  monetization.
- Backend and iOS source have been changed under operator-directed local
  workflow.
- Local backend and Xcode tests can run through
  `scripts/careloop-test-runner.sh`.
- Provider calls, production DB writes, StoreKit/APNs/social-auth live
  credentials, and release/deploy actions stay disabled until external setup is
  approved.
- The OS Roadmap remains NEXUS-platform-only; CareLoop phases live under
  Projects and project-roadmap files.

## Service Health

- Purpose: show which local NEXUS services are running, offline, disabled, planned, or unknown
- Shows: localhost-only service manifest posture, current status snapshot, operator commands, doctor findings, and troubleshooting guidance
- Available actions: inspection only
- Disabled actions: UI execution for `nexus:up`, `nexus:down`, `nexus:status`, and `nexus:doctor` is intentionally disabled
- Evidence/activity: service-state and doctor-report summaries rather than task evidence
- Known limitations: the page reflects existing manifest and local-state data; it does not create a new backend status channel

## OS Roadmap

- Purpose: track NEXUS OS platform capability only
- Shows: three primary tabs for Completed, In Progress, and Planned OS phases
- Available actions: inspection only
- Disabled actions: no mutations
- Evidence/activity: roadmap only; project progress stays on the Projects route
- Known limitations: phase labels belong here, not on primary product pages, and project-specific milestones do not belong in the OS roadmap

## Docs & Guides

- Purpose: provide one local index for current usage, codebase, and architecture docs
- Shows: Start Here, Operator Guides, Architecture, Codebase, and Troubleshooting sections with clickable guide cards and an in-page selected guide preview
- Available actions: select a guide card, filter docs, and open the local file from Developer Details when needed
- Disabled actions: no command execution, provider calls, DB writes, or project mutation
- Known limitations: guide previews are curated summaries; full markdown rendering remains future work

## Activity Log

- Purpose: inspect local, file-backed activity records across Command Center UI, Live Local API, governed action bridge, evidence, audit, failures, and blocked work.
- Shows: summary cards, tabs, filters, activity categories, source/agent grouping, task/project grouping, correlation IDs, and Trace Details by correlation ID.
- Available actions: filter, search, open a correlation trace, copy a correlation ID, and clear trace selection.
- How it helps debugging: use Timeline for recent events, Failures & Blocks for stoppages, API & Actions for local API/action bridge flow, and Correlations to inspect one redacted operator trace.
- Safety posture: Activity Log is read-only and displays redacted summaries only. It does not expose raw JSONL rows, raw logs, raw payloads, raw policy JSON, secrets, stack traces, or private project source.
- Disabled/not enabled: provider/tool/worker instrumentation, DB-backed activity storage, retention, export, telemetry, SLOs, and production observability stack.
- Current scope: UI/API/action bridge activity is captured; provider/tool/worker traces are not enabled yet; activity is file-backed/local in P41.8.

## Self-Update

- Purpose: inspect NEXUS OS self-update readiness without enabling apply.
- Shows: what changed, current state, next action, blockers, disabled reason, owner/capability, evidence/activity location, cost impact, approval state, rollback readiness, validation readiness, and scope boundary.
- Available actions: tab navigation only.
- Disabled actions: applying self-updates, generating patches, provider/tool dispatch, worker execution, project mutation, DB writes, deploy, release, network calls, and provider spend.
- Known limitations: Self-Update is display-only; future execution requires a separate approved phase and fresh validation.

## Header and Global Controls

- The global header is intentionally compact: `NEXUS / <Current Page>`, a scope/project chip, help icon, command palette icon, and compact theme menu.
- Environment, Local API, Durable State, service details, and local boot posture live on their dedicated pages instead of crowding every page.
- Theme support remains System, Dark, and Light through the compact theme menu.

## Demo Mode

- Purpose: public-safe explanation of the demo surface
- Shows: DemoApp-safe boundaries and guided demo context
- Available actions: demo inspection
- Disabled actions: private-project actions remain hidden
- Evidence/activity: demo-safe summaries only
- Known limitations: does not expose local-private details

## Agent Fleet

- Purpose: summarize agent roles and readiness
- Shows: current agents, role posture, and readiness states
- Available actions: inspection only
- Disabled actions: no direct dispatch from this page
- Known limitations: provider-backed execution is not enabled

## Approvals

- Purpose: summarize pending and decided approvals
- Shows: approval counts, recent approval state, and linked evidence posture
- Available actions: UI is read-only; local approval decisions use CLI
- Disabled actions: no UI mutation bridge
- Known limitations: approval decisions remain CLI-driven

## Contracts

- Purpose: show governed contracts and their role in execution
- Shows: contract coverage, summaries, and route-level references
- Available actions: inspection only
- Disabled actions: no contract mutation from the page
- Known limitations: developer details remain secondary

## Release Control

- Purpose: show release posture and blockers
- Shows: readiness state, gate status, and release bridge posture
- Available actions: inspection only
- Disabled actions: release action bridge is not enabled
- Known limitations: no deploy actions

## Cost Center

- Purpose: show cost-enforcement posture
- Shows: budget enforcement status, provider spend posture, and batch/API cost context
- Available actions: inspection only
- Disabled actions: cost execution controls are not enabled
- Known limitations: no provider spend because provider dispatch is disabled

## Batch Queue

- Purpose: show batch-processing posture
- Shows: batch readiness, queue posture, and not-enabled guidance
- Available actions: inspection only
- Disabled actions: batch runtime is not enabled
- Known limitations: no live background worker runtime

## API / Batch Adapter

- Purpose: inspect preview-only provider adapter and batch packaging readiness
- Route: `/command-center/api-batch`
- Shows: provider adapters, OpenAI request-shape preview, JSONL preview artifacts, cost estimates, and reconciliation posture
- Available actions: inspection and local preview review only
- Disabled actions: provider calls, external upload, API key reads, worker runtime, DB writes, and project mutation
- Known limitations: real provider dispatch is deferred to a later governed phase
# Data & Context Center

## Full Command Center Identity

The full Command Center is the NEXUS OS operating console. Its primary
contexts are:

- NEXUS OS
- Portfolio
- Selected Project
- No project selected

Environment, local-private mode, service health, and durable-state status are
secondary metadata. They should not replace the selected project or OS scope as
the page identity.

When no project is selected, the full Command Center shows setup guidance:

1. Create or import a project.
2. Add a project profile.
3. Define stack and test commands.
4. Create a mission.
5. Generate a plan.
6. Activate the first task.

Demo fixtures are reserved for a future separate Command Center Lite/demo
surface. They are not the fallback identity for the full Command Center.

Use `/command-center/context` to inspect trusted context readiness. The page
shows data source summaries, system-of-record domains, trust bands, freshness
and lineage status, context packet preview summaries, and exclusions or blocks.

The page is read-only. It does not show raw private docs, raw source, raw logs,
raw policy JSON, secrets, or credentials. It does not execute provider calls,
tool calls, worker jobs, DB writes, project mutation, or runtime agent context
injection.

# Agent Rooms

Use `/command-center/agent-rooms` to inspect governed mesh coordination.

The page shows redacted room, message, handoff, context-sync, and policy
summaries. Agents coordinate through NEXUS governance, not direct free chat.
Messages are scoped, redacted, audited, and policy-checked.

Agent Rooms is read-only in P48. It does not execute agents, transfer task
ownership, call providers, dispatch tools, start workers, write to DB, or mutate
project files. Provider/tool/worker dispatch remains disabled by design.

# Test Center

Use `/command-center/tests` to inspect the Test Suite Manager registry.

The page shows project and OS test suite previews, changed-file to test suite
mapping, evidence schema summaries, and coverage gaps with next actions.

**Tabs:**
- Overview — policy posture (executionEnabled: false, registryOnly: true) and suite counts
- Project Tests — CareLoop test suite previews with commandPreview strings, including focused smoke/backend/iOS suites
- OS Tests — NEXUS OS infrastructure test suite previews
- Selection Preview — shows which suites match current changed files (metadata-only)
- Evidence Model — test result record schema and redaction policy
- Gaps — coverage gaps with owner and next action

Test Center is registry and visibility only in P55. Test execution, command
execution, provider calls, external network, DB writes, and project mutation
are all disabled. The Run buttons in the suite views are disabled with a clear
reason. No DemoApp content appears on this page.
