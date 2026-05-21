# NEXUS Agentic OS — Product Requirements Document

**Version:** 1.2
**Date:** 2026-05-20
**Status:** Approved; updated through P99.6 Founder Business Build Governed Execution Admission Docs/Roadmap

---

## 1. Product Vision

NEXUS is a governed agentic operating system that converts founder intent into verified software delivery through contracts, skills, state machines, hooks, memory, and release gates.

> **NEXUS turns founder intent into governed, verifiable software delivery.**

> *Intent in. Verified execution out.*

NEXUS is not a collection of agents that chat. It is an OS — with a control plane, execution plane, verification plane, and observability plane — where every action is authorized, every handoff is typed, every gate is deterministic, and every release decision is backed by evidence.

---

## 1A. Current Implementation Status Through P99.6

NEXUS OS has progressed beyond preview-only architecture foundations into
governed local live-runtime state and founder workflow persistence. As of
P99.6:

- Command Center Lite is the primary founder-facing surface for Chat with NEXUS,
  Agent Flow, OS Roadmap, Activity, Live Readiness, Founder Intake, Business
  Build, Docs, and Durable State.
- Founder workflows support idea capture, structured Q&A, local PRD readiness,
  PRD review gates, agent workstream planning, activation review, and
  display-safe Business Build visibility.
- Local SQLite runtime foundations are implemented for schema-backed entity
  definitions, repository reads, governed evidence/audit/activity ledger writes,
  maintenance, and final validation.
- P93 adds enterprise live-runtime CRUD planning for founder session, PRD
  artifact, workstream plan, activation review, runtime task queue, evidence,
  audit, and Command Center state lanes.
- P93 adds governed mutation request envelopes and explicit local SQLite CRUD
  admission for allowlisted NEXUS OS runtime entities.
- Command Center Durable State / DB Runtime shows local CRUD admission
  readiness, request-envelope state, allowed local records, owner capability,
  next action, disabled reason, evidence/activity location, and cost impact.
- P94 adds local SQLite founder workflow schema for founder sessions, Q&A
  turns, PRD artifacts, and workstream plans.
- P94 adds governed founder workflow CRUD admission, blocked by default and
  unlocked only for approved local SQLite operations.
- P94 adds shared display-safe founder DB workflow view models consumed by
  Founder Intake, Business Build, and DB Runtime.
- Command Center Lite, Business Build, and DB Runtime now show saved founder
  workflow state, next question, PRD readiness, workstream lanes, blockers,
  owner capability, disabled reason, evidence/activity location, and cost
  posture.
- P94.6 refreshes README, PRD, roadmap, OS phase status, and validation evidence
  for P94.1-P94.5 before final P94 closure.
- P95 adds display-safe founder persistence operator controls for local SQLite
  founder workflow records.
- P95.3 admits approved local create/read/update/upsert/list operations only
  after explicit operator approval, rollback acceptance, audit acceptance,
  validation command acceptance, `sqlite-live` mode, and local write flags.
- P95.4 shows founder persistence controls in Command Center Lite, Business
  Build, and DB Runtime.
- P95.5 and P95.6 aggregate validation and update docs/roadmap readiness for
  what is live-local and what remains blocked.
- P95.7 closes final validation and records the P96 handoff.
- P96 adds a display-safe Business Build local execution readiness model over
  the founder workflow records.
- P96 renders Business Build local execution readiness and dry-run admission
  lanes in Command Center without runnable execution controls.
- P96 aggregate validation and docs/roadmap readiness prove the founder
  Business Build path is DB-backed locally while unsafe execution remains
  blocked.
- P97 defines the governed Business Build DB CRUD contract, local SQLite schema,
  local CRUD admission model, Command Center DB UX, aggregate validation, and
  docs/roadmap state for moving from local readiness to local SQLite Business
  Build sessions, execution requests, PRD snapshots, and agent lane state
  without enabling execution.
- P98 defines the governed live workstream handoff from DB-backed Business
  Build records into local workstream planning without enabling execution.
