# NEXUS Agentic OS — Architecture

**Version:** 1.0
**Date:** 2026-05-03

---

## Core Principle

```text
Domains own authority.
Agents own judgment.
Contracts own delegation.
Skills own execution.
Hooks own lifecycle enforcement.
State machines own truth.
Governor owns permission.
Memory owns evidence.
```

This is not a metaphor. Each statement is a structural rule that defines which part of the system is authoritative for which class of decision. Violations of these rules — agents owning truth, prompts owning execution, memory owning permission — are the root causes of agentic soup.

Phase 13 adds a public-safe Demo and Showcase Mode built around `DemoApp`. That
mode is zero-key, read-only by default, and intended for recruiters, investors,
and technical reviewers. It explains the operating system without private
project data and without adding runtime enforcement in this phase.

Phase 14 adds a domain ownership layer that answers who owns each domain, who
may decide, who may execute, who may verify, who may approve, and who resolves
conflicts. That ownership model is documented and validated in policy files, but
it is not runtime-enforced yet.

Phase 15-LOCAL adds the first local runtime traffic-plane layer. It introduces
identity propagation, per-call policy decisions, accountability evidence
records, and behavior baseline helpers that future execution paths can pass
through. The helpers are local modules only in this phase; orchestrator
dispatch is not rewritten yet.

Phase 16-LOCAL adds read-only Command Center live wiring. The dashboard now
surfaces bundled local validation, evidence, and runtime traffic-plane sample
status without adding API, DB, mutation, provider, or dispatch wiring yet.

Phase 17-LOCAL adds a local state adapter and read boundary. It can safely read
approved local files, normalize validation and demo artifacts, and build a
read-only snapshot for the Command Center and future API read routes. It does
not add DB, mutation endpoints, or live API behavior in this phase.

Phase 18-LOCAL adds a safe local write boundary. It introduces append-only
local runtime records for evidence, audit, events, approvals, and incidents,
plus a local task store prototype that future orchestrator integration can use.
It still does not wire orchestrator dispatch, add DB or API layers, or execute
providers.

Phase 19-LOCAL adds an orchestrator adapter dry-run mode. It proves that a
task can flow through identity context, agent context, runtime traffic-plane
evaluation, dry-run local write-boundary validation, and dry-run evidence and
audit simulation without wiring `loop.js`, `runner.js`, providers, or project
mutation.

Phase 20-LOCAL adds controlled local execution mode. It takes the same
governed path one step further by allowing real redacted task, audit,
evidence, runtime-event, approval, and incident records to be written under
`local-state/runtime/` for `DemoApp` only. It still does not wire dispatch,
execute providers or tools, mutate projects, or add DB/API layers.

Phase 21-LOCAL adds Command Center runtime file ingestion. The dashboard now
consumes a generated browser-safe snapshot derived from `local-state/runtime/`
so it can show real local runtime counts and recent records while remaining
read-only and without adding API, DB, or mutation wiring.

Phase 22-LOCAL adds local state-machine enforcement for controlled local task
execution. Before a local task state changes under `local-state/runtime/`, the
executor now validates that transition through the existing task state machine.
This is local prototype enforcement only; it is not wired into `loop.js` or
`runner.js` yet.

Phase 23-LOCAL adds a local approval workflow on top of that path. Approval-
required work now creates append-only local approval requests, approval
decisions, audit records, and approval evidence that can unlock guarded local
state transitions. This is still local only and does not add API, DB, or
provider execution.

Phase 24-LOCAL extends the read-only Command Center path so approval workflow
records and runtime refresh metadata are visible in the dashboard from the
generated runtime snapshot. The UI still does not mutate state, call providers,
or bypass the local CLI approval path.

Phase 25-LOCAL adds guarded local agent-task execution. Deterministic local
checks can now execute through task contracts, identity context, agent context,
capability policy, runtime traffic-plane decisions, task state-machine
validation, and the local write boundary. This still excludes providers,
external tools, project mutation, API, DB, and private-product execution.

Phase 26-LOCAL introduces a strict public/demo versus local-private boundary
for private project access. Public and demo modes stay DemoApp-only, while
local-private mode can access allowlisted private projects for limited
inventory and read purposes.

Phases 27-LOCAL through 31-LOCAL build the first governed private-project
validation path under that boundary: readiness inventory, governed planning,
command classification, controlled backend validation, and a narrow
remediation pass with clean post-fix validation.

