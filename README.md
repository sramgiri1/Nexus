# NEXUS — Agentic Venture Orchestration System

> One founder. 16 specialist agents. Multiple apps in parallel.
> File-based memory. Agentic loop. MCP-style tools.

---

## Architecture

```
nexus/
├── CLAUDE.md                    ← Claude Code reads this first (agent instructions)
├── orchestrator/
│   ├── loop.js                  ← Agentic loop — polls queue, dispatches agents
│   └── runner.js                ← Runs one agent: builds context, calls Claude, tool loop
├── tools/
│   └── index.js                 ← MCP-style tool registry (11 tools)
├── agents/                      ← System prompt for each agent (loaded from disk)
│   ├── nexus.md                 ← Orchestrator — JARVIS-style
│   ├── atlas.md                 ← Product Agent
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
            ├── api.js             ← Anthropic API calls
            └── nexusPrompt.js     ← Builds NEXUS system prompt from live data
```

---

## Setup (5 minutes)

```bash
# 1. Clone / unzip
cd nexus

# 2. Run setup script
chmod +x setup.sh && ./setup.sh

# 3. Add your API key to .env
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env

# 4. Add your API key to dashboard
echo "VITE_ANTHROPIC_API_KEY=sk-ant-..." >> dashboard/.env
```

Or manually:

```bash
npm install
cd dashboard && npm install && cd ..
cp .env.example .env
cp dashboard/.env.example dashboard/.env
# edit both .env files with your Anthropic API key
```

---

## Usage

### Talk to NEXUS directly
```bash
# Ask anything — NEXUS reads memory files for context
node scripts/run-agent.js nexus "What is blocking Sprint 1?"
node scripts/run-agent.js nexus "Give me a full portfolio status report"
node scripts/run-agent.js nexus "Brief me for an investor meeting"
node scripts/run-agent.js nexus "Which agents should be working right now?"
```

### Queue tasks for the loop
```bash
# Format: npm run task <agentId> "<task>" [projectId] [priority]
npm run task atlas "Write the ShiftPay PRD Section 7 API Contract" shiftpay high
npm run task core  "Generate Prisma schema for ShiftPay" shiftpay critical
npm run task beacon "Draft App Store listing for ShiftPay" shiftpay normal
npm run task radar  "Scan the home maintenance category" null normal
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

```
1. You add a task:
   npm run task atlas "Write PRD" shiftpay high
   → Writes to memory/task-queue.json

2. Loop detects change (file watcher or 10s poll):
   → Picks highest priority pending task
   → Marks task as "running"

3. Runner executes the agent:
   → Loads agents/<agentId>.md as system prompt
   → Reads relevant memory files (lean context, not full chat)
   → Calls Claude with MCP-style tools
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
| One agent context per conversation  | 16 agents share one source of truth  |
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

**NEXUS (Command Center)**
- Chat with NEXUS in real-time
- Context built from live memory files — no stale state
- Left panel shows live agent status, founder directives, task queue
- All data auto-refreshes every 4 seconds from memory/*.json

**STAR MAP (Constellation)**
- 3D animated agent dependency network
- Drag to rotate, scroll to zoom, click nodes to trace dependencies
- Particle streams show active connections
- Auto-rotation with twist effects

**TRACTION (Investor Module)**
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
- ⚡ NEXUS: Orchestrator Loop
- 📊 NEXUS: Status Report
- 🤖 Run: NEXUS Agent
- 🗺️ Run: ATLAS (ShiftPay PRD)
- 🗄️ Run: CORE (ShiftPay Schema)
- 📣 Run: BEACON (App Store Listing)
- 🔭 Run: RADAR (Market Scan)

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
# "Run CORE to generate the ShiftPay Prisma schema"
```

---

## Active Portfolio

| App       | Stage       | Gate | Score | Interviews | TAM    |
|-----------|-------------|------|-------|------------|--------|
| ShiftPay  | incubation  | G1   | 44/50 | 5/5 ✓      | $144M  |
| CareLoop  | incubation  | G1   | 44/50 | 5/5 ✓      | $479M  |
| HomeLog   | discovery   | —    | 41/50 | 0/5        | $599M  |

Combined TAM: **$1.2B+**

---

## Environment Variables

**Root `.env`** (for orchestrator and agents):
```
ANTHROPIC_API_KEY=sk-ant-...
LOOP_INTERVAL=10
MAX_TOKENS=2048
AGENT_MODEL=claude-haiku-4-5-20251001
NEXUS_MODEL=claude-sonnet-4-6
```

**`dashboard/.env`** (for the React dashboard):
```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

---

## Token Cost Estimates

| Operation                | Model      | Tokens (est.) | Cost (est.) |
|--------------------------|------------|----------------|-------------|
| Ask NEXUS (status)       | Sonnet 4.6 | ~2,000         | $0.006      |
| Run ATLAS (write PRD)    | Haiku 4.5  | ~3,000         | $0.002      |
| Run CORE (write schema)  | Haiku 4.5  | ~4,000         | $0.003      |
| Full portfolio scan      | Haiku 4.5  | ~5,000         | $0.004      |
| Dashboard chat message   | Sonnet 4.6 | ~1,500         | $0.005      |

Agents use Haiku by default (fast + cheap). NEXUS uses Sonnet (needs reasoning).
Change models in `.env` at any time.
