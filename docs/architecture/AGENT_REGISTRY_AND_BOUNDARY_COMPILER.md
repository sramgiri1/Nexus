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

## P45.2 - Agent Capability Matrix
P45.2 maps each registered agent to stable capability IDs and capability
categories: orchestration, planning, implementation, verification, security,
product, release, docs, platform, and governance.

The matrix validates separation of duties:
- Implementers cannot approve their own implementation.
- Verifiers cannot silently mutate code.
- Security/privacy agents can block risk but do not implement product code.
- Coordinators can route work but cannot bypass approval.

The matrix remains metadata-only. It reports gaps, overlaps, and risky
permissions, but it does not wire runtime enforcement into action bridges,
local APIs, workers, provider dispatch, or tool dispatch.

## Next
P45.3 defines path, tool, data, project-scope, change-scope, and approval
boundaries for each agent.

## P45.3 - Agent Path / Tool / Data Boundaries
P45.3 defines boundary metadata across six dimensions:
- Path boundaries.
- Tool boundaries.
- Data boundaries.
- Project scope boundaries.
- Change-scope boundaries.
- Approval boundaries.

Examples are recorded for CORE, SENTINEL, AUDITOR, WARDEN, and SWIFT. Tool
boundaries remain metadata-only; no MCP, provider, worker, xcodebuild, release,
or DB-write execution is enabled.

Data references are classified as public, internal, confidential, restricted,
or secret. Secret data and private source detailed scans remain forbidden for
the metadata-only boundary model.

## Next
P45.4 adds a dry-run boundary compiler that can produce a boundary envelope
without applying it to runtime execution.

## P45.4 - Boundary Compiler
P45.4 compiles agent registry metadata, project registry metadata, scope
classification, capability ID, and task intent into a dry-run boundary envelope.
The envelope contains:
- Agent identity.
- Project scope.
- Allowed and denied capabilities.
- Allowed and forbidden paths.
- Allowed and forbidden tools.
- Data classification limits.
- Cost policy.
- Memory policy.
- Required approvals.
- Required evidence.

The compiler is intentionally not connected to runtime execution. It is a
preview and validation model for later governed execution phases.

Example envelopes are generated for CORE, SENTINEL, WARDEN, and AUDITOR.

## Next
P45.5 exposes the registry and dry-run boundary preview in Command Center.

## P45.5 - Command Center Agent Registry UX
P45.5 turns the former Agent Fleet surface into a read-only Agent Registry
experience. The page shows tabs for Overview, Capabilities, Boundaries,
Projects, Evidence Requirements, and Developer Details.

The page shows the known NEXUS agents, their roles, status, capability counts,
approval requirements, evidence requirements, cost posture, memory posture, and
a dry-run boundary envelope preview. There are no edit controls, permission
changes, runtime enforcement toggles, provider calls, DB writes, or tool
dispatch.

## Next
P45.6 performs final validation for the registry, matrix, boundaries, compiler,
Command Center UX, docs, roadmap status, and safety posture.

## P45.6 - Agent Boundary Tests + Final Validation
P45.6 closes the Agent Registry + Boundary Compiler track. The final validation
confirms:
- P45.1 through P45.5 are complete.
- Agent registry, capability matrix, boundary model, and boundary compiler
  reports exist and include validation metadata.
- Command Center exposes the Agent Registry page.
- DemoApp remains demo-only.
- Runtime enforcement, tool dispatch, provider calls, DB writes, worker
  execution, release execution, and source mutation remain disabled.

P46 is next and will define scoped memory architecture and Memory Center
visibility.

## P46 Handoff
P46.1 repairs the P45 phase-status commit reference to `ba3032c` and starts the
scoped memory model. Agent boundaries remain metadata-only; scoped memory does
not expand agent permissions or enable runtime enforcement.