Phase 32-LOCAL adds a read-only Command Center private validation view. The UI
still does not mutate state or execute tests. It renders a generated
local-private snapshot that summarizes private-project validation status,
governance posture, and redacted runtime records without adding API, DB, or
provider wiring.

Phase 41.5 completes the first full Command Center UX stabilization loop:
route-wide copy cleanup, capability-state cleanup, global theme support,
Mission Control enterprise layout, page-specific UX cleanup, screenshot audit,
and a split between operator-facing usage guides and contributor-facing
codebase guides.

Phase 41.6.1 starts unified local boot foundation work without orchestrating
processes yet. It adds a declarative local service manifest plus read-only
`nexus:status` and `nexus:doctor` commands so operators can inspect current
service posture and validate localhost-only service assumptions before
single-command boot arrives.

Phase 41.8.1 starts the centralized activity and observability ledger foundation.
It defines a redaction-safe activity event schema, correlation ID model,
activity categories, validation helpers, and architecture docs. It does not add
runtime instrumentation, provider calls, worker execution, DB writes, activity
API routes, Activity Log UI, or project mutation.

Phase 41.8.2 adds the central activity logger and append-only local activity
store at `local-state/runtime/activity.jsonl`. It supports dry-run logging,
redaction before persistence, correlation lookup, and schema validation. It
still does not add broad runtime instrumentation, Activity Log UI, activity API
routes, provider/tool/worker logging, DB-backed activity storage, or project
mutation.

Phase 41.8.3 adds selected capture wiring for local API reads and governed
action bridge outcomes. It keeps activity records redacted and local-only,
exposes a read-only `/activity` summary endpoint, and leaves provider/tool/
worker logging, DB-backed activity storage, and trace drilldown for later
subphases.

The documentation layer is now intentionally separated:

- `docs/usage/` for operators and local users
- `docs/codebase/` for contributors, maintainers, and coding agents
- `docs/architecture/` for system-model and roadmap references

The service foundation follows that same split:

- `docs/usage/` explains how to read `nexus:status` and `nexus:doctor`
- `docs/codebase/` indexes the service-orchestration modules
- `docs/architecture/` defines why process orchestration is deferred to later
  phases

See also [`DOMAIN_OWNERSHIP_POLICY.md`](DOMAIN_OWNERSHIP_POLICY.md),
[`AGENT_AUTHORITY_MATRIX.md`](AGENT_AUTHORITY_MATRIX.md),
[`HANDOFF_OWNERSHIP_MODEL.md`](HANDOFF_OWNERSHIP_MODEL.md), and
[`ESCALATION_AND_CONFLICT_RESOLUTION.md`](ESCALATION_AND_CONFLICT_RESOLUTION.md).
See also [`RUNTIME_TRAFFIC_PLANE.md`](RUNTIME_TRAFFIC_PLANE.md),
[`IDENTITY_PROPAGATION.md`](IDENTITY_PROPAGATION.md),
[`ACCOUNTABILITY_EVIDENCE_RECORD.md`](ACCOUNTABILITY_EVIDENCE_RECORD.md), and
[`BEHAVIOR_BASELINE_MODEL.md`](BEHAVIOR_BASELINE_MODEL.md).

---

## What Makes NEXUS an OS

A traditional operating system provides:

- a scheduler that allocates CPU to processes
- a memory manager that controls address space
- a permission model that restricts what processes can do
- a file system that organizes persistent state
- a kernel that enforces policies processes cannot bypass

NEXUS provides an equivalent structure for agentic work:

| OS concept | NEXUS equivalent |
| --- | --- |
| Scheduler | `loop.js` — polls task queue, dispatches runnable tasks |
| Memory manager | `memory/*.json` — typed state store with write restrictions |
| Permission model | `safety/governor.js` — authorizes every sensitive action |
| File system | `projects/`, `reports/`, `memory/` — scoped by file-scope guard |
| Kernel | Governor + state machine — policies agents cannot bypass |
| Processes | Agents — reason within role boundaries, propose transitions |
| System calls | Tools — `enqueue_task`, `write_file`, `run_skill`, etc. |
| Device drivers | Skills — deterministic procedures for real external tools |
| Audit log | `memory/safety-events.json` — append-only, system-owned |

The OS framing is load-bearing. NEXUS is not "agents with guardrails." The governor, state machine, and contracts are not guardrails bolted onto a chat system. They are the kernel. The agents run on top of them.

The operator layer follows the same rule. Humans do not operate NEXUS by editing JSON, poking memory files, or bypassing dispatch. They operate it later through a Command Center UI and a NEXUS API boundary that still routes through governor, contracts, and the state machine.

