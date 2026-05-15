# Tool / MCP Registry + Tool Governance

## Purpose

P52 defines one governed tool gateway for NEXUS. The gateway is built from
metadata registries, policy checks, lazy contract loading, permission decisions,
and dry-run previews.

P52 does not create a fleet of always-on MCP servers. It also does not enable
real tool execution, provider calls, external network access, DB writes, worker
runtime, shell execution through the gateway, or project mutation.

Core rule:

> Right tool. Right time. Small context. Governed execution.

## P52.1 - Tool Registry Schema

P52.1 adds the read-only Tool Registry schema and metadata seed registry.
Tool definitions include category, interface type, allowed scopes, allowed
agents, allowed methods, forbidden methods, risk level, policy references,
evidence requirements, audit requirements, and lazy contract metadata.

Seed tools are metadata-only:

- Git Status
- Git Diff
- Test Runner
- Filesystem Boundary
- Playwright Browser
- GitHub PR
- DB Read-only
- Docs Diagram
- API Adapter
- Batch Adapter

Every seed tool has:

- `runtimeEnabled: false`
- `executionEnabled: false`
- `providerCallsAllowed: false`
- `externalNetworkAllowed: false`
- `projectMutationAllowed: false`

## Next Subphase

P52.2 adds the MCP registry schema as disabled placeholders only. No MCP server
runtime is created.
