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

---

## 1. Domains Own Authority

### Definition

A domain is a bounded area of the system that has a designated lead agent and a defined scope of ownership. The domain lead is the authoritative source of output within that domain. Other agents can read domain outputs but cannot write to authoritative domain artifacts without delegating through the domain lead.

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
  "projectId": "careloop",
  "taskType": "implementation",
  "objective": "...",
  "allowedFiles": ["projects/careloop/src/"],
  "forbiddenFiles": ["projects/careloop/.env"],
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
  "projectId": "careloop",
  "taskType": "verification_gate",
  "objective": "...",
  "allowedFiles": ["projects/careloop/src/"],
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
  "reportFile": "reports/auditor/careloop-diff-review-sprint2-2026-05-03.md",
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

The contracts layer and the state machine layer enforce different things. A state-transition contract that is schema-valid (all required fields present, types correct) can still be state-machine-blocked. Example: a contract with `from: running, to: completed, requestedBy: core` passes schema validation but is blocked by the state machine because `core` is a worker and workers cannot self-certify completion.

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

- `reports/auditor/careloop-diff-review-sprint2-<date>.md`
- `reports/sentinel/careloop-qa-checklist-<date>.md`
- `reports/warden/careloop-compliance-signoff-<date>.md`
- `nexus.decide.release` skill output (written to `reports/nexus/`)

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

The contracts layer, state machine layer, and governor define what the OS enforces. The agent enablement layer defines what each agent must understand in order to operate correctly within that enforcement.

Contracts and state machine rules exist as code. But agents are LLM-based processes — they must be explicitly taught to read contracts, propose state transitions rather than commit them, route to the correct model, defer batch work, attach evidence, and produce well-formed handoffs. Without shared standards, agents drift: they claim completion without evidence, produce vague handoffs, or attempt transitions the state machine will reject.

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

CareLoop parallel execution should not begin until agents have been confirmed as contract-aware, state-machine-aware, model-aware, batch-aware, skill-aware, and evidence-aware. The agent enablement layer is the prerequisite to governed parallel execution — not an optional add-on.
