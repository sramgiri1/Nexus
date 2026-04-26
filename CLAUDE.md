# NEXUS — Claude Code Instructions

This workspace uses FILE-BASED MEMORY. All state lives in JSON files.
Never rely on conversation history. Always read files first.

## Core Principle

Every agent does exactly one thing:
- **DECIDE** — strategy (NEXUS)
- **ORCHESTRATE** — flow control (PROGRAM ORCHESTRATOR / loop.js)
- **EXECUTE** — build/work (CORE, SWIFT, FORGE, PIXEL, CANVAS, STREAM, SYNAPSE)
- **VERIFY** — gates (AUDITOR, SENTINEL, WARDEN)
- **OBSERVE** — feedback (RELAY)

No agent mixes responsibilities.

## Architecture

```
nexus/
├── memory/                  ← SOURCE OF TRUTH (read before acting)
│   ├── portfolio.json       ← All projects, gates, scores
│   ├── agent-status.json    ← Live agent states (20 agents now incl. AUDITOR)
│   ├── task-queue.json      ← Pending/running/completed tasks
│   └── founder-actions.json ← Founder directives
│
├── agents/                  ← Agent system prompts (one .md per agent)
│   ├── [nexus|atlas|...]    ← 19 existing + auditor.md (NEW)
│
├── skills/                  ← Real executable skill functions (NEW)
│   ├── index.js             ← Registry: executeSkill(agent, skill, input)
│   ├── auditor/             ← code.lint, code.static_analysis, code.test_coverage, code.diff_review
│   ├── sentinel/            ← qa.simulator.run, qa.tests.execute, qa.logs.analyze, qa.security.scan
│   ├── warden/              ← compliance.privacy.check, compliance.permissions.validate, compliance.appstore.check
│   ├── nexus/               ← decide.priority, decide.release, read.system_state
│   └── orchestrator/        ← flow.plan, flow.dispatch, flow.monitor, flow.aggregate
│
├── hooks/
│   └── index.js             ← on_goal_received, on_step_completed, on_failure (NEW)
│
├── tools/index.js           ← MCP-style tool registry (incl. run_skill — NEW)
├── orchestrator/
│   ├── loop.js              ← Main agentic loop — parallel + dependsOn + skill tasks + hooks
│   └── runner.js            ← Single agent executor (Claude Sonnet/Haiku)
├── scripts/
│   ├── task.js              ← Add task: npm run task <agent> "<task>"
│   ├── sprint.js            ← Enqueue sprint: npm run sprint <1|2|3>
│   ├── skill.js             ← Run skill: npm run skill <agent> <skill> (NEW)
│   ├── run-agent.js         ← Run directly: npm run agent <agent> "<task>"
│   └── status.js            ← Print status: npm run status
├── projects/
│   ├── careloop/            ← CareLoop backend (Fastify + Prisma + PostgreSQL)
│   └── careloop-ios/        ← CareLoop iOS (SwiftUI)
└── dashboard/               ← React dashboard (npm run dashboard)
```

## Agent Hierarchy

```
FOUNDER
  ↓
NEXUS (Decision Engine — DECIDE)
  ↓
loop.js (Program Orchestrator — ORCHESTRATE)
  ↓
┌─────────────────────────────────────────────────────┐
│ STRATEGY TEAM      │ PRODUCT TEAM    │ PLATFORM TEAM │
│ RADAR, MERIDIAN    │ ATLAS, PRISM    │ FORGE, STREAM │
│                    │ CORE, SWIFT     │ SYNAPSE        │
│                    │ PIXEL, CANVAS   │               │
│                    │ (SHEPHERD leads)│               │
├────────────────────┴─────────────────┴───────────────┤
│ VERIFICATION (blocking gates — run after every build)│
│   AUDITOR → SENTINEL → WARDEN                        │
├──────────────────────────────────────────────────────┤
│ OBSERVABILITY (non-blocking)                         │
│   RELAY                                              │
├──────────────────────────────────────────────────────┤
│ GROWTH TEAM                                          │
│   BEACON, COMPASS, ORACLE                            │
└──────────────────────────────────────────────────────┘
```

## Sprint Execution Flow

