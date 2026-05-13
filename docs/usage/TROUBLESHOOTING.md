# Troubleshooting

## Dashboard Not Loading

- confirm `npm run dashboard` is running
- verify the dashboard port is available
- rebuild with `cd dashboard && npm run build` if needed

## Local API Offline

- run `npm run local-api:start`
- if the API is still offline, Command Center may fall back to snapshot-based data

## Action Bridge Unavailable

- run `npm run mission:action-server`
- review button states in Mission Control, Task Queue, or Agent Workbench for bridge-related disabled reasons

## Missing Service Manifest

- confirm `nexus.services.json` exists at repo root
- run `npm run nexus:doctor`

## Invalid Service Manifest

- run `npm run nexus:status`
- run `npm run nexus:doctor`
- fix malformed JSON or missing required service fields

## Port In Use

- `npm run nexus:doctor` can report a known service port as already in use
- this does not automatically mean failure for current local work, but it may indicate another local process already owns the port

## Missing Package Script

- run `npm run nexus:doctor`
- compare the current `package.json` scripts with the documented commands

## Service Disabled By Design

- some manifest entries are intentionally disabled in P41.6.1
- examples include worker runtime, tool gateway, and MCP gateway
- disabled by design is not the same as broken

## Snapshot Fallback Visible

This means the UI is using generated or file-backed data rather than live local API data. That is expected when the local API is offline or when a page is intentionally read-only.

## DB Writes Disabled

This is expected. Durable State is still file-backed with DB foundation ready, but DB writes remain disabled by policy.

## Worker Runtime Not Enabled

Also expected. Worker runtime is still planned and not part of the current local operator workflow.

## Provider Dispatch Not Enabled

Expected. Governed provider dispatch is still not enabled.

## Known Public Safety False Positive

`npm run check:public-safety` may still fail because of known pre-existing roadmap-doc false positives in `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`. Do not weaken public safety checks to force a pass.