Validation reports follow a narrower rule: they are generated during validation before
the final phase commit exists. Their metadata records the validation branch and
validation HEAD at generation time. That metadata is useful for traceability, but it is
not authoritative release metadata. Kanban and phase summaries remain the source of
truth for final phase commit IDs.

The Command Center follows a similar truthfulness rule in Phase 16-LOCAL: local
snapshot visibility is allowed, but the UI must not imply that live task queue
mutation, API calls, DB persistence, provider execution, or Xcode execution are
already wired.

---

## 1. Domains Own Authority

### Definition

A domain is a bounded area of the system that has a designated lead agent and a defined
scope of ownership. The domain lead is the authoritative source of output within that
domain. Other agents can read domain outputs but cannot write to authoritative domain
artifacts without delegating through the domain lead.

### Domain Map

| Domain | Lead agent | Owns |
| --- | --- | --- |
| Control | NEXUS | Portfolio state, agent dispatch, release decisions |
| Program | SHEPHERD | Sprint scope, exit criteria, dependency graph |
| Product | ATLAS | PRD, API contracts, sprint scope decisions |
| Platform | FORGE | Infrastructure, secrets, deploy pipeline |
| Verification | AUDITOR → SENTINEL → WARDEN | Gate evidence, QA sign-off, compliance sign-off |
| Growth | BEACON / COMPASS / ORACLE | ASO copy, keywords, analytics schema |
| Feedback | RELAY | Tester synthesis, bug clustering |
| Design | PRISM | Design system tokens, component specs |

### Why Domains Matter

Without domain ownership, multiple agents write to the same artifacts. CORE rewrites a schema that ATLAS owns. SENTINEL approves a gate that AUDITOR should have blocked. BEACON modifies copy that WARDEN has not reviewed. Each violation is individually small and collectively catastrophic.

Domain ownership is enforced at two levels:

1. **Behavioral**: agent system prompts define what each agent owns and cannot own.
2. **Structural**: the file-scope guard restricts which agent can write to which path.

---

## 2. Agents Own Judgment

### What Agents Are

Agents are reasoning units that operate within defined role boundaries. An agent's job is to interpret intent, make decisions within its scope, propose artifacts, and request state transitions. An agent does not own truth — it proposes truth to the state machine.

### What Agents Do

- Interpret task objectives in the context of their domain knowledge
- Decide how to approach implementation within allowed scope
- Call tools (read, write, enqueue, run_skill) to act on decisions
- Propose work products (code, documents, reports)
- Request handoffs via typed handoff contracts
- Report blockers to NEXUS via log_event or task result

### What Agents Do Not Do

- Decide that a gate has passed
- Decide that a sprint is complete
- Decide that a release is approved
- Write to memory files they do not own
- Enqueue tasks for agents they are not authorized to dispatch to
- Invoke skills they do not own
- Bypass the governor

### The Separation of Judgment and Authority

An agent that builds an API route has good judgment about whether that route is correct. It does not have authority to decide the route is verified. Judgment and authority are deliberately separated. The agent proposes; the state machine validates; the verifier confirms; NEXUS decides.

---

## 3. Contracts Own Delegation

### What Contracts Are

No work moves between agents without a typed contract. A contract is a structured object that specifies what work is being delegated, to whom, under what constraints, and with what acceptance criteria. Without a contract, there is no delegation.

### The Three Contract Types

**Task Contract** — governs what a single agent is asked to do:

```json
{
  "taskId": "task-...",
  "agentId": "core",
  "projectId": "demoapp",
  "taskType": "implementation",
  "objective": "...",
  "allowedFiles": ["demo/", "dashboard/"],
  "forbiddenFiles": ["memory/", "projects/"],
  "acceptanceCriteria": ["..."],
  "riskLevel": "medium",
  "blocking": true,
  "parentTaskId": "task-..."
}
```

**Handoff Contract** — governs delegation from one agent to another:

```json
{
  "sourceAgent": "core",
  "targetAgent": "auditor",
  "projectId": "demoapp",
  "taskType": "verification_gate",
  "objective": "...",
  "allowedFiles": ["demo/", "dashboard/"],
  "requiredSkills": ["auditor.code.lint", "auditor.code.diff_review"],
  "acceptanceCriteria": ["code.lint PASS", "code.diff_review PASS"],
  "riskLevel": "medium",
  "blocking": true,
  "parentTaskId": "task-..."
}
```

**Verification Contract** — governs what a gate must produce to be considered PASS:

```json
{
  "status": "gate_pass | gate_fail",
  "agentId": "auditor",
  "skillResults": [...],
  "gateDecision": "PASS — all required skills passed",
  "reportFile": "demo/reports/auditor-report.json",
  "completedAt": "..."
}
```

### Why Contracts Prevent Agentic Soup

A vague handoff — "CORE is done, SENTINEL should do QA now" — is not a contract. It contains no scope constraints, no acceptance criteria, no skill requirements, no blocking relationship. Receiving agents cannot execute safely because they do not know what they are authorized to do.

Contracts convert intention into specification. They are the interface between agents, not chat.

---

## 4. Skills Own Execution

### What Skills Are

Skills are deterministic Node.js procedures that run real tools — ESLint, SwiftLint, xcodebuild, xcrun, grep — and return typed results. Skills do not use Claude. Skills do not reason about results. Skills run and return `PASS`, `FAIL`, or `INFO`.

### Why Skills Exist

The alternative to skills is having Claude decide whether lint passed. That is not deterministic, not reproducible, and not auditable. A gate that relies on an LLM's opinion is not a gate.

Skills make gates verifiable. When AUDITOR runs `code.lint` and it returns `PASS`, that result is backed by ESLint's exit code and stdout. It is not an inference.

### Skill Ownership

Skills are owned by the agent that runs them. The governor enforces this. CORE cannot run `auditor.code.lint`. SENTINEL cannot run `warden.compliance.privacy.check`. Ownership prevents agents from self-certifying by running their own verification skill.

### The Skill Contract

Every skill returns:

```json
{
  "result": "PASS | FAIL | INFO",
  "issues": [{ "severity": "error | warning | info", "file": "...", "message": "..." }],
  "summary": "one-line description of result"
}
```

Skills write full output to `reports/<agent>/`. The structured result is used for gate pass/fail logic. The report file is the evidence artifact.

### Current Skills

| Agent | Skill | Tool it runs |
| --- | --- | --- |
| auditor | `code.lint` | ESLint + SwiftLint |
| auditor | `code.static_analysis` | grep for TODOs, console.log, eval(), localhost |
| auditor | `code.test_coverage` | count test files and functions |
| auditor | `code.diff_review` | git diff, high-risk file detection |
| sentinel | `qa.security.scan` | grep for secrets in source |
| sentinel | `qa.simulator.run` | xcrun simctl boot + install |
| sentinel | `qa.tests.execute` | xcodebuild test |
| sentinel | `qa.logs.analyze` | xcrun simctl log stream |
| warden | `compliance.privacy.check` | verify privacy.html sections |
| warden | `compliance.permissions.validate` | verify Info.plist NSXxx keys |
| warden | `compliance.appstore.check` | char limits, forbidden claims |
| nexus | `decide.priority` | rank task queue |
| nexus | `decide.release` | GO/NO-GO from gate statuses |
| nexus | `read.system_state` | consolidated memory snapshot |
| orchestrator | `flow.plan` | structured sprint phase plan |
| orchestrator | `flow.dispatch` | enqueue task with dependsOn |
| orchestrator | `flow.monitor` | real-time queue status |
| orchestrator | `flow.aggregate` | summarize phase results |

---

## 4.1 Execution Is Runtime-Aware

Skills and agents do not execute in an abstract void. They execute inside specific runtimes with specific capabilities and limits.

NEXUS execution runtimes are:

- `node-local`
- `linux-container`
- `macos-xcode`
- `provider-api`
- `batch-provider`
- `mcp-server`
- `human-approval`

The runtime is part of the execution contract, not an incidental implementation detail.

Examples:

- backend lint, static analysis, and many local checks can run in `node-local` or later `linux-container`
- iOS simulator and `xcodebuild` tasks require `macos-xcode`
- realtime planning or release decisions route through `provider-api`
- non-blocking summaries can route through `batch-provider`
- deploy, secrets, migration, and production-data actions may require `human-approval`

Two principles follow from this:

1. Execution is runtime-aware.
2. Containerization does not replace macOS Xcode runtime for iOS validation.

Runtime selection must happen before scheduling, because verifier evidence is only valid if it comes from a runtime that can actually perform the work.

The runtime model now also has a documented security boundary: sandbox rules,
default-deny network posture, secret handling, provider controls, MCP lifecycle,
and human approvals. Phase 9 adds the policy and validation model for those layers
only. It does not implement runtime enforcement yet.

