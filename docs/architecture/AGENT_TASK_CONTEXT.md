# Agent Task Context

## Purpose

Phase 4D adds a lightweight adapter that normalizes task input into a consistent agent context object. It is advisory only in this phase. The adapter gives future runtime integration a stable shape for agent policy, evidence, tools, skills, and handoff hints without changing dispatch behavior today.

## Context Shape

`buildAgentContext(input)` returns:

```json
{
  "agentId": "",
  "agentGroup": "",
  "agentPlane": "",
  "agentClass": "",
  "taskContract": {},
  "normalizedTask": {},
  "modelPolicy": {},
  "batchPolicy": {},
  "allowedTools": [],
  "requiredSkills": [],
  "currentState": "",
  "evidenceRequired": [],
  "handoffRules": [],
  "riskLevel": "",
  "blocking": false,
  "dependsOn": [],
  "warnings": [],
  "errors": [],
  "contextVersion": "1.0"
}
```

## Adapter Functions

- `buildAgentContext(input)`: builds the advisory context object from contract-style or legacy task input.
- `validateAgentContext(context)`: validates the normalized shape and returns deterministic errors and warnings.
- `normalizeTaskContract(task)`: converts contract-style or legacy tasks into a best-effort contract shape.
- `deriveAgentProfile(agentId)`: maps all 20 retrofitted agents to group, plane, and class metadata.
- `deriveModelPolicy(agentId, task)`: derives local routing posture without touching providers or secrets.
- `deriveBatchPolicy(agentId, task)`: derives non-blocking batch eligibility using shared batch rules.
- `deriveEvidenceRequirements(agentId, task)`: derives evidence expectations by agent and task type.
- `deriveAllowedTools(agentId, task)`: derives conservative abstract tool namespaces only.
- `deriveRequiredSkills(agentId, task)`: derives skill expectations and verification-request skills.
- `deriveHandoffRules(agentId, task)`: derives advisory handoff targets and reasons.

## Legacy Task Support

The adapter supports:

1. Contract-style tasks with explicit `projectId`, `taskType`, `allowedFiles`, and related fields.
2. Legacy tasks with fields like `id`, `agent`, `description`, and `project`.

Legacy tasks are normalized into a best-effort contract shape and generate warnings such as:

- `legacy_task_format`
- `missing_allowed_files`
- `missing_acceptance_criteria`
- `missing_required_skills`

Legacy tasks do not fail validation unless the input is malformed or the agent is unknown.

## Model Policy Derivation

Model policy is deterministic and local:

- Control-plane release, security, and deploy decisions stay realtime.
- Verification gates stay deterministic or realtime, never batch when blocking.
- Code and platform implementation tasks stay realtime.
- Growth, strategy, observability, and some content tasks may be batch-eligible only when non-blocking and classification-safe.
- Fallback is disabled when the task indicates safety, budget, permission, secret, or verification failure.

This phase does not call providers or choose actual models. It only builds advisory policy metadata.

## Batch Policy Derivation

Batch policy follows the shared batch standard and encodes:

- whether a task is eligible
- whether it is never-batch
- whether reconciliation would be required
- allowed non-blocking uses such as:
  - `market_summary`
  - `pricing_variants`
  - `feedback_clustering`
  - `marketing_copy_variants`
  - `aso_keywords`
  - `analytics_summary`
  - `non_blocking_prd_draft`
  - `non_blocking_design_variants`

Never-batch task types stay realtime, including code edits, verification gates, release decisions, deploy, secrets changes, CI/CD changes, migrations, auto-heal, and Xcode execution tasks.

## Evidence Derivation

The adapter derives evidence expectations by agent and task type. Examples:

- `nexus`: `release_contract`, gate evidence
- `shepherd`: task and handoff contracts
- `auditor`: lint, static analysis, diff review, test coverage
- `sentinel`: tests, simulator, logs, security scan
- `warden`: privacy, permissions, App Store policy
- execution agents: changed-file summaries and verification requests
- strategy/growth agents: source notes, assumptions, claim checks, privacy review requests

This is guidance only. Runtime enforcement comes later.

## Skills and Tools Derivation

The adapter derives:

- static control and verification skills from the retrofitted standards
- verification-request skills for implementation, QA, privacy, permissions, and App Store-sensitive tasks
- abstract tool namespaces such as:
  - `repo.read`
  - `repo.write`
  - `memory.read`
  - `memory.write`
  - `skill.run`
  - `queue.enqueue`
  - `contract.validate`
  - `state.request_transition`
  - `evidence.write`
  - `approval.request`

The adapter does not invoke tools. It only exposes what future runtime integration can use as policy context.

## Handoff Derivation

The adapter derives advisory handoff rules based on the retrofitted roles. Examples:

- `nexus` prefers `shepherd`, `forge`, `warden`, `sentinel`, and `auditor`
- `shepherd` can route to execution and verification agents
- `core`, `swift`, `pixel`, `forge`, `stream`, and `synapse` derive verifier and dependency handoffs
- `relay`, `beacon`, `compass`, and `oracle` derive routing targets for downstream execution or review

No routing is enforced in Phase 4D.

## What Phase 4D Does Not Enforce Yet

Phase 4D does not:

- change runtime dispatch
- change `orchestrator/loop.js`
- change `orchestrator/runner.js`
- enforce contracts at runtime
- enforce state-machine transitions
- enforce tool limits
- enforce provider routing
- block execution based on the derived context

The adapter only prepares normalized context for later phases.

## Future Runtime Integration

Future runtime integration can use this adapter to:

1. build a normalized context before dispatch
2. validate task shape consistently
3. surface warnings for legacy or incomplete tasks
4. pass evidence requirements, skills, and handoff guidance into execution
5. add contract and state-machine enforcement in a later phase without rewriting agent prompts again

The intended next step is to wire `buildAgentContext` into dispatch entry points while keeping state transitions, approvals, and verification enforcement explicit and auditable.
