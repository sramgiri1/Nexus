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

## Current Status Through P41.7.5

P41.5 is complete, P41.6.1 through P41.6.6 are complete, and P41.7.1 through P41.7.5 now add the codebase documentation foundation,
finalized tabbed Command Center validation layer, operator-facing usage documentation foundation, and route-aware Command Center help
links. The Command Center and local operator surface have:

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
- durable state foundation with file-backed persistence
- visual QA screenshots and route-wide UX checks

## What Is Not Enabled Yet

- worker runtime
- governed provider dispatch
- DB-backed runtime writes
- release/deploy action bridge
- broad autonomous source mutation

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
- Roadmap: [docs/architecture/NEXUS_PLATFORM_ROADMAP.md](docs/architecture/NEXUS_PLATFORM_ROADMAP.md)
- Visual QA audit: [reports/ui-audit](reports/ui-audit/visual-qa-report.md)

## Codebase Documentation

- [Codebase docs landing page](docs/codebase/README.md)
- [Module registry](docs/codebase/MODULE_REGISTRY.md)
- [Phase module index](docs/codebase/PHASE_MODULE_INDEX.md)

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
- P41.8: Centralized Activity Log + Observability Ledger
- P42: Project Registry + Adapter Framework

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

> See [CLAUDE.md](CLAUDE.md) for agent instructions, safety architecture, and key decisions.
> See [REFERENCE.md](REFERENCE.md) for portfolio status and token cost estimates.