Phase 11 layers a capability model on top of that runtime and security structure.
Capabilities are the bridge between agents, contracts, tools, skills, runtimes,
providers, approvals, evidence, and policies. Future tool, skill, provider, and
MCP execution should resolve through a capability check before execution. This
phase defines the registry and validation model only; it does not implement
runtime capability enforcement yet.

Phase 12 extends the proof model further with observability, traces, offline
evals, artifact metadata, telemetry, and evidence lineage. These make artifacts
and evidence explicit proof surfaces and keep evals offline and deterministic by
default. This phase defines models, policies, examples, and checks only; it
does not implement live telemetry exporters or runtime observability pipelines.

See:

- [`EXECUTION_RUNTIME_ARCHITECTURE.md`](EXECUTION_RUNTIME_ARCHITECTURE.md)
- [`XCODE_RUNNER_ARCHITECTURE.md`](XCODE_RUNNER_ARCHITECTURE.md)
- [`SKILL_RUNTIME_MAPPING.md`](SKILL_RUNTIME_MAPPING.md)
- [`EXECUTION_EVIDENCE_MODEL.md`](EXECUTION_EVIDENCE_MODEL.md)
- [`SECURITY_BOUNDARY.md`](SECURITY_BOUNDARY.md)
- [`RUNTIME_SANDBOX_MODEL.md`](RUNTIME_SANDBOX_MODEL.md)
- [`NETWORK_SECURITY_MODEL.md`](NETWORK_SECURITY_MODEL.md)
- [`SECRET_BOUNDARY.md`](SECRET_BOUNDARY.md)
- [`MCP_SECURITY_MODEL.md`](MCP_SECURITY_MODEL.md)
- [`HUMAN_APPROVAL_WORKFLOW.md`](HUMAN_APPROVAL_WORKFLOW.md)
- [`PROVIDER_SECURITY_MODEL.md`](PROVIDER_SECURITY_MODEL.md)

---

## 4.2 Operator Platform Boundary

Humans should not operate NEXUS by mutating memory files directly.

The future operator path is:

```text
Command Center UI
  → NEXUS API
  → Governor
  → Contract validation
  → State machine
  → JSON memory now / PostgreSQL later
```

This means:

- UI actions flow through API, not directly to memory
- API is the mutation boundary
- JSON remains runtime memory now
- PostgreSQL becomes durable state later
- demo and investor views are read-only later
- Obsidian is not runtime memory

See:

- [`COMMAND_CENTER_UI.md`](COMMAND_CENTER_UI.md)
- [`NEXUS_API_ARCHITECTURE.md`](NEXUS_API_ARCHITECTURE.md)
- [`NEXUS_DATABASE_ARCHITECTURE.md`](NEXUS_DATABASE_ARCHITECTURE.md)
- [`DATA_PROTECTION_AND_PII.md`](DATA_PROTECTION_AND_PII.md)
- [`DATABASE_AGENT_SECURITY.md`](DATABASE_AGENT_SECURITY.md)
- [`NEXUS_PLATFORM_ROADMAP.md`](NEXUS_PLATFORM_ROADMAP.md)

Phase 7 defines the operator platform architecture only. It does not implement UI, API,
or DB runtime changes. Phase 7A adds a static Command Center prototype in `dashboard/`
so the operator surface can be reviewed visually before API, DB, and runtime integration
work begins.

Data protection is a separate OS boundary. Classification, redaction, scanning, provider
policy, hook checks, and audit must mediate anything that touches personal information,
DB results, logs, evidence, or batch payloads. Batch and OpenRouter are restricted to
`public` or `internal` data by default. Future DB-agent behavior must route through safe
DB gateway tools and safe views, never raw unrestricted access. This phase defines that
policy, documentation, and validation surface only; it does not implement runtime
enforcement yet.

Phase 9 extends that boundary with default-deny network rules, secret boundary rules,
MCP lifecycle controls, provider safety, runtime sandbox assumptions, and human
approval workflow policy.

Phase 10 extends the OS boundary again with durable execution, task leases,
heartbeats, bounded retries, dead-letter handling, recovery and rollback models, and
incident response. These remain architecture, policy, and validation artifacts only in
this phase.

---

## 5. Hooks Own Lifecycle Enforcement

### What Hooks Are

Hooks are observer functions that fire at defined lifecycle transition points. They do not replace agents — they enforce transitions that agents cannot self-authorize. Hooks record evidence, prevent invalid transitions, and maintain audit continuity.

### The Hook Catalogue

