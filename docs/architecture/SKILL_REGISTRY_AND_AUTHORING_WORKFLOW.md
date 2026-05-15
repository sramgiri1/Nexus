# Skill Registry + Authoring Workflow

## Purpose

P50 creates a read-only, governed registry for reusable NEXUS skills. A skill is
a versioned operating asset that describes what an agent can help with, what
inputs and outputs are expected, what evidence is required, and which safety
boundaries apply.

## P50.1 - Skill Registry Schema

P50.1 defines the core schema, registry policy, and initial built-in skill
placeholders. Skills are visible as governance metadata only.

Safety posture:

- skill execution is disabled
- provider calls are disabled
- tool and MCP calls are disabled
- worker runtime is disabled
- DB writes are disabled
- project mutation is disabled
- agent definition mutation is disabled

## Registry Fields

Each registered skill includes:

- `skillId`
- `name`
- `description`
- `category`
- `ownerAgent`
- `allowedAgents`
- `requiredCapabilities`
- `compatibleProjectTypes`
- `compatibleStacks`
- `inputsSchema`
- `outputsSchema`
- `requiredEvidence`
- `testRequirements`
- `costPolicy`
- `riskLevel`
- `dataClassification`
- `executionEnabled`
- `providerCallsAllowed`
- `toolCallsAllowed`
- `projectMutationAllowed`
- `requiresApprovalFor`
- `version`
- `status`
- `createdAt`
- `updatedAt`

## Non-Goals

P50 does not execute skills, call providers, call tools, start workers, write to
DB, mutate projects, or modify agent definitions.

## Next Subphase

P50.2 adds the skill contract model used to describe allowed use cases,
forbidden use cases, evidence, rollback requirements, and safety notes.
