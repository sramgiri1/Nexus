# Agent Registry and Boundary Compiler

## Purpose
P45 turns NEXUS agent concepts into governed, versioned metadata. The registry
describes what each agent is for, which capabilities it may use, which actions
remain forbidden, and what evidence or approval is required before future
execution surfaces can rely on an agent.

P45.1 is schema-only. It does not grant runtime permissions, call providers,
dispatch tools, write to a DB, run workers, mutate project source, or edit agent
markdown definitions.

## P45.1 - Agent Registry Schema
The first registry slice defines these required fields for each agent:
agent identity, role, version, owner, status, agent type, allowed and forbidden
capabilities, project and change scopes, tool boundaries, path boundaries, data
classification boundaries, approval requirements, evidence requirements, cost
policy, memory policy, handoff policy, review-separation policy, and notes.

Seeded agents:
- NEXUS
- SHEPHERD
- CORE
- SWIFT
- SENTINEL
- AUDITOR
- WARDEN
- PRISM
- FORGE

## Safety Posture
The registry is metadata-only. It is safe for checkers, docs, and Command Center
read-only summaries, but it is not a runtime authorization layer yet.

## Next
P45.2 adds the agent capability matrix and separation-of-duties checks.
