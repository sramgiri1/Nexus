# NEXUS Phase Module Index

This index maps major phases and subphases to the module families they
introduced or materially changed. Registry entries are based on available repo
state and should be verified again during future docs audits.

## P34 — Mission Composer Governed Kickoff

- Primary capability:
  Governed mission kickoff from founder intent into a structured mission plan.
- Main files/folders touched:
  `mission-composer/*`,
  `scripts/mission-compose.js`,
  `policy/mission-composer-policy.json`
- Main checker(s):
  `scripts/check-mission-composer.js`
- Main report(s):
  Mission-composer validations remain checker-driven; verify future report
  additions during docs audit.
- Command Center impact:
  Established the planning foundation later surfaced by Mission Control and
  Workspace.
- Safety impact:
  Kept planning governed and local-private, without enabling provider dispatch.
- Known limitations:
  Registry entry based on available repo state; verify during future docs audit.

## P35 — Mission Action Bridge + Mission/PRD Awareness

- Primary capability:
  Governed local action bridge for mission-aware operator flows.
- Main files/folders touched:
  `scripts/mission-action-server.js`,
  `policy/mission-action-bridge-policy.json`,
  `policy/action-bridge-policy.json`
- Main checker(s):
  `scripts/check-mission-action-bridge.js`,
  `scripts/check-action-bridge.js`
- Main report(s):
  Checker-driven validation outputs.
- Command Center impact:
  Provided the bridge dependency later referenced by Mission Control and command
  palette actions.
- Safety impact:
  Preserved bridge governance and prevented arbitrary execution.
- Known limitations:
  Registry entry based on available repo state; verify during future docs audit.

## P36 — Agentic Workspace Home + Workflow Templates

- Primary capability:
  Workspace workflow templates and operator-facing next-best-action guidance.
- Main files/folders touched:
  `workspace/*`,
  `dashboard/src/data/commandCenterViewModel.js`,
  `dashboard/src/pages/CommandCenterV2.jsx`
- Main checker(s):
  `scripts/check-agentic-workspace.js`
- Main report(s):
  Checker-driven validation outputs.
- Command Center impact:
  Added the Agentic Workspace and workflow templates.
- Safety impact:
  Kept workspace planning route-first without execution.
- Known limitations:
  Some legacy checkers still expect older roadmap strings.

## P37 — Task Activation + Agent Assignment from UI

- Primary capability:
  Planned-task activation and governed agent assignment visibility.
- Main files/folders touched:
  `task-actions/*`,
  `dashboard/src/pages/CommandCenterV2.jsx`,
  `dashboard/src/data/commandCenterViewModel.js`
- Main checker(s):
  `scripts/check-task-activation-bridge.js`
- Main report(s):
  Checker-driven validation outputs.
- Command Center impact:
  Added Task Queue activation flows and agent assignment summaries.
- Safety impact:
  Activation remained governed without autonomous execution.
- Known limitations:
  Registry entry based on available repo state; verify during future docs audit.

## P38 — Agent Workbench + Human Review Loop

- Primary capability:
  Human review loop and task-detail inspection.
- Main files/folders touched:
  `workbench/*`,
  `dashboard/src/pages/CommandCenterV2.jsx`,
  `policy/agent-workbench-policy.json`
- Main checker(s):
  `scripts/check-agent-workbench.js`
- Main report(s):
  Checker-driven validation outputs.
- Command Center impact:
  Added Agent Workbench route and review loop.
- Safety impact:
  Review remained human-governed and read-only where required.
- Known limitations:
  Legacy roadmap assumptions still appear in the checker contract.

## P39 — First Controlled Implementation Workflow from UI

- Primary capability:
  Controlled implementation posture and validation summaries from the UI.
- Main files/folders touched:
  `dashboard/src/pages/CommandCenterV2.jsx`,
  `dashboard/src/data/commandCenterViewModel.js`,
  `policy/controlled-implementation-workflow-policy.json`
- Main checker(s):
  `scripts/check-controlled-implementation-workflow.js`
- Main report(s):
  Checker-driven validation outputs.
