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

## Reuse Audit and Refactor Candidate Inventory

- Purpose:
  Inventory duplicate patterns and recommend future shared helper candidates
  before risky refactors are attempted.
- Primary files:
  `codebase/reuseAudit.js`,
  `codebase/refactorCandidates.js`,
  `codebase/index.js`,
  `policy/reuse-audit-policy.json`,
  `scripts/check-reuse-audit.js`,
  `reports/reuse-audit.json`,
  `reports/reuse-audit-report.md`
- Public entry points:
  `codebase/index.js`,
  `scripts/check-reuse-audit.js`
- Inputs/outputs:
  Consumes allowed repo scan areas and policy metadata; outputs a JSON audit,
  markdown report, and prioritized refactor candidate plan.
- Side effects:
  Writes reuse-audit reports only.
- Safety boundary:
  Audit-only. Must not modify runtime behavior, action bridges, local API, DB
  behavior, protected project files, providers, or orchestrator runtime paths.
- Reuse notes:
  Use the audit output before introducing shared helpers or refactoring repeated
  checker, policy, report, redaction, or state patterns.
- Tests/checkers:
  `scripts/check-reuse-audit.js`
- Known limitations:
  Pattern detection is conservative and intended to guide future review, not to
  prove semantic equivalence.
- Status:
  foundation

## Skill Registry + Authoring Workflow

- Purpose:
  Document reusable governed skills, their contracts, templates, stack
  compatibility, and validation requirements before any runtime execution is
  enabled.
- Primary files:
  `skills-registry/skillSchema.js`,
  `skills-registry/skillRegistry.js`,
  `skills-registry/skillContract.js`,
  `skills-registry/skillTemplates.js`,
  `skills-registry/skillProfiles.js`,
  `skills-registry/skillTestRequirements.js`,
  `skills-registry/registry.json`,
  `policy/skill-registry-policy.json`
- Public entry points:
  `skills-registry/index.js`,
  `scripts/check-skill-registry.js`,
  `/command-center/skills`
- Inputs/outputs:
  Consumes static registry metadata and outputs read-only skill summaries,
  template metadata, stack compatibility, and test requirements.
- Side effects:
  Checker/report generation only.
- Safety boundary:
  Skill execution, provider calls, tool/MCP execution, worker runtime, DB writes,
  release execution, project mutation, and agent definition mutation remain
  disabled.
- Reuse notes:
  Future skill work should reuse the registry schema, contract model, template
  structure, stack profiles, and test requirement mapping before adding new
  skill-specific metadata.
- Tests/checkers:
  `scripts/check-skill-registry.js`,
  `scripts/check-command-center-ux.js`,
  `dashboard/tests/routes.spec.js`
- Known limitations:
  The registry is metadata-only until later governed automation phases enable
  safe execution paths.
- Status:
  active

## Hook Registry + Safe Automation Lifecycle

- Purpose:
  Define governed hook metadata, planned trigger contracts, rate/retry guards,
  loop-risk detection, kill switch previews, and read-only Command Center
  visibility before any automation execution is enabled.
- Primary files:
  `hooks/hookSchema.js`,
  `hooks/hookRegistry.js`,
  `hooks/triggerDefinitions.js`,
  `hooks/triggerContract.js`,
  `hooks/hookLimits.js`,
  `hooks/hookRuntimeGuard.js`,
  `hooks/loopRiskDetector.js`,
  `hooks/hookKillSwitch.js`,
  `policy/hook-registry-policy.json`
- Public entry points:
  `hooks/index.js`,
  `scripts/check-hook-registry.js`,
  `/command-center/hooks`
- Inputs/outputs:
  Consumes static hook definitions and policy metadata; outputs read-only hook
  readiness, trigger preview, guardrail, loop-risk, and kill-switch summaries.
- Side effects:
  Checker/report generation only.
- Safety boundary:
  Hook execution, schedulers, cron, webhooks, workers, provider/tool/MCP
  dispatch, DB writes, release execution, project mutation, and external network
  calls remain disabled.
- Reuse notes:
  Future automation phases should reuse the hook schema, trigger contract,
  guard decision, loop-risk, and kill-switch models before adding runtime
  integration.
