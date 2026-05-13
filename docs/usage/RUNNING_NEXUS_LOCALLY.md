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
- Unified boot: planned for P41.6.2

## Read-Only Service Foundation (P41.6.1)

P41.6.1 adds read-only service inspection commands:

- `npm run nexus:status`
- `npm run nexus:doctor`

These commands do **not** start or stop services. They only inspect the service manifest and local environment.

### How To Read Status Output

- `described`: the service is part of the current manifest but not managed yet
- `file-backed/read-only`: the persistence layer is active through files, not live DB writes
- `not enabled`: the service is intentionally unavailable in this phase

### What Comes Next

- `nexus:up` is planned for P41.6.2
- service health UI in Command Center is planned for P41.6.3

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
- `nexus:status` fails: check that `nexus.services.json` exists and parses
- `nexus:doctor` fails: verify required scripts exist in `package.json` and that localhost ports are valid

## Notes

- Do not assume provider execution is available.
- Do not assume worker runtime is available.
- Do not assume release/deploy bridges are enabled.
- Unified boot is planned for P41.6.2.
