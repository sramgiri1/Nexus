# NEXUS — Agentic Operating System

> One founder. 20 specialized agents. Strict execution boundaries. Real skill execution. Parallel phases with blocking verification gates.

---

## Architecture

```
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

## File Structure

```
nexus/
├── CLAUDE.md                    ← Claude Code reads this first
├── orchestrator/
│   ├── loop.js                  ← Parallel loop + dependsOn + skill task type + hooks
│   └── runner.js                ← One agent: loads prompt, calls Claude, tool loop
├── skills/                      ← Real executable functions (no Claude needed)
│   ├── index.js                 ← Registry: executeSkill(agent, skill, input)
│   ├── auditor/                 ← code.lint | code.static_analysis | code.test_coverage | code.diff_review
│   ├── sentinel/                ← qa.simulator.run | qa.tests.execute | qa.logs.analyze | qa.security.scan
│   ├── warden/                  ← compliance.privacy.check | compliance.permissions.validate | compliance.appstore.check
│   ├── nexus/                   ← decide.priority | decide.release | read.system_state
│   └── orchestrator/            ← flow.plan | flow.dispatch | flow.monitor | flow.aggregate
├── hooks/
│   └── index.js                 ← on_goal_received | on_step_completed | on_failure
├── tools/
│   └── index.js                 ← MCP-style tools (12 tools, incl. run_skill)
├── agents/                      ← System prompt .md files (20 agents)
│   ├── auditor.md               ← NEW: Code Review Gate
│   └── [nexus|atlas|core|...]
├── memory/                      ← SOURCE OF TRUTH
│   ├── portfolio.json
│   ├── agent-status.json
│   ├── task-queue.json
│   └── founder-actions.json
├── scripts/
│   ├── sprint.js                ← Enqueue sprint with gate phases built in
│   ├── skill.js                 ← Run any skill directly from CLI (NEW)
│   ├── task.js                  ← Add single task to queue
│   ├── run-agent.js             ← Run one agent directly (bypass queue)
│   └── status.js                ← Print system status
└── projects/
    ├── careloop/                ← Fastify + Prisma + PostgreSQL backend
    └── careloop-ios/            ← SwiftUI iOS app
```

---

## Agent Roster

### Core Engine

| Agent     | Layer        | Role                                                        |
|-----------|--------------|-------------------------------------------------------------|
| **NEXUS** | DECIDE       | Strategic brain — goals, priorities, release decisions      |

### Strategy Team

| Agent        | Layer   | Role                                              |
|--------------|---------|---------------------------------------------------|
| **RADAR**    | EXECUTE | Market scanning, TAM validation, threat detection |
| **MERIDIAN** | EXECUTE | Business strategy, pricing, revenue modeling      |

### Product Team (SHEPHERD orchestrates)

| Agent       | Layer   | Role                                              |
|-------------|---------|---------------------------------------------------|
| **SHEPHERD**| ORCHESTRATE | Sprint scope, exit criteria, release gating   |
| **ATLAS**   | EXECUTE | PRD, API contracts, sprint scope locking          |
| **PRISM**   | EXECUTE | Design system, screen specs, component layouts    |
| **CORE**    | EXECUTE | Fastify API, Prisma schema, auth, event logging   |
| **SWIFT**   | EXECUTE | SwiftUI screens, API client, session restore      |
| **PIXEL**   | EXECUTE | Web frontend, NEXUS dashboard                     |
| **CANVAS**  | EXECUTE | Static assets, privacy policy HTML, landing pages |

### Platform Team

| Agent      | Layer   | Role                                              |
|------------|---------|---------------------------------------------------|
| **FORGE**  | EXECUTE | Railway/Render deploy, secrets, CI/CD             |
| **STREAM** | EXECUTE | Data pipelines, external data ingestion           |
| **SYNAPSE**| EXECUTE | AI feature integration (Sprint 3+)                |

### Verification — Global Blocking Gates

| Agent        | Layer  | Skills                                                           |
|--------------|--------|------------------------------------------------------------------|
| **AUDITOR**  | VERIFY | `code.lint` `code.static_analysis` `code.test_coverage` `code.diff_review` |
| **SENTINEL** | VERIFY | `qa.simulator.run` `qa.tests.execute` `qa.logs.analyze` `qa.security.scan`  |
| **WARDEN**   | VERIFY | `compliance.privacy.check` `compliance.permissions.validate` `compliance.appstore.check` |

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

Every sprint auto-inserts verification gates between the build phase and the QA docs phase:

```
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