- P98 adds a display-safe handoff packet model and deterministic dry-run lane
  previews with owner capability, next action, blockers, disabled reason,
  evidence/activity location, validation command, and cost posture.
- Command Center Lite, Business Build, Agent Flow, and DB Runtime show the P98
  live workstream handoff and dry-run state without raw private IDs, raw DB
  table names, raw JSON/log/policy dumps, or runnable execution actions.
- P99 defines the governed execution admission handoff over P98 live workstream
  handoff packets.
- P99 adds a display-safe admission model, explicit approval envelope, and
  deterministic admission dry-run records for future scoped execution review.
- Command Center Lite, Business Build, Agent Flow, and DB Runtime show the P99
  Execution Admission card with admission state, approval gates, blocked lanes,
  owner capability, next action, disabled reason, evidence/activity location,
  and cost impact.
- P99.6 aggregates validation and updates README, PRD, Command Center guide,
  roadmap, reports, and phase status before final P99 closure.

Safety boundary as of P99.6:

- Provider/model calls remain blocked.
- Agent dispatch, tool execution, and worker execution remain blocked.
- Project source mutation remains blocked.
- Hosted DB mutation, migrations, deploy, release, export, package creation,
  network calls, and provider spend remain blocked.
- P93.4/P94.3 are the narrow exceptions: local SQLite CRUD can be admitted only
  for allowlisted OS runtime/founder workflow records and only with explicit
  operator approval, rollback acceptance, audit acceptance, validation command
  acceptance, `sqlite-live` mode, and local write flags.
- P95.3 is the founder persistence control exception: it permits only approved
  local SQLite founder workflow create/read/update/upsert/list paths and blocks
  delete, raw SQL, hosted DB mutation, project mutation, provider/model calls,
  agent dispatch, worker/tool execution, deploy, release, export, package
  creation, network calls, and provider spend.
- P96 does not add new execution authority. Business Build readiness remains
  local deterministic readiness plus dry-run admission visibility only.
- P97.6 documents governed local SQLite Business Build CRUD only. It does not
  dispatch agents, execute workers/tools, mutate project source, use hosted DBs,
  deploy, package, call providers/models, use network calls, or spend.
- P98.6 documents governed local handoff readiness only. Handoff packets and
  lane previews remain display-safe and non-executable. It does not dispatch
  agents, execute workers/tools, mutate project source, use hosted DBs, deploy,
  package, call providers/models, use network calls, or spend.
- P99.6 documents governed execution admission readiness only. Approval gates
  remain missing by design, executable lane count remains `0`, and P99 does not
  approve execution, dispatch agents, execute workers/tools, mutate project
  source, use hosted DBs, deploy, release, export, package, call
  providers/models, use network calls, or spend.

---

## 2. Problem: Why Loose Multi-Agent Systems Become Agentic Soup

Without architectural discipline, multi-agent systems degenerate. The following failure modes are predictable and compounding.

### 2.1 Vague Handoffs

When agents hand off work through unstructured messages or loosely typed context objects, receiving agents cannot determine what was done, what they are authorized to do next, or whether the prior work should be trusted. Vague handoffs create invisible assumptions that accumulate into broken pipelines.

### 2.2 Unclear Ownership

When multiple agents can act on the same domain — the same file, the same route, the same compliance decision — conflicts arise silently. Work is duplicated, overwritten, or left incomplete because no single agent owns the outcome.

### 2.3 Prompt-Based Verification

When an agent verifies its own work or another agent's work through natural-language reasoning rather than deterministic procedures, the result is not a gate — it is an opinion. Prompt-based verification produces neither reproducibility nor evidence. Gates that rely on Claude saying "looks good" are not gates.

### 2.4 Uncontrolled Task Creation

When any agent can enqueue arbitrary tasks for any other agent, the task queue becomes a free-for-all. Agents spawn remediation loops, retry themselves, and create circular dependencies. Without tier enforcement, the system has no ceiling on compute cost and no floor on task quality.

