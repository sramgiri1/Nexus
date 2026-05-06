# Capability Model

**Version:** 1.0  
**Date:** 2026-05-06

---

## Core Principle

Agents do not get broad authority.

Agents are granted scoped capabilities.

A capability defines:

- who may request it
- what it does
- which contract type it requires
- which runtime may execute it
- which tools or skills it uses
- which evidence it must produce
- which approvals it requires
- which data classes it may handle
- which policies constrain it

Capabilities are the formal bridge between agents, contracts, tools, skills,
runtimes, providers, approvals, evidence, policies, data classification, and
security boundaries.

---

## Why Capabilities Exist

Capabilities prevent:

- agentic soup
- broad tool access
- hidden authority
- unsafe MCP usage
- unauthorized provider use
- fake gate passing
- unrestricted file writes
- unbounded runtime execution
- secret or data leakage

Capabilities also make future kernel enforcement explicit. Instead of asking
whether an agent "should probably be allowed" to use a tool, the OS can later
check whether a declared capability allows that request under the governor,
contracts, state machine, and policy boundary.

---

## Capability Lifecycle

1. `proposed`
2. `reviewed`
3. `approved`
4. `enabled`
5. `deprecated`
6. `disabled`

Lifecycle state is capability metadata, not runtime execution state. A
capability can exist in the registry before runtime enforcement is turned on.

---

## Capability Shape

```json
{
  "capabilityId": "",
  "name": "",
  "description": "",
  "ownerAgent": "",
  "allowedAgents": [],
  "agentGroups": [],
  "contractTypes": [],
  "taskTypes": [],
  "tools": [],
  "skills": [],
  "runtimes": [],
  "providers": [],
  "dataClassesAllowed": [],
  "approvalRequired": false,
  "approvalTypes": [],
  "evidenceRequired": [],
  "policies": [],
  "riskLevel": "",
  "blockingAllowed": true,
  "batchEligible": false,
  "mcpAllowed": false,
  "status": "proposed|reviewed|approved|enabled|deprecated|disabled"
}
```

---

## Capability Rules

- capability must have an owner
- capability must have allowed agents
- capability must declare allowed data classes
- capability must declare runtime
- capability must declare evidence
- high-risk capability requires approval or explicit critical evidence rules
- MCP capability requires MCP security review
- provider capability requires provider policy
- batch capability cannot pass gates
- release capability requires gate evidence
- DB capability requires data protection policy and DB access policy
- secret capability never exposes raw secrets
- source write capability requires `allowedFiles`
- destructive capability requires approval

---

## Capability Boundaries

### Agents

Agents request capabilities indirectly through their task contracts and approved
execution path. They do not self-assign new capability scope.

### Contracts

Contracts remain the delegation boundary. A capability does not replace a
contract. It constrains which contract types and task types may execute with
which tools and skills.

### Tools and Skills

Tools and skills are not broad permissions. They are bound to capability scope.
Tooling that mutates repo state, runtime state, provider calls, approvals, or
evidence must later resolve through capability checks before execution.

### Runtimes and Providers

Every capability declares where it may run and which providers it may use.
OpenRouter remains low-risk only by default. Batch remains non-blocking only by
default. High-risk provider work stays on approved direct providers or local and
deterministic paths.

### Data Classification

Every capability declares which data classes it may handle. Data classification
still happens before provider, batch, log, evidence, MCP, or UI use. A
capability cannot override the data protection or security boundary policy.

### Evidence and Approvals

Every capability declares evidence expectations. Approval-required capabilities
must also declare approval types and approval policy linkage. Approval does not
replace verification evidence or state-machine rules.

### Security Boundary

Capabilities are governed by the security boundary, the governor, and the state
machine. Capability registration makes future enforcement explicit; it does not
grant bypass authority.

---

## Non-goals

This phase does not:

- enforce capabilities at runtime
- modify orchestrator dispatch
- add real MCP servers
- add new tools or skills
- change agent behavior

It defines the capability architecture, registry shape, and validation model
only.
