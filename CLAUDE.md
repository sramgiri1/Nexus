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
│   ├── founder-actions.json ← Founder directives
│   ├── safety-events.json   ← All governor blocks + approvals (append-only log)
│   └── system-usage.json    ← Token + cost tracking per day/month/agent
│
├── guardrails/              ← Safety policy configs (JSON — edit to tune limits)
│   ├── budget.json          ← Token/cost limits per day, month, per-task
│   ├── agent-permissions.json ← Tier definitions + skill ownership map
│   ├── command-policy.json  ← Shell command allowlist + blocked patterns
│   ├── file-scope.json      ← Protected paths + agents with write access
│   ├── loop-policy.json     ← Max iterations, retry limits, loop depth
│   ├── model-policy.json    ← Allowed models + max tokens per call
│   └── approval-policy.json ← Approval thresholds + headless auto-approve
│
├── safety/                  ← Governor modules (additive — never replaces existing code)
│   ├── governor.js          ← authorizeAction() entry point
│   ├── budgetGuard.js       ← Token/cost enforcement + recordUsage()
│   ├── loopGuard.js         ← Self-enqueue + circular handoff detection
│   ├── permissionGuard.js   ← Agent tier enforcement + skill ownership
│   ├── commandGuard.js      ← Shell command allowlist
│   ├── fileScopeGuard.js    ← Path traversal + protected path enforcement
│   ├── secretGuard.js       ← Regex scan for API keys/tokens before write
│   ├── approvalGate.js      ← Log approvals; auto-approve in headless mode
│   ├── safetyLogger.js      ← Writes to memory/safety-events.json
│   └── config.js            ← Loads + caches guardrail JSON configs
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
│   ├── status.js            ← Print status: npm run status
│   └── check-safety.js      ← Safety governor smoke tests: node scripts/check-safety.js
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

## Safety Governor

All sensitive actions are intercepted by `safety/governor.js` before executing.
The governor is **additive** — no existing agents, skills, tools, or memory files were removed.

### What is guarded

| Action                    | Guard applied                                        |
|---------------------------|------------------------------------------------------|
| `write_file` tool         | fileScopeGuard (path traversal) + secretGuard        |
| `enqueue_task` tool       | permissionGuard (tier) + loopGuard (self/cycle)      |
| `run_skill` tool          | permissionGuard (skill ownership)                    |
| LLM call (Anthropic only) | budgetGuard (daily token/cost limits)                |
| Shell command (future)    | commandGuard (allowlist + blocked patterns)          |

### Permission tiers

| Tier         | Agents                                                  | Can enqueue for        |
|--------------|---------------------------------------------------------|------------------------|
| ORCHESTRATOR | nexus                                                   | anyone                 |
| SHEPHERD     | shepherd                                                | all engineering agents |
| STRATEGY     | atlas, radar, meridian, prism, beacon, compass, oracle  | nexus only             |
| ENGINEER     | core, swift, pixel, canvas                              | nobody                 |
| PLATFORM     | forge, stream, synapse                                  | nobody                 |
| VERIFIER     | auditor, sentinel, warden                               | nobody                 |
| OBSERVER     | relay                                                   | nexus, shepherd        |

### Tune limits

Edit files in `guardrails/` — no code change needed:

- `budget.json` — raise/lower daily token/cost limits
- `agent-permissions.json` — add agents to tiers, adjust skill ownership
- `command-policy.json` — add/remove allowed shell commands
- `approval-policy.json` — change `auto_approve_in_headless` to `false` to require human sign-off

### Smoke test

```bash
node scripts/check-safety.js   # 20 tests covering all 6 guard types
```

### Audit log

```bash
cat memory/safety-events.json  # all blocked actions + approvals
cat memory/system-usage.json   # token + cost usage by day/agent
```

## Provider Strategy

### Provider Roles

| Provider | Use case |
| --- | --- |
| **direct_anthropic** | Deep reasoning, compliance, strategy, official Anthropic batch |
| **direct_openai** | Critical coding, realtime execution, official OpenAI batch |
| **openrouter** | Cheap realtime fallback, experimentation, cost-sensitive non-blocking tasks |
| **ollama** | Zero-cost local draft fallback only — never authoritative |

