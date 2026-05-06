# Trace Model

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose

Traces explain how work moved through NEXUS.

They capture causality across agents, contracts, capabilities, tools, skills,
runtimes, providers, state transitions, approvals, safety blocks, and release
control.

---

## Trace Types

- `task_trace`
- `agent_trace`
- `tool_trace`
- `skill_trace`
- `runtime_trace`
- `provider_trace`
- `batch_trace`
- `state_transition_trace`
- `approval_trace`
- `safety_trace`
- `incident_trace`
- `release_trace`
- `eval_trace`

---

## Trace Event Shape

```json
{
  "traceId": "",
  "spanId": "",
  "parentSpanId": "",
  "eventType": "",
  "projectId": "",
  "taskId": "",
  "agentId": "",
  "capabilityId": "",
  "contractId": "",
  "runtime": "",
  "provider": "",
  "stateBefore": "",
  "stateAfter": "",
  "result": "PASS|FAIL|INFO|BLOCKED",
  "summary": "",
  "evidenceIds": [],
  "artifactIds": [],
  "policyIds": [],
  "approvalIds": [],
  "cost": {},
  "dataClassification": "public|internal|confidential|restricted|secret|unknown",
  "redacted": true,
  "createdAt": ""
}
```

---

## Trace Rules

- every task run should have one `traceId`
- every tool, skill, model, and runtime call should create a span
- parent-child relationships must preserve causality
- trace events must not contain raw secrets
- trace events should reference evidence or artifacts, not embed large content
- state transitions must include before and after state
- safety blocks must include blocking policy
- provider calls must include provider, model, and cost metadata
- batch traces must separate submit, poll, complete, and reconcile
- release traces must link all gate evidence

---

## Trace Usage

Trace data should later support:

- operator debugging in Command Center
- incident reconstruction
- retry and recovery analysis
- release evidence linkage
- capability usage review
- cost and provider usage attribution
- offline eval outputs

Trace output is explanatory metadata. It is not a substitute for evidence or
artifact references.