### 2.5 Untyped Memory

When memory files contain a mix of formats, free-form prose, raw logs, and structured JSON in the same store, downstream readers cannot trust what they find. Agents make decisions on corrupted or stale state. Memory becomes a garbage dump rather than an evidence store.

### 2.6 No State Machine

When task status transitions (pending → running → completed → verified → released) are informal — written by any agent that decides it's done — the system has no single source of truth. An agent can mark itself completed, pass itself, and trigger downstream work without any authoritative validation.

### 2.7 Agents Self-Certifying Work

When the agent that performs work is also the agent that declares it valid, there is no separation of concerns. A builder that also gates its own output is not a gated system — it is a system that pretends to have gates.

### 2.8 Batch / Realtime Confusion

When batch-processed outputs — which are async, deferred, and potentially minutes to hours old — can unblock real-time work, the integrity of the pipeline breaks. A batch report that arrives after a gate has already been passed contributes nothing to safety and may create false evidence.

### 2.9 Weak Enforcement

When safety rules are documented but not enforced — when policy exists in markdown but has no runtime authority — agents will drift. Drift is not malicious; it is architectural. Systems without active enforcement converge on whatever is most convenient, not whatever is most correct.

---

## 3. Goals

NEXUS exists to solve the above problems. Each goal corresponds directly to a failure mode.

| Goal | Addresses |
| --- | --- |
| Typed task contracts | Vague handoffs |
| Typed handoff contracts | Vague handoffs, unclear ownership |
| Deterministic skills for all gates | Prompt-based verification |
| Lifecycle hooks that enforce transitions | Uncontrolled task creation, no state machine |
| State-machine-owned truth | No state machine, agents self-certifying |
| Domain ownership with explicit boundaries | Unclear ownership |
| Governed permissions by tier | Uncontrolled task creation, weak enforcement |
| Evidence-based release decisions | Agents self-certifying, prompt-based verification |
| Cost-aware model routing | Uncontrolled task creation |
| Safe batch processing with gate isolation | Batch/realtime confusion |
| Explicit human approval boundaries | Weak enforcement |

### 3.1 Typed Task Contracts

Every task in the queue must conform to a typed schema: agent, task type, objective, allowed files, forbidden files, acceptance criteria, risk level, blocking flag, and parent task ID. A task without a valid contract is rejected before it enters the queue.

### 3.2 Typed Handoff Contracts

When one agent delegates work to another, the handoff must carry: source agent, target agent, project ID, task type, objective, scope constraints, required skills, acceptance criteria, and risk level. No handoff proceeds without a complete context object.

### 3.3 Deterministic Skills

All verification gates — lint, static analysis, test execution, security scan, compliance check, App Store validation — must run as deterministic Node.js procedures that shell out to real tools. Skills return `PASS`, `FAIL`, or `INFO`. Claude does not interpret skill results. Skills are not prompts.

### 3.4 Lifecycle Hooks

Hooks observe and enforce the task lifecycle at defined transition points: `on_goal_received`, `on_step_completed`, `on_failure`, `on_safety_blocked`, `on_handoff_created`, `on_skill_executed`, `on_batch_queued`, `on_batch_reconciled`. Hooks produce audit records. Hooks prevent invalid transitions.

### 3.5 State-Machine-Owned Truth

Task state transitions are validated before they are committed. Agents propose transitions. The state machine confirms or rejects. Completed and released are not states an agent sets directly — they are states the system authorizes after verifying evidence.

### 3.6 Domain Ownership

Each domain has a designated lead agent. That agent owns the canonical state of its domain. Other agents can read, but only the domain lead can write authoritative outputs within that domain. Ownership is enforced by the governor, not by convention.

### 3.7 Governed Permissions

Every sensitive action — file write, task enqueue, skill invocation, LLM call, shell command — passes through the safety governor before it executes. Permission tiers define what each agent tier can do. Tier violations are blocked and logged.

### 3.8 Evidence-Based Release Decisions

