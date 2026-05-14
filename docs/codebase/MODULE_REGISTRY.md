# NEXUS Module Registry

This registry documents the major module families that currently shape the
public-safe NEXUS repo. Entries are based on available repo state and should be
updated as new module families or entry points are added.

## Command Center Dashboard

- Purpose:
  Render the operator-facing Command Center routes, Mission Control cockpit,
  roadmap, service health, command palette, and supporting UI summaries.
- Primary files:
  `dashboard/src/pages/CommandCenterV2.jsx`,
  `dashboard/src/pages/command-center-v2/*`,
  `dashboard/src/components/command-center-v2/*`,
  `dashboard/src/data/*`,
  `dashboard/src/hooks/*`,
  `dashboard/tests/routes.spec.js`
- Public entry points:
  `dashboard/src/pages/CommandCenterV2.jsx`,
  `dashboard/src/data/commandCenterViewModel.js`,
  `dashboard/src/data/commandCenterRoutes.js`,
  `dashboard/src/data/nexusRoadmap.js`
- Inputs/outputs:
  Consumes snapshot data, roadmap status, capability readiness, and local
  service status; outputs route-level UI state and operator summaries.
- Side effects:
  Browser rendering only.
- Safety boundary:
  UI must stay read-only unless an existing governed local action path already
  exists.
- Reuse notes:
  Reuse existing route metadata and view-model builders before adding new page
  state helpers.
- Tests/checkers:
  `dashboard/tests/routes.spec.js`,
  `scripts/check-command-center-ux.js`
- Known limitations:
  Runtime execution, provider dispatch, DB writes, and project mutation remain
  intentionally constrained.
- Status:
  active

## Mission Composer

- Purpose:
  Turn a mission goal into a governed mission plan, contract, and planning
  summary.
- Primary files:
  `mission-composer/index.js`,
  `mission-composer/missionComposer.js`,
  `mission-composer/missionContract.js`,
  `mission-composer/missionPlanner.js`,
  `policy/mission-composer-policy.json`
- Public entry points:
  `mission-composer/index.js`,
  `scripts/mission-compose.js`
- Inputs/outputs:
  Consumes mission intent, contract rules, and planning constraints; outputs
  mission plans and contract metadata.
- Side effects:
  Script-driven local artifacts only where already governed.
- Safety boundary:
  Must stay within governed local planning boundaries; no provider calls or
  uncontrolled project mutation.
- Reuse notes:
  Reuse mission planner and contract helpers rather than re-encoding mission
  structure in route code or one-off scripts.
- Tests/checkers:
  `scripts/check-mission-composer.js`
- Known limitations:
  Mission editing remains governed and not free-form from the browser.
- Status:
  active

## Mission Action Bridge

- Purpose:
  Provide the governed bridge used by approved local action flows that turn
  operator intent into bounded execution or evidence-producing actions.
- Primary files:
  `scripts/mission-action-server.js`,
  `policy/mission-action-bridge-policy.json`,
  `policy/action-bridge-policy.json`
- Public entry points:
  `scripts/mission-action-server.js`
- Inputs/outputs:
  Consumes approved local action requests; outputs governed action responses and
  local evidence or audit data where allowed.
- Side effects:
  Local runtime or append-only records only when already permitted by policy.
- Safety boundary:
  Must remain local-private and governed; no provider dispatch or unsafe
  execution expansion.
- Reuse notes:
  New operator actions should map to this bridge only if a safe governed path
  already exists.
- Tests/checkers:
  `scripts/check-mission-action-bridge.js`,
  `scripts/check-action-bridge.js`
- Known limitations:
  Bridge-backed actions remain intentionally narrower than the Command Center
  UX may describe.
- Status:
  active

## Task Activation / Agent Workbench / Controlled Implementation

- Purpose:
  Cover the planned-to-activated task flow, human review loop, and controlled
  implementation summaries.
- Primary files:
  `task-actions/index.js`,
  `task-actions/taskActivationBridge.js`,
  `task-actions/taskActivationStore.js`,
  `workbench/index.js`,
  `workbench/agentWorkbench.js`,
  `workbench/reviewBridge.js`,
  `workbench/reviewStore.js`
- Public entry points:
  `task-actions/index.js`,
  `workbench/index.js`,
  Command Center routes under `dashboard/src/pages/CommandCenterV2.jsx`
- Inputs/outputs:
  Consumes task plans, approvals, review state, and controlled implementation
  posture; outputs activated tasks, review state, and implementation summaries.
