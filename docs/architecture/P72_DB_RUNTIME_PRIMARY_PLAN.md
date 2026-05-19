# P72 DB-backed Runtime Primary

P72 prepares governed DB-backed runtime primary readiness for NEXUS OS. It
does not enable DB writes, migrations, schema mutation, project mutation,
provider dispatch, tool execution, worker execution, deploy execution, release
execution, export execution, package creation, external network calls, or
provider spend.

Contract: `contracts/os-roadmap/p72-execution-contracts.json`

## Boundary

- Scope: NEXUS OS DB runtime readiness only.
- Project source files and project roadmap files remain forbidden.
- DB, Prisma, migration, schema, and environment files remain forbidden.
- DB primary records are preview-only until a later explicit phase enables
  governed DB mutation.
- DB primary state, file-backed fallback state, migration readiness, disabled
  reason, evidence, activity, safety posture, and cost impact must be visible
  before any future DB mutation path is considered.

## Reuse

P72 must reuse existing helpers before adding new ones:

- `shared/resultEnvelope.js`
- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `shared/modeGuard.js`
- `shared/redaction.js`
- `os-roadmap/updatePhaseStatus.js`
- existing Command Center route matrix, tabs, cards, pills, and theme controls
- existing durable state, evidence, audit, activity, and cost preview patterns

## Subphases

### P72.1 Execution Contract + DB Runtime Boundary

Define P72 execution contracts only; no DB writes, migrations, schema
mutation, or runtime storage mutation behavior.

Status: complete. P72.1 adds the implementation-grade P72 subphase contract,
disabled DB write/migration boundary, validation checker, roadmap handoff, and
phase-status records.

### P72.2 DB Runtime Primary Contract

Define display-safe DB runtime primary contract records.

Status: complete. P72.2 adds preview-only `DbRuntimePrimaryContract`
records for NEXUS OS runtime readiness. Each contract includes DB primary
state, file-backed fallback state, migration state, allowed/forbidden files,
disabled execution flags, disabled reason, blockers, evidence/activity
references, cost impact, owner capability, and next action.

Implementation:

- `db-runtime/p72-2-placeholder.js` exports
  `createDbRuntimePrimaryContract`, `validateDbRuntimePrimaryContract`,
  `buildDbRuntimePrimaryContractEnvelope`, `P72_2_REQUIRED_FIELDS`, and
  `P72_2_SAMPLE_CONTRACTS`.
- `scripts/check-p722.js` validates contract shape, DB/project path blocking,
  disabled DB writes/migrations/schema mutation, disabled project mutation,
  disabled provider/tool/worker execution, disabled network/spend,
  disabled deploy/release/export/package execution, hidden private IDs and DB
  URLs, evidence/activity, cost impact, and non-runnable disabled reasons.

### P72.3 Migration Preview

Create DB migration preview records without writing migration or schema files.

Status: complete. P72.3 adds preview-only `DbMigrationPreview` records
derived from P72.2 DB runtime primary contracts. Each preview includes
migration state, migration-file-created status, schema-file-changed status,
affected stores, blocked operations, disabled execution flags, disabled
reason, evidence/activity references, cost impact, owner capability, and next
action.

Implementation:

- `db-runtime/p72-3-placeholder.js` exports `createDbMigrationPreview`,
  `validateDbMigrationPreview`, `buildDbMigrationPreviewEnvelope`,
  `P72_3_REQUIRED_FIELDS`, and `P72_3_SAMPLE_PREVIEWS`.
- `scripts/check-p723.js` validates preview shape, no migration/schema files
  on disk, disabled DB writes/migrations/schema mutation, disabled project
  mutation, disabled provider/tool/worker execution, disabled network/spend,
  disabled deploy/release/export/package execution, affected stores, blocked
  operations, hidden private IDs and DB URLs, evidence/activity, cost impact,
  and non-runnable disabled reasons.

### P72.4 DB Readiness Gate

Add DB readiness gates while keeping DB writes and migrations disabled.

Status: complete. P72.4 adds preview-only `DbReadinessGate` records derived
from P72.2 runtime contracts and P72.3 migration previews. Each gate records
the blocked readiness decision, DB primary state, fallback state, migration
state, preconditions, blocked operations, blockers, disabled reason, safety
posture, evidence/activity references, cost impact, owner capability, and next
action.

Implementation:

- `db-runtime/p72-4-placeholder.js` exports `createDbReadinessGate`,
  `validateDbReadinessGate`, `buildDbReadinessGateEnvelope`,
  `P72_4_REQUIRED_FIELDS`, and `P72_4_SAMPLE_GATES`.
- `scripts/check-p724.js` validates gate shape, blocked readiness, disabled DB
  writes/migrations/schema mutation, disabled project mutation, disabled
  provider/tool/worker execution, disabled network/spend, disabled
  deploy/release/export/package execution, visible preconditions and blocked
  operations, hidden private IDs and DB URLs, evidence/activity, cost impact,
  Command Center visibility, and non-runnable disabled reasons.

### P72.5 Command Center DB Runtime UX

Expose DB runtime readiness without runnable DB actions.

Status: planned.

### P72.6 Tests / Checkers / Docs

Aggregate P72 validation coverage before final validation.

Status: planned.

### P72.7 Final Validation

Validate and close P72 with DB writes and migrations still disabled.

Status: planned.

## Command Center Requirements

Future P72 UX must preserve System, Dark, and Light themes and show:

- what changed
- DB primary state
- fallback state
- migration readiness
- next action
- blockers
- disabled reason
- owner agent/capability
- evidence/activity location
- safety posture
- cost impact

Primary UX must not show raw JSON, raw logs, raw policy dumps, raw DB URLs, raw
private project IDs, DemoApp outside demo mode, internal phase labels outside
OS Roadmap, or fake runnable DB actions.

## Current Status

P72 is in progress through P72.4. DB writes, migrations, schema mutation,
project mutation, provider dispatch, tool execution, worker execution, deploy
execution, release execution, export execution, package creation, external
network calls, and provider spend remain disabled.
