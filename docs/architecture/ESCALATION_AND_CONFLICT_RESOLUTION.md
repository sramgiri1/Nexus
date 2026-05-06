# Escalation and Conflict Resolution

## Escalation Principle

When ownership is unclear, NEXUS should not guess.

It should escalate to the correct owner or request a contract correction.

## Escalation Types

- `missing_contract`
- `ambiguous_owner`
- `conflicting_agents`
- `missing_evidence`
- `failed_gate`
- `policy_block`
- `approval_required`
- `data_classification_missing`
- `provider_policy_missing`
- `runtime_missing`
- `capability_missing`
- `security_incident`
- `release_blocker`

## Escalation Owners

- `nexus` — strategic decision, release blocker, final prioritization
- `shepherd` — planning ambiguity, task graph ambiguity, owner routing
- `auditor` — code quality evidence ambiguity
- `sentinel` — QA, test, and runtime evidence ambiguity
- `warden` — privacy, compliance, permission, and security ambiguity
- `forge` — deploy, environment, CI/CD, and secrets approval path
- `stream` — data pipeline and data flow ambiguity
- `synapse` — provider, tool, and MCP ambiguity
- `relay` — feedback and bug-routing ambiguity

## Conflict Rules

### 1. Verification conflict

If `auditor`, `sentinel`, or `warden` disagree, release is blocked until
resolved.

### 2. Product vs. implementation conflict

`atlas` and `shepherd` resolve scope. Implementation agents do not silently
decide scope.

### 3. Design vs. implementation conflict

`prism` and `atlas` clarify the expected surface. Implementation agents block if
the design intent is unclear.

### 4. Security vs. speed conflict

Security, data protection, and governor boundaries win by default.

### 5. Cost vs. quality conflict

NEXUS decides with budget and evidence. Agents do not bypass cost policy on
their own.

### 6. Provider fallback conflict

Fallback is not allowed on safety, budget, permission, secret, or verification
failure.

### 7. Release conflict

NEXUS may only decide after required evidence exists.

### 8. Unresolved escalation conflict

Release remains blocked while a blocking escalation is unresolved.

## Escalation Output Shape

```json
{
  "escalationId": "",
  "type": "",
  "projectId": "",
  "taskId": "",
  "raisedBy": "",
  "owner": "",
  "reason": "",
  "blocking": true,
  "requiredAction": "",
  "evidence": [],
  "createdAt": ""
}
```

## Resolution Expectations

- escalations must be auditable
- escalations must reference evidence when available
- blocking escalations must halt release progression
- security wins by default
- approval-required escalations remain blocked until approval resolves them
- missing capability or missing contract escalations require correction rather
  than silent fallback
