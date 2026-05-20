# P92 Local SQLite Runtime

P92 starts the DB implementation lane for NEXUS OS. It uses local SQLite as the
first real durable runtime database because it is available on the operator
machine, requires no hosted service, and keeps provider spend at zero.

P92 does not enable hosted DBs, production DBs, provider/model calls, agent
dispatch, tool execution, worker execution, project creation, project mutation,
deploy, release, export, package creation, network calls, or provider spend.

## P92.1 Local SQLite Runtime Foundation

P92.1 is complete. It adds a guarded SQLite runtime module that can transform
the existing SQL schema into SQLite-compatible SQL and initialize a local DB
file under `local-state/runtime` only.

Default behavior remains non-writing:

- `NEXUS_DB_MODE=disabled` remains the default.
- `NEXUS_DB_MODE=file-backed` remains read-only JSON/JSONL fallback.
- SQLite writes require both `NEXUS_DB_MODE=sqlite-live` and
  `NEXUS_DB_ENABLE_WRITES=1`.

Operator commands:

- `npm run db:init:sqlite`
- `NEXUS_DB_MODE=sqlite-live NEXUS_DB_ENABLE_WRITES=1 npm run db:init:sqlite -- --apply --reset`
- `npm run check:p921-sqlite-runtime-foundation`
- `npm run check:db-foundation`

Known limitation: P92.1 initializes the local SQLite DB only. Runtime
repositories still use file-backed reads until later P92 subphases wire CRUD to
runtime routes and Command Center state.

## P92.2 SQLite CRUD Repository Core

P92.2 is complete. It adds `db/sqliteCrudRepository.js`, a schema-driven CRUD
repository over the 18 NEXUS OS entities defined in `db/schema.json`.

The repository:

- allowlists entity names and fields from `db/schema.json`;
- maps JavaScript camelCase fields to SQLite snake_case columns;
- stores array/object fields as JSON text and restores array fields on reads;
- supports insert, get, list, update, and delete against local SQLite;
- rejects unknown entities, unknown fields, and raw SQL-shaped entity names;
- requires `NEXUS_DB_MODE=sqlite-live` for reads;
- requires both `NEXUS_DB_MODE=sqlite-live` and `NEXUS_DB_ENABLE_WRITES=1` for
  writes.

P92.2 does not wire Command Center routes or runtime stores to SQLite yet. It
only creates the reusable CRUD layer and validates it with a temporary local DB.

Validation:

- `npm run check:p922-sqlite-crud-repository`
- `npm run check:p921-sqlite-runtime-foundation`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

## P92.3 SQLite Runtime Read Wiring

P92.3 is complete. It wires `db/dbRepository.js` read paths to the local SQLite
CRUD layer when SQLite is explicitly live and initialized. If the DB is disabled,
missing, or unavailable, the repository falls back to the existing file-backed
readers.

SQLite-backed read paths:

- projects
- missions
- mission tasks and runtime tasks
- agents
- evidence
- audit events
- runtime events
- contracts
- roadmap phases
- actions

Repository writes remain blocked through `writeNotSupportedYet`. P92.3 does not
enable provider/model calls, agent dispatch, project mutation, hosted DBs,
deploy, release, export, package creation, network calls, or provider spend.

Validation:

- `npm run check:p923-sqlite-runtime-read-wiring`
- `npm run check:p922-sqlite-crud-repository`
- `npm run check:p921-sqlite-runtime-foundation`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

## P92.4 Governed SQLite Runtime Writes

P92.4 is complete. It adds `db/sqliteRuntimeWrites.js` and wires the existing
governed append paths to local SQLite after their current file-backed validation
and append behavior succeeds.

SQLite write scope is intentionally narrow:

- evidence records map to `evidence`;
- audit records map to `audit_events`;
- activity records map to `runtime_events`.

Writes require both `NEXUS_DB_MODE=sqlite-live` and
`NEXUS_DB_ENABLE_WRITES=1`. If SQLite writes are disabled, the existing JSONL
append remains the source of truth and the SQLite bridge reports a disabled
write result instead of mutating the DB.

P92.4 does not enable broader entity mutation, provider/model calls, agent
dispatch, project mutation, hosted DBs, deploy, release, export, package
creation, network calls, or provider spend.

Validation:

- `npm run check:p924-governed-sqlite-runtime-writes`
- `npm run check:p923-sqlite-runtime-read-wiring`
- `npm run check:p922-sqlite-crud-repository`
- `npm run check:p921-sqlite-runtime-foundation`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

## P92.5 Command Center DB Live State UX

P92.5 is complete. The Durable State `DB Runtime` tab now shows display-safe
local SQLite live state:

- local SQLite readiness;
- repository read wiring;
- governed evidence/audit/activity ledger write scope;
- file-backed fallback state;
- blocked hosted DB, general mutation, project mutation, provider/tool,
  deploy, export, package, release, network, and spend actions;
- owner capability;
- next action;
- evidence report locations;
- cost impact.

The UX remains informational only. It exposes no DB toggles, migration buttons,
hosted DB setup, raw DB paths, raw DB URLs, raw logs, raw JSON, private IDs, or
DemoApp.

Validation:

- `npm run check:p925-command-center-db-live-state-ux`
- `cd dashboard && npm run build`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "DB live state"`
- `npm run check:p924-governed-sqlite-runtime-writes`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- browser verification on `/command-center/database`

## P92.6 SQLite Maintenance Closure

P92.6 is complete. It adds local-only SQLite backup maintenance:

- `db/sqliteMaintenance.js`
- `npm run db:backup:sqlite`
- `npm run check:p926-sqlite-maintenance-closure`

Backup behavior:

- dry-run by default;
- `--apply` or `NEXUS_SQLITE_BACKUP_APPLY=1` is required to create a backup;
- backup files are constrained to `local-state/runtime/backups`;
- backup path traversal is rejected;
- hosted DBs, production DBs, provider calls, project mutation, deploy, release,
  export, package creation, network calls, and spend remain blocked.

Validation:

- `npm run check:p926-sqlite-maintenance-closure`
- `npm run check:p925-command-center-db-live-state-ux`
- `npm run check:p924-governed-sqlite-runtime-writes`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

## P92.7 Final Validation

P92.7 is complete when final validation passes and OS phase status is stamped
with real commits. The final checker confirms:

- P92.1-P92.6 reports exist;
- P92 package scripts are registered;
- SQLite runtime, CRUD, write, and maintenance exports are available;
- Command Center DB live-state UX is present;
- docs and contracts cover all P92 subphases;
- no stale `pending-final-commit` remains in completed P92 entries;
- hosted DBs, production DBs, provider calls, project mutation, deploy, package,
  export, network calls, and provider spend remain blocked.

Validation:

- `npm run check:p927-sqlite-final-validation`
- all P92.1-P92.6 checkers
- `cd dashboard && npm run build`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "DB live state"`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

## Next Phase

- P93 is planned for the next NEXUS OS DB/live-runtime expansion.
