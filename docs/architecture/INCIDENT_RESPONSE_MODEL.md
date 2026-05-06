# Incident Response Model

**Version:** 1.0  
**Date:** 2026-05-06

---

## Incident Types

- `security_incident`
- `data_protection_incident`
- `secret_exposure_incident`
- `provider_incident`
- `runtime_incident`
- `batch_incident`
- `db_incident`
- `mcp_incident`
- `release_incident`
- `cost_incident`
- `stuck_queue_incident`

---

## Incident Severity

- `SEV0` critical
- `SEV1` high
- `SEV2` medium
- `SEV3` low

---

## Incident Record

```json
{
  "incidentId": "",
  "type": "",
  "severity": "",
  "projectId": "",
  "taskId": "",
  "detectedBy": "",
  "summary": "",
  "evidence": [],
  "owner": "",
  "status": "open|mitigating|resolved|closed",
  "createdAt": "",
  "resolvedAt": ""
}
```

---

## Runbooks

### Secret Exposure

- classify as security incident immediately
- revoke or rotate affected secret
- block related provider, tool, or deploy paths
- link evidence and audit records
- require human review before closure

### Raw Personal Data Sent to LLM or Batch

- classify as data protection incident
- stop further provider or batch usage for that payload
- record evidence and affected scope
- require redaction or policy fix
- require human review before closure

### Provider Outage

- classify as provider incident
- capture provider failure evidence
- determine whether fallback is policy-allowed
- avoid duplicate side effects during retry

### Stuck Batch Reconciliation

- classify as batch incident
- preserve provider job references
- stop duplicate completion
- retry only through reconcile-safe path

### Failed Release Gate

- classify as release incident if it blocks critical delivery
- preserve gate evidence and failure output
- route remediation to the owning agent
- do not mask the gate failure with retry language

### Unapproved Deploy Attempt

- classify as security or approval incident
- record blocked action and actor
- require approval workflow review

### Runaway Cost or Budget Spike

- classify as cost incident
- capture usage and provider evidence
- apply human review for override paths
- block unsafe retry storms

### Stuck Queue or Worker Heartbeat Expired

- classify as stuck queue incident
- record missing heartbeat evidence
- evaluate reclaim safety
- escalate high-risk tasks for review

### MCP Suspicious Tool Result

- classify as MCP incident
- quarantine the suspicious result
- preserve evidence and audit trail
- require review before using downstream output

---

## Incident Rules

- incidents are auditable
- incidents link evidence
- incidents block release if severity requires it
- incident closure requires a resolution summary
- security and data incidents require human review
- an incident must not be hidden by retry logic

---

## Reliability Outcome

Retries keep the system moving through transient issues. Incident handling makes sure
serious failures remain visible, attributable, and release-blocking when needed.

This phase defines the incident model only. It does not implement live incident
automation yet.
