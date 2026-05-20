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

## Next Subphases

- P92.4 Governed SQLite writes for activity, evidence, and audit records.
- P92.5 Command Center DB live state UX.
- P92.6 migration, backup, docs, and roadmap closure.
- P92.7 final validation.
