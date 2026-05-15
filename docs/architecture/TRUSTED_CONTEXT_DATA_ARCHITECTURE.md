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

## P47.3 - Source Trust Score

Source trust scoring computes deterministic local trust bands for every
registered source. Scoring considers whether the source is a system of record,
whether its path exists locally, owner metadata, freshness policy, redaction,
lineage, forbidden modes, and allowed agent metadata.

Trust bands are high, medium, low, and unavailable. Scores are explanatory and
redacted. They do not call providers, query external services, infer private
content, write to a database, or grant runtime permissions.

## Next

P47.4 adds freshness and lineage records so trusted context can explain whether
a source is fresh, stale, invalidated, unknown, or unavailable.

## P47.4 - Freshness + Lineage

Freshness evaluation classifies each source as fresh, stale pending validation,
invalidated by change, unknown, or unavailable. P47.4 keeps freshness markers
metadata-only and in-memory for checker validation; it does not rewrite source
files or mutate runtime ledgers.

Lineage records capture source ID, derivation, generator, project/scope/task
metadata, activity or evidence references, timestamp, and redacted status. Raw
source content and private payloads are excluded.

## Next

P47.5 builds read-only trusted context packet previews from registry, source of
record, trust score, freshness, and lineage metadata.

## P47.5 - Trusted Context Packet

Trusted context packets are read-only previews for future agent/provider runs.
They include source summaries, inclusion and exclusion reasons, trust summaries,
freshness summaries, and lineage summaries.

P47 packets are summaries-only. They do not include raw source code, raw private
docs, raw logs, secrets, credentials, or raw policy JSON. Demo and public-safe
modes cannot include private project sources. Packets are not injected into
runtime agents and do not trigger provider, tool, worker, or DB behavior.

## Next

P47.6 adds a Command Center Data & Context Center so operators can inspect
trusted context readiness without seeing raw private content.

## P47.6 - Command Center Data / Context Center

The Command Center Data & Context Center is available at
`/command-center/context`. It shows trusted context posture through tabs for
overview, data sources, system of record, trust scores, freshness and lineage,
context packet preview, and exclusions or blocks.

The UI is read-only and uses summaries only. It does not show raw docs, raw
source, raw logs, raw policy JSON, secrets, or private content. It preserves
dark/light/system theme behavior and keeps provider, tool, worker, DB write, and
runtime agent injection disabled.

## Next

P47.7 closes the trusted context phase with final validation, regenerated P47
reports, docs updates, and P48 as the next roadmap phase.

## P47.7 - Tests + Docs + Final Validation

P47.7 validates the full trusted context layer: data source registry,
system-of-record mapping, source trust scoring, freshness and lineage, trusted
context packet previews, and Command Center Data & Context Center visibility.

P47 closes as a read-only architecture layer. It does not enable provider/tool
dispatch, worker runtime, DB writes, project mutation, or runtime agent context
injection.

## Next

P48 - Governed Agentic Mesh.
