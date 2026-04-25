# NEXUS — Agentic Venture Orchestration System

> One founder. 16 dispatchable agents plus 3 documented process roles. Multiple apps in parallel.
> File-based memory. Agentic loop. MCP-style tools.

---

## Architecture

```text
nexus/
├── CLAUDE.md                    ← Claude Code reads this first (agent instructions)
├── orchestrator/
│   ├── loop.js                  ← Agentic loop — polls queue, dispatches agents
│   └── runner.js                ← Runs one agent: builds context, calls LLM, tool loop
├── tools/
│   └── index.js                 ← MCP-style tool registry (11 tools)
├── agents/                      ← System prompt files (prompt presence ≠ runner dispatch support)
│   ├── nexus.md                 ← Orchestrator — CEO-style
│   ├── atlas.md                 ← Product Agent
│   ├── shepherd.md              ← Program Manager / Sprint Gate Agent
│   ├── warden.md                ← Compliance & Privacy Agent
│   ├── relay.md                 ← User Feedback & Research Agent
│   ├── prism.md                 ← Design Agent
│   ├── forge.md                 ← DevOps Agent
│   ├── core.md                  ← Backend Agent
│   ├── swift.md                 ← iOS Dev Agent
│   ├── sentinel.md              ← QA Agent
│   ├── beacon.md                ← Marketing Agent
│   ├── compass.md               ← SEO Agent
│   ├── oracle.md                ← Analytics Agent
│   ├── canvas.md                ← Web Builder Agent
│   ├── stream.md                ← Data Pipeline Agent
│   ├── synapse.md               ← AI Features Agent
│   ├── radar.md                 ← Market Gap Agent
│   ├── meridian.md              ← Business Agent
│   └── pixel.md                 ← Frontend Agent
├── memory/                      ← SOURCE OF TRUTH — agents read/write these
│   ├── portfolio.json           ← All projects, gates, scores, decisions
│   ├── agent-status.json        ← Live agent states (updated by agents)
│   ├── task-queue.json          ← Pending / running / completed tasks
│   ├── founder-actions.json     ← Founder directives checklist
│   ├── conversations/           ← Per-agent activity logs
│   └── snapshots/               ← Last run output per agent
├── scripts/
│   ├── task.js                  ← CLI: add task to queue
│   ├── run-agent.js             ← Run agent directly (bypasses queue)
│   ├── status.js                ← Print system status
│   └── reset-memory.js          ← Reset task queue
├── projects/
│   ├── shiftpay/                ← ShiftPay codebase
│   └── careloop/                ← CareLoop codebase
└── dashboard/                   ← React dashboard (Vite)
    └── src/
        ├── pages/
        │   ├── CommandCenter.jsx  ← NEXUS chat (reads live memory files)
        │   ├── Constellation.jsx  ← 3D agent network map
        │   └── Traction.jsx       ← Investor metrics module
        └── utils/
            ├── memory.js          ← Fetches memory/*.json files
            ├── api.js             ← Ollama API calls
            └── nexusPrompt.js     ← Builds NEXUS system prompt from live data
```

---

## Agent Roster

### Dispatchable Today

These are the agents currently registered in `orchestrator/runner.js` and dispatchable through the queue today.

### Orchestration

| Agent     | Role               | What it does                                                    |
|-----------|--------------------|-----------------------------------------------------------------|
| **NEXUS** | CEO / Orchestrator | Coordinates all agents, routes work, answers founder questions. |

### Product & Design

| Agent     | Role    | What it does                                                       |
|-----------|---------|--------------------------------------------------------------------|
| **ATLAS** | Product | Writes the PRD, locks decisions, defines API contracts per sprint. |
| **PRISM** | Design  | Produces design system, screen layouts, and component specs.       |

### Engineering

