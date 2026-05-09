# Live Local API Backend — P40-LOCAL

## Purpose

P40 moves Command Center from generated/static snapshots toward live local API-driven data. It introduces a local-only HTTP server that reads existing JSON/JSONL/report artifacts and exposes them through a safe response layer. Command Center fetches from this API when available and falls back gracefully to generated snapshots when offline.

## Why P40 Follows First Controlled Implementation

P39 proved the end-to-end governed write path: propose → apply → evidence → audit → runtime records. P40 closes the read loop — the operator can now see those records live in Command Center without restarting the dashboard or regenerating snapshots.

## Current Problem with Generated Snapshots

Before P40, Command Center read from static JavaScript modules (`privateValidationSnapshot.js`, `actionBridgeSnapshot.js`, `runtimeSnapshot.js`). These are generated at check time and stale by the time the dashboard runs. Evidence records, audit trails, and task state changes were invisible until a new snapshot was generated and the dashboard rebuilt.

## Local-Only API Boundary

The API binds to `127.0.0.1` only (port 4321). It is not accessible from external hosts, it makes no outbound network calls, it connects to no database, and it calls no providers. All data is read from existing local files through the `local-state/safeFileReader.js` boundary.

```
Browser (localhost:517x) → fetch → Local API (127.0.0.1:4321) → local-state/* → JSON/JSONL files
```

## Read Endpoints

| Endpoint | Returns |
|---|---|
| `GET /health` | Service name, phase, API version, safety flags |
| `GET /status` | Mode, active project/mission, backend validation, runtime health |
| `GET /missions` | Mission contract summary, task plan summary |
| `GET /tasks` | Planned + runtime tasks, counts by state |
| `GET /tasks/:id` | Task detail, evidence, audit events |
| `GET /agents` | Agents from task plan, planned/runtime task counts |
| `GET /evidence` | Evidence ledger counts, by-type/by-result, recent records |
| `GET /audit` | Audit trail counts, by-event-type, recent events |
| `GET /runtime` | Runtime file health, counts, recent events |
| `GET /contracts` | Mission contract + task plan summaries |
| `GET /projects` | Active project summary, backend validation status |
| `GET /roadmap` | NEXUS OS phases P34–P45, current/next phase markers |
| `GET /actions` | Mission/task/review/implementation action records |

## Action Endpoints

Action endpoints are **not** implemented directly in the local API. All writes go through the existing governed bridges on port 3748 (mission action server). The local API client delegates action calls to that server. This preserves the governance chain established in P34–P39.

Bridges used:
- `mission-actions/missionActionBridge.js` — mission composition
- `task-actions/taskActivationBridge.js` — task activation
- `workbench/reviewBridge.js` — review decisions
- `implementation-actions/implementationBridge.js` — controlled implementation

## Why Action Endpoints Must Reuse Governed Bridges

Allowing the local API to write files directly would bypass the governance chain (evidence recording, audit events, runtime state transitions, safety guards). All writes must flow through bridges that enforce mode checks, path guards, and evidence creation.

## No DB Yet

P40 reads from JSON/JSONL files in `local-state/runtime/`. P41 will introduce a DB-backed store with durable state. The response layer includes `dbBacked: false` in every envelope to make this explicit.

## No Providers / Network

The local API never calls Anthropic, OpenAI, or any other provider. It never makes outbound HTTP requests. `providerCallsEnabled: false` and `externalNetworkEnabled: false` are in every response envelope.

## No Arbitrary File Reads

All reads go through `local-state/safeFileReader.js` which enforces `ALLOWED_SOURCE_DIRS` and blocks `BLOCKED_SOURCE_DIRS` (including `projects/`, `.env`, `.git`, `node_modules`). No raw source content is extracted.

## Redaction / Safe Response Model

Every response is wrapped in a standard envelope:

```json
{
  "ok": true,
  "source": "live-local-api",
  "mode": "local-private",
  "generatedAt": "...",
  "apiVersion": "1.0",
  "dbBacked": false,
  "providerCallsEnabled": false,
  "externalNetworkEnabled": false,
  "data": { ... },
  "warnings": [],
  "errors": []
}
```

The `redactApiPayload()` function strips secret-like values and private project name patterns before any data leaves the server. Stack traces are never included in error responses.

## Command Center Live API / Fallback Behavior

When the local API is online:
- TopBar shows "Local API: Online" with a green indicator
- Mission Control shows a "Live local API" source badge
- Evidence Ledger reads from `GET /evidence`
- Task Queue reads from `GET /tasks`
- Projects page reads from `GET /projects`

When offline:
- TopBar shows "Local API: Offline · snapshot fallback" with an amber indicator
- All pages fall back to generated snapshot modules
- A "Retry connection" button triggers a fresh health check
- Live API Status page (`/command-center/liveapi`) shows which pages are live-backed vs fallback

## Starting the Server

```bash
NEXUS_MODE=local-private npm run local-api:start
```

The server logs startup confirmation and the active mode. It handles `SIGINT`/`SIGTERM` for clean shutdown.

## Files

| File | Purpose |
|---|---|
| `local-api/server.js` | HTTP server, route dispatch, lifecycle |
| `local-api/safeResponse.js` | Envelope, redaction, error handling |
| `local-api/routes/health.js` | GET /health |
| `local-api/routes/status.js` | GET /status |
| `local-api/routes/missions.js` | GET /missions |
| `local-api/routes/tasks.js` | GET /tasks, GET /tasks/:id |
| `local-api/routes/agents.js` | GET /agents |
| `local-api/routes/evidence.js` | GET /evidence |
| `local-api/routes/audit.js` | GET /audit |
| `local-api/routes/runtime.js` | GET /runtime |
| `local-api/routes/contracts.js` | GET /contracts |
| `local-api/routes/projects.js` | GET /projects |
| `local-api/routes/roadmap.js` | GET /roadmap |
| `local-api/routes/actions.js` | GET /actions, GET /actions/:id |
| `local-api/index.js` | Re-exports all public functions |
| `policy/live-local-api-policy.json` | P40 policy boundary |
| `scripts/start-local-api.js` | Server entry point |
| `scripts/check-live-local-api.js` | 14-section validator (147 checks) |
| `dashboard/src/api/localApiClient.js` | Browser fetch-only client with fallback |

## Next Phase: DB Foundation + Durable State (P41)

P41 will replace JSON/JSONL file reads with a DB-backed store. Evidence, audit, tasks, and events will be written to and read from a local database. The local API endpoints will remain the same — P41 swaps the data layer without changing the API surface.
