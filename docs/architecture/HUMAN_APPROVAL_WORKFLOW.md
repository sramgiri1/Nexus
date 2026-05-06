# Human Approval Workflow

**Version:** 1.0  
**Date:** 2026-05-06

---

## Approval-Required Actions

- production deploy
- secrets or environment changes
- CI or CD changes
- infrastructure changes
- database migrations
- destructive SQL
- production data access
- external data export
- new MCP server
- new provider
- new dependency install
- release GO if configured
- waiver of failed gate
- rollback from final state
- high-cost budget override

---

## Approval Request Shape

```json
{
  "approvalId": "",
  "type": "",
  "requestedBy": "",
  "projectId": "",
  "taskId": "",
  "riskLevel": "",
  "reason": "",
  "evidence": [],
  "expiresAt": "",
  "approvalRequired": true
}
```

---

## Approval Result Shape

```json
{
  "approvalId": "",
  "decision": "approved|rejected|expired",
  "approvedBy": "",
  "reason": "",
  "createdAt": "",
  "auditEventId": ""
}
```

---

## Rules

- agents cannot approve their own requests
- approval is scoped, not blanket
- approval expires
- approval evidence is linked
- rejected approval blocks the transition
- approval bypass is a safety event
- approval result is evidence
- approval does not replace verification evidence

---

## Workflow Summary

1. an agent or operator requests a risky action
2. the kernel marks the action as approval-required
3. evidence and reason are attached to the approval request
4. an authorized human approves, rejects, or lets the request expire
5. the approval result is recorded as evidence and audit
6. execution remains blocked unless the required approval result exists

This phase defines the approval model only. It does not implement the live approval
service or UI actions yet.
