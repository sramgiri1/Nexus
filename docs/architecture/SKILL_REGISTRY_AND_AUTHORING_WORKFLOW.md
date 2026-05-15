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

## P50.2 - Skill Contract Model

P50.2 adds contract helpers that turn registered skills into governance
contracts. A skill contract describes:

- purpose
- input contract
- output contract
- allowed use cases
- forbidden use cases
- required agent boundary
- required project profile
- required evidence
- test plan
- rollback requirement
- cost policy
- safety notes

Contracts are not executable. They do not call providers, tools, workers, DB
write paths, project mutation paths, or agent-definition mutation paths.

## Next Subphase

P50.3 adds governed skill templates for Plan, Review, QA, Ship, Retro, Guard,
and Explain-style operator workflows.

## P50.3 - Governed Skill Templates

P50.3 adds opinionated operator templates:

- Plan Mission
- Create Project Brief
- Review Plan
- Run QA Gate
- Fix Failing Test Plan
- Prepare Release Review
- Retro and Lessons Learned
- Guard / Freeze Scope
- Explain Current State

Each template defines a user-facing label, owner agent, supported agents,
required capability, required evidence, disabled execution reason, cost policy,
approval requirement, and linked Command Center action. Templates are visible
and governable only; they are not executable.

## Next Subphase

P50.4 maps skill templates to stack-specific profiles without enabling runtime
adapters.

## P50.4 - Stack-Specific Skill Profiles

P50.4 adds compatibility profiles for common project stacks:

- SaaS Node / Fastify
- Web React
- iOS Swift / Xcode
- Android Gradle placeholder
- Docs / Architecture
- NEXUS OS Platform

Each profile maps governed skill templates to compatible and unavailable
states, explains why unavailable skills are blocked, lists future adapters,
defines project profile requirements, and names validation expectations.

Profiles are planning and governance metadata only. They do not run stack
adapters, call providers, start tools, invoke Xcode/Gradle, write to DB, or
mutate project files.

## Next Subphase

P50.5 adds explicit skill test requirements for every governed template and
profile relationship.

## P50.5 - Skill Test Requirements

P50.5 defines test requirement metadata for every governed skill template.
Each requirement set includes:

- required static checks
- required contract checks
- required Command Center UI checks
- required evidence checks
- future runtime checks marked disabled

These requirements make future skill authoring safer by defining validation
expectations before any skill execution path exists. Runtime checks remain
future-only and disabled.

## Next Subphase

P50.6 exposes the Skill Registry in Command Center as a read-only operating
surface.
