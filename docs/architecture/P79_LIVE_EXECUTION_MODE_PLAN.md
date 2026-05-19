# P79 Live Execution Contract + Mode Gates

Status: in progress

Contract: `contracts/os-roadmap/p79-execution-contracts.json`

## Purpose

P79 moves NEXUS from enterprise preview toward live use by defining live mode, admission gates, and Command Center live readiness. This is not a broad runtime flip. Each subphase enables only one narrow safety layer and must remain independently commit-ready.

## Live Safety Boundary

Provider calls are blocked in P79.1. Tool execution is blocked in P79.1. Worker execution is blocked in P79.1. Project mutation is blocked in P79.1. DB writes are blocked in P79.1. Deploy, release, export, and package execution are blocked in P79.1. Provider spend is blocked in P79.1.

Every future live capability must carry:

- explicit operator approval
- selected scope boundary
- budget limit
- rollback plan
- activity/evidence record
- cost record
- redaction check
- disabled reason and blocker list when unavailable

## Subphases

### P79.1 Live Mode Contract + Gates

Goal: recognize `live` mode and create a blocked-by-default live capability gate model.

Allowed files: `shared/modeGuard.js`, `live-execution/liveExecutionGate.js`, P79 contract/docs/checkers/reports, package scripts, OS roadmap/status.

Forbidden files: `projects/**`, `db/**`, `prisma/**`, `migrations/**`, `providers/**`, `tools/**`, `worker-runtime/**`, `deploy/**`, `release/**`, `auth/**`, `users/**`, `rbac/**`, `.env`, `.env.*`.

Validation:

- `npm run check:p791-live-mode-gate`
- `npm run check:p79-execution-plan`
- `npm run check:phase-validation-coverage`
- `npm run check:os-phase-status`
- `npm run check:format-readability`
- `git diff --check`

### P79.2 Live Command Intent Admission

Goal: add live command admission schemas and approval records without executing commands.

UX: Command Center must explain current admission state, next action, blockers, disabled reason, owner, evidence/activity location, and cost impact.

Expected data shape:

- state: `blocked` or `admitted`
- capability
- knownCapability
- redacted intent
- missingApprovals
- executionEnabled: `false`
- dryRunOnly: `true`
- provider/tool/worker/project/DB/deploy/spend flags: `false`
- disabledReason
- blockers
- nextAction
- ownerCapability
- evidenceLocation
- activityLocation
- costImpact

Validation: `npm run check:p792-live-command-intent`.

### P79.3 Local Action Bridge Admission Controller

Goal: route local action bridge requests through live admission checks without enabling mutation.

UX: blocked live actions must return actionable disabled reasons, not fake success states.

Behavior:

- `NEXUS_MODE=live` action bridge POST routes return a blocked admission payload before local bridge execution.
- `local-private` and `test` behavior stays under the existing local bridge policy.
- Live admission payloads include capability, disabled reason, blockers, next action, owner capability, evidence/activity location, and cost impact.
- Raw task IDs from request bodies are replaced with display-safe placeholders in admission data.
- Bridge execution remains blocked even when admission evidence is complete.

Validation: `npm run check:p793-action-bridge-admission`.

### P79.4 Command Center Live Readiness UX

Goal: expose live readiness gates in Command Center without runnable live actions.

UX requirements:

- show what changed
- show current state
- show next action
- show blockers
- show disabled reason
- show owner agent/capability
- show evidence/activity location
- show cost impact
- preserve dark, light, and system themes
- do not show raw JSON, raw logs, raw policy dumps, DemoApp, private project IDs, or internal phase labels outside OS Roadmap

Validation:

- `npm run check:p794-command-center-live-readiness-ux`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "Live readiness"`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npm run build`

### P79.5 Tests / Checkers / Docs

Goal: aggregate P79 validation coverage and documentation evidence.

Validation: `npm run check:p795-tests-checkers-docs`.

### P79.6 Final Validation

Goal: close P79 validation and confirm live readiness remains gated.

Validation: `npm run check:p796-final-validation`.

### P79.7 P80 Handoff

Goal: create P80 founder intake runtime contract. This handoff remains contract-only.

Validation: `npm run check:p80-execution-plan`.

## Reuse Check

P79 must reuse:

- `shared/reportWriter.js`
- `shared/reportMetadata.js`
- `shared/resultEnvelope.js`
- `shared/modeGuard.js`
- `shared/redaction.js`
- `shared/checkResultFormatter.js`
- `os-roadmap/updatePhaseStatus.js`
- existing dashboard route, tab, card, badge, evidence, activity, audit, and cost patterns

Do not duplicate report writers, mode guards, redaction helpers, checker formatters, phase status updaters, result envelopes, route matrices, UI card/tab/status components, or activity/evidence/audit appenders.

## Rollback

Rollback P79.1 by reverting `shared/modeGuard.js`, deleting `live-execution/liveExecutionGate.js`, removing P79 package scripts/checkers/reports/docs/contracts, and returning OS phase status to P78.
