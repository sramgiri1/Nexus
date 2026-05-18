# P64 Provider + Tool Dispatch Through Governance

P64 is the governed dispatch foundation for future provider and tool execution.
It must not enable live calls until each gate is implemented, tested, and
recorded in OS phase status.

Execution contract: `contracts/os-roadmap/p64-execution-contracts.json`.

## Scope

- NEXUS OS only.
- No `projects/**` edits.
- No provider calls, tool execution, project mutation, DB writes, deploy, release,
  external network calls, or worker execution in P64.1.
- No DemoApp exposure in the full Command Center.
- No raw project/private IDs, raw JSON, raw logs, raw policy dumps, or fake
  working actions in primary UX.

## Required Reuse

P64 must reuse existing helpers before adding new ones:

- `api-batch/providerPolicy.js`
- `api-batch/providerAdapter.js`
- `api-batch/providerRegistry.js`
- `tool-governance/toolGatewayPolicy.js`
- `tool-governance/toolExecutionPreview.js`
- `tool-governance/toolPermissionMatrix.js`
- `runtime/policyDecision.js`
- `runtime/evidenceRecord.js`
- `shared/resultEnvelope.js`
- `shared/redaction.js`
- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `os-roadmap/updatePhaseStatus.js`

Duplicating report writers, mode guards, redaction helpers, checker formatters,
phase status updaters, result envelopes, route matrices, UI cards/tabs/badges,
activity helpers, evidence helpers, or audit appenders is forbidden unless the
report documents why and lists a refactor candidate.

## Subphases

### P64.1 Execution Contract + Governance Split

Create the implementation-grade P64 contract, checker, docs, report, and phase
status handoff. No runtime behavior changes.

Validation:

- `npm run check:p64-execution-plan`
- `npm run check:phase-validation-coverage`
- `npm run check:os-phase-status`
- `npm run check:format-readability`
- `git diff --check`

### P64.2 Dispatch Policy Envelope

Create pure dispatch envelope and policy-decision normalizers. The envelope must
represent denied, preview, and approval-required decisions without calling
providers or tools.

Status: complete. P64.2 added `dispatch-governance/dispatchEnvelope.js` and
`dispatch-governance/dispatchPolicy.js` as pure modules. They reuse existing
cost estimation, redaction, result envelope, and runtime policy decision helpers
and keep provider dispatch, tool execution, project mutation, DB writes, deploy,
external network calls, and worker execution disabled.

### P64.3 Provider / Tool Readiness Matrix

Map provider and tool readiness into readable states using existing registries.
Readiness states may be disabled, preview, approval-required, or blocked.

### P64.4 Dispatch Dry Run

Build dry-run dispatch previews with cost impact, approval requirement, disabled
reason, evidence location, and activity location. Dry runs must set execution to
false.

### P64.5 Command Center Dispatch UX

Expose readiness and dry-run state in existing Command Center governance pages.
The UX must show current state, next action, blockers, disabled reason, owner
capability, evidence/activity location, and cost impact.

### P64.6 Tests / Checkers / Docs

Aggregate P64 checks and documentation. The final checker must fail if any P64
surface claims execution without explicit approval and evidence.

### P64.7 Final Validation

Run final validation, record known limitations, close P64, and hand off to the
next phase only when status and reports are current.

## Command Center Requirements

Future P64 UX must preserve System, Dark, and Light themes and show:

- what changed
- current state
- next action
- blockers
- disabled reason
- owner agent or capability
- evidence/activity location
- cost impact

Primary UX must not show raw JSON, raw logs, raw policy dumps, internal phase
labels outside OS Roadmap, DemoApp outside Command Center Lite/demo mode, or raw
private project IDs.

## Status

P64.1 starts as contract-only. P64 remains in progress until the final validation
subphase completes. Real provider/tool dispatch is not implemented by this plan.
