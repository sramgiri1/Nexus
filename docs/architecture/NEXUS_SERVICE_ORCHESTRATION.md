# NEXUS Service Orchestration

## Purpose

P41.6 introduces a unified local service story for NEXUS so operators do not need to memorize scattered service entry points forever.

## Why Unified Boot Is Needed

By the end of P41.5, NEXUS already had:

- a dashboard
- a live local API
- a governed action bridge
- file-backed runtime state
- multiple checkers and reports

But starting or diagnosing the local environment still required remembering separate commands and local assumptions. P41.6 starts solving that.

## P41.6.1 Scope

P41.6.1 is foundation only. It adds:

- a declarative service manifest
- a manifest loader and validator
- a read-only `nexus:status` command
- a read-only `nexus:doctor` command
- a service orchestration policy
- a service orchestration checker

It does **not** add service start/stop orchestration yet.

## Service Manifest Design

`nexus.services.json` is the single declarative source for current local service posture.

It describes:

- service id
- label
- type
- host
- port
- command
- health URL
- current phase behavior
- whether the service is enabled now
- whether managed boot is deferred to a later phase

## Status Command

`npm run nexus:status`:

- reads the manifest
- validates it
- summarizes service posture
- writes `reports/nexus-service-status.json`

This command is read-only. It does not start services.

## Doctor Command

`npm run nexus:doctor`:

- checks Node runtime
- checks required package scripts
- validates the manifest
- enforces localhost-only service rules
- inspects known ports locally
- confirms future services remain disabled
- writes `reports/nexus-doctor-report.json`

This command is also read-only. It does not start services.

## Current Limitation

There is no process management in P41.6.1.

- no `nexus:up`
- no `nexus:down`
- no background service spawning
- no auto-restart

## Next Phases

- P41.6.2: `nexus:up` / `nexus:down` process manager
- P41.6.3: Command Center service health UI

## Localhost-Only Rule

All enabled network services must default to:

- `127.0.0.1`

No service may default to:

- `0.0.0.0`

## Guardrails

This foundation does not add:

- provider calls
- external network calls
- DB writes
- project mutation

MCP and tool infrastructure are represented as planned gateway services rather than many always-on MCP servers.
