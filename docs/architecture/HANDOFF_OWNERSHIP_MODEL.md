# Handoff Ownership Model

## Core Principle

Handoffs are contracts, not vague messages.

A handoff must include:

- `sourceAgent`
- `targetAgent`
- `projectId`
- `taskId`
- `objective`
- `context`
- `allowedFiles` if file work is involved
- `forbiddenFiles`
- `acceptanceCriteria`
- `requiredEvidence`
- `riskLevel`
- `blocking`
- `dependsOn`
- `escalationOwner`

## Handoff Types

- `control_to_orchestration`
- `orchestration_to_execution`
- `product_to_design`
- `product_to_backend`
- `product_to_ios`
- `product_to_web`
- `implementation_to_verification`
- `verification_to_remediation`
- `platform_to_approval`
- `data_to_compliance`
- `ai_to_security`
- `growth_to_content`
- `observability_to_remediation`
- `release_to_decision`

## Canonical Ownership Flow

- NEXUS hands planning to SHEPHERD.
- SHEPHERD hands execution to domain owners.
- Execution agents hand verification to AUDITOR, SENTINEL, and WARDEN.
- Verification failures route remediation to implementation owners.
- Privacy and compliance issues route to WARDEN.
- Deployment, secrets, and migrations route through FORGE and approval.
- Feedback routes through RELAY and then to the correct owner.
- Release decisions route to NEXUS only after evidence exists.

## Handoff Rules

- handoffs cannot bypass contracts
- handoffs cannot bypass capabilities
- handoffs cannot bypass approvals
- handoffs must identify the owner and escalation path
- handoff scope must match the target agent’s primary domain
- verification handoffs must include required evidence, not a completion claim
- approval handoffs must explain why approval is required
- remediation handoffs must identify the original failing evidence

## Handoff Anti-patterns

- "someone fix this"
- "mark complete"
- "run all checks" without required skills or evidence
- "deploy this" without environment and approval context
- "use provider" without data classification or provider policy
- "analyze DB" without data classification and approval
- "pass gate" without evidence

## Ownership Consequences

If a handoff is missing scope, evidence requirements, or escalation owner, the
correct behavior is to block or escalate. The system should not guess who owns
the work.
