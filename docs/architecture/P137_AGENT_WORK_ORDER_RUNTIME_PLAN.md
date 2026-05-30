# P137 Agent Work Order Runtime Plan

P137 defines how NEXUS turns founder/business intent into governed agent work
orders without loading full registries into model context and without enabling
live dispatch. Runtime owns the full tool, MCP schema, skill, agent, policy,
and memory registries. Agents receive only scoped task contracts, selected
project profiles, scoped memory packets, trusted context packets, selected
skill/tool contracts, budget limits, policy limits, and evidence references.

P137 is staged:

- P137.1 Contract / Policy / Safety Boundary
- P137.2 Work Order Model
- P137.3 Dispatch Dry Run
- P137.4 Agent Flow Command Center UX
- P137.5 Tests / Checkers
- P137.6 Docs / Roadmap / Status
- P137.7 Final Validation

## P137.1 Contract / Policy / Safety Boundary

Status: complete

Narrow goal:
- Start P137 with an implementation-grade agent work order runtime contract,
  seven-subphase split, context-loading safety boundary, checker, docs/status
  handoff, and planned-only P137.2 handoff.

Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `033f2712`

Allowed files:
- `contracts/os-roadmap/p137-agent-work-order-runtime-contracts.json`
- `docs/architecture/P137_AGENT_WORK_ORDER_RUNTIME_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `package.json`
- `scripts/check-p1371-agent-work-order-runtime.js`
- `scripts/check-p1367-secrets-providers-tool-governance-final-validation.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- P137.1, P136.7, enterprise, OS status, and phase coverage reports

