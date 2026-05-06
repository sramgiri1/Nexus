# nexus-agent-retrofit

## Name

NEXUS Agent Retrofit

## Description

Retrofit selected NEXUS agent prompt files to the operating-system structure while preserving useful content and keeping runtime behavior untouched.

## When to Use

Use when a phase explicitly scopes agent prompt retrofits and lists the exact agent files allowed for modification.

## Steps

1. Inspect the relevant `agents/_shared/*` standards before editing any agent file.
2. Inspect the selected agent files in scope.
3. Preserve useful existing role-specific content.
4. Add the required OS sections consistently.
5. Enforce contract, state-machine, model, batch, skill, evidence, and handoff behavior in the prompt text.
6. Do not change runtime behavior or runtime files.
7. Do not modify unrelated agents.
8. Verify no forbidden files were touched before committing.

## Safety Checks

- Confirm the phase lists the exact allowed agent files.
- Confirm shared standards exist and are readable.
- Confirm no runtime file is edited.
- Confirm no unrelated agent file changed.

## Allowed Outputs

- Updated agent prompt files inside scope
- Retrofit summary
- Diff summary
- Validation notes required by the phase

## Forbidden Actions

- Changing runtime behavior
- Modifying unrelated agents
- Editing files outside the allowed agent list
- Claiming enforcement exists in runtime when only prompt docs changed

## Agent Retrofit Checklist

- Shared Standards
- Identity
- Mission
- Authority
- Inputs
- Contract Behavior
- State Machine Behavior
- Model / Cost / Batch Policy
- Skills
- Evidence
- Handoff Rules
- Forbidden Actions
- Output Contract
- Done Criteria
- Escalation Rules
