# Scoped Memory Architecture

## Purpose
P46 defines scoped memory for NEXUS so agents can work across the NEXUS OS,
private projects, missions, tasks, sessions, and evidence without receiving one
blended global memory pool. The architecture is metadata-first and read-only
until later runtime/provider phases explicitly wire governed memory injection.

## P46.1 - Memory Scope Model
P46.1 introduces the canonical memory scopes and memory item schema.

Memory scopes:
- `global_agent`
- `nexus_os`
- `project`
- `mission`
- `task`
- `session`
- `evidence_linked`
- `promotion_candidate`

Change scopes:
- `NEXUS_OS_CHANGE`
- `PROJECT_CHANGE`
- `CROSS_CUTTING_CHANGE`
- `DEMO_CHANGE`
- `DOCS_CHANGE`
- `UNKNOWN`

Memory items are summary metadata, not raw source or raw prompts. Required
fields include identity, scope, project/mission/task/agent linkage,
classification, allowed agents, forbidden modes, freshness, confidence,
verification timestamps, version, redaction status, and evidence/audit links.

## Forbidden Memory Classes
P46 memory must not store secrets, `.env` material, raw credentials, unrelated
project memory, raw private source, raw prompts unless explicitly allowed, or
unrelated audit history.

## Current Safety Posture
- Runtime memory injection is not enabled.
- Provider dispatch is not enabled.
- Tool dispatch is not enabled.
- Worker runtime is not enabled.
- DB writes are not enabled.
- Memory records are metadata summaries only.

## Next
P46.2 adds safe local memory stores for OS, project, task, and session memory
metadata.

## P46.2 - Project / OS / Task / Session Memory Stores
P46.2 adds local JSONL stores under `memory/runtime/` for scoped memory
metadata. The store helpers support append/list/get operations by scope,
project, task, and agent, but records are still summaries only.

Store files:
- `os-memory.jsonl`
- `project-memory.jsonl`
- `task-memory.jsonl`
- `session-memory.jsonl`

The stores reject secret-like content, force redacted summaries, and keep demo
and public modes out of private project memory by default. These stores are not
runtime injection and are not DB-backed.

## Next After P46.2
P46.3 builds deterministic scoped memory packets for future governed dispatch.

## P46.3 - Memory Packet Builder
P46.3 adds deterministic packet selection for future scoped memory injection.
Packets accept scope, project, mission, task, agent, capability, mode, and a
memory budget. They return included memory, excluded memory, inclusion reasons,
freshness/trust warnings, token estimates, and classification summaries.

P46.3 does not send packets to providers or inject them into runtime agents.
Packets are summaries only and explicitly exclude unrelated project memory,
demo/private leakage, raw private source, secret-like material, and raw prompts.

## Next After P46.3
P46.4 adds memory access policy decisions for agents, scopes, modes, and
classifications.

## P46.4 - Memory Access Policy
P46.4 adds policy-only access decisions for scoped memory. The policy evaluates
agent, project, memory scope, mode, capability, and classification before
returning one of:
- `ALLOW`
- `DENY`
- `REDACT`
- `REQUIRE_APPROVAL`

Private project memory is denied in demo/public modes, unrelated project memory
is denied by default, and raw secret/source/prompt classes are denied. WARDEN,
AUDITOR, and NEXUS can inspect relevant redacted metadata, but not secrets.

## Next After P46.4
P46.5 adds freshness, staleness, invalidation, and promotion-candidate rules.

## P46.5 - Memory Freshness + Staleness
P46.5 tracks whether memory can still be trusted after OS, project, task, or
documentation changes. Freshness states are:
- `fresh`
- `stale_pending_validation`
- `expired`
- `invalidated`
- `unknown`

Invalidation plans are proposals. They identify memory that should be marked
stale pending validation, but they do not automatically rewrite runtime state.
Promotion candidates are also proposals and require approval.

## Next After P46.5
P46.6 exposes scoped memory safely in Command Center through a read-only Memory
Center.

## P46.6 - Command Center Memory Center
P46.6 adds `/command-center/memory` as a read-only Memory Center. It shows:
- Overview
- OS Memory
- Project Memory
- Agent Memory
- Task Memory
- Session Memory
- Stale Memory
- Promotion Candidates
- Packets

Memory Center displays summaries, source labels, freshness, classification,
allowed agents, verification timestamps, evidence links, promotion proposals,
and packet previews. It does not show raw source, secrets, raw prompts, raw
logs, or raw policy dumps. It does not edit memory and does not inject memory
into agents.

## Next After P46.6
P46.7 performs final validation, regenerates memory reports, repairs phase
status commit placeholders, and closes P46.

## P46.7 - Tests + Docs + Final Validation
P46.7 closes Scoped Memory Architecture + Memory Center. Final validation
confirms:
- Memory scope model, stores, packet builder, access policy, freshness model,
  and Memory Center reports exist.
- Memory Center is route-tested and visible in Command Center.
- Demo/public access to private project memory is denied.
- Runtime memory injection, provider dispatch, tool dispatch, worker runtime,
  DB writes, project mutation, and private project file changes remain disabled.

P47 is next and will define Trusted Context + Data Architecture Layer.