- Command Center impact:
  Added the Implementation Workflow route and implementation summaries.
- Safety impact:
  Preserved controlled, bounded implementation messaging without broad source
  mutation.
- Known limitations:
  No dedicated standalone implementation folder currently exists.

## P40 — Live Local API Backend

- Primary capability:
  Read-only local API backend for Command Center data.
- Main files/folders touched:
  `local-api/*`
- Main checker(s):
  `scripts/check-live-local-api.js`
- Main report(s):
  Local API validation remains checker-driven.
- Command Center impact:
  Enabled live local API summaries and service-health integration.
- Safety impact:
  Stayed local-only, read-only, and provider-free.
- Known limitations:
  UI still supports snapshot/file-backed fallback when the API is offline.

## P41 — DB Foundation + Durable State

- Primary capability:
  Durable-state foundation and DB schema/config/health groundwork.
- Main files/folders touched:
  `db/*`,
  `local-api/routes/db.js`
- Main checker(s):
  `scripts/check-db-foundation.js`
- Main report(s):
  `reports/*` DB foundation outputs as generated by validation scripts.
- Command Center impact:
  Powered Durable State and DB Foundation summaries.
- Safety impact:
  DB writes remained disabled by policy.
- Known limitations:
  Runtime remains file-backed until later DB-primary phases.

## P41.5.1 — Command Center Route-Wide UX Copy + Capability State Cleanup

- Primary capability:
  Removed stale internal phase labels from primary UX.
- Main files/folders touched:
  `dashboard/src/pages/CommandCenterV2.jsx`,
  `dashboard/src/data/commandCenterViewModel.js`,
  `dashboard/src/data/capabilityReadiness.js`
- Main checker(s):
  `scripts/check-command-center-ux.js`
- Main report(s):
  `reports/command-center-ux-report.md`
- Command Center impact:
  Replaced roadmap-fragment copy with user-facing readiness and capability
  language.
- Safety impact:
  Improved operator clarity without expanding runtime scope.
- Known limitations:
  Registry entry based on available repo state; verify during future docs audit.

## P41.5.2 — Global Theme Switcher + Route-Wide Theme Validation

- Primary capability:
  System/Dark/Light theme support across Command Center.
- Main files/folders touched:
  `dashboard/src/hooks/useNexusTheme.js`,
  `dashboard/src/styles-command-center-v2.css`,
  `dashboard/tests/routes.spec.js`
- Main checker(s):
  `scripts/check-command-center-ux.js`
- Main report(s):
  `reports/command-center-ux-report.md`
- Command Center impact:
  Added the global theme switcher and theme-aware route validation.
- Safety impact:
  None beyond improved operator readability.
- Known limitations:
  Registry entry based on available repo state; verify during future docs audit.

## P41.5.3 — Mission Control Enterprise Dashboard Layout

- Primary capability:
  Enterprise cockpit layout for Mission Control.
- Main files/folders touched:
  `dashboard/src/pages/CommandCenterV2.jsx`,
  `dashboard/src/styles-command-center-v2.css`
- Main checker(s):
  `scripts/check-command-center-ux.js`
- Main report(s):
  `reports/command-center-ux-report.md`
- Command Center impact:
  Established the first dense Mission Control cockpit structure.
- Safety impact:
  Pure UX/layout improvement.
- Known limitations:
  Registry entry based on available repo state; verify during future docs audit.

## P41.5.4 — Page-Specific UX Cleanup

- Primary capability:
  Page-specific state summaries, empty states, and action-state cleanup.
- Main files/folders touched:
  `dashboard/src/pages/CommandCenterV2.jsx`,
  `dashboard/src/data/commandCenterViewModel.js`,
  `dashboard/tests/routes.spec.js`
- Main checker(s):
  `scripts/check-command-center-ux.js`
- Main report(s):
  `reports/command-center-ux-report.md`
- Command Center impact:
  Improved Workspace, Task Queue, Workbench, Implementation, Live API, Durable
  State, Evidence, Safety, and Projects.
