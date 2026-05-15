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