A release decision requires verifiable artifacts: AUDITOR gate report, SENTINEL QA sign-off, WARDEN compliance sign-off, and `nexus.decide.release` skill output. Release is not a conversation conclusion — it is a structured decision backed by three independent gate results.

### 3.9 Cost-Aware Model Routing

The system routes each task to the lowest-cost model capable of handling it. Deterministic skills run without Claude. Fast tasks run on Haiku. Reasoning-heavy tasks run on Sonnet. Batch-eligible tasks are deferred to async batch. Budget guards enforce daily and monthly spend limits per agent.

### 3.10 Safe Batch Processing

Batch tasks are async and deferred. They cannot unblock real-time gates. Batch output must be reconciled before it influences downstream work. Code agents — CORE, SWIFT, PIXEL, CANVAS, FORGE — are never batch-eligible. Verifiers — AUDITOR, SENTINEL, WARDEN — are never batch-eligible.

### 3.11 Explicit Human Approval Boundaries

Certain actions require founder approval before proceeding: any action with `riskLevel: critical`, any gate that fails three consecutive times, any infrastructure change that affects production, any release decision. These are not optional checkpoints — they are enforced approval gates.

---

## 4. Non-Goals

NEXUS explicitly does not aim to be the following.

| Non-goal | Why it is excluded |
| --- | --- |
| A loose multi-agent chat system | Chat produces untyped outputs that cannot gate work |
| A prompt-only framework | Prompts are not enforcement — skills and governor are |
| A code generator wrapper | NEXUS is an OS, not a wrapper around a code LLM |
| A fully autonomous deploy bot | Deploys require human approval; autonomy stops at the gate |
| A system where agents self-certify success | Separation of execution and verification is non-negotiable |
| A system where batch output can pass gates | Batch is async; gates require synchronous evidence |
| A system where workers freely schedule workers | Tier enforcement exists; workers do not enqueue workers |
| A system where prompts replace enforcement | Policy without runtime authority is not policy |

---

## 5. Operator / User

### Primary Operator: The Founder or Builder

The operator of NEXUS is a founder, solo engineer, or small team that wants to build software products with a governed AI team — without building the orchestration infrastructure from scratch.

The operator provides **intent**: a high-level goal, a sprint scope, a feature request, or a product direction. NEXUS translates that intent into a structured execution plan, routes work to the appropriate domain agents, enforces verification gates, and returns verified artifacts.

The operator does not need to manage which agent does what. The operator needs to:

- Approve actions that require human authorization
- Review gate failures and decide whether to re-scope or re-run
- Make product decisions that NEXUS surfaces as requiring founder input

### What the Operator Is Not Doing

The operator is not manually routing tasks between agents. The operator is not writing test scripts. The operator is not deciding which model to use for a given task. The operator is not checking whether lint passed. NEXUS handles all of that.

### The Operator's Interface

| Interface | What it provides |
| --- | --- |
| `npm run sprint N` | Enqueue a full sprint with gates wired |
| `npm run agent nexus "<intent>"` | Direct conversation with NEXUS |
| `npm run skill nexus decide.release` | Request a release decision |
| `npm run status` | Live system state |
| `npm run dashboard` | Visual system view |
| `memory/founder-actions.json` | Queue of founder decisions NEXUS needs |
| `/command-center/lite` | Founder-first Chat with NEXUS and agent planning surface |
| `/command-center/business-build` | Local PRD, workstream, activation review, and business build state |
| `/command-center/database` | Durable State and DB Runtime visibility for local SQLite runtime posture |

---

## 6. Core Motto

> **Intent in. Verified execution out.**

> **NEXUS turns founder intent into governed, verifiable software delivery.**

These phrases define what NEXUS is optimizing for. Every architectural decision — contracts, state machines, governor, skills, hooks — traces back to this: the operator provides direction and receives verified artifacts, not chat transcripts.

---

## 7. Primary Use Cases

### 7.1 Full-Stack SaaS Product Development

