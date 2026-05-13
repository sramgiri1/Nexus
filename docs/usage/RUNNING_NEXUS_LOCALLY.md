# Running NEXUS Locally

## Current Local Run Model

NEXUS currently runs as a set of local services and validation scripts. P41.6.2 adds one-command local boot and shutdown for the current enabled service set, and P41.6.3 adds a Command Center Service Health page for read-only operator visibility.

## Available Commands

From `package.json`:

- Dashboard: `npm run dashboard`
- Local API: `npm run local-api:start`
- Mission action bridge: `npm run mission:action-server`
- Unified boot: `npm run nexus:up`
- Unified shutdown: `npm run nexus:down`
- Unified status: `npm run nexus:status`
- Unified doctor: `npm run nexus:doctor`
- Screenshot audit: `npm run command-center:screenshot-audit`

You can also inspect `package.json` directly for the latest supported commands.

## Service Health Page

Open:

- `/command-center/services`

The Service Health route explains:

- what each local service does
- which services are online, offline, disabled, or planned
- which commands to run in a terminal
- current doctor findings and troubleshooting guidance

This page is read-only. UI execution for service commands is not enabled yet.

## Current Service Posture

- Dashboard: available
- Local API: available as a local read layer
- Action bridge: available for governed action flows
- DB foundation: read-only, file-backed foundation only
- Unified boot: available for enabled local services

## Unified Local Boot (P41.6.2)

P41.6.2 adds:

- `npm run nexus:up`
- `npm run nexus:down`
- `npm run nexus:status`
- `npm run nexus:doctor`

`nexus:up` starts only enabled manifest services on `127.0.0.1`.
`nexus:down` stops only NEXUS-managed PIDs.
`nexus:status` and `nexus:doctor` remain read-focused inspection commands.

### Command Center Service Health (P41.6.3)

P41.6.3 adds a Service Health route to Command Center so operators can inspect:

- Command Center dashboard
- Live Local API
- Governed Action Bridge
- Durable State Foundation
- Worker Runtime placeholder
- MCP / Tool gateway placeholder
- Provider Dispatch placeholder
- Batch Jobs placeholder

Use it to understand whether a service is:

- Online
- Offline
- Disabled by policy
- Not enabled
- Planned
- Unknown

### How To Read Status Output

- `running, managed PID ...`: started by NEXUS and tracked in local service state
- `running, external/unmanaged`: already running outside NEXUS management; `nexus:down` will not stop it
- `file-backed/read-only`: the persistence layer is active through files, not live DB writes
- `not enabled`: the service is intentionally unavailable in this phase

### What Comes Next

- command palette and simple operator actions are planned for P41.6.4

## Durable State Status

- Current persistence: file-backed
- DB foundation: ready
- DB writes: disabled by policy
- Runtime DB primary: not enabled

## If a Service Is Offline

- Dashboard offline: run `npm run dashboard`
- Local API offline: run `npm run local-api:start`
- Action bridge unavailable: run `npm run mission:action-server`
- One-command boot for enabled services: run `npm run nexus:up`
- One-command shutdown for NEXUS-managed services: run `npm run nexus:down`
- Snapshot fallback visible: the UI is using generated/browser-safe fallback data instead of live reads
- `nexus:status` fails: check that `nexus.services.json` exists and parses
- `nexus:doctor` fails: verify required scripts exist in `package.json`, the service-state directory is writable, and localhost ports are valid
- If a required port is already in use by an unhealthy process, stop that process or pick a different local environment before retrying `nexus:up`
- Disabled-by-design services in this phase include workers, MCP Gateway, and Provider Gateway
- Service Health shows `Unknown`: refresh local service artifacts with `npm run nexus:status`
- Service Health shows `Offline`: run `npm run nexus:doctor`, then start or restart the service from a local terminal
- Service Health command buttons are disabled: this is expected; browser-side service execution is not enabled yet

## Notes

- Do not assume provider execution is available.
- Do not assume worker runtime is available.
- Do not assume release/deploy bridges are enabled.
- DB writes remain disabled by policy.
