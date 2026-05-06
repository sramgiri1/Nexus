# Capability Registry

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose of the Registry

The capability registry is the machine-readable map of which scoped actions the
NEXUS OS recognizes.

It is the bridge between:

- agent identity
- contract type
- task type
- tools
- skills
- runtimes
- providers
- approvals
- evidence
- data classification
- policies

The registry exists so future runtime integration can check capability scope
before executing tool, skill, provider, batch, or MCP actions.

---

## Registry and Schema Location

- Registry: `capabilities/registry.json`
- Schema: `capabilities/schema.json`

The registry is versioned configuration. The schema defines the required
capability shape. This phase adds the files and a validator, but does not wire
runtime enforcement yet.

---

## Registry Categories

- `control`
- `planning`
- `verification`
- `implementation`
- `platform`
- `data`
- `ai_provider`
- `growth`
- `observability`
- `security`
- `approval`
- `release`
- `demo`

Categories are expressed through capability identifiers, agent ownership, task
types, and supporting documentation. They will later support operator views in
the Command Center UI and capability-aware scheduling decisions.

---

## How Capabilities Are Used by Agents

Agents do not receive broad tool access. They receive a scoped task contract and
later a scoped capability context.

That future context can answer questions like:

- which tools may this agent call for this contract
- which skills are allowed for this task type
- which runtime is valid
- which provider is allowed
- whether batch is eligible
- which evidence must be produced
- whether approval is required first

The registry does not replace AGENTS.md or the agent prompts. Those define role
discipline. The registry defines machine-readable execution scope.

---

## Future Runtime Use

Future runtime integration should check capability rules before execution:

```text
agentId
  + contractType
  + taskType
  + requestedToolOrSkill
  + runtime
  + provider
  + dataClass
  + approvalStatus
  → capability decision
```

That future decision path should still route through the governor, contracts,
state machine, approval policy, and security boundary. Capability matching is a
constraint layer, not a replacement for those controls.

---

## Registry Interaction Model

### AGENTS.md

AGENTS.md describes system behavior and agent operating expectations. The
capability registry gives those expectations a structured OS-facing model.

### Contracts

Contracts describe delegated work. The registry constrains which contract types
and task types are valid for a given scoped capability.

### State Machine

The state machine remains the source of truth for lifecycle transitions. A
capability does not authorize invalid state transitions.

### Skills and Tools

Every future tool or skill request should resolve through a capability match.
Tool and skill use must also respect data classification, approvals, and audit
requirements.

### Execution Runtimes

The runtime registry in Phase 6 defines where work can run. The capability
registry declares which runtime is acceptable for a given class of work.

### Data Protection Policy

Capabilities do not override data protection. Allowed data classes in the
registry must remain consistent with classification, redaction, and provider
restrictions.

### Security Boundary

MCP, provider, secret, approval, and network boundaries still apply. Capability
scope narrows requests within those boundaries.

### Approval Policy

Approval-required capabilities must declare their approval types and include the
approval policy in their governing policy list.

### Evidence Model

Every capability declares evidence expectations so results can be linked to
audit, state transitions, reliability, and release readiness later.

### Command Center UI

The operator platform can later surface which capabilities were used, which are
approval-gated, which runtimes were selected, and which evidence was produced.

---

## Non-goals

This phase does not enforce capabilities at runtime.

It defines the registry, schema, and validation path only.