A founder defines a product. NEXUS routes design, backend API, database schema, frontend, and infrastructure work to domain agents. AUDITOR gates every build. SENTINEL runs QA. WARDEN validates compliance. NEXUS makes the release decision. The founder approves deployment.

### 7.1A Startup Idea to Business Lifecycle

A founder can arrive with only a startup idea. NEXUS must not jump directly to
implementation. It first runs a governed intake loop:

- capture the founder's raw idea and intended customer
- ask clarifying questions until the business model, customer, problem,
  value proposition, constraints, and success criteria are understood
- route feasibility validation to the appropriate agents, including product,
  business strategy, market research, compliance, design, and technical review
- create a PRD with assumptions, open questions, risks, acceptance criteria,
  validation plan, agent ownership, and evidence requirements
- turn the PRD into governed missions, task contracts, gates, and agent
  assignments
- keep working through validated plans until the idea becomes a complete
  business system with product, operations, release, growth, evidence,
  support, and governance loops

Command Center must make this lifecycle visible as the primary founder
experience. It should show the current idea stage, questions still needed,
feasibility status, PRD status, assigned agents, next action, blockers,
evidence, cost posture, and what NEXUS is not yet allowed to execute.

### 7.2 Mobile App Development

Parallel iOS and backend development managed by SWIFT and CORE, gated by AUDITOR, tested on simulator by SENTINEL, compliance-checked by WARDEN, distributed to TestFlight by FORGE.

### 7.3 AI-Native Applications

SYNAPSE integrates Claude API into product surfaces. NEXUS routes AI feature work through the same gate sequence as all other work — AI features do not bypass verification. All Claude calls in the product are cost-tracked.

### 7.4 QA and Release Automation

Sprint verification without a human QA engineer. AUDITOR runs lint and diff review deterministically. SENTINEL boots the simulator, installs the app, runs XCTest. WARDEN checks privacy and permissions. NEXUS aggregates evidence and recommends GO or NO-GO.

### 7.5 Internal Enterprise Tools

A team uses NEXUS to build internal tooling: dashboards, data pipelines, admin panels. The same OS applies — contracts, gates, domain ownership, governed execution. Works for one tool or a portfolio of tools.

### 7.6 Multi-Project Product Studio Workflows

A studio with multiple concurrent products uses NEXUS to manage the portfolio. One project is active at a time. Work is gated and verified before a project advances to the next gate. On-hold projects are never dispatched to by active agents.

---

## 8. Success Criteria

NEXUS achieves its goals when the following are true in runtime behavior:

| Criterion | How to verify |
| --- | --- |
| Every queued task has a valid task contract | `task-queue.json` — no task missing required fields |
| Every handoff has a valid handoff contract | Handoff context objects have all 13 required fields |
| Every state transition is validated | No task moves to `completed` without matching gate evidence |
| Every gate pass has deterministic evidence | Gate reports in `reports/<agent>/` back all PASS decisions |
| Every release decision has release contract evidence | `nexus.decide.release` output references AUDITOR + SENTINEL + WARDEN reports |
| Batch tasks cannot unblock gates | `dependsOn` wiring blocks gate phases from batch predecessors |
| Code agents cannot batch | CORE, SWIFT, PIXEL, CANVAS, FORGE not in batch-eligible list |
| Verifiers cannot modify production source code | Governor file-scope guard blocks verifier writes to `src/`, `app/`, `lib/` |
| Workers cannot mark final completion directly | State machine rejects direct completion writes from worker agents |
| README explains the OS architecture in the first 60 seconds | Non-technical reader understands control/execution/verification planes within first 500 words |
| Founder idea can become structured PRD readiness without execution leakage | Command Center Lite and Business Build show idea, next question, PRD readiness, workstreams, blockers, evidence, and disabled actions |
| Local runtime state can be persisted only through governed SQLite admission | P93.4/P94.3 checkers prove default blocked state, explicit approval/write flags, entity allowlists, and no hosted DB/project/provider execution |
| Command Center shows DB runtime state without raw internals | P93.5/P94.5 Playwright and checker coverage verify Enterprise Runtime CRUD and Founder DB Workflow UX, evidence links, no raw JSON/log/policy dumps, no DemoApp/private IDs, and no mutation buttons |
| Governed execution admission is visible before execution is allowed | P99.5/P99.6 show admission model, approval envelope, dry-run blockers, owner, next action, evidence, and cost impact across Lite, Business Build, Agent Flow, and DB Runtime while executable lane count stays `0` |