| Hook | Fires when | Enforcement role |
| --- | --- | --- |
| `on_goal_received` | Task picked up by loop | Records task start with full context |
| `on_step_completed` | Task or skill finishes | Records result, tool calls, iterations |
| `on_failure` | Task or skill returns FAIL | Records error; may trigger auto-heal |
| `on_safety_blocked` | Governor blocks an action | Records block reason and evidence |
| `on_handoff_created` | Agent enqueues a handoff | Validates handoff contract completeness |
| `on_skill_executed` | A skill finishes | Records skill result; updates gate evidence |
| `on_batch_queued` | A batch task is deferred | Records batch item ID and expected reconcile path |
| `on_batch_reconciled` | A batch result comes back | Records reconcile result; checks gate isolation |

### The Observability Rule

Hooks are observability and enforcement mechanisms. They are not agents. Hooks do not make product decisions, write feature code, or propose handoffs. A hook that performs meaningful agent work is an architecture violation.

### Fast Handler Requirement

Hook handlers must be fast. Hooks execute synchronously in the loop before the next task is picked up. A hook that calls an LLM, performs heavy I/O, or blocks for more than a few hundred milliseconds degrades the entire system.

---

## 6. State Machines Own Truth

### What the State Machine Does

The state machine is the authoritative record of task, gate, and project state. Agents propose state transitions. The state machine validates and commits them. A state that has not been committed by the state machine does not exist — regardless of what any agent has written to chat or to a file.

### Task State Lifecycle

```text
queued → running → completed → verified → released
```

Transitions:

| From | To | Authorized by |
| --- | --- | --- |
| queued | running | loop.js (dispatcher) |
| running | completed | State machine — requires agent result + tool calls |
| completed | verified | State machine — requires gate evidence from verifier |
| verified | released | State machine — requires NEXUS release decision + all gate reports |
| running | failed | State machine — requires failure evidence |
| failed | queued | loop.js auto-heal — governor-checked |

### Why State Machines Prevent Self-Certification

An agent that writes `"status": "completed"` to a task is proposing a transition, not committing one. The state machine checks: does the result contain verifiable evidence? Was the correct gate sequence run? Are there open dependencies? Without validation, the transition does not commit.

This is the structural reason why workers cannot mark final completion directly.

### Schema Valid ≠ Transition Allowed

The contracts layer and the state machine layer enforce different things. A
state-transition contract that is schema-valid (all required fields present, types
correct) can still be state-machine-blocked. Example: a contract with `from: running,
to: completed, requestedBy: core` passes schema validation but is blocked by the state
machine because `core` is a worker and workers cannot self-certify completion.

See [state-machine/STATE_MACHINE.md](../../state-machine/STATE_MACHINE.md) for the full state machine specification, all lifecycle diagrams, and forbidden transition tables.

---

## 7. Governor Owns Permission

### What the Governor Does

The governor is the single authorization point for all sensitive actions. It runs before every tool execution. It cannot be bypassed by any agent at any tier.

### What the Governor Authorizes

| Action | Guards applied |
| --- | --- |
| `write_file` | Path traversal check + secret scan + verifier write restrictions |
| `enqueue_task` | Tier enforcement + self-enqueue block + circular handoff detection + queue cap |
| `run_skill` | Skill ownership — agent can only invoke skills it owns |
| `write_memory` | Blocks writes to audit logs (`safety-events`, `system-usage`) |
| LLM call | Daily token and cost budget check; usage recorded after call |
| Shell command | Allowlist check against `command-policy.json` |
| Batch submit | Batch eligibility check — code agents and verifiers are never batch-eligible |

### Permission Tiers

| Tier | Agents | Can enqueue for |
| --- | --- | --- |
| ORCHESTRATOR | nexus, loop | anyone |
| SHEPHERD | shepherd | all engineering agents |
| STRATEGY | atlas, radar, meridian, prism, beacon, compass, oracle | nexus only |
| ENGINEER | core, swift, pixel, canvas | nobody |
| PLATFORM | forge, stream, synapse | nobody |
| VERIFIER | auditor, sentinel, warden | nobody |
| OBSERVER | relay | nexus, shepherd |

### Why the Governor Cannot Be Bypassed

The governor runs inside `executeTool` before the tool handler executes. There is no code path that runs a tool without passing through `authorizeAction()`. Agents cannot write directly to the filesystem, spawn tasks, or invoke skills without the governor's authorization.

This is what makes NEXUS enforceable rather than merely documented.

---

## 8. Memory Owns Evidence

### What Memory Is

