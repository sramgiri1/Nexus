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
