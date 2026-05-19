# P71 Project Shipping Boundary + Export Pipeline

P71 prepares governed project shipping and export readiness for NEXUS OS. It
does not enable package creation, export execution, project mutation, provider
dispatch, tool execution, worker execution, DB writes, deploy execution,
release execution, external network calls, or provider spend.

Contract: `contracts/os-roadmap/p71-execution-contracts.json`

## Boundary

- Scope: NEXUS OS project shipping governance only.
- Project source files and project roadmap files remain forbidden.
- Package and export records are preview-only until a later explicit phase
  enables governed execution.
- NEXUS internals, raw evidence, raw audit, raw activity, local runtime state,
  secrets, and DemoApp data remain blocked from project package content.
- Shipping state, redaction posture, approval, evidence, activity, disabled
  reason, safety posture, and cost impact must be visible before any future
  export path is considered.

## Reuse

P71 must reuse existing helpers before adding new ones:

- `scope-boundary/exportSafety.js`
- `scope-boundary/exportRules.js`
- `scope-boundary/exportSafetyReport.js`
- `shared/resultEnvelope.js`
- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `shared/modeGuard.js`
- `shared/redaction.js`
- `os-roadmap/updatePhaseStatus.js`
- existing Command Center route matrix, tabs, cards, pills, and theme controls
- existing evidence, audit, activity, and cost preview patterns

## Subphases

### P71.1 Schema / Policy / Contract

Define P71 execution contracts only; no package creation, export execution, or
project mutation behavior.

Status: complete. P71.1 adds the implementation-grade P71 subphase contract,
disabled package/export execution boundary, validation checker, roadmap
handoff, and phase-status records.

### P71.2 Project Shipping Manifest Contract

Define display-safe project shipping manifest records.

Status: complete. P71.2 adds preview-only `ProjectShippingManifest`
records for NEXUS OS shipping readiness. Each manifest includes a
display-safe project name, export target, manifest state, redaction state,
allowed/forbidden files, disabled execution flags, disabled reason, blockers,
sanitized shipping items, evidence/activity references, cost impact, owner
capability, and next action.

Implementation:

- `project-shipping/p71-2-placeholder.js` exports
  `createProjectShippingManifest`, `validateProjectShippingManifest`,
  `buildProjectShippingManifestEnvelope`, `P71_2_REQUIRED_FIELDS`, and
  `P71_2_SAMPLE_MANIFESTS`.
- `scripts/check-p712.js` validates manifest shape, project path blocking,
  hidden private IDs, secret redaction, hidden raw paths, disabled package
  creation/export execution, disabled project mutation, disabled provider/
  tool/worker execution, disabled DB/network/spend, disabled deploy/release
  execution, evidence/activity, cost impact, and non-runnable disabled
  reasons.

### P71.3 Export Package Preview

Create export package preview records without writing package artifacts.

Status: complete. P71.3 adds preview-only `ExportPackagePreview` records
derived from P71.2 shipping manifests. Each preview includes package preview
identity, package state, artifact-created status, disabled execution flags,
disabled reason, blockers, preview items, blocked items, evidence/activity
references, cost impact, owner capability, and next action.

Implementation:

- `project-shipping/p71-3-placeholder.js` exports
  `createExportPackagePreview`, `validateExportPackagePreview`,
  `buildExportPackagePreviewEnvelope`, `P71_3_REQUIRED_FIELDS`, and
  `P71_3_SAMPLE_PREVIEWS`.
- `scripts/check-p713.js` validates preview shape, blocked project/artifact
  paths, no package artifact on disk, disabled package creation/export
  execution, disabled project mutation, disabled provider/tool/worker
  execution, disabled DB/network/spend, disabled deploy/release execution,
  preview-only items, blocked items, evidence/activity, cost impact, hidden
  private IDs, and non-runnable disabled reasons.

### P71.4 Shipping Readiness Gate

Add shipping readiness gates while keeping package creation and export
execution disabled.

Status: complete. P71.4 adds preview-only `ShippingReadinessGate` records
derived from P71.3 export package previews. Each gate records approval state,
manifest readiness, preview readiness, redaction readiness, evidence
readiness, cost review readiness, required evidence, blockers, disabled
reason, owner capability, evidence/activity references, and next action while
keeping package creation and export execution disabled.

Implementation:

- `project-shipping/p71-4-placeholder.js` exports
  `createShippingReadinessGate`, `validateShippingReadinessGate`,
  `buildShippingReadinessGateEnvelope`, `P71_4_REQUIRED_FIELDS`, and
  `P71_4_SAMPLE_GATES`.
- `scripts/check-p714.js` validates gate shape, operator approval state,
  readiness flags, required evidence, no package artifact on disk, disabled
  package creation/export execution, disabled project mutation, disabled
  provider/tool/worker execution, disabled DB/network/spend, disabled
  deploy/release execution, evidence/activity, cost impact, hidden private
  IDs, and non-runnable disabled reasons.

### P71.5 Command Center Shipping UX

Expose project shipping readiness without runnable package or export actions.

Status: complete. P71.5 exposes display-only project shipping readiness at
`/command-center/shipping` using the existing Command Center route matrix, tab
shell, page summary, cards, pills, disabled buttons, and theme controls. The
primary UX shows what changed, shipping state, export readiness, next action,
blockers, disabled reason, owner capability, evidence/activity locations,
redaction posture, and cost impact without showing raw JSON, raw logs, raw
evidence, private IDs, DemoApp, or internal phase labels.

Implementation:

- `dashboard/src/data/projectShippingReadiness.js` builds the display-safe
  project shipping readiness view model from the P71.4 shipping readiness
  gate.
- `dashboard/src/data/commandCenterTabs.js` exports
  `PROJECT_SHIPPING_TABS`.
- `dashboard/src/data/commandCenterRoutes.js` wires the shipping route.
- `dashboard/src/pages/CommandCenterV2.jsx` renders the shipping readiness
  page with disabled package/export/shipping controls only.
- `scripts/check-p715-command-center-shipping-ux.js` validates route wiring,
  UX data shape, disabled actions, no private IDs, no DemoApp, no raw JSON
  markers, no primary UX phase labels, and source-level disabled execution
  posture.

### P71.6 Tests / Checkers / Docs

Aggregate P71 validation coverage before final validation.

Status: complete.

### P71.7 Final Validation

Validate and close P71 with package creation and export execution still
disabled.

Status: planned.

## Command Center Requirements

Future P71 UX must preserve System, Dark, and Light themes and show:

- what changed
- shipping state
- export readiness
- next action
- blockers
- disabled reason
- owner agent/capability
- evidence/activity location
- redaction posture
- cost impact

Primary UX must not show raw JSON, raw logs, raw policy dumps, raw evidence,
raw audit, raw activity, raw private project IDs, DemoApp outside demo mode,
internal phase labels outside OS Roadmap, or fake runnable package/export
actions.

## Current Status

P71 is in progress through P71.6. Package creation, export execution, project
mutation, provider dispatch, tool execution, worker execution, DB writes,
deploy execution, release execution, external network calls, and provider
spend remain disabled.