- Safety impact:
  Clarified what is available, blocked, or disabled by design.
- Known limitations:
  Registry entry based on available repo state; verify during future docs audit.

## P41.5.5 — Route-Wide Screenshot UX Audit + Visual QA Report

- Primary capability:
  Automated route screenshots and visual QA artifacts.
- Main files/folders touched:
  `scripts/capture-command-center-screenshots.js`,
  `reports/ui-audit/*`,
  `dashboard/tests/routes.spec.js`
- Main checker(s):
  `scripts/check-command-center-ux.js`
- Main report(s):
  `reports/ui-audit/manifest.json`,
  `reports/ui-audit/visual-qa-report.md`
- Command Center impact:
  Added dark/light route visual baselines and DOM-level screenshot checks.
- Safety impact:
  No runtime expansion; validation only.
- Known limitations:
  Screenshot audit is a baseline, not a pixel-diff regression system.

## P41.5.6 — Usage Docs + Codebase Docs + README Finalization

- Primary capability:
  Public-safe usage docs, diagram registry, and README/codebase-doc alignment.
- Main files/folders touched:
  `docs/usage/*`,
  `docs/codebase/*`,
  `docs/architecture/diagrams/*`,
  `scripts/check-docs-coverage.js`
- Main checker(s):
  `scripts/check-docs-coverage.js`
- Main report(s):
  `reports/docs-coverage-report.md`
- Command Center impact:
  Added help-link foundations and documentation references.
- Safety impact:
  Codified public-safe wording and docs boundaries.
- Known limitations:
  Deeper codebase registry accuracy still required a later P41.7 pass.

## P41.6.1 — Service Manifest, Status, and Doctor

- Primary capability:
  Declarative service manifest with read-only status and doctor commands.
- Main files/folders touched:
  `nexus.services.json`,
  `service-orchestration/*`,
  `scripts/nexus-status.js`,
  `scripts/nexus-doctor.js`
- Main checker(s):
  `scripts/check-nexus-service-orchestration.js`
- Main report(s):
  `reports/nexus-service-status.json`,
  `reports/nexus-doctor-report.json`,
  `reports/nexus-service-orchestration-report.md`
- Command Center impact:
  Created the data foundation later surfaced by Service Health.
- Safety impact:
  Explicitly kept this phase read-only with no process management.
- Known limitations:
  Process management was deferred to P41.6.2.

## P41.6.2 — nexus:up / nexus:down Process Manager

- Primary capability:
  Localhost-only process manager for NEXUS-managed services.
- Main files/folders touched:
  `service-runtime/*`,
  `scripts/nexus-up.js`,
  `scripts/nexus-down.js`,
  `local-state/runtime/services/*`
- Main checker(s):
  `scripts/check-nexus-local-boot.js`,
  `scripts/check-nexus-boot.js`
- Main report(s):
  `reports/nexus-boot-report.md`,
  `reports/nexus-service-status-report.md`
- Command Center impact:
  Enabled boot-state data that later informed Service Health UX.
- Safety impact:
  Enforced localhost-only binding, managed-PID shutdown, and disabled future
  services by default.
- Known limitations:
  Command Center still lacked service-health UX until P41.6.3.

## P41.6.3 — Command Center Service Health UX

- Primary capability:
  Operator-facing service health route and local boot guidance.
- Main files/folders touched:
  `dashboard/src/pages/CommandCenterV2.jsx`,
  `dashboard/src/data/commandCenterViewModel.js`,
  `dashboard/tests/routes.spec.js`
- Main checker(s):
  `scripts/check-nexus-local-boot.js`,
  `scripts/check-command-center-ux.js`
- Main report(s):
  `reports/nexus-local-boot-report.md`,
  `reports/command-center-ux-report.md`
- Command Center impact:
  Added Service Health route, service cards, command guidance, and doctor
  summaries.
- Safety impact:
  Preserved read-only UI execution posture.
- Known limitations:
  Service commands still run from the terminal, not the browser.

## P41.6.4 — NEXUS Command Palette + Simple Operator Actions

