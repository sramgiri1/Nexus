# Controlled Implementation Workflow — P39-LOCAL

## Purpose

P39 is the first phase where a UI-driven workflow may apply a narrow source change via the action bridge. The target is `projects/careloop/docs/NEXUS_IMPLEMENTATION_LOG.md` — documentation only. CORE is the assigned agent. The change is a governance log entry that records the implementation event.

## Why Documentation First

P38 let the operator review and approve tasks without executing anything. P39 crosses the first real write threshold — but deliberately targets a documentation file with no production behavior change, no provider calls, no DB access, and no iOS or backend source mutation. This demonstrates the full propose → apply → evidence → audit → rollback flow at minimum blast radius.

## Implementation Types

| Type | Target | Mutation |
|---|---|---|
| `documentation_readiness_log` | `projects/careloop/docs/NEXUS_IMPLEMENTATION_LOG.md` | Documentation only |

All other types are blocked in P39. Source, test, schema, iOS, and production code mutations are all forbidden.

## Multi-Layer Path Enforcement

Three independent layers block writes to forbidden paths:

1. **Policy file** (`policy/controlled-implementation-workflow-policy.json`) — declares `allowedPaths` and `forbiddenPaths`
2. **Plan layer** (`implementationPlan.js`) — `createImplementationProposal` validates type, mode, agent, and path
3. **Bridge layer** (`implementationBridge.js`) — verifies `allowedPath` before any file write; rejects if path matches a forbidden prefix (`projects/careloop/src`, `projects/careloop/test`, `projects/careloop/prisma`, `projects/careloop-ios`)

If any layer fails, the implementation is blocked before the file write.

## Proposal → Apply Flow

```
Operator opens Implementation Workflow page
  ↓
Select activated task (from workbench items via /workbench endpoint)
  ↓
Propose Implementation
  POST /actions/implementation/propose
    → createImplementationRequest (validate actionType, mode, agent, task)
    → createImplementationProposal (validate path, type, safety flags)
    → return patchSummary + rollbackPlan + validationPlan
    → NO file write on propose
  ↓
Review: patch summary, rollback note, safety boundary, validation status
  ↓
Apply Controlled Change
  POST /actions/implementation/apply
    → same validation path as propose
    → createPatchPlan → write file (create or append)
    → appendEvidence (type: implementation_result, result: PASS)
    → appendAuditEvent (type: controlled_implementation_applied)
    → writeLocalStateEvent (type: governed_implementation_applied)
    → appendImplementationAction (action record in actions.jsonl)
    → return result with validationStatus: SKIPPED
  ↓
Dashboard shows: patch summary, rollback note, validation result, next action
```

## Validation Status: SKIPPED

Documentation-only changes do not require the backend validation gate (`careloop:backend-validate`). The implementation bridge records `validationStatus: SKIPPED` with an explanatory note. Controlled backend validation can still be run separately if needed.

## Safety Boundary

| Property | Value |
|---|---|
| Provider calls | false |
| Network calls | false |
| DB access | false |
| Production behavior change | false |
| Dependency install | false |
| Schema change | false |
| Source mutation | false |
| iOS mutation | false |
| Documentation mutation | YES — allowed path only |

## Rollback

The bridge writes a rollback plan alongside every apply result. For a new log entry:

1. Open `projects/careloop/docs/NEXUS_IMPLEMENTATION_LOG.md`
2. Remove the `## P39 Controlled Implementation Workflow` section appended by this action
3. Restore the original file state (or delete if the file was newly created)
4. The implementation action record remains in `local-state/runtime/actions.jsonl` (append-only)

## Bridge Routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/actions/implementation/propose` | Validate + return proposal (no write) |
| POST | `/actions/implementation/apply` | Validate + write + record evidence/audit |
| GET | `/actions/implementation` | List all implementation action records |
| GET | `/actions/implementation/:actionId` | Get a single implementation action record |

## Files

| File | Purpose |
|---|---|
| `policy/controlled-implementation-workflow-policy.json` | P39 policy boundary |
| `implementation-actions/implementationStore.js` | Append-only action record store |
| `implementation-actions/implementationPlan.js` | Proposal, patch plan, rollback plan, report writer |
| `implementation-actions/implementationBridge.js` | Validate → write → evidence → audit → runtime event |
| `implementation-actions/index.js` | Re-exports all functions |
| `scripts/mission-action-server.js` | Action server with /actions/implementation/* routes |
| `dashboard/src/api/implementationActions.js` | Browser fetch-only API client |
| `dashboard/src/data/commandCenterViewModel.js` | `controlledImplementation` view model field |
| `dashboard/src/pages/CommandCenterV2.jsx` | ImplementationPage component + nav item + route |
| `scripts/check-controlled-implementation-workflow.js` | 15-section validator (87/87 checks) |

## Validation

```bash
npm run check:controlled-implementation-workflow   # 87/87 checks
npm test                                            # 42/42 E2E tests
npm run build                                       # clean build
```
