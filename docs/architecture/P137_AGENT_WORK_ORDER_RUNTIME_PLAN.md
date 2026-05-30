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

Status: complete

Narrow goal:
- Surface the P137.3 non-runnable agent work order dispatch dry run on Agent
  Flow as a concise, display-safe founder/operator view.

Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `c2cd498a`

Allowed files:
- `dashboard/src/data/businessBuild.js`
- `dashboard/src/pages/CommandCenterV2.jsx`
- `dashboard/tests/routes.spec.js`
- `contracts/os-roadmap/p137-agent-work-order-runtime-contracts.json`
- `docs/architecture/P137_AGENT_WORK_ORDER_RUNTIME_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `package.json`
- `scripts/check-p1374-agent-work-order-runtime.js`
- `scripts/check-p1373-agent-work-order-runtime.js`
- `scripts/check-p1372-agent-work-order-runtime.js`
- `scripts/check-p1371-agent-work-order-runtime.js`
- `scripts/check-p1367-secrets-providers-tool-governance-final-validation.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- P137.4, P137.3, P137.2, P137.1, P136.7, enterprise, OS status, and phase
  coverage reports

Forbidden files:
- `projects/**`
- `generated-projects/**`
- `careloop/**`
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
- Add `buildAgentWorkOrderRuntimeDisplayModel` in
  `dashboard/src/data/businessBuild.js`.
- Add `AgentWorkOrderRuntimeCard` to `dashboard/src/pages/CommandCenterV2.jsx`
  and render it only on Agent Flow.
- Add focused Agent Flow Playwright coverage in `dashboard/tests/routes.spec.js`.
- Add `scripts/check-p1374-agent-work-order-runtime.js` and package script.
- Update P137.3, enterprise, and OS status checker handoffs.
- Update P137 contract, this plan, README, platform roadmap, enterprise
  roadmap, OS phase status, phase index, and generated reports.

Expected exports, schemas, and data shapes:
- `buildAgentWorkOrderRuntimeDisplayModel(founderIdeaSummary)`
- Display model shape: current state, local planning mode, source state,
  founder idea, work-order counts, owner capability, next action, disabled
  reason, evidence location, activity location, cost impact, work-order lanes,
  dispatch gates, safety rows, and blockers.
- The Command Center adapter reuses browser-safe founder live handoff work-order
  display data and the checker compares it against the P137.3 dry-run lane
  shape. The dashboard must not import Node-side runtime helpers.
- The display model excludes raw dry-run handles, scoped-context key arrays,
  provider payloads, tool payloads, executable commands, runtime dispatch
  requests, raw private IDs, raw JSON/log/policy/registry dumps, mutation
  controls, dispatch controls, deploy controls, package controls, and spend
  controls.

Command Center UX requirements:
- Agent Flow shows planned work-order lanes, dispatch gates, blockers, disabled
  reason, owner capability, evidence/activity location, next action, and
  zero-spend cost impact.
- Chat/Lite stays clean.
- Primary UX must not show raw JSON, raw logs, raw policy dumps, raw registry
  dumps, raw private IDs, demo surfaces, or fake runnable actions.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Use existing Command Center CSS variables and card/grid/pill patterns.

Playwright tests:
- Add `Agent Flow agent work order runtime shows display-safe dry run`.
- Run route-wide Command Center UX coverage.

Checker updates:
- Add `check:p1374-agent-work-order-runtime`.
- Update P137.3 checker for P137.4 handoff compatibility.
- Update enterprise readiness checker for P137.4 active state.
- Update OS phase status checker for P137.5 handoff ID.

Docs/README/roadmap updates:
- Update this plan.
- Update README current implementation notes.
- Update platform and enterprise roadmaps.
- Update P137 OS phase status/index.

OS phase status update:
- P137 remains in progress.
- P137.4 complete.
- Current phase is P137.4.
- Previous phase is P137.3.
- Next phase is P137.5 planned-only.

Validation commands:
- `npm run check:p1374-agent-work-order-runtime`
- `npm run check:p1373-agent-work-order-runtime`
- `npm run check:p1372-agent-work-order-runtime`
- `npm run check:p1371-agent-work-order-runtime`
- `npm run check:p1367-secrets-providers-tool-governance-final-validation`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Agent Flow agent work order runtime"`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- Browser verification at `/command-center/agent-flow`
- `git diff --check`

