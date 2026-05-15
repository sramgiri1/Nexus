# Governed Agentic Mesh

P48 introduces a governed message and room layer for NEXUS agents.

Core rule: agents collaborate through NEXUS governance, never free direct chat.

## P48.1 - Agent Message Contract

The agent mesh message contract defines typed, scoped, redacted coordination
messages. Messages can request clarification, handoff, evidence, review,
context updates, blocker reporting, approval, validation, implementation
readiness, or failure review.

Messages are metadata-only in P48.1. They cannot store raw payloads, mutate task
state, call providers, dispatch tools, start workers, write to the database, or
mutate project files.

## Safety Boundary

- Unknown message types are blocked.
- Missing sender, receiver, scope, or type is blocked.
- Raw payload storage is blocked.
- Demo/public modes cannot include private project messages.
- Mesh messages may influence future tasks only through governed paths.

## Next

P48.2 adds an append-only local message bus for redacted mesh messages.

## P48.2 - Agent Message Bus

The message bus records governed mesh messages in an append-only local JSONL
store. Records remain redacted, summaries-only, and filterable by room, task,
agent, project, mission, type, and status.

The message bus preserves audit/evidence separation. It can create an activity
logger dry-run when the observability logger is present, but it does not enable
provider calls, tool dispatch, worker runtime, DB writes, project mutation, or
task state mutation.

## Next

P48.3 adds governed agent rooms that group agents, tasks, messages, and
evidence by scope.

## P48.3 - Agent Rooms

Agent rooms group agents, tasks, messages, and evidence by governed scope. Room
types include mission, task, validation, implementation review, release review,
and OS update rooms.

Rooms are coordination metadata only. They do not execute agents, transfer task
ownership, dispatch providers/tools/workers, write to DB, or mutate project
files. Participant updates and closure are represented as append-only room
records.

## Next

P48.4 defines governed handoff requests from one agent to another.

## P48.4 - Handoff Protocol

The handoff protocol records a governed request from one agent to another. A
handoff includes the source and target agent, scope, mission/task references,
reason, requested capability, evidence IDs, required next evidence, policy
decision, human-review requirement, and status.

Handoffs create redacted mesh messages and append handoff decision records, but
they do not transfer task ownership or mutate task state. Sensitive handoffs
require human review, and cross-scope handoffs are blocked unless represented as
`CROSS_CUTTING_CHANGE` with an allowing policy decision.

## Next

P48.5 connects agent rooms to policy-scoped trusted context summaries.

## P48.5 - Context Sync Through Policy

Context sync connects an agent room to trusted context packet summaries. It
lists allowed sources, excluded sources, stale context, and packet summary
metadata without exposing raw documents, raw source payloads, secrets, or policy
JSON in primary outputs.

Context sync obeys trusted-context packet policy from P47. It blocks raw context
inclusion, blocks private project context in demo/public-safe modes, and keeps
runtime agent injection disabled. The result is a governed context summary that
agents can reference through NEXUS coordination only.

## Next

P48.6 adds Command Center visibility for governed agent rooms, messages,
handoffs, and context sync posture.
