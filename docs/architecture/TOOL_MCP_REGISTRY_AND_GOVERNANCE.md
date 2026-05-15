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

## P52.2 - MCP Registry Schema

P52.2 adds disabled MCP placeholders as registry metadata only. The registry
describes future MCP server candidates without starting servers, loading full
schemas into context, requiring secrets, or allowing network egress.

Seed MCP placeholders are disabled:

- Filesystem MCP Placeholder
- GitHub MCP Placeholder
- Playwright MCP Placeholder
- DB Read-only MCP Placeholder
- Xcode MCP Placeholder
- Android Gradle MCP Placeholder

Every MCP placeholder has:

- `serverEnabled: false`
- `schemasLoadedByDefault: false`
- `lazySchemaLoadingRequired: true`
- `egressPolicy: none`
- `secretsRequired: []`

These records exist so future phases can evaluate tools and MCP servers through
one governed gateway. They do not create or start MCP server runtimes.

## Next Subphase

P52.3 adds the governed tool gateway decision layer. It remains metadata-only
and does not execute tools.
