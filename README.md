# NEXUS — Agentic Operating System

> One founder. 20 specialized agents. Strict execution boundaries. Real skill execution. Parallel phases with blocking verification gates. Central safety governor on every sensitive action.

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

**Current status:** Standards written. Individual agent retrofitting is in progress — not all 20 agents have been confirmed contract- and state-machine-aware yet. CareLoop full parallel execution should not begin until agents have been individually validated against these standards.

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
    ├── careloop/                ← Fastify + Prisma + PostgreSQL backend
    └── careloop-ios/            ← SwiftUI iOS app
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
npm run task core "Add reminder scheduling" careloop critical
npm run task atlas "Review Sprint 2 contracts" careloop high
npm run task beacon "Write App Store description" careloop normal
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
ANTHROPIC_API_KEY=sk-ant-...      # Claude Sonnet + Haiku

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

NEXUS uses [AGENTS.md](AGENTS.md) for Codex and repo-level operating rules. Local Codex skills exist for branch safety, phase implementation, agent retrofit, PR review, security review, and UI concept work. Claude Code's official `frontend-design` plugin may be used for UI concepts only. Community plugins are intentionally not part of core NEXUS. Tooling assists workflow but does not replace contracts, governor, state machine, skills, or verification gates.

---

> See [CLAUDE.md](CLAUDE.md) for agent instructions, safety architecture, and key decisions.
> See [REFERENCE.md](REFERENCE.md) for portfolio status and token cost estimates.
