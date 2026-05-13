# Unified NEXUS Local Boot

## Purpose

P41.6.2 adds one-command local boot and shutdown for the current NEXUS operator surface.

## Why One-Command Boot Exists

By the end of P41.6.1, the repo had a service manifest plus read-only status and doctor commands, but operators still had to remember separate start commands. P41.6.2 adds managed local boot and shutdown on top of that manifest.

## Service Manifest Model

`nexus.services.json` is the declarative source of truth for:

- which services exist
- which are enabled now
- which are required
- which ports and hosts they use
- which commands may be started by NEXUS
- which services remain disabled by design

Only manifest-declared enabled services may be started.

## `nexus:up` Behavior

`npm run nexus:up`:

- requires local-private mode
- validates the manifest
- validates localhost-only bindings
- checks ports and current health
- starts enabled services in `startOrder`
- writes managed PID/state under `local-state/runtime/services/`
- writes per-service logs under `local-state/runtime/services/logs/`

`npm run nexus:up -- --dry-run` prints the boot plan without starting anything.

## `nexus:down` Behavior

`npm run nexus:down`:

- reads managed service state
- stops only NEXUS-managed PIDs
- uses `SIGTERM` first
- escalates to `SIGKILL` only for still-running managed processes after timeout
- updates service state after shutdown

Unmanaged processes are never killed by this command.

## `nexus:status` Behavior

`npm run nexus:status` summarizes:

- manifest services
- managed PID state
- port status
- health URL state where applicable
- current Command Center / Local API / Action Bridge URLs
- disabled placeholders

## `nexus:doctor` Behavior

`npm run nexus:doctor` performs read-only local diagnostics for:

- Node runtime
- package scripts
- dashboard package presence
- service manifest validity
- localhost-only bindings
- service state path accessibility
- known port posture
- DB-write-disabled posture
- provider-call-disabled posture

## Local-Only Boundary

All managed services stay on:

- `127.0.0.1`

No service defaults to `0.0.0.0`. No provider calls or external network calls are introduced by the boot manager.

## Disabled Future Services

These stay disabled in P41.6.2:

- workers
- mcp-gateway
- provider-gateway

They are represented in the manifest for future orchestration, but `nexus:up` must skip them.

## DB Posture

- Durable State remains file-backed
- DB writes remain disabled by policy
- runtime DB primary is still not enabled

## Troubleshooting

- If `nexus:up` fails, run `npm run nexus:doctor`
- If a required port is already in use, inspect the existing local process before retrying
- If `nexus:down` skips a process, it was not started by NEXUS

## P41.6.3 — Command Center Service Health UX

P41.6.3 adds a read-only Command Center Service Health route so operators can see what the local boot system is responsible for without executing service commands from the browser.

### Purpose

- expose the current local service model in product-grade UI
- distinguish online, offline, disabled, not enabled, planned, and unknown states
- connect `nexus:up`, `nexus:down`, `nexus:status`, and `nexus:doctor` to clear operator guidance

### Service Cards

The Service Health page summarizes:

- Command Center
- Live Local API
- Governed Action Bridge
- Durable State Foundation
- Worker Runtime
- MCP / Tool Gateway
- Provider Dispatch
- Batch Jobs

Each card shows purpose, requirement level, configured port, health URL where relevant, current state, operator guidance, and a safety note.

### Operator Guidance

The page shows copy-only command guidance for:

- `npm run nexus:up`
- `npm run nexus:down`
- `npm run nexus:status`
- `npm run nexus:doctor`

UI execution is intentionally disabled in this phase. Operators must run those commands in a local terminal until a later governed action path exists.

### Planned vs Offline vs Disabled

- `Online` and `Offline` are used only when the current service state can be determined from existing status data or safe live checks.
- `Not enabled` is used for intentionally unavailable future services.
- `Planned` is used for future placeholders that should not be mistaken for runtime failures.
- `Disabled by policy` is used for Durable State posture where DB writes remain off and file-backed fallback remains active.

### Localhost-Only Safety

Service Health reinforces the P41.6 local boot boundary:

- localhost-only bindings
- no provider calls
- no external network
- DB writes disabled
- no project mutation from the UI

## Next Subphase

P41.6.4 adds the NEXUS command palette plus simple operator actions.
