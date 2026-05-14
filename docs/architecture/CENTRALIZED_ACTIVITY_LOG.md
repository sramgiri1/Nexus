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

## P41.8.2A - Activity Log Readiness UX

P41.8.2A adds a Command Center Activity Log readiness page without adding broad
instrumentation. The page explains that the schema, correlation model, central
logger, and local activity store are ready, while UI/API/action bridge capture
and trace views are still pending.

The Activity Log page uses operator-facing readiness language:

- Activity schema: Ready
- Correlation ID model: Ready
- Central logger: Ready
- Local activity store: Ready
- UI/API/action instrumentation: Not wired yet
- Trace view: Planned

It does not claim provider/tool/worker logging, DB-backed activity, or full
activity UI instrumentation exists. P41.8.3 remains responsible for adding
capture points across the UI, local API, and governed action bridge.

## P41.8.3 - API / UI / Action Bridge Activity Capture

P41.8.3 wires selected capture points into the existing activity logger without
changing provider, worker, tool, DB, or project mutation behavior.

Captured now:

- Local API read requests and failures are captured through redacted activity
  events.
- `GET /activity` exposes a local read-only summary of recent activity records.
- Governed action bridge requests and outcomes are captured for mission compose,
  task activation, human review, and controlled implementation.
- Command Center Activity Log reads summarized records from the local API when
  it is online and shows safe empty-state guidance when it is offline.

The capture helper lives in `observability/activityCapture.js`. It provides
shared helpers for UI intent records, local API records, governed action bridge
records, and failure records. All records still pass through schema validation
and redaction before append.

The `/activity` route returns summarized records only. It does not expose raw
JSONL lines, raw payloads, raw policies, raw logs, secrets, stack traces, or
private project source details.

Still deferred:

- Browser-only UI click persistence without a governed capture endpoint.
- Provider/tool/worker capture.
- DB-backed activity storage.
- Full trace drilldown by correlation ID.

Next phase: P41.8.4 - Command Center Activity Log Page.

## P41.8.4 - Command Center Activity Log Page

P41.8.4 turns the Activity Log from readiness copy into a real operator page.
It remains read-only and uses summarized records from the local `/activity`
endpoint instead of raw JSONL contents.

The page provides:

- status cards for logger readiness, local store readiness, `/activity`
  endpoint readiness, captured categories, and correlation IDs
- tabs for Overview, Timeline, By Agent, By Task, Failures & Blocks, API &
  Actions, and Correlations
- client-side filters for category, status, source/agent, project/scope, and
  free-text search across summary, event type, task, source, and correlation ID
- useful empty states when the store is empty or filters produce no matches
- category/status badges that avoid raw internal dumps

Full trace replay and correlation drilldown remain P41.8.5. Provider, tool,
worker, and DB-backed activity remain disabled.

## P41.8.5 - Trace View by Correlation ID

P41.8.5 adds redacted trace drilldown for correlation-linked activity records.
The trace model lives in `observability/activityTrace.js` and turns activity
events into a safe timeline with status, duration, category counts, related task
IDs, related agents, evidence IDs, and audit IDs.

Activity list versus trace view:

- The Activity Log list shows individual summarized records, filters, and
  grouped views across recent activity.
- The trace view starts from one correlation ID and shows the connected timeline
  for that operator flow.
- `GET /activity/:correlationId` returns a local-only read envelope with
  `trace` and `summary` fields.
- `GET /activity` includes recent correlation summaries and trace counts for the
  Activity Log page.

Trace safety rules:

- Trace view is read-only.
- Trace timeline entries use redacted summaries only.
- Raw JSONL records, raw logs, raw payloads, secrets, stack traces, and private
  project content are not exposed in primary UX.
- Missing timestamps and empty correlation IDs produce safe empty traces rather
  than runtime failures.

Still not wired:

- Provider/tool/worker traces.
- DB-backed activity storage.
- Activity retention policy.
- Telemetry, SLOs, exports, and cross-process trace stitching beyond captured
  local activity records.

Next phase: P41.8.6 - Activity Tests + Docs + Final Validation.

## P41.8.6 - Activity Tests + Docs + Final Validation

P41.8.6 closes the P41.8 activity-log track. It does not add new runtime
instrumentation. It finalizes validation, documentation, reports, and phase
status for the activity schema, central logger, capture helpers, Activity Log
page, and trace view by correlation ID.

Finalized surfaces:

- Activity event schema and correlation ID model from P41.8.1.
- Central logger and local append-only JSONL store from P41.8.2.
- Selected UI/API/action bridge capture helpers from P41.8.3.
- Command Center Activity Log page from P41.8.4.
- Correlation trace helper and read-only trace endpoint from P41.8.5.
- Final observability checker and report for the whole P41.8 track.

The operator-facing Activity Log remains intentionally scoped. It shows
file-backed local records, redacted summaries, tabs, filters, correlation IDs,
trace details, and useful empty states. It does not claim provider/tool/worker
instrumentation, DB-backed activity storage, retention, export, telemetry, or
SLO support.

Non-goals preserved:

- No provider calls.
- No tool or MCP runtime instrumentation.
- No worker runtime instrumentation.
- No DB writes or DB-backed activity storage.
- No production observability stack.
- No private project file mutation.

Next phase: P41.9 - README + Architecture Diagram Registry.

## Future Phases

- P41.8.2 - Central Activity Logger
- P41.8.2A - Docs & Guides Interaction + Activity Log Placeholder Polish
- P41.8.3 - API/UI/Action Bridge Activity Capture
- P41.8.4 - Command Center Activity Log Page
- P41.8.5 - Trace View by Correlation ID
- P41.8.6 - Activity Tests + Docs + Final Validation
- P41.9 - README + Architecture Diagram Registry

Future instrumentation must use the schema, preserve redaction requirements, and
route writes through a dedicated activity logger rather than ad hoc appenders.
