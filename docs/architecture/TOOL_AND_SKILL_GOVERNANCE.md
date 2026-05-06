# Tool and Skill Governance

**Version:** 1.0  
**Date:** 2026-05-06

---

## Core Principle

Tools and skills are not automatically safe.

Every tool or skill must be bound to a capability.

This keeps authority explicit across agents, contracts, runtimes, providers,
approvals, evidence, data classification, policies, the governor, and the state
machine.

---

## Tool Categories

- memory
- repo
- queue
- contract
- state
- evidence
- skill
- runtime
- provider
- batch
- approval
- database
- mcp
- ui
- reporting

---

## Skill Categories

- code quality
- QA or test
- compliance or privacy
- orchestration
- release decision
- runtime execution
- data protection
- security boundary
- reliability
- capability validation

---

## Governance Rules

- tool use requires an allowed capability
- skill execution requires a capability
- tool output must be evidence-linked or audit-linked
- tools that mutate state require governor and state-machine checks later
- tools that read sensitive data require data classification
- tools that write files require `allowedFiles`
- tools that call network require network policy
- tools that use provider require provider policy
- tools that use secrets require the secret boundary
- tools that use MCP require MCP registry entry and security review
- tools that trigger approval-required action must create an approval request
- no tool may bypass contracts, state machine, or governor

---

## Governance by Boundary

### Sensitive Reads

Reading personal, confidential, restricted, or secret-adjacent data requires
classification and capability scope before results can enter logs, evidence,
provider context, batch, or UI payloads.

### Writes and Mutations

Repo writes, queue writes, contract writes, runtime mutations, and approval
requests are not generic permissions. They are scoped execution paths that later
need capability validation plus policy checks.

### Provider and Batch Use

Provider and batch access are governed capabilities. OpenRouter remains limited
to low-risk public or internal work by default. Batch remains non-blocking only
and cannot pass gates.

### MCP Use

MCP is not a generic escape hatch. MCP actions require registry-level permission,
security review, data-class constraints, and audit linkage.

---

## Future Enforcement

Future runtime enforcement should check:

```text
agentId + taskType + requestedTool + dataClass + runtime + provider + approvalStatus
```

against the capability registry before execution.

That check should remain additive to:

- contracts
- governor policy
- state machine rules
- security boundary
- approval policy
- data protection policy
- evidence model

Capability enforcement is a planned kernel check, not an optional convention.
