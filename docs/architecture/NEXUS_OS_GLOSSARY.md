# NEXUS Agentic OS — Glossary

**Version:** 1.0
**Date:** 2026-05-03

---

## Agentic Soup vs Agentic OS

Before defining terms, it is worth naming the failure mode that NEXUS is designed to prevent.

### Agentic Soup

A multi-agent system where:

- Agents talk to each other freely, without structured delegation
- Handoffs are vague — "CORE is done, someone should do QA" is a handoff
- Agents self-certify their own work — the builder decides the build is verified
- Memory is untyped — JSON files contain a mix of prose, raw logs, and structured data
- State is informal — task status is whatever the last agent that touched it said it was
- Task spawning is unbounded — any agent can create work for any other agent
- Enforcement is documentation — rules exist in markdown but have no runtime authority
- Gates are opinions — a verifier says "looks good" without running real tools

The result: unpredictable behavior, cascading failures, unverifiable outputs, and no trustworthy audit trail. The system may appear to work in demos and collapse under real use.

### Agentic OS

A multi-agent system where:

- Contracts define all work — no task moves without a typed task or handoff contract
- Skills execute procedures — verification runs real tools, not prompts
- Hooks enforce lifecycle — invalid state transitions are blocked at the transition point
- State machines commit truth — agents propose transitions; the state machine validates and commits them
- Governor authorizes actions — every sensitive action passes through a single authorization point before execution
- Memory stores evidence — every gate pass produces a file artifact; every decision can be traced
- Tier enforcement limits spawning — workers cannot dispatch workers; verifiers cannot fix implementation
- Humans approve high-risk actions — certain decisions require founder authorization, not agent consensus

The result: reproducible behavior, auditable decisions, trustworthy gate evidence, and a system that behaves the same way whether a human is watching or not.

---

## Term Definitions

### Founder Intent

A high-level goal, product direction, sprint scope, or task objective provided by the operator. Founder intent is the input that NEXUS translates into typed task contracts and a structured execution plan. Founder intent does not need to specify which agent does what — that is NEXUS's job.

---

### NEXUS

The decision engine and chief of staff of the agentic OS. NEXUS:

- Translates founder intent into typed task contracts
- Dispatches work to domain agents via `enqueue_task`
- Maintains portfolio state in `memory/portfolio.json`
- Makes GO / NO-GO release decisions via `nexus.decide.release`
- Surfaces blockers to the founder via `memory/founder-actions.json`
- Runs at the top of the control plane

NEXUS does not write feature code. NEXUS does not self-certify gates. NEXUS does not approve clinic/EHR integration.

---

### SHEPHERD

The program manager of the agentic OS. SHEPHERD:

- Owns the sprint plan, dependency graph, and exit criteria
- Enforces the gate sequence: AUDITOR → SENTINEL → WARDEN
- Surfaces sprint blockers before they cascade
- Dispatches work to engineering agents on behalf of NEXUS

SHEPHERD is a process role. It runs in the control plane but executes via natural-language tasks (founder-operated until runner dispatch is wired). SHEPHERD does not write product code or approve scope changes without ATLAS input.

---

### Agent

A reasoning unit that operates within a defined role boundary. An agent:

- Interprets task objectives in the context of its domain knowledge
- Makes decisions about how to approach work within its allowed scope
- Calls tools to read, write, and act on decisions
- Proposes state transitions but does not commit them unilaterally
- Has a system prompt that defines its identity, tools, skills, and safety boundaries

An agent is not a free-form AI assistant. An agent is a domain specialist with explicit ownership, explicit tools, and explicit cannot-own restrictions.

---

### Domain

A bounded area of the system with a designated lead agent and a defined scope of authority. A domain owns the canonical state of its artifacts. Other agents can read domain outputs but cannot write authoritative outputs within a domain without delegating to the domain lead.

Examples: product domain (ATLAS), verification domain (AUDITOR → SENTINEL → WARDEN), platform domain (FORGE).

---

### Domain Lead

The agent that owns a domain. The domain lead is the authoritative source of output within that domain. When multiple agents could plausibly act in a domain, only the domain lead is authorized to produce canonical artifacts.

---

### Worker

An agent in the execution plane that produces artifacts. Workers:

- Implement features, write documents, configure infrastructure, produce analysis
- Operate within typed task contracts
- Request verification via typed handoff contracts
- Cannot invoke verification skills they do not own
- Cannot enqueue tasks for other workers at the same tier

See: execution plane.

---

### Verifier

An agent in the verification plane that runs deterministic skills and produces gate evidence. Verifiers:

- Run real tools — not prompts — to produce PASS / FAIL / INFO results
- Write gate evidence to `reports/<agent>/`
- Produce the verification artifacts that NEXUS needs to make a release decision
- Cannot modify production source code
- Cannot fix implementation failures — they report them

Current verifiers: AUDITOR, SENTINEL, WARDEN.

---

### Skill

A deterministic Node.js procedure that runs real tools and returns a typed result. Skills:

- Do not use Claude
- Shell out to ESLint, SwiftLint, xcodebuild, xcrun, grep, or other real executables
- Return `{ "result": "PASS | FAIL | INFO", "issues": [...], "summary": "..." }`
- Are owned by a specific agent — only that agent can invoke the skill
- Are the mechanism by which NEXUS achieves verifiable, reproducible gate evidence

Skills are not prompts. A gate backed by a skill is verifiable. A gate backed by a prompt is an opinion.

---

### Hook

An observer function that fires at a defined lifecycle transition point. Hooks:

- Record evidence at transition points (task start, task complete, skill result, handoff created)
- Can prevent invalid state transitions
- Are fast — they do not call LLMs or perform heavy I/O
- Do not bypass the governor
- Are not agents — they do not make product decisions or propose handoffs

The 8 lifecycle hooks: `on_goal_received`, `on_step_completed`, `on_failure`, `on_safety_blocked`, `on_handoff_created`, `on_skill_executed`, `on_batch_queued`, `on_batch_reconciled`.

---

### Contract

A typed object that specifies a delegation of work. No work moves between agents without a contract. Contracts define scope, authorization, acceptance criteria, and risk level. There are three contract types: task contract, handoff contract, and verification contract.

A contract is not a message. A contract is not a summary of what happened. A contract is a pre-work specification that the receiving agent can execute deterministically.

---

### Task Contract

A typed specification of what a single agent is asked to do. Required fields:

`taskId`, `agentId`, `projectId`, `taskType`, `objective`, `allowedFiles`, `forbiddenFiles`, `acceptanceCriteria`, `riskLevel`, `blocking`, `parentTaskId`.

A task without a valid contract is rejected at the queue level.

---

### Handoff Contract

A typed specification of a delegation from one agent to another. Required fields:

`sourceAgent`, `targetAgent`, `projectId`, `taskType`, `objective`, `allowedFiles`, `forbiddenFiles`, `requiredSkills`, `acceptanceCriteria`, `riskLevel`, `blocking`, `parentTaskId`.

A handoff without all required fields is rejected by the `on_handoff_created` hook.

---

### Verification Contract

A typed gate result produced by a verifier agent after running all required skills. Required fields:

`status` (`gate_pass | gate_fail`), `agentId`, `taskId`, `projectId`, `phase`, `skillResults`, `gateDecision`, `reportFile`, `completedAt`.

A verification contract is the evidence artifact. It cannot be fabricated — it is produced by running real skills and collecting their `PASS | FAIL | INFO` results.

---

### Release Contract

The final artifact produced by NEXUS's `nexus.decide.release` skill. Required fields:

`decision` (`GO | NO-GO | CONDITIONAL`), `projectId`, `sprint`, `gateStatus`, `conditions`, `blockers`, `recommendation`, `decidedAt`.

A release contract references all three verification contracts (AUDITOR + SENTINEL + WARDEN). A release decision without this evidence is not a valid release contract.

---

### Governor

The single authorization point for all sensitive actions. The governor (`safety/governor.js`) runs before every tool execution via `authorizeAction(agentId, action, params)`. It enforces:

- Permission tier limits (what agents can enqueue for whom)
- File scope restrictions (what paths agents can write to)
- Skill ownership (what skills agents can invoke)
- Budget limits (daily token and cost caps)
- Secret detection (API keys, tokens in file writes)
- Audit log integrity (no agent writes to `safety-events` or `system-usage`)
- Loop detection (no self-enqueue, no circular handoffs)

