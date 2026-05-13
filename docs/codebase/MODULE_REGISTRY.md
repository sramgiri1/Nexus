# Module Registry

## Command Center Dashboard

- `dashboard/src/pages/CommandCenterV2.jsx`
  Primary Command Center shell and route rendering.
- `dashboard/src/data/commandCenterViewModel.js`
  Builds the UI view model from snapshots, runtime state, and route posture.
- `dashboard/src/data/commandCenterRoutes.js`
  Route matrix, headings, status metadata, and help-doc mapping.
- `dashboard/src/data/capabilityReadiness.js`
  Product-facing capability states.
- `dashboard/src/hooks/useNexusTheme.js`
  System/Dark/Light theme management.

## Workspace Templates and Recommendations

- `workspace/workflowTemplates.js`
- `workspace/workflowRecommendations.js`

These define governed workflow cards and recommendation logic for Workspace.

## Mission Composer

- `scripts/mission-compose.js`
- `scripts/check-mission-composer.js`

Mission composition is validated through script-driven checks and surfaced in Command Center planning flows.

## Task Activation Bridge

- `scripts/check-task-activation-bridge.js`
- dashboard Task Queue and Mission Control route data

This governs planned-to-activated task flows.

## Agent Workbench / Review Loop

- `workbench/agentWorkbench.js`
- `workbench/reviewBridge.js`
- `workbench/reviewStore.js`
- `scripts/check-agent-workbench.js`

These modules power Workbench inspection and human review capture.

## Controlled Implementation Workflow

- `scripts/check-controlled-implementation-workflow.js`
- Command Center implementation route

This area exposes controlled implementation posture and validation summaries.

## Local API Backend

- `local-api/server.js`
- `local-api/routes/*`
- `scripts/check-live-local-api.js`

These modules provide live local read surfaces without enabling provider calls or DB writes.

## DB Foundation

- `db/schema.json`
- `db/schema.sql`
- `db/dbConfig.js`
- `db/dbHealth.js`
- `db/dbRepository.js`
- `scripts/check-db-foundation.js`

This family defines the durable-state foundation while runtime remains file-backed.

## Command Execution / Controlled Runner

- `orchestrator/localExecutor.js`
- `orchestrator/guardedTaskExecutor.js`
- `scripts/orchestrator-local-execute.js`
- `scripts/guarded-task-execute.js`

These modules support governed local execution and deterministic guarded tasks.

## Private Project Readiness / Validation Modules

- `scripts/careloop-inventory.js`
- `scripts/careloop-validation-plan.js`
- `scripts/careloop-command-classify.js`
- `scripts/careloop-backend-validate.js`
- `scripts/check-careloop-*`

These remain local-private and governed. Public-safe docs should refer to them as private-project validation modules.

## Local-State Runtime Records

- `local-state/runtime/tasks.json`
- `local-state/runtime/evidence.jsonl`
- `local-state/runtime/audit.jsonl`
- `local-state/runtime/events.jsonl`
- approval and incident JSONL files

These are the current runtime system of record for local execution flows.

## Script Pattern

- `scripts/check-*.js`
  Validation entry points with report writers and exit-code contracts.

## Reports Pattern

- `reports/*.md`
- `reports/*.json`
- `reports/ui-audit/*`

Reports summarize validation, status snapshots, and visual QA artifacts.
