# Agentic Workspace Home — P36-LOCAL

## Purpose

P36 transforms the Command Center from a reports dashboard into an **Agentic Workspace**: the founder opens the Command Center, sees the available workflows NEXUS can perform, and chooses what to do next. No workflow executes automatically.

## Design Principle

> "NEXUS OS should feel like an Agentic Workspace where the user chooses what they want NEXUS to do."

The UI presents structured workflow choices. The OS provides metadata, recommendations, and next-best-action guidance. Execution bridges arrive in P37+.

## Architecture

```
workspace/
├── workflowTemplates.js        ← 8 workflow templates (read-only metadata)
├── workflowRecommendations.js  ← recommendWorkflows(), getNextBestAction(), buildWorkspaceSummary()
└── index.js                    ← re-exports all 6 functions

policy/
└── agentic-workspace-policy.json  ← P36 safety boundary (execution: false)

dashboard/src/pages/CommandCenterV2.jsx
├── WorkflowCard                ← renders one workflow (state-aware button)
├── WorkspaceBand               ← "What do you want NEXUS to do?" band in Mission Control
└── WorkspacePage               ← /command-center/workspace full route

dashboard/src/data/commandCenterViewModel.js
└── buildCommandCenterViewModelV2()
    └── agenticWorkspace        ← nextBestAction, workflowTemplates[], workspaceStatus
```

## Workflow Templates (P36)

| ID | Label | Category | Risk | Enabled Now | Ships |
|---|---|---|---|---|---|
| build-product | Build Product | build | high | no | P37 |
| fix-failing-test | Fix Failing Test | fix | medium | no | P37 |
| validate-backend | Validate Backend | validate | low | no | P37 |
| review-release | Review Release | release | high | no | P39 |
| plan-sprint | Plan Sprint | plan | low | no | P37 |
| privacy-review | Run Privacy Review | govern | medium | no | P38 |
| ios-validation | Prepare iOS Validation | validate | medium | no | P38 |
| govern-agent-work | Govern Agent Work | govern | low | **yes** | P36 |

Only `govern-agent-work` is enabled in P36. All others show their target phase.

## Next-Best Action Logic

`getNextBestAction(context)` inspects mission/plan/task state:

- If mission + plan exist, tasks not yet activated → "Activate First Mission Task" (targets P37, disabled)
- If tasks activated → targets the first unvalidated task workflow
- Always returns a `targetPhase` field for display

## Policy Boundary (P36)

```json
{
  "workflowExecutionAllowed": false,
  "taskActivationAllowed": false,
  "workflowTemplatesAllowed": true,
  "providerCallsAllowed": false,
  "networkCallsAllowed": false,
  "dbAccessAllowed": false,
  "projectMutationAllowed": false
}
```

The workspace is **read-only** in P36. It shows state and guides decisions. No agents are dispatched.

## UI Components

### WorkflowCard

Renders one workflow template. State-aware button:

- `enabledNow: true` → "Start Workflow" (clickable, navigates to /command-center/workspace)
- `enabledNow: false` → disabled button showing `disabledReason` and target phase

### WorkspaceBand

Inserted into Mission Control between CareLoop progress card and KPI metrics row. Shows:

- "What do you want NEXUS to do?" prompt
- Next-best action card (single highlighted recommendation)
- Scrollable workflow card grid

### WorkspacePage

Full-page view at `/command-center/workspace`. Shows:

- NBA card
- Mission status safety grid (plan ready, tasks activated, backend validated, tests)
- All 8 workflow cards
- Current limitations (execution gates, P37+ requirements)

## Mode Awareness

- `local-private`: workspace shows real mission data from view model
- Demo Mode: isolated to `/command-center/demo` — workspace page is not shown
- The WorkspaceBand never renders "DemoApp" text outside Demo Mode

## Roadmap Context

| Phase | Feature |
|---|---|
| P36 | Agentic Workspace Home + Workflow Templates (this doc) |
| P37 | Task Activation + Agent Assignment from UI |
| P38 | Agent Workbench + Human Review Loop |
| P39 | First Controlled Implementation Workflow from UI |
| P40 | Live Local API Backend for Command Center |
| P41 | DB Foundation + Durable State |
| P42 | DB-backed Command Center + Live Refresh |
| P43 | Worker Queue + Runtime Engine |
| P44 | Provider/Tool Dispatch Through Governance |
| P45 | Enterprise Release Candidate |

## Validation

```bash
npm run check:agentic-workspace   # 12-section workspace check (PASS)
npm run test:pages                # 25/25 E2E tests pass
npm run check:public-safety       # PASS
npm run check:mission-action-bridge # PASS
```