Forbidden files:
- `projects/**`
- `project-specific app/**`
- `generated-projects/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `db/**`
- `local-state/runtime/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`

Exact files/modules created or updated:
- Add P137 contract JSON.
- Add this P137 plan.
- Add P137.1 checker and report.
- Update P136.7 handoff checker.
- Update enterprise and OS phase checkers.
- Update README, platform roadmap, enterprise roadmap, package script, OS phase
  status, phase index, and generated reports.

Expected exports, schemas, and data shapes:
- P137.1 is contract-only and adds no runtime exports or schemas.
- Future P137 model shape: task contract, selected project profile, scoped
  memory packet, trusted context packet, selected skill/tool contract, budget
  limits, policy limits, evidence references, audit/activity references, owner
  agent/capability, blockers, disabled reason, next action, cost impact, and
  safety flags.
- Forbidden future packet contents: full tool registry, all MCP schemas, all
  skills, all agents, all policies, all memory, secret values, provider
  payloads, raw private IDs, raw JSON/log/policy dumps, mutation controls,
  dispatch controls, deploy controls, package controls, and spend controls.

Command Center UX requirements:
- Preserve existing Command Center UX in P137.1.
- P137.4 owns future Agent Flow UX updates.
- No demo surfaces, raw IDs, raw JSON, raw logs, raw policy dumps, raw registry
  dumps, fake runnable actions, dispatch controls, project mutation controls,
  deploy controls, package controls, or spend controls in primary UX.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Validate with existing route-wide Command Center Playwright coverage.

Playwright tests:
- No Playwright source update in P137.1 because no dashboard source changes.
- Run existing route-wide Command Center coverage.
- P137.4 must add focused Agent Flow UX coverage.

Checker updates:
- Add `check:p1371-agent-work-order-runtime`.
- Update P136.7 final checker for P137.1 handoff compatibility.
- Update enterprise readiness checker for P137.1 active state.
- Update OS phase status checker for P137.1/P137.2 handoff IDs.

Docs/README/roadmap updates:
- Add this plan.
- Update README current implementation notes.
- Update platform and enterprise roadmaps.
- Update P137 OS phase status/index.

OS phase status update:
- P137 in progress.
- P137.1 complete.
- Current phase is P137.1.
- Previous phase is P136.7.
- Next phase is P137.2 planned-only.

Validation commands:
- `npm run check:p1371-agent-work-order-runtime`
- `npm run check:p1367-secrets-providers-tool-governance-final-validation`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Final safety checks:
- No forbidden paths changed.
- No full registry/context loading into model context.
- No provider/model calls, tool execution, MCP startup, agent dispatch,
  DB/runtime writes, project mutation, network calls, deploy, release, export,
  package, or spend.
- P137.2 remains planned-only.
- No stale implementation commit marker remains after status stamp.

Git add/commit/push commands:
- `git add <P137.1 allowed files>`
- `git commit -m "chore(nexus): implement p1371 agent work order runtime"`
- `git add <P137.1 status stamp files>`
- `git commit -m "chore(nexus): stamp p1371 agent work order runtime"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist:
- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX preservation
- Tests/checkers run
- Dashboard build/unit/page results
- Docs/README/roadmap updates
- OS phase status update
- Evidence/report records
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

## P137.2-P137.7 Implementation Boundaries

### P137.2 Work Order Model

Status: complete

Narrow goal:
- Define the read-only agent work order model and scoped context packet shape
  without dispatching agents or loading full registries.

Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `fad26b65`

Allowed files:
- `shared/agentWorkOrderRuntimeModel.js`
- `contracts/os-roadmap/p137-agent-work-order-runtime-contracts.json`
- `docs/architecture/P137_AGENT_WORK_ORDER_RUNTIME_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `package.json`
- `scripts/check-p1372-agent-work-order-runtime.js`
- `scripts/check-p1371-agent-work-order-runtime.js`
- `scripts/check-p1367-secrets-providers-tool-governance-final-validation.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- P137.2, P137.1, P136.7, enterprise, OS status, and phase coverage reports

Forbidden files:
- `projects/**`
- `project-specific app/**`
- `generated-projects/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `db/**`
- `local-state/runtime/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`

Exact files/modules created or updated:
- Add `shared/agentWorkOrderRuntimeModel.js`.
- Add `scripts/check-p1372-agent-work-order-runtime.js`.
- Update P137.1 and P136.7 handoff checkers.
- Update enterprise and OS phase checkers.
- Update P137 contract, this plan, README, platform roadmap, enterprise
  roadmap, package script, OS phase status, phase index, and generated reports.

Expected exports, schemas, and data shapes:
- `AGENT_WORK_ORDER_RUNTIME_PHASE`
- `AGENT_WORK_ORDER_RUNTIME_VERSION`
- `AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES`
- `AGENT_WORK_ORDER_RUNTIME_SAFETY_FLAG_NAMES`
- `buildAgentWorkOrderRuntimeModel`
- `validateAgentWorkOrderRuntimeModel`
- `buildAgentWorkOrderRuntimeEnvelope`
- Data shape: phase, version, task contract, selected project profile, scoped
  memory packet, trusted context packet, selected skill/tool contract summaries,
  budget/policy limits, work order packets, evidence refs, audit refs, activity
  refs, owner agent/capability, next action, blockers, disabled reason, cost
  impact, command center visibility, and all-false safety flags.
- Dispatch dry-run exports remain P137.3 work, not P137.2 work.

Command Center UX requirements:
- Preserve existing Command Center UX and route-wide navigation.
- Do not edit dashboard source in P137.2.
- P137.4 owns model-to-Agent-Flow UX wiring.
- Primary UX must not show raw JSON, raw logs, raw policy dumps, raw registry
  dumps, raw private IDs, fake runnable actions, dispatch controls, mutation
  controls, deploy controls, package controls, or spend controls.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Validate with existing route-wide Command Center Playwright coverage.

Playwright tests:
- No Playwright source update in P137.2 because no dashboard source changes.
- Run existing route-wide Command Center coverage.
- P137.4 must add focused Agent Flow UX coverage.

Checker updates:
- Add `check:p1372-agent-work-order-runtime`.
- Update P137.1 and P136.7 checkers for P137.2 handoff compatibility.
- Update enterprise readiness checker for P137.2 active state.
- Update OS phase status checker for P137.3 handoff ID.

Docs/README/roadmap updates:
- Update this plan.
- Update README current implementation notes.
- Update platform and enterprise roadmaps.
- Update P137 OS phase status/index.

OS phase status update:
- P137 remains in progress.
- P137.2 complete.
- Current phase is P137.2.
- Previous phase is P137.1.
- Next phase is P137.3 planned-only.

Validation commands:
- `npm run check:p1372-agent-work-order-runtime`
- `npm run check:p1371-agent-work-order-runtime`
- `npm run check:p1367-secrets-providers-tool-governance-final-validation`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Final safety checks:
- No forbidden paths changed.
- No full registry/context loading into model context.
- No provider/model calls, tool execution, MCP startup, agent dispatch,
  DB/runtime writes, project mutation, network calls, deploy, release, export,
  package, or spend.
- P137.3 remains planned-only.
- No stale implementation commit marker remains after status stamp.

Git add/commit/push commands:
- `git add <P137.2 allowed files>`
- `git commit -m "chore(nexus): implement p1372 agent work order runtime"`
- `git add <P137.2 status stamp files>`
- `git commit -m "chore(nexus): stamp p1372 agent work order runtime"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist:
- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX preservation
- Tests/checkers run
- Dashboard build/unit/page results
- Docs/README/roadmap updates
- OS phase status update
- Evidence/report records
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

### P137.3 Dispatch Dry Run

Status: complete

Narrow goal:
- Create a local, non-runnable agent work order dispatch dry run from the
  P137.2 scoped runtime model without dispatching agents or loading full
  registries.

Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `99cdbe6a`

Allowed files:
- `shared/agentWorkOrderRuntimeModel.js`
- `contracts/os-roadmap/p137-agent-work-order-runtime-contracts.json`
- `docs/architecture/P137_AGENT_WORK_ORDER_RUNTIME_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `package.json`
- `scripts/check-p1373-agent-work-order-runtime.js`
- `scripts/check-p1372-agent-work-order-runtime.js`
- `scripts/check-p1371-agent-work-order-runtime.js`
- `scripts/check-p1367-secrets-providers-tool-governance-final-validation.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- P137.3, P137.2, P137.1, P136.7, enterprise, OS status, and phase coverage
  reports

Forbidden files:
- `projects/**`
- `project-specific app/**`
- `generated-projects/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `db/**`
- `local-state/runtime/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`

Exact files/modules created or updated:
- Update `shared/agentWorkOrderRuntimeModel.js` with the P137.3 dry-run
  builders and validator.
- Add `scripts/check-p1373-agent-work-order-runtime.js`.
- Update P137.2, P137.1, and P136.7 handoff checkers.
- Update enterprise and OS phase checkers.
- Update P137 contract, this plan, README, platform roadmap, enterprise
  roadmap, package script, OS phase status, phase index, and generated reports.

Expected exports, schemas, and data shapes:
- `AGENT_WORK_ORDER_DISPATCH_DRY_RUN_PHASE`
- `buildAgentWorkOrderDispatchDryRun`
- `validateAgentWorkOrderDispatchDryRun`
- `buildAgentWorkOrderDispatchDryRunEnvelope`
- Data shape: phase, version, source model state, dispatch summary, dispatch
  rows, gate rows, blocked authority rows, scoped context refs, evidence refs,
  audit refs, activity refs, owner agent/capability, next action, blockers,
  disabled reason, cost impact, redaction summary, candidate counts, null
  provider/tool/executable/runtime payloads, command center visibility, and
  all-false safety flags.
- The dry run is display-safe and non-runnable. It does not create dispatch
  requests, provider payloads, tool payloads, executable commands, DB/runtime
  writes, project mutations, deploy/release/export/package actions, network
  calls, or spend.

Command Center UX requirements:
- Preserve existing Command Center UX and route-wide navigation.
- Do not edit dashboard source in P137.3.
- P137.4 owns model-to-Agent-Flow UX wiring.
- Primary UX must not show raw JSON, raw logs, raw policy dumps, raw registry
  dumps, raw private IDs, fake runnable actions, dispatch controls, mutation
  controls, deploy controls, package controls, or spend controls.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Validate with existing route-wide Command Center Playwright coverage.

Playwright tests:
- No Playwright source update in P137.3 because no dashboard source changes.
- Run existing route-wide Command Center coverage.
- P137.4 must add focused Agent Flow UX coverage for the dry-run display.

Checker updates:
- Add `check:p1373-agent-work-order-runtime`.
- Update P137.2, P137.1, and P136.7 checkers for P137.3 handoff
  compatibility.
- Update enterprise readiness checker for P137.3 active state.
- Update OS phase status checker for P137.4 handoff ID.

Docs/README/roadmap updates:
- Update this plan.
- Update README current implementation notes.
- Update platform and enterprise roadmaps.
- Update P137 OS phase status/index.

OS phase status update:
- P137 remains in progress.
- P137.3 complete.
- Current phase is P137.3.
- Previous phase is P137.2.
- Next phase is P137.4 planned-only.

Validation commands:
- `npm run check:p1373-agent-work-order-runtime`
- `npm run check:p1372-agent-work-order-runtime`
- `npm run check:p1371-agent-work-order-runtime`
- `npm run check:p1367-secrets-providers-tool-governance-final-validation`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Final safety checks:
- No forbidden paths changed.
- No full registry/context loading into model context.
- No provider/model calls, tool execution, MCP startup, agent dispatch,
  DB/runtime writes, project mutation, network calls, deploy, release, export,
  package, or spend.
- P137.4 remains planned-only.
- No stale implementation commit marker remains after status stamp.

Git add/commit/push commands:
- `git add <P137.3 allowed files>`
- `git commit -m "chore(nexus): implement p1373 agent work order dry run"`
- `git add <P137.3 status stamp files>`
- `git commit -m "chore(nexus): stamp p1373 agent work order dry run"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist:
- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX preservation
- Tests/checkers run
- Dashboard build/unit/page results
- Docs/README/roadmap updates
- OS phase status update
- Evidence/report records
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

### P137.4 Agent Flow Command Center UX

Status: planned

- Surface P137.3 dry-run state in Agent Flow.
- Show what changed, current state, next action, blockers, disabled reason,
  owner agent/capability, evidence/activity location, and zero-spend cost
  impact.
- Preserve System/Dark/Light themes and route-wide safety.

### P137.5 Tests / Checkers

Status: planned

- Aggregate P137 contract, model, dry run, Agent Flow UX, docs, status,
  route-wide safety, and forbidden-path coverage.
- Do not enable dispatch, DB/runtime writes, provider/model calls, tool
  execution, project mutation, network, or spend.

### P137.6 Docs / Roadmap / Status

Status: planned

- Align P137 docs, README, roadmaps, reports, checker handoffs, and OS phase
  status through P137.6.
- Prepare P137.7 final validation.

### P137.7 Final Validation

Status: planned

- Close P137 with final validation evidence, prior report verification,
  checker compatibility, route-wide Command Center safety, docs/status closure,
  and planned-only P138 handoff.