### Routing config

```text
config/
├── model-map.json            ← per-agent provider/model/batch settings
├── model-aliases.json        ← alias → ${ENV_VAR} resolution
├── provider-policy.json      ← provider capabilities + cost multipliers
├── batch-policy.json         ← batch eligibility rules
├── openrouter-policy.json    ← OpenRouter allowed/blocked task types
├── fallback-policy.json      ← fallback trigger conditions
└── task-classification.json  ← task text → task type rules
```

### Batch Processing

- Batch calls cost 50% less (direct_openai or direct_anthropic only).
- Batch is async — task deferred to `memory/batch-queue.json`, no tool loop.
- **Never batch:** code edits, gates, deploys, release decisions, auto-heal, tool loops, secrets, CI/CD, infra.
- **Prefer batch for:** reports, summaries, marketing copy, ASO/SEO, market scans, QA docs.
- OpenRouter chat batch is **disabled** — no official support.

### OpenRouter

- Requires `OPENROUTER_API_KEY`.
- Uses OpenAI-compatible endpoint (`https://openrouter.ai/api/v1`).
- Supports provider routing: `allow_fallbacks`, `require_parameters`, `data_collection: deny`, `sort: price`.
- **Never** used for: `release_decision`, `security_blocker`, `deploy`, `verification_gate`, `auto_heal`.

### Fallback

- Attempted once on first provider call if: `missing_api_key`, `rate_limit`, `provider_unavailable`, `timeout`.
- **Never** fallback on: `budget_exceeded`, `safety_blocked`, `secret_detected`, `permission_denied`.
- Ollama never used as fallback for high-risk task types.

### Commands

```bash
npm run check:model-routing   # validate all agent routing configs (no API calls)
npm run batch:status          # show batch queue counts
npm run batch:submit          # mark pending batches as submitted (local-only, no real API call yet)
```

## Batch implementation status

| Capability | Status |
| --- | --- |
| Dry-run queueing to `memory/batch-queue.json` | **Live** |
| Lifecycle states (`batch_pending`, `dry_run_submitted`, …) | **Live** |
| Real OpenAI Batch API submission | **Disabled** — `ENABLE_REAL_OPENAI_BATCH=false` |
| Real Anthropic Message Batches API | **Disabled** — `ENABLE_REAL_ANTHROPIC_BATCH=false` |
| Batch result polling / reconciliation | **Not yet implemented** |
| OpenRouter live smoke test | **Disabled** — `ENABLE_OPENROUTER_LIVE_SMOKE=false` |

**Do not enable any real-batch flag until `npm run check:model-routing` passes with 0 failures.**

OpenRouter request building is isolated in `providers/openRouterClient.js`. The `provider` routing
object (allow_fallbacks, data_collection, sort) is constructed there and is not spread elsewhere.

Provider batch stubs are in `providers/openaiBatch.js` and `providers/anthropicBatch.js`. Each
function throws with a clear message until the feature flag is set to `true`.

## Agent Operating Standards

All 20 agents must follow the shared standards in `agents/_shared/`. Individual agent prompts extend these standards — they do not override them.

| Standard | File | What It Covers |
| --- | --- | --- |
| Operating Standard | `agents/_shared/agent-operating-standard.md` | Role discipline, verification rules, governor rules, prohibited actions |
| Etiquette | `agents/_shared/agent-etiquette.md` | Communication, handoff tone, blocker resolution |
| Skill Usage | `agents/_shared/skill-usage-standard.md` | When skills are mandatory, skill output contract, how to propose new skills |
| Hook Usage | `agents/_shared/hook-usage-standard.md` | Hook catalogue, payload contracts, observability-only rule |
| Handoff Standard | `agents/_shared/handoff-standard.md` | Handoff schema, validity rules, canonical chains |
| Memory Standard | `agents/_shared/memory-standard.md` | Source of truth map, read/write protocol, protected files |
| Output Contracts | `agents/_shared/output-contracts.md` | Structured output formats for all 8 task result types |

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