| Agent       | Role          | What it does                                                     |
|-------------|---------------|------------------------------------------------------------------|
| **FORGE**   | DevOps        | Provisions Supabase, deploys to Railway/Render, manages secrets. |
| **CORE**    | Backend       | Builds the Fastify API, Prisma schema, auth, and event logging.  |
| **SWIFT**   | iOS           | Builds all SwiftUI screens, the API client, and session logging. |
| **PIXEL**   | Frontend      | Builds web UI outside the iOS app (e.g., the NEXUS dashboard).   |
| **CANVAS**  | Web Builder   | Produces static assets: privacy policy HTML and landing pages.   |
| **SYNAPSE** | AI Features   | Integrates LLM features into apps. Deferred to Sprint 2+.        |
| **STREAM**  | Data Pipeline | Manages external data ingestion. No active work Sprint 1-2.      |

### Quality & Testing

| Agent        | Role | What it does                                                          |
|--------------|------|-----------------------------------------------------------------------|
| **SENTINEL** | QA   | Writes and executes the test plan. Signs off on sprint exit criteria. |

### Growth & Analytics

| Agent       | Role      | What it does                                                        |
|-------------|-----------|---------------------------------------------------------------------|
| **BEACON**  | Marketing | Drafts App Store listings and launch copy. Needs Apple Dev account. |
| **COMPASS** | SEO       | Keyword research and ASO optimization. Starts when name is locked.  |
| **ORACLE**  | Analytics | Defines event schemas and PostHog funnels. Deferred to beta.        |

### Strategy

| Agent        | Role       | What it does                                                      |
|--------------|------------|-------------------------------------------------------------------|
| **RADAR**    | Market Gap | Scans categories for whitespace, validates TAM, flags threats.    |
| **MERIDIAN** | Business   | Scores revenue models, validates pricing, produces business case. |

### Documented Process Roles

These prompt files exist and are used as founder workflow lanes in the documentation, but they are not currently dispatchable from the queue because `orchestrator/runner.js` does not register them yet.

| Role         | What it does                                                         |
|--------------|----------------------------------------------------------------------|
| **SHEPHERD** | Program manager for sprint scope, exit criteria, and release gating. |
| **WARDEN**   | Compliance and privacy owner for user-data handling and sign-off.    |
| **RELAY**    | Tester feedback and support synthesis routed back into product/QA.   |

---

## How Agents Derive Data from Each Other

Agents do not call each other directly — they communicate through the shared memory files in `memory/`. The graph below shows who produces what and who reads it.

```text
FOUNDER
  │  writes directives
  ▼
memory/founder-actions.json
  │  read by
  ▼
NEXUS ──────────────────────────────────────────────────────────────────┐
  │  routes work via task queue                                          │
  ▼                                                                      │
memory/task-queue.json                                                   │
  │  dispatches agents                                                   │
  ▼                                                                      │
RADAR ──► memory/portfolio.json (TAM, score)                            │
  │                                                                      │
  └──► MERIDIAN reads TAM + score ──► writes business score             │
                                                                        │
ATLAS reads portfolio.json + RELAY's feedback clusters                  │
  │  writes PRD (projects/careloop/docs/PRD.md)                         │
  ▼                                                                      │
SHEPHERD (process role; founder/manual workflow until runner wiring exists)
  reads PRD ──► slices sprint scope ──► writes sprint plan              │
  │                                                                      │
  ├──► PRISM reads PRD + sprint scope ──► writes screen specs           │
  │                                                                      │
  ├──► CORE reads PRD + API contracts ──► writes routes, schema         │
  │      │                                                               │
  │      └──► SWIFT reads API contracts ──► writes iOS screens          │
  │                                                                      │
  ├──► SENTINEL reads PRD + sprint scope ──► writes QA checklist        │
  │                                                                      │
  ├──► WARDEN (process role) reads PRD §8 (compliance) ──► writes privacy policy, │
  │           incident-response.md                                       │
  │                                                                      │
  └──► FORGE reads portfolio.json (infra decisions) ──► deploys API     │
                                                                        │
RELAY (process role) reads alpha feedback ──► clusters bugs ──► writes to│
  memory/founder-actions.json ──► read by ATLAS, SENTINEL ◄────────────┘

ORACLE reads PRD §10 (event schema) ──► configures PostHog funnels
BEACON reads PRD + app name ──► writes App Store copy
COMPASS reads app name + BEACON copy ──► writes ASO keywords
CANVAS reads PRD §8 (privacy policy template) ──► writes privacy.html
```

