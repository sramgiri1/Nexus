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

## P52.3 - Governed Tool Gateway

P52.3 adds the decision-only governed tool gateway. It evaluates whether a
metadata lookup, selected contract request, or execution preview is allowed,
blocked, or requires a later approval path.

The gateway supports request types:

- `tool.lookup`
- `tool.contract`
- `tool.execute.preview`

Execution preview does not execute anything. It returns a
`BLOCKED_RUNTIME_DISABLED` decision because P52 keeps all runtime execution
disabled.

Gateway decisions include:

- `ALLOW_METADATA_ONLY`
- `DENY`
- `REQUIRE_APPROVAL`
- `BLOCKED_NOT_ENABLED`
- `BLOCKED_SCOPE`
- `BLOCKED_AGENT`
- `BLOCKED_PROJECT`
- `BLOCKED_DATA_CLASSIFICATION`
- `BLOCKED_COST`
- `BLOCKED_METHOD`
- `BLOCKED_RUNTIME_DISABLED`

The gateway returns safe summaries only. It does not return raw tool payloads,
raw MCP schemas, shell commands, provider credentials, or project-private source
content.

## P52.4 - Tool Search + Contract Preview

P52.4 adds metadata-only search, selected contract loading, and execution
preview wrappers on top of the governed gateway.

Tool search returns compact summaries only:

- tool id
- display name
- category
- interface type
- status
- risk level
- owner
- matched fields

Search does not return raw schemas or all tool contracts. Contract loading is
selected and lazy: one requested tool contract can be loaded only after the
gateway allows `tool.contract` for the active context.

Execution preview calls the gateway with `tool.execute.preview` and returns the
blocked decision. It does not execute tools, run shell commands, call providers,
load MCP servers, access external networks, write DB state, or mutate projects.

## P52.5 - Lazy Tool Contract Loading

P52.5 adds explicit context budget guardrails so NEXUS does not load all tool or MCP schemas into model context.

The lazy loading policy:

- allows selected contract loading only
- caps selected contracts at three per task
- caps tool summaries at twenty per task
- blocks all tool schemas in context
- blocks all MCP schemas in context
- blocks raw MCP schemas and bulk raw tool contracts in primary context

These guardrails keep tool context small and governed. They do not execute
tools, start MCP servers, call providers, access external networks, write DB
state, or mutate projects.

## P52.6 - Tool Permission Matrix

P52.6 adds a default-deny permission matrix for tool metadata. Permissions are
evaluated by agent, project, scope, method, data classification, and risk
posture.

The seed matrix covers:

- AUDITOR access to Git Diff metadata
- SENTINEL access to Test Runner metadata
- CORE access to Filesystem Boundary metadata
- WARDEN policy boundary metadata with approval
- SWIFT Xcode MCP placeholder blocked until runtime exists
- DROID Android Gradle MCP placeholder blocked until runtime exists
- Demo scope blocked from private project tools

The matrix is metadata-only. It does not enable execution, MCP servers,
providers, external network, DB writes, workers, or project mutation.

## P52.7 - Safe Tool Adapter Previews

P52.7 adds adapter preview modules for the first tool families:

- Git Adapter Preview
- Test Runner Adapter Preview
- Filesystem Boundary Adapter Preview
- Playwright Adapter Preview

Each adapter exposes the same preview contract:

- `describeAdapter()`
- `listSupportedMethods()`
- `validateAdapterRequest(request)`
- `previewAdapterAction(request)`
- `getAdapterSafetySummary()`

The adapters do not execute commands, launch browsers, run tests, read or write
project files, call external networks, call providers, write DB state, or mutate
projects. They only describe and validate future governed actions.

## P52.8 - Command Center Tool Gateway View

P52.8 exposes a read-only Command Center route at `/command-center/tools`.

The view includes tabs for:

- Overview
- Tool Registry
- MCP Registry
- Permissions
- Contracts
- Adapters
- Lazy Loading
- Developer Details

The page explains the single governed gateway model, metadata-only registry
state, disabled MCP placeholders, lazy contract loading, default-deny
permissions, and preview-only adapters. It does not add UI execution controls or
backend execution behavior.

## P52.9 - Final Validation

P52.9 validates and closes Tool / MCP Registry + Tool Governance. The final
checker verifies the registries, gateway decisions, lazy loading policy,
permission matrix, adapter previews, Command Center route, reports, OS phase
status, and safety boundaries.

P52 closes with these non-goals preserved:

- no real tool execution
- no MCP server runtime
- no provider calls
- no external network calls
- no DB writes
- no worker runtime
- no shell execution through the gateway
- no project mutation

## Next Subphase

P53 starts the Trigger + Integration Gateway.