Memory is the typed state store and evidence database. Every significant action produces a record. Every gate pass produces an artifact. Every decision can be traced to a file. Memory is not a cache. It is not a conversation transcript. It is the audit trail.

### Memory Layout

| Path | Type | Owner | Purpose |
| --- | --- | --- | --- |
| `memory/portfolio.json` | Typed JSON | NEXUS | Project stages, gates, scores |
| `memory/agent-status.json` | Typed JSON | loop.js + agents | Live agent states |
| `memory/task-queue.json` | Typed JSON | loop.js | Task lifecycle |
| `memory/founder-actions.json` | Typed JSON | NEXUS | Open founder directives |
| `memory/safety-events.json` | Append-only log | Safety system | All governor blocks + approvals |
| `memory/system-usage.json` | Append-only log | Budget guard | Token + cost usage |
| `reports/<agent>/` | Markdown / JSON | Each agent | Full skill output, gate reports |
| `memory/conversations/<agent>.log` | Append-only log | Each agent | Activity log |

### Protected Files

`memory/safety-events.json` and `memory/system-usage.json` are system-owned. No agent can write to them directly. The governor blocks such writes at the tool level. This preserves the integrity of the audit trail.

### Memory Quality Rules

- Structured JSON only in `memory/*.json` — no free-form text in typed fields
- No secrets in any memory file — API keys, tokens, credentials are forbidden
- Long outputs go to `reports/<agent>/`, not to `memory/`
- `memory/conversations/<agent>.log` is append-only — never truncated

### Memory as Evidence

When NEXUS makes a release decision, that decision is backed by files:

- `demo/reports/auditor-report.json`
- `demo/reports/sentinel-report.json`
- `demo/reports/warden-report.json`
- `demo/reports/release-decision.json`

The release decision is not a conclusion in a chat thread. It is a structured artifact that references three independent verification artifacts.

---

## System Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│  FOUNDER INTENT                                             │
│  npm run sprint N  |  npm run agent nexus "..."             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  CONTROL PLANE                                              │
│  NEXUS (decision) + SHEPHERD (plan) + loop.js (dispatch)    │
│  Governor authorizes all tool calls in this plane           │
└──────────┬──────────────────────────────────────────────────┘
           │  typed task contracts
           ▼
┌─────────────────────────────────────────────────────────────┐
│  EXECUTION PLANE                                            │
│  CORE  SWIFT  PIXEL  CANVAS  FORGE  STREAM  SYNAPSE         │
│  ATLAS  PRISM  RADAR  MERIDIAN  BEACON  COMPASS  ORACLE     │
│  Workers produce artifacts. Cannot self-certify.            │
└──────────┬──────────────────────────────────────────────────┘
           │  typed handoff contracts
           ▼
┌─────────────────────────────────────────────────────────────┐
│  VERIFICATION PLANE                                         │
│  AUDITOR → SENTINEL → WARDEN                                │
│  Deterministic skills. Evidence artifacts. No source edits. │
└──────────┬──────────────────────────────────────────────────┘
           │  verification contracts + evidence
           ▼
