# Troubleshooting

## Dashboard Not Loading

- confirm `npm run dashboard` is running, or run `npm run nexus:up`
- verify port `5173` is free or already owned by a healthy local NEXUS process
- rebuild with `cd dashboard && npm run build` if needed
- open `/command-center/services` once the dashboard is up to confirm current
  service posture

## Local API Offline

- run `npm run nexus:status`
- run `npm run nexus:doctor`
- start the API with `npm run local-api:start` or `npm run nexus:up`
- if the API remains offline, Command Center may fall back to snapshot-based or
  file-backed data

## Action Bridge Unavailable

- run `npm run nexus:doctor`
- start the bridge with `npm run mission:action-server` or `npm run nexus:up`
- review disabled reasons in Mission Control, Task Queue, Agent Workbench, or
  Command Palette for bridge-related requirements

## `nexus:up` Fails

- rerun `npm run nexus:doctor`
- inspect `local-state/runtime/services/service-state.json`
- inspect the service log under `local-state/runtime/services/logs/`
- confirm the required port is not already held by an unhealthy process
- confirm the service command in `nexus.services.json` still matches a real
  local script

## `nexus:down` Stops Nothing

This usually means the processes were not started by NEXUS.

- run `npm run nexus:status`
- look for `external/unmanaged`
- stop those processes manually if needed

## Missing Service Manifest

- confirm `nexus.services.json` exists at repo root
- run `npm run nexus:doctor`
- do not invent an ad-hoc manifest; fix the checked-in file instead

## Invalid Service Manifest

- run `npm run nexus:status`
- run `npm run nexus:doctor`
- fix malformed JSON or missing required service fields
- confirm enabled services still bind to `127.0.0.1`

## Port In Use

- `npm run nexus:doctor` can report a required port as already in use
- this is not always a failure; it may mean a healthy unmanaged local service
  is already running
- if the process is stale or unhealthy, stop it manually and retry `nexus:up`

## Missing Package Script

- run `npm run nexus:doctor`
- compare the current `package.json` scripts with the documented commands
- use `npm run dashboard`, `npm run local-api:start`, and
  `npm run mission:action-server` directly if you are working around unified
  boot issues

## Service Disabled By Design

Some service entries are intentionally disabled in the current phase.

Examples:

- Worker Runtime
- MCP / Tool Gateway
- Provider Dispatch

Disabled by design is not the same as broken.

## Snapshot Fallback Visible

This means the UI is using generated or file-backed data rather than live local
API data. That is expected when the local API is offline or when a page is
intentionally read-only.

## No Project Selected

If Workspace, Task Queue, Agent Workbench, Implementation, Evidence, or Projects shows a no-project state:

1. create, import, or select a project
2. add a project profile
3. define stack and test commands
4. create a mission
5. generate a plan
6. activate the first task

Do not expect DemoApp to appear in local-private mode. DemoApp is demo mode only.

## Tabs Missing Or Not Switching

- refresh the page and retry the tab
- run `cd dashboard && npm run test:pages` if validating locally
- confirm the route is implemented, not a planned Coming Soon route
- use the first tab as the safe overview if a drilldown tab has no data yet

## Service Health Shows `Unknown`

- run `npm run nexus:status`
- rerun `npm run nexus:doctor`
- refresh `/command-center/services`

## Activity Log Has No Records

- confirm the local API is running with `npm run nexus:status`
- open `/command-center/activity`
- run a governed local action or local API read to create a captured activity
  event
- remember that provider/tool/worker traces are not enabled yet
- if the page shows snapshot fallback, the local API is offline or unavailable

Activity is local and file-backed in P41.8. It is stored under
`local-state/runtime/activity.jsonl` and displayed as redacted summaries.

## Trace Details Shows No Events

- copy the correlation ID and search the Activity Log for it
- clear filters that may hide matching records
- check whether the event was captured before P41.8.5 trace support
- use Timeline first if you are unsure which correlation ID to inspect

The trace view is intentionally read-only. It does not expose raw JSONL rows,
raw logs, raw payloads, secrets, stack traces, or private project source.

## DB Writes Disabled

This is expected. Durable State is still file-backed with DB foundation ready,
but DB writes remain disabled by policy.

## Worker Runtime Not Enabled

Also expected. Worker runtime is still planned and not part of the current
local operator workflow.

## Provider Dispatch Not Enabled

Expected. Governed provider dispatch is still not enabled.

## Known Public Safety False Positive

`npm run check:public-safety` may still fail because of known pre-existing
roadmap-doc false positives in `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.
Do not weaken public safety checks to force a pass.