```
Phase N:   CORE + SWIFT build in parallel
  ↓ all complete
Phase N.1: AUDITOR gate (4 skills run in parallel — no Claude needed)
           code.diff_review | code.lint | code.static_analysis | code.test_coverage
  ↓ all PASS
Phase N.2: SENTINEL QA gate (3 skills)
           qa.security.scan | qa.simulator.run | qa.tests.execute
  ↓ all PASS
Phase N.3: WARDEN compliance gate (2 skills)
           compliance.privacy.check | compliance.permissions.validate
  ↓ all PASS
Phase N+1: SENTINEL QA checklist (Claude — writes human-readable docs)
```

## How to Use

### Run a sprint
```bash
npm run sprint 2 --dry-run   # preview task graph with gate phases
npm run sprint 2             # enqueue and...
npm run orchestrator         # ...process automatically
```

### Run a skill directly
```bash
npm run skill auditor code.lint
npm run skill auditor code.diff_review
npm run skill sentinel qa.tests.execute
npm run skill sentinel qa.simulator.run
npm run skill warden compliance.privacy.check
npm run skill nexus read.system_state
npm run skill -- --list      # show all available skills
```

### Talk to NEXUS
```bash
npm run agent nexus "What's blocking Sprint 2?"
npm run agent nexus "Give me a full portfolio status report"
npm run agent nexus "Brief me for an investor meeting"
```

### Queue a single task
```bash
npm run task core "Add reminder scheduling" careloop critical
npm run task sentinel "Write Sprint 2 QA checklist" careloop high
```

### Check system status
```bash
npm run status
npm run skill nexus read.system_state
npm run skill orchestrator flow.monitor
```

## File-Based Memory Protocol

1. **Read before acting** — always read relevant memory files first
2. **Write results to files** — never just output to chat
3. **Update agent status** — use update_agent_status when starting/finishing
4. **Log events** — use log_event for important actions
5. **Enqueue dependent tasks** — use enqueue_task to chain work
6. **Run skills via run_skill tool** — never fabricate lint/QA/compliance results

## Skills System

Skills are real executable Node.js + Bash functions. They bypass Claude entirely.

| Agent        | Skill                          | What it runs                                |
|--------------|--------------------------------|---------------------------------------------|
| auditor      | code.lint                      | eslint + swiftlint                          |
| auditor      | code.static_analysis           | grep TODOs, console.log, eval, localhost    |
| auditor      | code.test_coverage             | count test files and functions              |
| auditor      | code.diff_review               | git diff, flag high-risk file changes       |
| sentinel     | qa.simulator.run               | xcrun simctl boot + install                 |
| sentinel     | qa.tests.execute               | xcodebuild test                             |
| sentinel     | qa.logs.analyze                | xcrun simctl log stream (8s)                |
| sentinel     | qa.security.scan               | grep for secrets in source                  |
| warden       | compliance.privacy.check       | verify privacy.html sections                |
| warden       | compliance.permissions.validate| verify Info.plist NSXxx keys                |
| warden       | compliance.appstore.check      | char limits, forbidden claims               |
| nexus        | decide.priority                | rank queue tasks                            |
| nexus        | decide.release                 | GO/NO-GO from gate statuses                 |
| nexus        | read.system_state              | consolidated memory snapshot                |
| orchestrator | flow.plan                      | structured sprint phase plan                |
| orchestrator | flow.dispatch                  | enqueue task with dependsOn                 |
| orchestrator | flow.monitor                   | real-time queue status                      |
| orchestrator | flow.aggregate                 | summarize phase results                     |

## Hooks

| Event              | When it fires                    | What it does                   |
|--------------------|----------------------------------|--------------------------------|
| on_goal_received   | Task picked up by loop           | Logs to orchestrator.log       |
| on_step_completed  | Task/skill completes (pass/fail) | Logs result + tool calls       |
| on_failure         | Task/skill returns FAIL          | Logs error for investigation   |

## Active Portfolio

**ACTIVE:** CareLoop — all agents focused here
**ON HOLD:** ShiftPay, HomeLog — resume after CareLoop Gate 2

See memory/portfolio.json for current state.

## CareLoop Key Decisions (Locked)

- Bundle ID: com.careloop.ios
- Auth Sprint 1-2: static API key (x-api-key header)
- Auth Sprint 3: Supabase JWT bearer token
- Clinic integration: PERMANENTLY OFF (triggers HIPAA)
- Reminder escalation: 15 minutes
- Daily digest: 6pm local time via Resend
- Compliance: FTC Health Breach Notification Rule (NOT HIPAA)
