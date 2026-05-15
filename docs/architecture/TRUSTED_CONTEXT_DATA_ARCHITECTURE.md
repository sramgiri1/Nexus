# Trusted Context + Data Architecture

P47 defines the metadata-only trusted context layer between Project Registry,
Scoped Memory, Tool/MCP governance, and future provider or worker execution.

Core rule: no agent acts without trusted, scoped, fresh, governed context.

## P47.1 - Data Source Registry

The data source registry describes every source that may contribute to a future
trusted context packet. The registry records source ownership, classification,
scope, allowed agents, forbidden modes, freshness policy, redaction requirements,
and lineage requirements.

The registry is read-only in P47.1. It does not read private source content,
start services, call providers, dispatch tools, write to a database, mutate
project files, or inject context into runtime agents.

## Source Categories

- OS sources: roadmap, phase status, architecture docs, agent registry metadata,
  and codebase module registry.
- Project sources: project registry, project profile files, private project
  documentation references, and validation reports.
- Runtime sources: task state, evidence, audit, event, and activity ledgers.
- Safety sources: policy files and public/private boundary reports.

## Safety Boundary

Private project sources are local-private only and forbidden in demo/public
modes. P47 uses summaries and metadata only. Raw source, raw docs, raw logs,
secrets, credentials, and private user data are not included in primary context
outputs.

## Next

P47.2 maps knowledge domains to their system-of-record source so future context
packets can prefer authoritative data over stale or ambiguous alternatives.

## P47.2 - System-of-Record Mapping

The system-of-record map defines which source is authoritative for each trusted
context domain. It prevents future agents from selecting stale, ambiguous, or
unauthorized sources when building context.

Mapped domains include project requirements, project profile, project registry,
OS roadmap, task state, evidence, audit, activity, validation results, release
decisions, agent capability, policy, cost state, and scoped memory.

The map is still metadata-only. Future cost state is marked planned. Scoped
memory is referenced as packet-preview context only and is not injected into
runtime agents.

## Next

P47.3 adds source trust scoring so the registry and system-of-record map can
explain which sources are high, medium, low, or unavailable for use.