- Side effects:
  Local task state and append-only runtime records where already allowed.
- Safety boundary:
  Must not expand into autonomous execution, release actions, or unrestricted
  source mutation.
- Reuse notes:
  Reuse task activation, workbench review, and implementation summary helpers
  instead of duplicating task-state logic in UI-only code.
- Tests/checkers:
  `scripts/check-task-activation-bridge.js`,
  `scripts/check-agent-workbench.js`,
  `scripts/check-controlled-implementation-workflow.js`
- Known limitations:
  Several UI actions remain route-first or disabled until later governed
  capabilities are implemented.
- Status:
  active

## Live Local API

- Purpose:
  Expose safe local read surfaces for missions, tasks, evidence, roadmap,
  service status, and DB foundation information.
- Primary files:
  `local-api/index.js`,
  `local-api/server.js`,
  `local-api/routes/*`,
  `local-api/safeResponse.js`
- Public entry points:
  `local-api/server.js`
- Inputs/outputs:
  Consumes local snapshot files, route-specific state, and safe response
  helpers; outputs read-only local API responses.
- Side effects:
  Read-only file access and HTTP responses.
- Safety boundary:
  Must stay local-only, avoid provider calls, and avoid DB writes unless an
  explicit future phase changes that posture.
- Reuse notes:
  Reuse `safeResponse.js` and existing route patterns before adding new local
  read endpoints.
- Tests/checkers:
  `scripts/check-live-local-api.js`
- Known limitations:
  Command Center may fall back to snapshot or file-backed data when the API is
  offline.
- Status:
  active

## DB Foundation + Durable State

- Purpose:
  Define the durable-state schema, config, health, import planning, and mapping
  layers while runtime remains file-backed.
- Primary files:
  `db/schema.json`,
  `db/schema.sql`,
  `db/dbConfig.js`,
  `db/dbHealth.js`,
  `db/dbRepository.js`,
  `db/dbImportPlan.js`,
  `db/dbSnapshotMapper.js`,
  `local-api/routes/db.js`
- Public entry points:
  `db/index.js`,
  `local-api/routes/db.js`
- Inputs/outputs:
  Consumes schema/config/import metadata; outputs DB foundation health and
  mapping summaries.
- Side effects:
  Foundation-level reads and mapping only; runtime-primary writes are not
  enabled here.
- Safety boundary:
  DB writes remain disabled by policy for the current operator phases.
- Reuse notes:
  Reuse the repository, mapper, and health helpers rather than adding new DB
  access logic in route or checker code.
- Tests/checkers:
  `scripts/check-db-foundation.js`,
  `scripts/db-foundation-status.js`
- Known limitations:
  Durable State is still file-backed for active runtime behavior.
- Status:
  foundation

## Unified Local Boot

- Purpose:
  Define, inspect, and manage the localhost-only service manifest and local boot
  lifecycle for dashboard, local API, action bridge, and planned placeholders.
- Primary files:
  `nexus.services.json`,
  `service-runtime/index.js`,
  `service-runtime/serviceManifest.js`,
  `service-runtime/serviceProcessManager.js`,
  `service-runtime/serviceStateStore.js`,
  `service-runtime/serviceHealth.js`,
  `service-runtime/servicePorts.js`,
  `scripts/nexus-up.js`,
  `scripts/nexus-down.js`,
  `scripts/nexus-status.js`,
  `scripts/nexus-doctor.js`
- Public entry points:
  `scripts/nexus-up.js`,
  `scripts/nexus-down.js`,
  `scripts/nexus-status.js`,
  `scripts/nexus-doctor.js`
- Inputs/outputs:
  Consumes `nexus.services.json`, local process state, and localhost health
  checks; outputs status snapshots, doctor reports, and managed service state.
- Side effects:
  Starts or stops only declared localhost services when using the boot manager;
  writes state under `local-state/runtime/services/`.
- Safety boundary:
  Must remain localhost-only, manifest-driven, and provider/network/DB-write
  disabled.
- Reuse notes:
  Reuse service-runtime helpers for manifest loading, port checks, health, and
  state management rather than creating parallel boot scripts.
- Tests/checkers:
  `scripts/check-nexus-service-orchestration.js`,
  `scripts/check-nexus-local-boot.js`,
  `scripts/check-nexus-boot.js`
- Known limitations:
  Disabled placeholders such as workers and gateways remain planned, not active
  runtime services.
- Status:
  active

## Local State / Runtime Records

