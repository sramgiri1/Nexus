# DB Foundation and Durable State — P41-LOCAL

## Purpose

P41 introduces the schema foundation for NEXUS durable state. DB writes remain disabled. File-backed fallback continues as the source of truth. P41 establishes the entity model, health layer, file-to-entity mapping, and seed preview that P42 will use to enable live DB writes.

## Why P41 Follows Live Local API

P40 proved the live read loop: Command Center can fetch real task, evidence, and audit data from the local API in real time. P41 adds the data model foundation so that P42 can swap the file-backed source for a DB-backed one without changing the API surface or the browser client.

## What P41 Is Not

P41 does NOT:
- Connect to any database
- Run any migrations
- Write any entity records to a DB
- Change the local API response structure
- Require any additional setup from the operator

## DB Mode: Disabled

`db/dbConfig.js` reads `NEXUS_DB_MODE` from the environment. Any value other than `file-backed` resolves to `disabled`. In P41, DB mode is always `disabled`.

```
NEXUS_DB_MODE=disabled  (default)
NEXUS_DB_MODE=file-backed  (reads from JSON/JSONL — still no DB)
```

## Entity Model

18 entities are defined in `db/schema.json` and `db/schema.sql`. Each entity has:

- `name` — table/collection name
- `primaryKey` — unique identifier field
- `fields` — typed field map
- `requiredFields` — non-nullable fields
- `indexes` — recommended query indexes
- `sourceMapping` — existing files this entity maps to
- `piiRisk` — low or none
- `retentionClass` — governs how long records should be kept
- `redactionRequired` — whether API responses must redact this entity
- `fileFallbackSource` — the primary file source for P41 reads

## Module Architecture

```
db/
├── schema.json          ← Entity definitions, P41-LOCAL, dbWritesEnabled: false
├── schema.sql           ← Portable SQL artifact (not executed in P41)
├── dbConfig.js          ← Mode loader + validator
├── dbHealth.js          ← Health, readiness, status summary
├── dbRepository.js      ← File-backed reads for all entities; writeNotSupportedYet
├── dbImportPlan.js      ← Dry-run file-to-entity mapping, import plan builder
├── dbSnapshotMapper.js  ← Entity shape mapping, seed preview, foundation status report
└── index.js             ← Re-exports all public functions
```

## Local API /db Endpoint

`GET /db` returns:
- `dbBacked: false` — always in P41
- `mode` — current DB mode (disabled or file-backed)
- `fallback: "file-backed"` — active fallback
- `schemaDefined: true`, `schemaVersion: "1.0"`, `entityCount: 18`
- `dbWritesEnabled: false`
- `fileFallbackRequired: true`
- `importPlan` — source availability summary
- `entities` — entity name, purpose, primaryKey, fieldCount, piiRisk, retentionClass, fileFallbackSource

## Command Center Integration

The Durable State page (`/command-center/database`) shows:
- Policy boundary from `db-foundation-policy.json`
- Import plan: how many of the 18 entity sources are available
- Entity registry table (live from `/db` if API is online, schema.json fallback)
- Next phase action: what P42 will do

The TopBar shows a `DB: file-backed · P41` persistence badge.

The Safety Center shows a "DB Foundation Boundary · P41-LOCAL" section documenting that writes are disabled and file fallback is required.

## Policy Boundary

`policy/db-foundation-policy.json`:
- `dbWritesEnabled: false`
- `productionDbAllowed: false`
- `externalDbAllowed: false`
- `fileFallbackRequired: true`
- `schemaArtifactsAllowed: true`
- `dryRunMappingAllowed: true`
- `nextPhase: "P42-LOCAL"`

## File Source Availability (P41)

17 of 18 entity sources are available on a fresh local clone. The one typically absent is `local-state/runtime/reviews.jsonl` — it is created the first time a review action is submitted through the Agent Workbench.

## Next Phase: P42-LOCAL

P42 will:
1. Enable `dbWritesEnabled: true` in `db/dbConfig.js`
2. Run entity migrations from file-backed sources to a local SQLite or embedded DB
3. Switch local API routes from `dbRepository.js` (file reads) to live DB queries
4. Keep the API surface identical — no changes to the browser client

## Files

| File | Purpose |
|---|---|
| `db/schema.json` | Entity definitions, 18 entities |
| `db/schema.sql` | Portable SQL schema artifact |
| `db/dbConfig.js` | Mode loading and validation |
| `db/dbHealth.js` | Health and readiness checks |
| `db/dbRepository.js` | File-backed entity reads |
| `db/dbImportPlan.js` | Import plan builder and validator |
| `db/dbSnapshotMapper.js` | Snapshot-to-entity mapper |
| `db/index.js` | Re-exports |
| `policy/db-foundation-policy.json` | P41 boundary policy |
| `local-api/routes/db.js` | GET /db route handler |
| `scripts/db-foundation-status.js` | Status printer and report writer |
| `scripts/check-db-foundation.js` | 13-section validator |
| `reports/db-foundation-status.json` | Generated entity mapping status |
| `reports/db-import-plan.json` | Generated import plan |
