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

## Future Phases

- P41.8.2 - Central Activity Logger
- P41.8.3 - API/UI/Action Bridge Activity Capture
- P41.8.4 - Command Center Activity Log Page
- P41.8.5 - Trace View by Correlation ID
- P41.8.6 - Activity Tests + Docs + Final Validation

Future instrumentation must use the schema, preserve redaction requirements, and
route writes through a dedicated activity logger rather than ad hoc appenders.