Final safety checks:
- No forbidden paths changed.
- No full registry/context loading into model context.
- No provider/model calls, tool execution, MCP startup, agent dispatch,
  DB/runtime writes, project mutation, network calls, deploy, release, export,
  package, or spend.
- P137.5 followed next as tests/checkers hardening.
- No stale implementation commit marker remains after status stamp.

Git add/commit/push commands:
- `git add <P137.4 allowed files>`
- `git commit -m "chore(nexus): implement p1374 agent work order ux"`
- `git add <P137.4 status stamp files>`
- `git commit -m "chore(nexus): stamp p1374 agent work order ux"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist:
- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX changes
- Tests/checkers run
- Dashboard build/unit/page results
- Docs/README/roadmap updates
- OS phase status update
- Evidence/report records
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

### P137.5 Tests / Checkers

Status: complete

Narrow goal:
- Aggregate P137 contract, model, dry run, Agent Flow UX, docs, status,
  route-wide safety, checker handoffs, and forbidden-path coverage.

Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `93d208f2`

Allowed files:
- `contracts/os-roadmap/p137-agent-work-order-runtime-contracts.json`
- `docs/architecture/P137_AGENT_WORK_ORDER_RUNTIME_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `package.json`
- `scripts/check-p1375-agent-work-order-runtime.js`
- `scripts/check-p1374-agent-work-order-runtime.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- P137.5, P137.4, enterprise, OS status, and phase coverage reports

Forbidden files:
- `projects/**`
- `generated-projects/**`
- `careloop/**`
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
- Add `scripts/check-p1375-agent-work-order-runtime.js`.
- Update `scripts/check-p1374-agent-work-order-runtime.js` for P137.5 handoff.
- Update enterprise and OS phase checkers.
- Update P137 contract, this plan, README, platform roadmap, enterprise
  roadmap, package script, OS phase status, phase index, and generated reports.

Expected exports, schemas, and data shapes:
- No new runtime exports or schemas.
- The checker validates existing P137 exports:
  `buildAgentWorkOrderRuntimeModel`,
  `validateAgentWorkOrderRuntimeModel`,
  `buildAgentWorkOrderDispatchDryRun`,
  `validateAgentWorkOrderDispatchDryRun`, and the Agent Flow display model.
- The validated shapes remain scoped work-order packets, local dry-run rows,
  Agent Flow display lanes, blocked gate rows, safety rows, evidence/activity
  labels, disabled reason, next action, and zero-spend cost impact.

Command Center UX requirements:
- Preserve existing Command Center UX.
- Do not edit dashboard source or dashboard tests in P137.5.
- Validate existing Agent Flow and route-wide Command Center coverage.
- Primary UX must not show raw JSON, raw logs, raw policy dumps, raw registry
  dumps, raw private IDs, demo surfaces, dispatch controls, fake runnable
  actions, mutation controls, deploy controls, package controls, or spend
  controls.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Validate through route-wide Command Center Playwright coverage.

Playwright tests:
- No Playwright source update in P137.5 because no dashboard source changes.
- Validate the existing P137.4 Agent Flow regression remains present.
- Run route-wide Command Center UX coverage.

Checker updates:
- Add `check:p1375-agent-work-order-runtime`.
- Update P137.4 checker for P137.5 handoff compatibility.
- Update enterprise readiness checker for P137.5 active state.
- Update OS phase status checker for P137.6 handoff ID.

Docs/README/roadmap updates:
- Update this plan.
- Update README current implementation notes.
- Update platform and enterprise roadmaps.
- Update P137 OS phase status/index.

OS phase status update:
- P137 remains in progress.
- P137.5 complete.
- Current phase is P137.5.
- Previous phase is P137.4.
- Next phase is P137.6 planned-only.

Validation commands:
- `npm run check:p1375-agent-work-order-runtime`
- `npm run check:p1374-agent-work-order-runtime`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Final safety checks:
- No forbidden paths changed.
- No dashboard source/test edits in P137.5.
- No full registry/context loading into model context.
- No provider/model calls, tool execution, MCP startup, agent dispatch,
  DB/runtime writes, project mutation, network calls, deploy, release, export,
  package, or spend.
- P137.6 remains planned-only.
- No stale implementation commit marker remains after status stamp.

Git add/commit/push commands:
- `git add <P137.5 allowed files>`
- `git commit -m "chore(nexus): implement p1375 agent work order runtime"`
- `git add <P137.5 status stamp files>`
- `git commit -m "chore(nexus): stamp p1375 agent work order runtime"`
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
