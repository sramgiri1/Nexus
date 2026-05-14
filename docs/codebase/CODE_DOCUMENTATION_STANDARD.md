# NEXUS Code Documentation Standard

## 1. Purpose

Every new NEXUS module must be understandable by future maintainers, coding
agents, and contributors without relying on oral history or one-off prompts.
The goal is durable understanding: what the module does, what it must never do,
which boundary it belongs to, and which existing modules should be reused
instead of duplicated.

## 2. Required module documentation fields

Every major module family, entry-point file, or checker should document:

- Module name
- Purpose
- Public exports
- Inputs
- Outputs
- Side effects
- Safety boundary
- Allowed writes
- Forbidden writes
- Provider/network/DB behavior
- Related policies
- Related reports
- Related Command Center pages
- Related tests/checkers
- Reuse guidance
- Known limitations

If a field is not applicable, say so explicitly rather than leaving it implied.

## 3. Documentation header template

Use this copy-paste template for a major file or module entry:

```text
Module:
Purpose:
Owner layer:
Used by:
Inputs:
Outputs:
Side effects:
Safety boundary:
Allowed writes:
Forbidden writes:
Provider/network/DB behavior:
Related policies:
Related reports:
Related Command Center pages:
Tests/checkers:
Reuses:
Known limitations:
```

## 4. Module family documentation template

Use this template for folders or closely related file families:

```text
Module family:
Purpose:
Primary files:
Public entry points:
Inputs:
Outputs:
Side effects:
Safety boundary:
Allowed writes:
Forbidden writes:
Provider/network/DB behavior:
Related policies:
Related reports:
Related Command Center pages:
Tests/checkers:
Reuse guidance:
Known limitations:
Status:
```

## 5. Reuse-first rule

Before creating a new helper, search the repo for existing helpers that already
cover the need. Start with:

- policy loading
- report writing
- redaction or safe response shaping
- mode guards
- safe file reads
- runtime snapshot normalization
- checker formatting
- evidence, audit, or activity appenders
- result-envelope helpers

If an existing helper is close but incomplete, prefer extending it in a scoped
phase rather than creating a parallel utility with overlapping behavior.

## 6. Refactor safety rule

Do not refactor high-risk runtime or security paths without a dedicated refactor
subphase and validation plan. This applies especially to:

- orchestrator runtime flows
- local API safety boundaries
- DB access layers
- action-bridge paths
- provider or tool execution boundaries
- write guards and local-state mutation boundaries

Documentation phases can describe these areas, but they should not quietly
restructure them.

## 7. Docs update trigger

Any phase that adds or materially changes module structure must update
`docs/codebase/` and the module registry. If a phase introduces a new public
entry point, checker, report, or operator-facing route, the corresponding code
documentation should be updated in the same phase.

## 8. Examples

### Example: Command Center view model module

- Module name: `dashboard/src/data/commandCenterViewModel.js`
- Purpose: Build the UI-facing Command Center state from snapshots, capability
  metadata, roadmap status, and service-health summaries.
- Public exports: view-model builders and route-facing summary helpers.
- Inputs: snapshot files, capability readiness data, roadmap registry data,
  service-health metadata.
- Outputs: normalized page models for Mission Control and the route set.
- Side effects: read-only; no browser writes beyond normal rendering.
- Safety boundary: must not execute services, providers, DB writes, or private
  project mutation.
- Tests/checkers: `dashboard/tests/routes.spec.js`,
  `scripts/check-command-center-ux.js`.

### Example: Check script module

- Module name: `scripts/check-docs-coverage.js`
- Purpose: Validate required docs exist, key codebase registry sections are
  present, local links resolve, and a report is written.
- Public exports: none; CLI entry script.
- Inputs: repo files under `docs/`, `README.md`, and status registries.
- Outputs: console summary plus `reports/docs-coverage-report.md`.
- Side effects: writes a markdown report only.
- Safety boundary: must stay local, read-only apart from report generation, and
  must not call providers or mutate project files.

### Example: Local API read route

- Module name: `local-api/routes/roadmap.js`
- Purpose: Expose read-only roadmap or status data to local operator surfaces.
- Public exports: route-registration helpers for the local API.
- Inputs: local snapshot files or registry data.
- Outputs: safe local JSON responses.
- Side effects: read-only file access only.
- Safety boundary: must not introduce provider calls, project mutation, or DB
  writes.

### Example: Action bridge module

- Module name: `scripts/mission-action-server.js`
- Purpose: Provide the governed bridge surface used by already approved local
  operator flows.
- Public exports: none; CLI/server entry point.
- Inputs: local-private action requests within approved boundaries.
- Outputs: governed bridge responses and local evidence or audit side effects
  where already permitted.
- Safety boundary: must remain local-private and governed by the related action
  bridge policies.

### Example: DB foundation module

- Module name: `db/dbRepository.js`
- Purpose: Define the durable-state repository layer and its read/write posture.
- Public exports: repository helpers used by DB foundation tooling.
- Inputs: schema, config, and import-mapping metadata.
- Outputs: DB foundation read models and import planning helpers.
- Side effects: phase-dependent; current operator surfaces still treat runtime
  as file-backed and DB writes as disabled by policy.
- Safety boundary: must not quietly enable production DB or runtime-primary
  behavior outside an explicit phase.
