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
repositories still use file-backed reads until a later P92 subphase wires
selected reads and governed writes to SQLite.

## Next Subphases

- P92.2 SQLite repository reads for selected runtime entities.
- P92.3 governed SQLite writes for activity/evidence/audit only.
- P92.4 Command Center DB live state UX.
- P92.5 migration and backup checks.
- P92.6 docs/roadmap closure.
- P92.7 final validation.
