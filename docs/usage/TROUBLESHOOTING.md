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

## Service Health Shows `Unknown`

- run `npm run nexus:status`
- rerun `npm run nexus:doctor`
- refresh `/command-center/services`

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