- Primary capability:
  Governed command palette and operator action catalog.
- Main files/folders touched:
  `dashboard/src/data/nexusCommands.js`,
  `dashboard/src/pages/CommandCenterV2.jsx`,
  `dashboard/src/data/capabilityReadiness.js`,
  `dashboard/tests/routes.spec.js`
- Main checker(s):
  `scripts/check-command-center-ux.js`,
  `scripts/check-os-phase-status.js`
- Main report(s):
  `reports/command-center-ux-report.md`,
  `reports/os-phase-status-report.md`
- Command Center impact:
  Added Plan, Review, QA, Fix, Ship, Retro, Guard, Freeze, and Explain operator
  intents.
- Safety impact:
  Explicitly kept unsafe or unavailable commands disabled with clear reasons.
- Known limitations:
  Several commands remain route-first or not-enabled until later governed
  capabilities exist.

## P41.6.5 — OS Roadmap / Project Roadmap Separation, Boot Docs, Troubleshooting, and Final Validation

- Primary capability:
  Separated OS roadmap from project progress and tightened boot-facing operator
  docs.
- Main files/folders touched:
  `os-roadmap/nexus-phases.json`,
  `os-roadmap/phase-status.json`,
  `dashboard/src/data/nexusRoadmap.js`,
  `docs/usage/RUNNING_NEXUS_LOCALLY.md`,
  `docs/usage/TROUBLESHOOTING.md`
- Main checker(s):
  `scripts/check-os-phase-status.js`,
  `scripts/check-nexus-boot.js`,
  `scripts/check-command-center-ux.js`
- Main report(s):
  `reports/os-phase-status-report.md`,
  `reports/nexus-boot-report.md`
- Command Center impact:
  OS Roadmap became OS-only while project progress moved under Projects.
- Safety impact:
  Improved public/private boundary clarity in roadmap surfaces.
- Known limitations:
  Project progress remained a temporary example until a future registry phase.

## P41.6.6 — Command Center Boundary Polish + Mission Control Consistency

- Primary capability:
  Local-private/demo boundary polish and Mission Control consistency fixes.
- Main files/folders touched:
  `dashboard/src/pages/CommandCenterV2.jsx`,
  `dashboard/src/data/commandCenterViewModel.js`,
  `dashboard/src/styles-command-center-v2.css`,
  `os-roadmap/phase-status.json`
- Main checker(s):
  `scripts/check-command-center-ux.js`,
  `scripts/check-os-phase-status.js`
- Main report(s):
  `reports/command-center-ux-report.md`,
  `reports/os-phase-status-report.md`
- Command Center impact:
  Removed DemoApp leakage from local-private Mission Control, polished badges,
  fixed mission display, and cleaned top-bar density.
- Safety impact:
  Strengthened boundary correctness without changing runtime behavior.
- Known limitations:
  Some legacy validation scripts still assume older roadmap wording.

## P41.7.1 — Codebase Documentation Standard + Module Registry

- Primary capability:
  Establish the codebase documentation standard, module registry, and phase
  module index.
- Main files/folders touched:
  `docs/codebase/README.md`,
  `docs/codebase/CODE_DOCUMENTATION_STANDARD.md`,
  `docs/codebase/MODULE_REGISTRY.md`,
  `docs/codebase/PHASE_MODULE_INDEX.md`,
  `scripts/check-docs-coverage.js`,
  `os-roadmap/nexus-phases.json`,
  `os-roadmap/phase-status.json`
- Main checker(s):
  `scripts/check-docs-coverage.js`,
  `scripts/check-os-phase-status.js`
- Main report(s):
  `reports/docs-coverage-report.md`,
  `reports/os-phase-status-report.md`
- Command Center impact:
  Keeps roadmap status in sync and improves future contributor understanding of
  the modules behind Command Center surfaces.
- Safety impact:
  Codifies reuse-first and no-high-risk-refactor rules before deeper refactor
  phases.
- Known limitations:
  Reuse audit, shared-helper inventory, and broader usage-doc expansion are
  intentionally deferred to later P41.7 subphases.