- Purpose:
  Provide the file-backed runtime record system for tasks, evidence, audit,
  approvals, incidents, service state, and normalized snapshots.
- Primary files:
  `local-state/index.js`,
  `local-state/readLocalState.js`,
  `local-state/writeLocalState.js`,
  `local-state/stateStore.js`,
  `local-state/taskStore.js`,
  `local-state/approvalStore.js`,
  `local-state/safeFileReader.js`,
  `local-state/writeGuards.js`,
  `local-state/appendAuditEvent.js`,
  `local-state/appendEvidence.js`,
  `local-state/normalizeRuntimeFiles.js`,
  `local-state/normalizeRuntimeStatus.js`,
  `local-state/normalizeReports.js`,
  `local-state/runtime/*`
- Public entry points:
  `local-state/index.js`
- Inputs/outputs:
  Consumes append-only local runtime events and state files; outputs normalized
  snapshots and guarded writes.
- Side effects:
  Local file reads and governed local file writes.
- Safety boundary:
  Must preserve append-only or guarded write semantics and avoid accidental
  project-file mutation.
- Reuse notes:
  Reuse normalization and safe-file helpers before adding route-specific runtime
  readers.
- Tests/checkers:
  `scripts/check-local-state-boundary.js`,
  `scripts/check-local-write-boundary.js`,
  `scripts/check-command-center-runtime-ingestion.js`
- Known limitations:
  Local runtime state is intentionally file-backed until later DB-primary phases.
- Status:
  active

## Policies

- Purpose:
  Store the declarative policy boundaries that govern capabilities, local boot,
  API safety, approvals, private mode, DB foundation, and execution limits.
- Primary files:
  `policy/*.json`
- Public entry points:
  Individual policy files consumed by scripts and runtime guards.
- Inputs/outputs:
  Policy JSON in, boundary decisions or validations out.
- Side effects:
  None; declarative configuration only.
- Safety boundary:
  Policies are a core safety surface and should not be duplicated casually.
- Reuse notes:
  New capabilities should extend or reference existing policies before inventing
  ad hoc runtime rules.
- Tests/checkers:
  Many `scripts/check-*.js` validators read these files directly.
- Known limitations:
  Policy loading patterns are spread across scripts and remain candidates for a
  later reuse audit.
- Status:
  active

## Reports and Checkers

- Purpose:
  Validate repo contracts and write human-readable or machine-readable status
  reports for operators and maintainers.
- Primary files:
  `scripts/check-*.js`,
  `reports/*.md`,
  `reports/*.json`,
  `reports/ui-audit/*`
- Public entry points:
  `package.json` check scripts and generated artifacts under `reports/`
- Inputs/outputs:
  Consume repo files, runtime snapshots, and status registries; output console
  validation plus persisted reports.
- Side effects:
  Local report generation only.
- Safety boundary:
  Checkers must stay local, avoid provider calls, and avoid mutating protected
  project sources.
- Reuse notes:
  Reuse existing checker formatting, git metadata, and report-writing patterns
  rather than creating inconsistent validators.
- Tests/checkers:
  Self-validating through direct script execution in phase validation flows.
- Known limitations:
  Some legacy checkers still assume older roadmap strings and may fail outside
  the immediate subphase contract.
- Status:
  active

## Architecture and Usage Docs

- Purpose:
  Capture operator guidance, architecture intent, roadmap direction, and
  codebase-structure references.
- Primary files:
  `docs/architecture/*`,
  `docs/usage/*`,
  `docs/codebase/*`
- Public entry points:
  `README.md`,
  `docs/usage/README.md`,
  `docs/codebase/README.md`,
  architecture index documents
- Inputs/outputs:
  Human-authored markdown in; contributor/operator understanding out.
- Side effects:
  None beyond documentation maintenance.
- Safety boundary:
  Public-safe docs must avoid leaking private project internals or unsafe
  execution instructions.
- Reuse notes:
  Prefer linking across existing docs instead of re-explaining the same boundary
  in multiple places.
- Tests/checkers:
  `scripts/check-docs-coverage.js`
- Known limitations:
  Deeper reuse-audit and shared-helper docs are deferred to later P41.7
  subphases.
- Status:
  active

## Planned or Not Found

- Controlled implementation folder:
  No standalone `controlled-implementation/` folder was found. Current
  implementation workflow behavior is documented through Command Center route
  code, policies, and checkers instead.
- Provider or tool runtime registries:
  Not active yet. These remain planned future module families under later
  roadmap phases.