- Tests/checkers:
  `scripts/check-hook-registry.js`,
  `scripts/check-command-center-ux.js`,
  `dashboard/tests/routes.spec.js`
- Known limitations:
  The registry is readiness-only until a later governed runtime phase explicitly
  enables safe execution.
- Status:
  active

## Tool / MCP Registry + Tool Governance

- Purpose:
  Define the metadata-only tool registry that will feed one governed tool
  gateway. P52 starts with tool definitions and later adds MCP placeholders,
  search, lazy contracts, permission checks, and dry-run previews.
- Primary files:
  `tool-governance/toolRegistrySchema.js`,
  `tool-governance/toolRegistry.js`,
  `tool-governance/mcpRegistrySchema.js`,
  `tool-governance/mcpRegistry.js`,
  `tool-governance/toolTypes.js`,
  `tool-governance/seeds/tool-registry.seed.json`,
  `tool-governance/seeds/mcp-registry.seed.json`,
  `policy/tool-registry-policy.json`,
  `policy/mcp-registry-policy.json`
- Public entry points:
  `tool-governance/index.js`,
  `scripts/check-tool-registry.js`,
  `scripts/check-mcp-registry.js`
- Inputs/outputs:
  Consumes static registry metadata; outputs read-only tool and MCP placeholder
  summaries and validation reports.
- Side effects:
  Checker/report generation only.
- Safety boundary:
  Tool execution, MCP execution, shell execution through the gateway, provider
  calls, external network, DB writes, workers, and project mutation remain
  disabled.
- Reuse notes:
  Future tool gateway phases should reuse the registry schema and seed metadata
  before adding adapter or permission-specific models.
- Tests/checkers:
  `scripts/check-tool-registry.js`,
  `scripts/check-mcp-registry.js`
- Known limitations:
  P52.1 and P52.2 are metadata-only and do not implement contracts,
  permissions, adapters, MCP server runtime, or Command Center Tool Gateway UX
  yet.
- Status:
  foundation

## Shared Helper Catalog and Refactor Plan

- Purpose:
  Define the planned and existing shared helpers that future phases should
  reuse, plus the risk-ranked plan for later helper extraction.
- Primary files:
  `codebase/sharedHelperCatalog.js`,
  `codebase/refactorCandidatePlan.js`,
  `docs/codebase/SHARED_HELPER_CATALOG.md`,
  `docs/codebase/REFACTOR_CANDIDATE_PLAN.md`,
  `docs/codebase/SHARED_HELPER_ADOPTION_GUIDE.md`,
  `policy/shared-helper-catalog-policy.json`,
  `scripts/check-shared-helper-catalog.js`,
  `reports/shared-helper-catalog-report.md`,
  `reports/refactor-candidate-plan.json`
- Public entry points:
  `codebase/index.js`,
  `scripts/check-shared-helper-catalog.js`
- Inputs/outputs:
  Consumes the P41.7.2 reuse audit and helper definitions; outputs a
  machine-readable refactor candidate plan and markdown validation report.
- Side effects:
  Writes shared-helper catalog reports only.
- Safety boundary:
  Planning-only. Broad refactors, runtime behavior changes, DB writes, provider
  calls, local API changes, and protected project mutations remain forbidden.
- Reuse notes:
  Future phases should consult this catalog before adding helpers or duplicating
  report, checker, policy, route, or runtime patterns.
- Tests/checkers:
  `scripts/check-shared-helper-catalog.js`
- Known limitations:
  No helper extraction is implemented in P41.7.3.
- Status:
  foundation

## Command Center Tab System Foundation

- Purpose:
  Provide reusable tab and scope-shell components so dense Command Center pages
  can move from long single-page dashboards to focused drilldown surfaces.
- Primary files:
  `dashboard/src/components/command-center-v2/CommandTabs.jsx`,
  `dashboard/src/components/command-center-v2/ScopeSwitcher.jsx`,
  `dashboard/src/components/command-center-v2/ProjectSwitcher.jsx`,
  `dashboard/src/data/commandCenterTabs.js`,
  `scripts/check-command-center-tabs.js`,
  `docs/architecture/COMMAND_CENTER_TABBED_NAVIGATION.md`