The governor cannot be bypassed by any agent at any tier. It is not a guardrail — it is the kernel.

---

### State Machine

The authoritative validator of task, gate, and project state transitions. The state machine:

- Validates transitions before committing them
- Requires evidence artifacts for transitions to `verified` and `released`
- Rejects transitions that are proposed without sufficient evidence
- Is the reason why workers cannot mark final completion directly

The state machine enforces the principle: agents propose transitions; the state machine commits them.

---

### Memory

The typed state store and evidence database of NEXUS. Memory:

- Lives in `memory/*.json` — structured JSON files with defined schemas
- Is the source of truth for agent status, task queue, portfolio state, and founder directives
- Is the evidence store for gate results, release decisions, and safety events
- Is protected: certain files (`safety-events.json`, `system-usage.json`) are system-owned and cannot be written to by agents
- Is not a conversation transcript, a cache, or a log dump

Agents must read memory before acting and write results to memory after acting. Conversation history is not reliable state.

---

### Evidence

A file artifact that verifiably backs a gate decision. Evidence:

- Is produced by a deterministic skill running a real tool
- Is written to `reports/<agent>/` by the verifier
- Is referenced in the verification contract
- Is required for NEXUS to make a release decision

Evidence is not a claim. "CORE says lint passed" is not evidence. The output of `eslint --format json` written to `reports/auditor/careloop-lint-sprint2-2026-05-03.json` is evidence.

---

### Gate

A blocking verification checkpoint that a task graph phase cannot proceed past until all required skills pass. Gates:

- Are implemented as `dependsOn` wiring in the task graph
- Require verification contracts from AUDITOR, SENTINEL, and/or WARDEN
- Block the next phase structurally — not via prompt or advisory warning
- Can fail, triggering auto-heal via NEXUS dispatch
- Cannot be satisfied by batch output

The three gates in the standard sprint sequence: AUDITOR gate, SENTINEL gate, WARDEN gate.

---

### Batch Task

An async, deferred task whose output is not available in real time. Batch tasks:

- Are eligible for Anthropic Message Batches or OpenAI Batch API (when enabled)
- Are tracked in `memory/batch-queue.json`
- Must be reconciled before their output influences downstream work
- Cannot satisfy gate evidence requirements
- Are never used for: code implementation, gate execution, release decisions, auto-heal, infrastructure work

Batch-eligible task types: marketing copy, ASO copy, market analysis, QA documentation, analytics spec.

---

### Realtime Task

A synchronous task that runs in the active orchestration loop and produces results immediately. Realtime tasks:

- Execute via `loop.js` with Claude or skill invocation
- Can satisfy gate evidence requirements
- Are required for all code implementation, verification, and release work

---

### Deferred Batch

A batch task that has been queued to `memory/batch-queue.json` but not yet submitted to the batch API. Deferred batch is the current implementation state — batch queuing is live but real API submission is disabled until `ENABLE_REAL_OPENAI_BATCH` or `ENABLE_REAL_ANTHROPIC_BATCH` is set to `true`.

---

### Reconciliation

The process of collecting a completed batch job's output and updating the relevant task state in `memory/batch-queue.json`. Reconciliation:

- Fires the `on_batch_reconciled` hook
- Updates batch item status from `submitted` to `reconciled` or `reconciled_requires_review`
- Does not automatically unblock gates — reconciled batch output must be reviewed before it influences gate decisions

---

### Release Decision

A structured decision by NEXUS, backed by three verification contracts, that recommends GO, NO-GO, or CONDITIONAL for a project release. The release decision:

- Is produced by `nexus.decide.release` skill
- References AUDITOR gate report, SENTINEL QA sign-off, and WARDEN compliance sign-off
- Is written to `reports/nexus/` as a typed JSON artifact
- Requires founder approval before a deployment proceeds

A release decision is not a chat message. It is a structured artifact with evidence references.

---

### Agentic Soup

See the opening section of this glossary. The failure mode that NEXUS is designed to prevent. The defining characteristics: vague handoffs, unclear ownership, self-certifying agents, untyped memory, informal state, and enforcement that lives only in documentation.
