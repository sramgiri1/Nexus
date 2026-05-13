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
