# Network Security Model

**Version:** 1.0  
**Date:** 2026-05-06

---

## Core Rule

Default deny network egress.

NEXUS should treat network access as a granted capability, not an ambient
assumption. Agents, tools, runtimes, and future MCP servers should only reach
approved destinations for approved reasons.

---

## Allowed Categories

- approved model providers
- approved batch providers
- approved GitHub or Jira endpoints later
- approved MCP endpoints later
- approved package registries only during dependency phases
- local services explicitly started by the operator

---

## Blocked by Default

- unknown domains
- random webhooks
- raw database hosts
- arbitrary `curl` or `wget`
- file upload endpoints
- public pastebins
- telemetry endpoints not approved
- exfiltration destinations

---

## Provider Routing Rules

- OpenAI and Anthropic direct providers are for approved realtime or batch use
- OpenRouter is low-risk only by default
- no confidential, restricted, or secret data goes to OpenRouter by default
- no fallback on safety, budget, permission, secret, or verification failures

---

## Approval Required

- new provider
- new MCP server
- new webhook
- external upload
- package or dependency install
- production DB or network access
- CI or CD integration

---

## Future Enforcement Points

- tool gateway
- provider gateway
- MCP registry
- sandbox network policy
- CI policy
- API policy
- audit log

---

## Phase Scope

This document defines the default-deny posture and the future enforcement points.
It does not implement live egress filtering in this phase.