- Public entry points:
  `CommandTabs`,
  `CommandTabList`,
  `CommandTabPanel`,
  `ScopeSwitcher`,
  `ProjectSwitcher`,
  `getTabsForPage`
- Inputs/outputs:
  Consumes tab configuration, active tab state, active scope, current mode, and
  safe project label metadata. Outputs accessible tab UI and a scope context
  shell.
- Side effects:
  Browser UI state only. No backend writes, provider calls, Project Registry
  mutation, or runtime execution.
- Safety boundary:
  DemoApp is not used in local-private primary Command Center pages. Portfolio
  and multi-project behavior are placeholders until P42.
- Reuse notes:
  Future page tab rollout should reuse `CommandTabs` and `PAGE_TAB_PLANS`
  instead of creating page-local tab systems.
- Tests/checkers:
  `dashboard/tests/routes.spec.js`,
  `scripts/check-command-center-tabs.js`,
  `scripts/check-command-center-ux.js`
- Known limitations:
  Only Mission Control receives the initial tab shell in P41.7.3A.
- Status:
  foundation

## Observability Activity Modules

- Purpose:
  Provide the local, redaction-safe activity schema, logger, capture helpers,
  store, API summaries, and trace view used by the Command Center Activity Log.
- Primary files:
  `observability/activitySchema.js`,
  `observability/activityTypes.js`,
  `observability/correlation.js`,
  `observability/redactionPolicy.js`,
  `observability/activityLogger.js`,
  `observability/activityStore.js`,
  `observability/activityCapture.js`,
  `observability/activityTrace.js`,
  `observability/index.js`,
  `local-api/routes/activity.js`
- Public entry points:
  `createActivityEvent`,
  `validateActivityEvent`,
  `createTraceContext`,
  `logActivityDryRun`,
  `appendActivityEvent`,
  `readActivityEvents`,
  `recordUiActivity`,
  `recordApiActivity`,
  `recordActionBridgeActivity`,
  `recordActivityFailure`,
  `buildActivityTrace`
- Inputs/outputs:
  Consumes redacted activity input from local UI/API/action bridge surfaces and
  outputs schema-compliant activity events, local JSONL records, summarized
  `/activity` responses, and correlation trace summaries.
- Side effects:
  The central logger can append to `local-state/runtime/activity.jsonl` through
  governed helper calls. The local API route and Command Center Activity Log are
  read-only.
- Safety boundary:
  No provider calls, external network calls, worker instrumentation, DB writes,
  DB-backed activity storage, raw payload logging, raw log display, or private
  project source exposure.
- Reuse notes:
  Future instrumentation must reuse the schema, correlation, redaction, logger,
  and trace helpers instead of writing ad hoc activity records.
- Tests/checkers:
  `scripts/check-activity-event-schema.js`,
  `scripts/check-central-activity-logger.js`,
  `scripts/check-activity-capture.js`,
  `scripts/check-activity-trace-view.js`,
  `scripts/check-activity-observability-final.js`,
  `dashboard/tests/routes.spec.js`
- Known limitations:
  Provider/tool/worker traces, DB-backed storage, retention, export, telemetry,
  SLOs, and production observability integrations remain future phases.
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

## Architecture Diagram Registry

- Purpose:
  Track source diagrams, planned rendered artifacts, public-safe diagram
  metadata, and architecture visualization validation.
- Primary files:
  `docs/architecture/diagrams/README.md`,
  `docs/architecture/diagrams/diagram-registry.json`,
  `docs/architecture/diagrams/sources/*.mmd`,
  `scripts/check-architecture-diagrams.js`,
  `reports/architecture-diagram-registry-report.md`
- Public entry points:
  `docs/architecture/diagrams/README.md`,
  `README.md`
- Inputs/outputs:
  Mermaid source diagrams and registry JSON in; public-safe architecture
  diagram inventory and validation report out.
- Side effects:
  The checker writes `reports/architecture-diagram-registry-report.md`.
