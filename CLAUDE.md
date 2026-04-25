# NEXUS — Claude Code Instructions

This workspace uses FILE-BASED MEMORY. All state lives in JSON files.
Never rely on conversation history. Always read files first.

## Architecture

```
nexus/
├── memory/               ← SOURCE OF TRUTH (read before acting)
│   ├── portfolio.json    ← All projects, gates, scores
│   ├── agent-status.json ← Live agent states
│   ├── task-queue.json   ← Pending/completed tasks
│   └── founder-actions.json ← Founder directives
├── agents/               ← Agent system prompts (one file per agent)
├── tools/index.js        ← MCP-style tool registry
├── orchestrator/
│   ├── loop.js           ← Main agentic loop (npm run orchestrator)
│   └── runner.js         ← Single agent executor
├── scripts/
│   ├── task.js           ← Add task: npm run task <agent> "<task>"
│   ├── run-agent.js      ← Run directly: npm run agent <agent> "<task>"
│   └── status.js         ← Print status: npm run status
├── projects/
│   ├── shiftpay/         ← ShiftPay codebase
│   └── careloop/         ← CareLoop codebase
└── dashboard/            ← React dashboard (npm run dashboard)
```

## How to Use

### Talk to NEXUS (the main agent)
```bash
node scripts/run-agent.js nexus "What's blocking Sprint 1?"
node scripts/run-agent.js nexus "Give me a full portfolio status report"
node scripts/run-agent.js nexus "What do I need to do today?"
node scripts/run-agent.js nexus "Brief me for an investor meeting"
```

### Queue a task for the loop
```bash
npm run task atlas "Write CareLoop PRD" careloop high
npm run task core "Add reminder scheduling" careloop critical
npm run task beacon "Draft App Store listing for CareLoop" careloop normal
```

### Check system status
```bash
npm run status
```

### Start the orchestrator loop (processes queue automatically)
```bash
npm run orchestrator
```

### Start the dashboard
```bash
npm run dashboard
```

## File-Based Memory Protocol

1. **Read before acting** — always read relevant memory files first
2. **Write results to files** — never just output to chat
3. **Update agent status** — use update_agent_status tool when starting/finishing
4. **Log events** — use log_event for important actions
5. **Enqueue dependent tasks** — use enqueue_task to chain work

## Active Portfolio

**ACTIVE:** CareLoop — all agents focused here
**ON HOLD:** ShiftPay, HomeLog — resume after CareLoop Gate 2

See memory/portfolio.json for current state.

## CareLoop Key Decisions (Locked)

- Bundle ID: com.careloop.ios
- Auth: static API key (x-api-key header)
- Clinic integration: PERMANENTLY OFF (triggers HIPAA)
- Reminder escalation: 15 minutes
- Daily digest: 6pm local time via Resend
- Compliance: FTC Health Breach Notification Rule