If any gate FAIL, the next phase's tasks remain blocked by `dependsOn`. Fix the issue, re-run the gate skill, re-enqueue.

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
npm run skill -- --list                     # all available skills

npm run skill auditor code.lint             # ESLint + SwiftLint
npm run skill auditor code.diff_review      # git diff risk analysis
npm run skill sentinel qa.tests.execute     # xcodebuild test
npm run skill sentinel qa.simulator.run     # boot simulator
npm run skill warden compliance.privacy.check
npm run skill nexus read.system_state       # full system snapshot
npm run skill nexus decide.release          # GO / NO-GO
npm run skill orchestrator flow.monitor     # queue status
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

```
1.  sprint.js enqueues tasks in phases with dependsOn wiring + gate skill tasks
2.  loop.js polls task-queue.json every 10s (file watcher triggers instantly)
3.  For each runnable task (dependsOn satisfied):
      type === "skill"  →  executeSkill(agent, skill, input)  [no Claude]
      type === (LLM)    →  runAgent(agentId, task, context)   [Claude API]
4.  Hooks fire: on_goal_received → on_step_completed / on_failure
5.  Results written to queue.completed or queue.failed
6.  Gate phase tasks inherit dependsOn from all preceding phase task IDs
7.  If gate FAIL: next phase stays blocked; fix and re-enqueue gate task
```

---

## Skills System

Skills are deterministic Node.js functions that shell out to real tools. They return:

```json
{ "result": "PASS | FAIL | INFO", "issues": [], "summary": "one-line" }
```

Every verification agent (AUDITOR, SENTINEL, WARDEN) uses `run_skill` via the tool registry. Claude agents can call skills too — they never fabricate lint/test/compliance results.

---

## MCP-Style Tools (12 tools)

| Tool                  | What It Does                                            |
|-----------------------|---------------------------------------------------------|
| `read_memory`         | Read any memory JSON file                               |
| `write_memory`        | Write/merge into a memory JSON file                     |
| `update_agent_status` | Update agent status, task, progress                     |
| `enqueue_task`        | Add a task to the queue for another agent               |
| `read_project`        | Read a project from portfolio.json                      |
| `update_project`      | Update project fields (stage, gate, score...)           |
| `update_gate`         | Update a single gate status for a project               |
| `read_file`           | Read a file from projects/                              |
| `write_file`          | Write a file to projects/ (creates dirs)                |
| `list_files`          | List files in a projects/ directory                     |
| `log_event`           | Append to agent's activity log                          |
| `run_skill`           | Execute a real skill (lint, QA, compliance) — **NEW**   |

---

## Hooks

| Event              | Fires when                    | Built-in behavior                    |
|--------------------|-------------------------------|--------------------------------------|
| `on_goal_received` | Task picked up by loop        | Logs to memory/conversations/orchestrator.log |
| `on_step_completed`| Task or skill finishes        | Logs result, tool calls, iterations  |
| `on_failure`       | Task or skill returns FAIL    | Logs error summary                   |

Register custom hooks in `hooks/index.js` via `registerHook(event, asyncFn)`.

---

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...   # required — Claude Sonnet + Haiku
NEXUS_MODEL=                   # optional override for NEXUS agent
LOOP_INTERVAL=10               # seconds between queue polls (default 10)
OLLAMA_HOST=http://localhost:11434  # optional local model fallback
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

> See [CLAUDE.md](CLAUDE.md) for agent instructions and key decisions.
> See [REFERENCE.md](REFERENCE.md) for portfolio status and token cost estimates.
