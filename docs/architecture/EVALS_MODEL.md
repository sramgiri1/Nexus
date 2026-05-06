# Evals Model

**Version:** 1.0  
**Date:** 2026-05-06

---

## Core Principle

NEXUS should be tested against OS-level safety and correctness scenarios, not
only unit tests.

Evals verify that:

- agents do not overclaim authority
- gates require evidence
- batch cannot pass gates
- restricted data is blocked
- OpenRouter is limited by data classification
- Xcode tasks require macOS runtime
- deploys, secrets, and migrations require approval
- tool use requires capability
- stuck tasks route to reliability handling
- release GO requires gate evidence

---

## Eval Scenario Shape

```json
{
  "scenarioId": "",
  "name": "",
  "description": "",
  "category": "",
  "input": {},
  "expected": {
    "result": "PASS|FAIL|BLOCKED",
    "blockedBy": "",
    "requiredEvidence": [],
    "forbiddenActions": [],
    "requiredPolicies": []
  },
  "riskLevel": "",
  "tags": []
}
```

---

## Eval Categories

- `agent_authority`
- `verification_gate`
- `batch_policy`
- `data_protection`
- `provider_security`
- `runtime_routing`
- `approval_workflow`
- `capability_policy`
- `reliability`
- `release_control`

---

## Eval Rules

- evals must be deterministic where possible
- evals do not call real providers by default
- evals do not require secrets
- no secrets belong in eval payloads or eval artifacts
- evals should run offline
- evals should generate reports
- evals should be linked to policies and capabilities
- eval failures block promotion to demo or release readiness

These evals are intentionally offline and deterministic by default. They exist
to test policy, traceability, and OS behavior, not model creativity.

Representative scenarios include:

- batch cannot pass gates
- release requires gate evidence
- restricted data blocked from provider execution
- Xcode requires macOS runtime
- capability required for tool use

---

## Future Eval Runner

A future eval runner should:

- load scenarios
- evaluate expected policies
- check outputs
- write eval report
- emit `eval_trace`
- link evidence

This phase does not implement the full runner.

It creates scenario files, policy expectations, and validation checks only.
