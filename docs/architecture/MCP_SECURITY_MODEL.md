# MCP Security Model

**Version:** 1.0  
**Date:** 2026-05-06

---

## Core Rule

No MCP server is trusted by default.

MCP may eventually be useful for GitHub, Jira, browser, and database access, but
only after explicit registration, capability scoping, security review, approval,
and monitoring.

---

## MCP Server Lifecycle

1. `proposed`
2. `security_reviewed`
3. `capability_scoped`
4. `approved`
5. `enabled`
6. `monitored`
7. `disabled`
8. `revoked`

---

## MCP Registration Fields

- `serverId`
- `purpose`
- `owner`
- `allowedAgents`
- `allowedTools`
- `allowedDomains`
- `dataClassesAllowed`
- `secretsRequired`
- `approvalRequired`
- `networkAccess`
- `auditLevel`
- `riskLevel`

---

## MCP Risks

- broad tool authority
- filesystem access
- network egress
- credential exposure
- prompt injection
- data exfiltration
- hidden side effects
- tool result poisoning

---

## MCP Rules

- no unreviewed MCP
- no automatic MCP install
- no MCP with broad filesystem access by default
- no MCP can receive restricted or secret data by default
- MCP tool results must be classified and redacted
- MCP calls are audited
- MCP capabilities are least-privilege
- MCP cannot bypass governor, contracts, or state machine

---

## Future Use Cases

GitHub, Jira, browser, and DB MCP integrations may be useful later, but only if
they pass this lifecycle and policy model.

---

## Phase Scope

This phase defines the MCP security posture and registration model only. It does
not add or enable live MCP servers.