- Safety boundary:
  Diagram sources must not expose private project names, secrets, raw logs, raw
  policy payloads, or private project source paths. Rendered artifacts are not
  generated in P41.9.1.
- Reuse notes:
  Add future diagrams to `diagram-registry.json` before linking or rendering
  them from primary docs.
- Tests/checkers:
  `scripts/check-architecture-diagrams.js`
- Known limitations:
  P41.9.1 adds source-only placeholders. PNG/SVG rendering is planned for a
  later phase after a safe local rendering workflow is selected.
- Status:
  foundation

## Trusted Context + Data Architecture

- Purpose:
  Define the metadata-only context trust layer that identifies authoritative,
  fresh, scoped, governed data sources before future agent/provider execution.
- Primary files:
  `trusted-context/*`,
  `policy/trusted-context-policy.json`,
  `docs/architecture/TRUSTED_CONTEXT_DATA_ARCHITECTURE.md`
- Public entry points:
  `trusted-context/index.js`,
  `scripts/check-trusted-context-data-sources.js`
- Inputs/outputs:
  Source metadata and repository file existence in; trusted context registry
  summaries, validation reports, and future packet previews out.
- Side effects:
  Checkers write P47 reports under `reports/`. Runtime behavior is unchanged.
- Safety boundary:
  No provider calls, tool dispatch, worker runtime, DB writes, project source
  mutation, private source content scans, or runtime agent injection are enabled.
- Reuse notes:
  Future context, memory, tool, provider, worker, and project registry phases
  should use this registry before adding new context sources.
- Tests/checkers:
  `scripts/check-trusted-context-data-sources.js`,
  `scripts/check-system-of-record-map.js`,
  `scripts/check-source-trust-score.js`,
  `scripts/check-context-freshness-lineage.js`,
  `scripts/check-trusted-context-packet.js`,
  `scripts/check-trusted-context-command-center.js`,
  `scripts/check-trusted-context-final-validation.js`
- Known limitations:
  P47 is metadata-only. Packet previews are not injected into agents and do not
  enable provider/tool/worker dispatch, DB writes, or project mutation.
- Status:
  active

## Governed Agentic Mesh

- Purpose:
  Provide governed, metadata-only agent coordination through scoped messages,
  append-only message records, agent rooms, handoff requests, policy-scoped
  context summaries, and Command Center visibility.
- Primary files:
  `agent-mesh/messageTypes.js`, `agent-mesh/messageContract.js`,
  `agent-mesh/messageStore.js`, `agent-mesh/messageBus.js`,
  `agent-mesh/agentRooms.js`, `agent-mesh/roomStore.js`,
  `agent-mesh/handoffProtocol.js`, `agent-mesh/contextSync.js`,
  `dashboard/src/pages/CommandCenterV2.jsx`
- Public entry points:
  `agent-mesh/index.js`, `scripts/check-governed-agentic-mesh.js`,
  `/command-center/agent-rooms`
- Inputs/outputs:
  Redacted message, room, handoff, and context-sync metadata in; JSONL runtime
  records, summaries, validation reports, and read-only UI state out.
- Side effects:
  Checkers write P48 reports and local runtime JSONL validation records under
  `local-state/runtime/`.
- Safety boundary:
  Direct agent chat, provider dispatch, tool dispatch, worker runtime, DB
  writes, project mutation, task ownership mutation, raw payload storage, and
  raw private context exposure remain disabled.
- Reuse notes:
  Future agent coordination must use the mesh message contract, room model,
  handoff protocol, and policy-scoped context summaries rather than creating
  direct agent-to-agent messaging.
- Tests/checkers:
  `scripts/check-agent-mesh-message-contract.js`,
  `scripts/check-agent-mesh-message-bus.js`,
  `scripts/check-agent-rooms.js`,
  `scripts/check-agent-handoff-protocol.js`,
  `scripts/check-agent-mesh-context-sync.js`,
  `scripts/check-governed-agentic-mesh.js`
- Known limitations:
  P48 remains coordination metadata only. It does not execute agents, dispatch
  providers/tools/workers, write to DB, mutate project files, or change task
  ownership.
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