---

## 9. Architectural Constraints

These constraints are not configurable. They define what NEXUS is.

1. **No free-form handoffs.** Every delegation is a typed handoff contract.
2. **No self-certified gates.** The agent that built the work cannot gate the work.
3. **No prompt-only enforcement.** Every policy must have a runtime guard.
4. **No unbounded task spawning.** Tier enforcement and queue size cap (50) are always active.
5. **No batch gates.** Batch output cannot be used as gate evidence for real-time work.
6. **No silent failures.** Every failure is logged to `safety-events.json` or the agent's conversation log.
7. **No secrets in memory.** Memory files never contain API keys, tokens, or credentials.
8. **No direct writes to audit logs.** `safety-events.json` and `system-usage.json` are append-only, system-owned.

---

## 10. Agent Enablement Layer

### Status

Contracts layer: **implemented** (`contracts/`)
State machine layer: **implemented** (`state-machine/`)
Agent enablement layer: **standards written; individual agent retrofitting in progress**

### Purpose

The contracts layer defines what work looks like. The state machine layer defines what transitions are allowed. The agent enablement layer defines how each agent must behave to operate correctly within those systems.

Without shared standards, agents drift. An agent with no contract awareness may attempt a direct `running -> completed` transition. An agent with no evidence standard may claim a gate passed without attaching skill output. An agent with no batch awareness may route gate verification work to async batch. The enablement layer closes these gaps explicitly.

### What It Is Not

The agent enablement layer does not change runtime behavior. The governor, loop.js, skills, and providers are unchanged. The shared standards in `agents/_shared/` are documentation that agent prompts extend — not runtime code.

### Shared Standards

Nine shared standards are defined in `agents/_shared/`:

- `agent-operating-standard.md` — OS process model, role discipline, the "Agents propose. Skills execute. State machines commit." rule
- `contract-usage-standard.md` — how to read, validate, and produce contracts
- `state-machine-standard.md` — per-tier transition expectations, forbidden transitions
- `model-routing-standard.md` — provider policy, fallback rules, budget awareness
- `batch-usage-standard.md` — batch-eligible vs never-batch task types, evidence isolation
- `skill-usage-standard.md` — mandatory skills, skill-first verification, skill result format
- `evidence-standard.md` — evidence types, attachment rules, release evidence requirements
- `handoff-standard.md` — handoff schema, validity rules, canonical chains
- `agent-etiquette.md` — communication tone, fabrication prohibition, blocker resolution

### Delivery Dependency

CareLoop parallel execution (CORE + SWIFT building simultaneously, AUDITOR gate running after, SENTINEL after that) should not begin until agents are confirmed contract-aware and state-machine-aware. The agent enablement layer is a prerequisite to governed parallel execution. Not all 20 agents have been individually retrofitted yet — that is the next phase.

---

## 11. Future Considerations (Out of Scope for v1)

The following are acknowledged as future directions. They are not in scope for the current architecture pass.

- Per-task cost attribution in `system-usage.json`
- Multi-operator / team mode (currently single-operator)
- Plugin architecture for external skill modules
- Cross-project dependency tracking at the OS level
- Provider/model execution admission after explicit cost, policy, rollback, and
  approval gates
- Agent dispatch and worker execution after explicit scoped runtime admission
- Project source mutation, generated app creation, deploy, release, export, and
  package flows after separate phase contracts and validation
- Hosted DB adapters and migrations after local SQLite runtime requirements are
  fully closed and operator approval boundaries are defined
