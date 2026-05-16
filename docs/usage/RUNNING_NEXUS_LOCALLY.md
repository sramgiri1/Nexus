# Running NEXUS Locally

## Current Local Run Model

NEXUS runs as a localhost-only operator surface with a small set of governed
local services plus read-only inspection commands.

Through P41.6.5, the operator path is:

- use `npm run nexus:doctor` to confirm local prerequisites
- use `npm run nexus:status` to inspect the current service snapshot
- use `npm run nexus:up` to start enabled manifest services
- use `npm run nexus:down` to stop only NEXUS-managed services
- use `/command-center/services` to review service posture in Command Center

The UI can still fall back to snapshot/file-backed data when the local API is
offline.

Historical note: "Unified boot is planned for P41.6" was the operator
limitation before `nexus:up` and `nexus:down` landed. Unified boot is now
available, but earlier phase docs and reports may still reference that old
limitation.

## Available Commands

From `package.json`:

- Dashboard only: `npm run dashboard`
- Local API only: `npm run local-api:start`
- Mission action bridge only: `npm run mission:action-server`
- Unified boot: `npm run nexus:up`
- Unified shutdown: `npm run nexus:down`
- Unified status: `npm run nexus:status`
- Unified doctor: `npm run nexus:doctor`

If you are unsure whether a command exists in the current repo state, inspect
`package.json` directly.

## What `nexus:up` Starts

`npm run nexus:up` starts only enabled services declared in
`nexus.services.json`.

Current required enabled services:

- Command Center dashboard
- Live Local API
- Governed Action Bridge

Current disabled or not-enabled services:

- Durable State DB runtime primary
- Worker Runtime
- MCP / Tool Gateway
- Provider Dispatch gateway

Those disabled services are represented in the manifest so operators can tell
the difference between planned capability and runtime failure.

## Expected URLs

- Command Center dashboard: `http://127.0.0.1:5173/`
- Live Local API health: `http://127.0.0.1:4321/health`
- Governed Action Bridge health: `http://127.0.0.1:3748/health`

All managed services stay on `127.0.0.1`. No NEXUS local boot command should
bind to `0.0.0.0`.

## Runtime State and PID Tracking

NEXUS-managed service state is stored under:

- `local-state/runtime/services/service-state.json`

Per-service logs are written under:

- `local-state/runtime/services/logs/`

Use these files for local inspection only. They are runtime artifacts, not
public-facing reports.

## Service Health Page

Open:

- `/command-center/services`

The Service Health route explains:

- what each local service does
- whether it is online, offline, disabled, planned, or unknown
- which command to run in a terminal
- whether the UI is using manifest data, service-state artifacts, or fallback
  status
- current doctor findings and common troubleshooting guidance

The page is read-only. Browser-side execution of `nexus:up`, `nexus:down`,
`nexus:status`, and `nexus:doctor` is not enabled yet.

## How This Relates To Command Center Tabs

- Service Health explains local boot and service state.
- Live API shows endpoint and bridge readiness.
- Durable State explains file-backed persistence and DB write policy.
- Safety Center summarizes provider, network, DB write, and mutation boundaries.
- Projects shows project progress and start-project guidance.
- OS Roadmap shows NEXUS OS phase progress only.

If the local API is offline, Command Center may still show snapshot or
file-backed fallback data. That is an intentional degraded mode, not automatic
evidence of corruption.

## Command Palette and Service Health

The Command Palette uses current service and capability posture to explain why
commands are available or disabled.

Examples:

- if the Action Bridge is offline, governed action commands explain that the
  bridge is required
- if the local API is offline, read-first routes can still explain snapshot
  fallback
- if runtime locks, release actions, or provider dispatch are not enabled, the
  palette shows the missing capability instead of pretending to execute

## Worker Runtime Preview

P60 adds a Worker Runtime preview page at `/command-center/workers`.

The page shows queue, lease, heartbeat, retry/timeout, and dead-letter models
for future background execution. It is intentionally preview-only:

- no worker loop starts
- no agents execute
- no tools, MCP adapters, or providers run
- no project files are mutated
- no DB writes occur

Use `npm run check:worker-runtime` to validate the worker runtime model and
`npm run worker-runtime:status` to write
`reports/worker-runtime-status.json`.

## How To Read Status Output

- `running, managed PID ...`: started by NEXUS and tracked in the service-state
  file
- `running, external/unmanaged`: already running outside NEXUS management;
  `nexus:down` will not stop it
- `file-backed/read-only`: Durable State fallback is active, but DB writes stay
  disabled
- `not enabled`: intentionally unavailable in this phase
- `planned`: future capability placeholder, not a runtime failure
- `unknown`: run `npm run nexus:status` again or inspect Service Health for the
  latest snapshot

## Recovery When Ports Are Busy

If `nexus:doctor` or `nexus:status` reports a required port in use:

1. check whether an existing healthy local NEXUS process already owns the port
2. if it is a healthy unmanaged process, either keep using it or stop it
   manually before retrying `nexus:up`
3. if it is an unhealthy or stale process, stop it before retrying
4. rerun `npm run nexus:doctor`
5. rerun `npm run nexus:up`

## Recovery When a Service Fails to Start

- run `npm run nexus:doctor`
- inspect `local-state/runtime/services/service-state.json`
- inspect the relevant file under `local-state/runtime/services/logs/`
- confirm the service command still exists in `package.json`
- confirm the service host remains `127.0.0.1`
- use the Service Health page to see whether Command Center is reading a live
  state, a stale state, or fallback data

## Current Limitations

- local API may be offline and the UI may use snapshot/file-backed fallback
- browser-side service execution is still disabled
- worker runtime, provider dispatch, and release execution are not enabled
- DB writes remain disabled by policy
- `check:public-safety` may still fail because of known pre-existing
  roadmap-doc false positives unless they are explicitly resolved in a later
  phase
