# Task Activation and Agent Assignment — P37-LOCAL

## Purpose

P37 converts planned mission tasks (defined in the mission task plan) into governed runtime tasks in the local queue. This is the first time the operator can take an action that creates real runtime state — without executing agents.

## Why Activation Follows Workflow Templates

P36 (Agentic Workspace) showed the operator what NEXUS can do. P37 lets the operator start the process by activating the first safe task. Activation is the bridge between "I chose a workflow" and "agents begin working" — it converts a plan entry into a runtime queue entry with full governance records.

## Planned Task vs Runtime Task

| Concept | Planned Task | Runtime Task |
|---|---|---|
| Source | `contracts/missions/private-project-task-plan.json` | `local-state/runtime/tasks.json` |
| State | `queued` (in plan, not yet activated) | `queued` (in runtime, ready for agent pickup) |
| Agent | `targetAgent` from mission composer | Preserved from plan |
| Scope | Read-only plan artifact | Mutable runtime record |
| Evidence | None yet | `task_activation` evidence created on activation |
| Audit | None yet | `task_activation_completed` audit event created |

## Agent Assignment from Task Plan

Agents are assigned at plan time by the mission composer. P37 preserves these assignments:

| Task | Agent | Capability | Risk |
|---|---|---|---|
| Project Brief | SHEPHERD | orchestration.plan_flow | medium |
| Backend Validation Follow-up | AUDITOR | verification.code_quality_gate | medium |
| UX Product Flow Planning | PRISM | design.ux_flow | low |
| iOS Readiness Planning | SENTINEL | verification.qa_gate | medium |
| Privacy Compliance Review | WARDEN | security.privacy_review | high |
| First Controlled Implementation Candidate | CORE | implementation.backend_code | high |

Agent assignment is never randomized. It comes from the mission contract.

## Command Center Flow

```
Operator opens Task Queue page
  ↓
Task Queue shows 6 planned mission tasks with agents, capabilities, risk levels
  ↓
Operator clicks "Activate" on Project Brief (SHEPHERD)
  ↓
taskActions.js → POST /actions/task/activate → mission-action-server → taskActivationBridge
  ↓
Bridge validates: mode, mission contract, task plan, plan task fields, policy
  ↓
Runtime task created: { state: "queued", targetAgent: "shepherd", capabilityId: "orchestration.plan_flow" }
  ↓
Evidence appended: type=task_activation, result=PASS, redacted=true
  ↓
Audit appended: eventType=task_activation_completed, redacted=true
  ↓
Runtime event appended: eventType=governed_task_activated, redacted=true
  ↓
Activation action stored in local-state/runtime/actions.jsonl
  ↓
Task Queue shows activated status + runtimeTaskId + evidence/audit indicators
```

## Task Activation Does Not Execute Agents

In P37, activation creates a runtime queue entry. The agent does not receive the task, does not call providers, and does not produce output. Actual agent execution arrives in P38 (Agent Workbench) and P39 (Controlled Implementation Workflow).

```
P37: planned → activated (queued)   ← THIS PHASE
P38: queued → agent workbench        ← next: human review loop
P39: approved → implementation       ← first controlled build workflow
```

## Governance Boundary

No action in P37 crosses any of these boundaries:

- No provider calls (Anthropic, OpenAI)
- No network calls (external)
- No DB access
- No shell command execution
- No project mutation (`projects/careloop/*` untouched)
- No source code mutation of agent system prompts
- All records are append-only and `redacted: true`

## Evidence / Audit / Runtime Records

Each activation creates three immutable records:

**Evidence** (`local-state/runtime/evidence.jsonl`):
```json
{ "type": "task_activation", "result": "PASS", "agentId": "shepherd", "capabilityId": "orchestration.plan_flow", "dataClassification": "confidential", "redacted": true }
```

**Audit** (`local-state/runtime/audit.jsonl`):
```json
{ "eventType": "task_activation_completed", "actorId": "local-operator", "previousState": "planned", "nextState": "queued", "redacted": true }
```

**Action record** (`local-state/runtime/actions.jsonl`):
```json
{ "actionType": "task.activate", "status": "completed", "target": { "planTaskId": "...", "runtimeTaskId": "...", "capabilityId": "..." }, "redacted": true }
```

## Duplicate Activation Handling

If the same `planTaskId` is activated twice, the bridge returns an idempotent success response with a warning. No duplicate runtime task is created.

## UI States

| Button State | Condition | Appearance |
|---|---|---|
| `Activate` | Bridge online, task not yet activated | Green, clickable |
| `Requires governed action bridge` | Bridge offline | Grey, disabled |
| `Activating…` | Request in flight | Amber, disabled |
| `Activated` | Activation completed | Green-tinted, disabled |
| `[block reason]` | Task blocked by policy | Red-tinted, disabled |

## Policy (P37-LOCAL)

```json
{
  "phase": "P37-LOCAL",
  "taskExecutionAllowed": false,
  "agentExecutionAllowed": false,
  "providerCallsAllowed": false,
  "networkCallsAllowed": false,
  "dbAccessAllowed": false,
  "projectMutationAllowed": false,
  "evidenceAllowed": true,
  "auditAllowed": true
}
```

## Next Phase

**P38 — Agent Workbench + Human Review Loop**

- Activated tasks appear in Agent Workbench
- Operator can review task details, approve or reject
- Agents begin receiving tasks through the approval gate
- Human-in-the-loop controls prevent autonomous execution

## Validation

```bash
npm run check:task-activation-bridge   # 12/12 PASS
npm run test:pages                     # 30/30 E2E tests pass
npm run test:unit                      # 7/7 unit tests pass
npm run check:public-safety            # PASS
npm run check:agentic-workspace        # PASS
npm run check:mission-action-bridge    # PASS
```
