# Running NEXUS Locally

## Current Local Run Model

NEXUS currently runs as a set of local services and validation scripts. There is no unified local boot yet.

## Available Commands

From `package.json`:

- Dashboard: `npm run dashboard`
- Local API: `npm run local-api:start`
- Mission action bridge: `npm run mission:action-server`
- Screenshot audit: `npm run command-center:screenshot-audit`

You can also inspect `package.json` directly for the latest supported commands.

## Current Service Posture

- Dashboard: available
- Local API: available as a local read layer
- Action bridge: available for governed action flows
- DB foundation: read-only, file-backed foundation only
- Unified boot: planned for P41.6

## Durable State Status

- Current persistence: file-backed
- DB foundation: ready
- DB writes: disabled by policy
- Runtime DB primary: not enabled

## If a Service Is Offline

- Dashboard offline: run `npm run dashboard`
- Local API offline: run `npm run local-api:start`
- Action bridge unavailable: run `npm run mission:action-server`
- Snapshot fallback visible: the UI is using generated/browser-safe fallback data instead of live reads

## Notes

- Do not assume provider execution is available.
- Do not assume worker runtime is available.
- Do not assume release/deploy bridges are enabled.
- Unified boot is planned for P41.6.