┌─────────────────────────────────────────────────────────────┐
│  CONTROL PLANE (release decision)                           │
│  NEXUS nexus.decide.release → GO / NO-GO / CONDITIONAL      │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│  OBSERVABILITY PLANE (non-blocking, parallel)               │
│  RELAY  hooks  safety-events  system-usage  batch lifecycle  │
└─────────────────────────────────────────────────────────────┘
```

All planes share the governor as their single authorization point. All planes share memory as the evidence store. No plane can bypass either.

---

## 9. Agent Enablement Layer

### Why It Exists

The contracts layer, state machine layer, and governor define what the OS enforces. The
agent enablement layer defines what each agent must understand in order to operate
correctly within that enforcement.

Contracts and state machine rules exist as code. But agents are LLM-based processes —
they must be explicitly taught to read contracts, propose state transitions rather than
commit them, route to the correct model, defer batch work, attach evidence, and produce
well-formed handoffs. Without shared standards, agents drift: they claim completion
without evidence, produce vague handoffs, or attempt transitions the state machine will
reject.

### What the Enablement Layer Is Not

The agent enablement layer does not change runtime behavior. It does not modify the governor, loop.js, skills, or providers. It is shared documentation that agent system prompts reference and extend.

Individual agents will be retrofitted to reference these standards in a subsequent phase. Until then, the standards define the target behavior — not the current baseline.

### The Standards

Shared standards live in `agents/_shared/`. All 20 agent prompts extend these standards; they do not override them.

| Standard | File | Covers |
| --- | --- | --- |
| Operating Standard | `agent-operating-standard.md` | Role discipline, OS process model, "Agents propose. Skills execute. State machines commit." |
| Contract Usage | `contract-usage-standard.md` | How to read task contracts, produce handoffs, handle missing contracts |
| State Machine | `state-machine-standard.md` | What each tier may propose, forbidden transitions, lifecycle diagrams |
| Model Routing | `model-routing-standard.md` | Provider policy, fallback rules, batch eligibility by task type |
| Batch Usage | `batch-usage-standard.md` | Which tasks are batch-eligible, never-batch list, evidence isolation |
| Skill Usage | `skill-usage-standard.md` | Mandatory skills, skill-first verification, skill result format |
| Evidence | `evidence-standard.md` | Evidence types, attachment rules, evidence item shape |
| Handoff | `handoff-standard.md` | Handoff schema, validity rules, canonical chains |
| Etiquette | `agent-etiquette.md` | Communication tone, fabrication prohibition, escalation rules |

### Delivery Sequencing

DemoApp showcase execution should not begin until agents have been confirmed as
contract-aware, state-machine-aware, model-aware, batch-aware, skill-aware, and
evidence-aware. The agent enablement layer is the prerequisite to governed
parallel execution, not an optional add-on.

## 10. Private Project Mode and First Governed Task

Phase 26-LOCAL created the `local-private` mode boundary. Public and demo mode
surfaces block all private project access. In `local-private` mode, private
projects are accessible under an explicit allowlist with `inventory` and `read`
purposes only.

Phase 27-LOCAL produced a readiness snapshot of the private project backend and
iOS projects without reading source contents, .env files, or private business
details.

Phase 28-LOCAL created the first governed private-project task through NEXUS. A
SHEPHERD validation plan was routed through the local identity, capability, state
machine, and write boundary layers and transitioned `queued → running →
implementation_done`. No source mutation, build/test execution, or
provider/network/DB calls were made.

Phase 29-LOCAL classified private-project backend package scripts by execution
safety via the AUDITOR `verification.code_quality_gate` task in `local-private`
mode. No commands were executed. The recommended first controlled validation
command (`test`) was identified for P30.

Phase 30-LOCAL executed the first approved backend command through the NEXUS
controlled local execution path. The AUDITOR `verification.code_quality_gate`
task ran `npm test` with a command allowlist check, preflight, and `spawnSync`
with minimal env (no secrets inherited). Output was captured, redacted, and
hashed. No mutation detected.

Phase 31-LOCAL investigated and remediated one failing test surfaced by P30.
Root cause was classified as a `date_window_boundary_bug` (high confidence).
A narrow 1-line patch was applied to the private-project backend. All 58 tests
pass after the fix was validated through the same governed execution path.

## 11. Architecture Diagram Registry

NEXUS architecture diagrams are tracked through the maintained registry at
[docs/architecture/diagrams/diagram-registry.json](diagrams/diagram-registry.json)
and documented in [docs/architecture/diagrams/README.md](diagrams/README.md).

P41.9.1 adds source-only Mermaid diagrams for the enterprise architecture,
Command Center flow, project/OS boundary, agent governance, runtime
self-healing, and grouped NEXUS roadmap.

P41.9.2 renders public-safe SVG artifacts for those diagrams and updates README
and diagram docs to reference existing SVG outputs only. Mermaid CLI was not
available without installing dependencies in this environment, so P41.9.2 uses
deterministic `fallback-svg` artifacts and records that render mode in the
registry.

The diagram registry is public-safe by default. Diagrams may describe private
project boundaries generically, but they must not include private project names,
source paths, secrets, raw logs, or raw policy payloads. The enterprise
architecture diagram must stay architectural; the full roadmap belongs in the
separate roadmap diagram and roadmap documents.

## 12. Project Registry Foundation

P42.1 adds the Project Registry schema and policy foundation. The baseline
registry distinguishes NEXUS OS platform work, private project placeholders, and
demo-only projects without enabling a runtime project selector or adapter
execution.

The registry uses public-safe labels by default. The demo project entry is
demo-only and must not be used as the local-private fallback project. Private
projects use `Private Project` wording in public-safe surfaces until later
registry and profile phases can safely load explicit local-private metadata.

P42.2 adds the read-only project profile loader and validator for bounded
example `nexus.project.json` profiles. The loader does not execute adapters,
select projects, mutate project files, connect to databases, call providers, or
scan private source trees. It only validates safe profile metadata and reports
readiness for the later stack profile model.