**Key data flows in detail:**

| Produces                           | Agent    | Consumed by                                    |
|------------------------------------|----------|------------------------------------------------|
| TAM, opportunity score             | RADAR    | MERIDIAN, NEXUS, ATLAS                         |
| Business score, revenue model      | MERIDIAN | NEXUS, founder briefings                       |
| PRD (requirements, API contracts)  | ATLAS    | SHEPHERD (process role), CORE, SWIFT, PRISM, SENTINEL, WARDEN (process role) |
| Sprint plan, exit criteria         | SHEPHERD (process role) | NEXUS, SENTINEL, all engineering agents        |
| API routes + schema                | CORE     | SWIFT, SENTINEL, FORGE                         |
| iOS screens                        | SWIFT    | SENTINEL (test plan), RELAY (process role feedback) |
| Screen designs                     | PRISM    | SWIFT, CORE, ATLAS                             |
| QA checklist + test results        | SENTINEL | SHEPHERD (process-role sprint gate), ATLAS     |
| Compliance review + privacy policy | WARDEN (process role) | SHEPHERD (process role; can't ship without sign-off) |
| Deployed API + infra               | FORGE    | SWIFT, SENTINEL                                |
| User feedback clusters             | RELAY (process role) | ATLAS (PRD revisions), SENTINEL (bugs)         |
| App Store copy                     | BEACON   | COMPASS (ASO), founder review                  |
| Event schema + funnels             | ORACLE   | NEXUS (north-star metrics), ATLAS              |
| Privacy policy HTML                | CANVAS   | WARDEN (process role) review, FORGE (deploy)   |

---

## Setup (5 minutes)

```bash
# 1. Install Ollama and pull models
brew install ollama && brew services start ollama
ollama pull llama3.2:3b
ollama pull qwen3:4b
ollama pull qwen2.5-coder:3b
ollama pull qwen2.5-coder:7b

# 2. Install dependencies
npm install
cd dashboard && npm install && cd ..

# 3. Copy env files
cp .env.example .env
cp dashboard/.env.example dashboard/.env
```

---

## Usage

### Talk to NEXUS directly

```bash
node scripts/run-agent.js nexus "What is blocking Sprint 1?"
node scripts/run-agent.js nexus "Give me a full portfolio status report"
node scripts/run-agent.js nexus "Brief me for an investor meeting"
node scripts/run-agent.js nexus "Which agents should be working right now?"
```

### Queue tasks for the loop

```bash
# Format: npm run task <agentId> "<task>" [projectId] [priority]
npm run task atlas    "Write the CareLoop PRD Section 7 API Contract" careloop high
npm run task core     "Generate Prisma schema for CareLoop"           careloop critical
npm run task sentinel "Write Sprint 1 QA checklist"                   careloop high
npm run task beacon   "Draft App Store listing for CareLoop"          careloop normal
npm run task radar    "Scan the home maintenance category"            null    normal
```

### Check system status

```bash
npm run status
```

### Start the orchestrator loop (auto-processes queue)

```bash
npm run orchestrator
# Loop polls task-queue.json every 10s (configurable via LOOP_INTERVAL)
# File watcher triggers immediately on task-queue.json changes
```

### Start the dashboard

```bash
npm run dashboard
# Opens http://localhost:5173
# Dashboard reads memory/*.json files live — always current
```

### Run both together

```bash
npm run dev
# Starts orchestrator loop + dashboard simultaneously
```

---

## How the Agentic Loop Works

```text
1. You add a task:
   npm run task atlas "Write PRD" careloop high
   → Writes to memory/task-queue.json

2. Loop detects change (file watcher or 10s poll):
   → Picks highest priority pending task
   → Marks task as "running"

3. Runner executes the agent:
   → Loads agents/<agentId>.md as system prompt
   → Reads relevant memory files (lean context, not full chat)
   → Calls local LLM via Ollama with MCP-style tools
   → Agent uses tools: read_memory, write_file, update_agent_status, enqueue_task...
   → Tool loop runs until stop_reason === "end_turn" (max 10 iterations)

4. Results written to files:
   → Agent writes output to projects/<id>/docs/ or memory/
   → memory/agent-status.json updated
   → memory/snapshots/<agentId>-latest.json saved

5. Task moves to completed:
   → memory/task-queue.json updated
   → Loop ready for next task
```

---

## Why File-Based Memory

| Chat Memory                         | File-Based Memory                    |
|-------------------------------------|--------------------------------------|
| Lost when conversation ends         | Persists forever                     |
| Grows token count every message     | Agents load only their slice         |
| One agent context per conversation  | 18 agents share one source of truth  |
| Can't be read by other tools        | Dashboard reads same files           |
| Expensive at scale                  | Token-efficient — load what you need |

---

## MCP-Style Tools

Every agent gets a set of typed tools. The runner injects only the tools each agent needs.

| Tool                  | What It Does                                    |
|-----------------------|-------------------------------------------------|
| `read_memory`         | Read any memory JSON file                       |
| `write_memory`        | Write/merge into a memory JSON file             |
| `update_agent_status` | Update agent status, task, progress in memory   |
| `enqueue_task`        | Add a task to the queue for another agent       |
| `read_project`        | Read a project from portfolio.json              |
| `update_project`      | Update project fields (stage, gate, score...)   |
| `update_gate`         | Update a single gate status for a project       |
| `read_file`           | Read a file from projects/                      |
| `write_file`          | Write a file to projects/ (creates dirs)        |
| `list_files`          | List files in a projects/ directory             |
| `log_event`           | Append to agent's activity log                  |

---

## Dashboard

The React dashboard at `localhost:5173` has three views:

### NEXUS (Command Center)

- Chat with NEXUS in real-time
- Context built from live memory files — no stale state
- Left panel shows live agent status, founder directives, task queue
- All data auto-refreshes every 4 seconds from memory/*.json

### STAR MAP (Constellation)

- 3D animated agent dependency network
- Drag to rotate, scroll to zoom, click nodes to trace dependencies
- Particle streams show active connections
- Auto-rotation with twist effects

### TRACTION (Investor Module)

- Traction signals with progress tracking
- Unit economics calculator (LTV, CAC, payback period, gross margin)
- Revenue projection waterfall (Month 1–12)
- Evidence wall + investor-ready checklist + comparable exits

---

## Adding a New App

```bash
# 1. Add to portfolio
node scripts/run-agent.js nexus "Add a new project called PetLog — pet care tracker — TAM $80M"

# 2. Have RADAR scan the space
npm run task radar "Score the pet care app opportunity" null high

# 3. Have MERIDIAN validate the revenue model
npm run task meridian "Validate PetLog revenue model — $4.99/mo freemium" petlog normal

# 4. Start Gate 0 interviews
# (you do this — NEXUS can't do user interviews)
```

---

## VS Code Integration

**Launch configs** (F5 or Run panel):

- NEXUS: Orchestrator Loop
- NEXUS: Status Report
- Run: NEXUS Agent
- Run: ATLAS (CareLoop PRD)
- Run: CORE (CareLoop Schema)
- Run: SENTINEL (QA Checklist)
- Run: BEACON (App Store Listing)
- Run: RADAR (Market Scan)

**Tasks** (Cmd+Shift+P → "Run Task"):

- NEXUS: Install All Dependencies
- NEXUS: Start Orchestrator Loop
- NEXUS: Start Dashboard
- NEXUS: Status Report
- NEXUS: Ask NEXUS (status / blockers / investor brief)
- NEXUS: Reset Task Queue

**Claude Code** — open from project root:

```bash
claude
# Claude reads CLAUDE.md automatically
# "What's the current portfolio status?"
# "Run CORE to generate the CareLoop Prisma schema"
```

---

> See [REFERENCE.md](REFERENCE.md) for portfolio status, environment variables, and token cost estimates.
