# Evidence Lineage

**Version:** 1.0  
**Date:** 2026-05-06

---

## Core Principle

Evidence must be traceable from claim → task → skill or runtime → artifact →
decision.

Agent claim is not evidence.

---

## Lineage Chain

Founder intent  
→ task contract  
→ capability  
→ runtime, tool, or skill execution  
→ trace  
→ artifact  
→ evidence  
→ gate result  
→ release decision

---

## Evidence Lineage Item

```json
{
  "evidenceId": "",
  "sourceType": "skill|tool|runtime|provider|batch|approval|manual|eval",
  "sourceId": "",
  "taskId": "",
  "projectId": "",
  "agentId": "",
  "capabilityId": "",
  "contractId": "",
  "artifactIds": [],
  "traceIds": [],
  "supports": [],
  "result": "PASS|FAIL|INFO|BLOCKED",
  "summary": "",
  "createdAt": ""
}
```

---

## Rules

- agent claim is not evidence
- evidence must identify source
- evidence should link artifacts where applicable
- evidence should link trace where applicable
- gate results require evidence
- release decisions require gate evidence
- batch evidence cannot pass gates
- manual evidence must identify actor or approval
- evidence should not contain raw secrets
- evidence lineage should survive rollback and recovery

---

## Why Lineage Matters

Lineage lets the OS explain:

- which claim is supported
- which task produced that support
- which skill or runtime generated it
- which artifact backs it
- which gate consumed it
- which release decision depended on it

Without lineage, evidence becomes detached files. With lineage, evidence becomes
decision-grade proof.
