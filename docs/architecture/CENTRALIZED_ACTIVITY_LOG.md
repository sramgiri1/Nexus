# Centralized Activity Log

## Purpose

The centralized activity log is the future NEXUS observability ledger for
operator actions, local service activity, governed action bridge decisions,
policy outcomes, test/check results, evidence references, and recovery events.
P41.8.1 defines the schema and correlation model only.

## P41.8.1 Foundation

P41.8.1 adds:

- an Activity Event Schema under `observability/activitySchema.js`
- a Correlation ID Model under `observability/correlation.js`
- event categories and types under `observability/activityTypes.js`
- redaction-safe payload helpers under `observability/redactionPolicy.js`
- a policy and checker for the schema foundation

P41.8.1 does not instrument runtime paths, start services, add an Activity Log
UI, add an activity API endpoint, write to a DB, call providers, call external
networks, or mutate project source.

## Activity Event Schema

Every event is normalized to schema version `1.0` and includes:

- identity: `activityId`, `correlationId`, `parentActivityId`
- timing: `timestamp`, `durationMs`
- classification: `level`, `category`, `eventType`, `dataClassification`
- scope: `scope`, `mode`, `projectId`, `missionId`, `taskId`, `agentId`
- source and outcome: `source`, `status`, `decision`, `summary`
- links: `evidenceIds`, `auditIds`, `relatedIds`
- safe payload areas: `cost`, `error`, `metadata`

Persisted or shared activity events must be redacted.

## Correlation ID Model

Correlation IDs connect related work across Command Center, local API, action
bridge, future worker, future provider/tool, and checker surfaces.

- `corr_...` identifies the cross-surface trace.
- `act_...` identifies a single activity event.
- `parentActivityId` links child activity to an earlier activity event.
- trace context may carry project, mission, task, agent, scope, and source
  identifiers without exposing raw payloads.

## Redaction Rules

Activity metadata must not contain secrets, raw private source, raw logs, raw
policy dumps, stack traces, API keys, cookies, authorization headers, or large
source snippets. The redaction helper replaces sensitive keys and known secret
patterns with redacted placeholders before validation.

## Event Categories

The initial category model covers:

- `ui`
- `api`
- `action_bridge`
- `agent`
- `task`
- `policy`
- `evidence`
- `tool`
- `provider`
- `worker`
- `test`
- `cost`
- `security`
- `release`
- `recovery`
- `docs`
- `system`

Provider, tool, and worker categories are schema placeholders only in P41.8.1.
They do not enable dispatch or execution.

## Safety Boundary

The P41.8.1 foundation is read/model-only. It permits event construction and
validation in memory, report generation by the checker, and documentation/status
updates. It does not capture live runtime events or write activity records.

## P41.8.2 - Central Activity Logger

P41.8.2 adds the first central activity logger and append-only local activity
store. The logger normalizes activity input through the P41.8.1 schema, applies
redaction before persistence, validates the final event, and then appends one
JSON event per line to `local-state/runtime/activity.jsonl`.

### Logger Module

The logger lives in `observability/activityLogger.js` and provides:

- `createActivityLogger(options)` for scoped logger instances
- `createActivityEvent(input)` for normalized schema-compliant events
- `validateActivityForLogging(event)` for redaction-safe validation
- `logActivity(input, options)` for append-only persistence
- `logActivityDryRun(input, options)` for no-write validation
- `buildActivityLoggerSummary(options)` for store posture summaries

### Activity Store

The activity store lives in `observability/activityStore.js` and provides safe
read/append helpers for `local-state/runtime/activity.jsonl`.

Store rules:

- append-only JSONL
- one event per line
- blank lines ignored on read
- malformed lines reported as warnings, not crashes
- no deletes or in-place mutation helpers
- default path is fixed under `local-state/runtime`
- absolute paths and path traversal are blocked

### Dry-run vs append

Dry-run logging returns the same normalized event shape as append logging but
does not write to `activity.jsonl`. Checkers use dry-run for validation where
possible and snapshot/restore the store when append behavior must be verified.

### Redaction before persistence

The logger sanitizes metadata and error fields before validation and
persistence. Secret-like keys, API-key-like values, authorization/cookie/token
fields, stack traces, and large source-like snippets are redacted before any
event can be appended.

### Correlation lookup

Activity records keep both `activityId` and `correlationId`. The store supports
lookup by activity ID and lookup of all events sharing a correlation ID. P41.8.2
does not add a trace UI; it only establishes the local lookup helpers.

### Not implemented in P41.8.2

- broad runtime instrumentation
- Command Center Activity Log UI
- `/activity` API endpoint
- provider/tool/worker logging
- DB-backed activity storage
- project source mutation

Next phase: P41.8.3 - API / UI / Action Bridge Activity Capture.

## Future Phases

- P41.8.2 - Central Activity Logger
- P41.8.3 - API/UI/Action Bridge Activity Capture
- P41.8.4 - Command Center Activity Log Page
- P41.8.5 - Trace View by Correlation ID
- P41.8.6 - Activity Tests + Docs + Final Validation

Future instrumentation must use the schema, preserve redaction requirements, and
route writes through a dedicated activity logger rather than ad hoc appenders.
