# Security Boundary

**Version:** 1.0  
**Date:** 2026-05-06

---

## Core Principle

Agents do not own authority.

The kernel, governor, contracts, state machine, policies, approvals, and runtime
gateways own authority.

Agents can reason, propose, and request. They cannot self-authorize risky actions,
bypass state transitions, approve their own work, or define their own security
exceptions.

This phase defines the security architecture, policies, and validation model only.
It does not implement runtime enforcement yet.

Phase 11 extends this posture with a machine-readable capability model. That
registry does not replace the governor, contracts, or state machine. It adds an
explicit authorization layer that future runtime integration can consult before
tool, provider, runtime, or MCP execution.

Phase 14 adds domain ownership and agent authority rules on top of that. The
security boundary answers what must be blocked. The ownership model answers who
may request, decide, verify, escalate, or stay out of a domain entirely.

Phase 15-LOCAL adds a local traffic-plane helper between agents and future
model, tool, skill, runtime, provider, batch, or MCP calls. That helper
enforces the operational categories of privilege, behavioral monitoring, and
accountability, but it is not fully wired into orchestrator dispatch yet.

---

## Security Layers

### 1. Human / Operator Boundary

- user roles and RBAC are planned later
- approval authority belongs to human operators, not agents
- read-only demo and investor mode must not expose real mutable state
- all state-changing operator actions must be audited

### 2. UI / API Boundary

- UI never mutates memory or DB directly
- every mutation goes through the NEXUS API
- the API routes through governor, contracts, and state machine
- the API returns redacted evidence references rather than raw sensitive artifacts

### 3. Agent Boundary

- agents act through contracts
- agents only receive scoped context
- agents never receive raw secrets
- agents cannot bypass tools or governor
- agents cannot directly approve their own risky actions

### 4. Tool / Skill Boundary

- deterministic tools and skills execute defined procedures
- tools enforce allowed paths and policy boundaries
- tools emit evidence
- tool outputs are classified and redacted before persistence or LLM context reuse
- future tool, skill, provider, and MCP requests should also require a declared
  capability from the capability registry

### 5. Runtime Boundary

- runtimes are explicit: `node-local`, `linux-container`, `macos-xcode`,
  `provider-api`, `batch-provider`, `mcp-server`, and `human-approval`
- runtime selection must follow task type and policy
- high-risk runtime actions require approval

### 6. Network Boundary

- default deny network egress
- network allowlists are capability-scoped later
- provider endpoints are controlled
- MCP endpoints are controlled
- unreviewed egress is blocked by policy

### 7. Secret Boundary

- secrets are referenced by name only
- raw secrets never enter prompts, logs, batch, evidence, or UI
- environment values are not printed
- secret scans happen before logs, evidence, or model calls

### 8. Data Boundary

- data classification happens before LLM, batch, log, or evidence use
- Phase 8 data classes still apply
- the future DB agent must use a safe gateway
- OpenRouter and batch are restricted to `public` and `internal` by default

### 9. Approval Boundary

- deploys require approval
- secret or environment changes require approval
- migrations require approval
- production data access requires approval
- destructive operations require approval

### 10. Audit Boundary

- every state-changing action emits an audit event
- every blocked action emits a safety event
- every approval or rejection is recorded

---

## Threat Model

NEXUS must assume the following threats exist unless explicitly mitigated:

- agent prompt injection
- tool misuse
- secret leakage
- unsafe shell command
- file boundary violation
- unreviewed MCP server
- unrestricted network egress
- provider data leakage
- batch payload leakage
- raw DB row exposure
- fake gate pass
- release without evidence
- unapproved deploy or migration
- log or evidence leakage
- demo mode leaking real data

The correct response is not to trust the prompt more. The response is to enforce
kernel-owned boundaries: governor checks, contract checks, state machine checks,
data classification, approvals, audit, and evidence requirements.

---

## Security Posture

- default deny for network egress
- default deny for MCP access
- default deny for raw secret exposure
- default deny for unapproved production data access
- least-privilege tool and runtime use
- classification and redaction before provider, batch, log, evidence, or UI flow
- release evidence required before release decisions

---

## Non-goals

This phase does not:

- implement runtime enforcement
- modify orchestrator dispatch
- add live MCP servers
- add live network integrations
- add secrets or credentials
- change agent behavior

It defines policies, boundaries, and validation checks only.
