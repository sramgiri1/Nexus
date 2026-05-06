# Runtime Sandbox Model

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose

Each NEXUS runtime has a distinct security envelope. Runtime selection is not only
about capability. It is also about isolation, command limits, path limits, timeout
control, artifact handling, and approval requirements.

This document defines the future sandbox model without implementing runtime
enforcement in this phase.

---

## Shared Sandbox Concepts

- command allowlist concept
- path allowlist concept
- timeout requirement on bounded execution
- artifact directory boundary for outputs
- safe environment variables only
- output redaction before logs, evidence, or UI use
- failure handling that records safety or audit events

---

## Runtime 1 — `node-local`

### Allowed

- read repo files within contract scope
- run validation scripts
- run package scripts explicitly requested
- write allowed files only

### Blocked

- arbitrary destructive shell
- secret printing
- network calls unless the phase allows them
- modifying forbidden files
- deleting project files without approval

### Notes

- `node-local` is useful for deterministic repo checks and lightweight command
  execution
- it still requires command allowlist, path allowlist, timeout, and audit

---

## Runtime 2 — `linux-container`

### Allowed Later

- isolated backend or frontend tests
- lint and static analysis
- build checks
- sandboxed skill execution

### Blocked

- Xcode or iOS simulator execution
- production secrets
- unrestricted host filesystem access
- privileged containers unless approved
- outbound network unless allowlisted

### Notes

- containerization is a future runtime option
- it must preserve artifact directory boundary, timeout controls, and explicit
  egress policy

---

## Runtime 3 — `macos-xcode`

### Allowed Later

- `xcodebuild`
- `xcrun simctl`
- `xcresult` collection
- simulator logs, screenshots, and crash artifacts

### Blocked

- arbitrary shell
- signing or exporting release builds without approval
- secret access
- deleting outside derived data or artifact directories
- unbounded commands

### Notes

- `macos-xcode` is required for iOS and simulator validation
- it must use command allowlist, path allowlist, timeout, and redacted artifact
  handling

---

## Runtime 4 — `provider-api`

### Allowed

- realtime LLM calls by policy
- approved provider selection through model routing
- controlled reasoning or report generation

### Blocked

- secrets
- restricted data
- unauthorized fallback
- release, security, or deploy decisions through an unapproved provider path

### Notes

- provider payloads must pass classify, redact, and scan before send
- responses must pass classify, redact, and scan before persistence, log, or
  evidence use

---

## Runtime 5 — `batch-provider`

### Allowed

- non-blocking `public` or `internal` summaries and variants

### Blocked

- gates
- release decisions
- tool loops
- code edits
- secrets
- confidential, restricted, or secret data

### Notes

- batch requires reconcile before downstream use
- batch outputs are report evidence, not gate evidence

---

## Runtime 6 — `mcp-server`

### Allowed Later

- approved and registered MCP servers only

### Blocked

- unregistered MCP
- broad filesystem or server access
- hidden network egress
- secret access without approval

### Notes

- MCP usage requires registration, capability scoping, approval, audit, and
  monitoring

---

## Runtime 7 — `human-approval`

### Defines

- approval request
- approval evidence
- approval expiry
- approver identity
- audit event

### Notes

- approval is additive to runtime selection
- approval does not replace verification evidence
- rejected or expired approval blocks the action

---

## Failure Handling

All runtimes should eventually support:

- explicit failure result
- timeout result
- blocked-by-policy result
- redacted logs
- evidence references rather than raw secret-bearing output
- audit linkage to task, project, and actor

This model is architectural only in Phase 9.
