# P64.8 Code Mode Runtime + Lazy Tool Loading

P64.8 prepares code-mode runtime foundations without enabling execution. It
extends the governed dispatch foundation from P64 and reuses the P52 lazy tool
contract and context budget helpers.

Execution contract: `contracts/os-roadmap/p648-execution-contracts.json`.

## Scope

- NEXUS OS only.
- No `projects/**` edits.
- No code execution, provider dispatch, tool execution, project mutation, DB
  writes, deploy, release, external network calls, worker execution, or all-tool
  context loading.
- No DemoApp exposure in full Command Center.
- No raw project/private IDs, raw JSON, raw logs, raw tool schemas, raw MCP
  schemas, or raw policy dumps in primary UX.

## Required Reuse

P64.8 must reuse existing helpers before adding new ones:

- `tool-governance/lazyContractPolicy.js`
- `tool-governance/contextBudgetGuard.js`
- `tool-governance/toolContractLoader.js`
- `tool-governance/toolGateway.js`
- `dispatch-governance/dispatchEnvelope.js`
- `dispatch-governance/dispatchDryRun.js`
- `shared/resultEnvelope.js`
- `shared/redaction.js`
- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `os-roadmap/updatePhaseStatus.js`

## Subphases

### P64.8.1 Execution Contract + Guardrails

Create this implementation-grade contract, checker, docs, reports, and phase
status handoff. No runtime behavior changes.

### P64.8.2 Code Mode Session Contract

Define preview-only code-mode session records and validation. Sessions must show
state, disabled reason, selected contract count, evidence refs, and execution
disabled posture.

### P64.8.3 Lazy Tool Selection Packet

Build selected lazy tool contract packets using existing context budget guards.
All-tool and all-MCP schema loading remain blocked.

### P64.8.4 Command Center Code Mode Readiness UX

Expose code-mode readiness and lazy-loading state in Command Center without
enabling execution.

### P64.8.5 Final Validation

Aggregate checks, close P64.8, and hand off to P65.

## Command Center Requirements

Future P64.8 UX must preserve System, Dark, and Light themes and show:

- code-mode state
- selected contract count
- blocked bulk-loading reason
- disabled execution reason
- owner capability
- evidence/activity location
- next action
- cost impact if relevant

Primary UX must not show raw JSON, raw logs, raw policy dumps, raw tool schemas,
raw MCP schemas, internal phase labels outside OS Roadmap, DemoApp outside demo
mode, or raw private project IDs.

## Status

P64.8.1 is contract-only. P64.8 remains in progress until final validation.
