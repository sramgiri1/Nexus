# nexus-phase-implementation

## Name

NEXUS Phase Implementation

## Description

Execute a phase prompt safely by staying inside scope, making the smallest necessary changes, and finishing with the exact validation and git flow requested.

## When to Use

Use when a roadmap phase or architecture phase defines allowed files, forbidden files, validation commands, and commit instructions.

## Steps

1. Restate the phase goal in one or two lines.
2. List the allowed files from the prompt.
3. List the forbidden files from the prompt.
4. Inspect only the relevant docs, standards, or existing scoped files needed for the change.
5. Make the minimal set of changes required to satisfy the phase.
6. Run only the requested checks or validation commands.
7. Show a diff summary and changed files.
8. Commit and push only if the prompt explicitly says to do so.

## Safety Checks

- Reconfirm the current phase scope before editing.
- Stop if the requested work would touch forbidden files.
- Stop if the phase would require runtime changes not explicitly allowed.
- Keep edits narrow and reviewable.

## Allowed Outputs

- Scope summary
- Minimal patch inside allowed files
- Validation results requested by the phase
- Diff summary
- Commit and push confirmation only when explicitly authorized

## Forbidden Actions

- Modifying runtime outside scope
- Adding dependencies without approval
- Editing unrelated agents or files
- Changing model routing, governor, batch, tools, skills, providers, contracts, or state-machine unless the phase explicitly allows it
