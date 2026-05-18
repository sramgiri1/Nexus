# P63 AI Interaction Snapshot + Granular Recovery Layer

**Status:** Planned NEXUS OS phase.
**Track:** NEXUS_OS
**Parent phase:** `P63`
**Execution contracts:** `contracts/os-roadmap/p63-execution-contracts.json`
**Next phase after closure:** `P64` Provider + Tool Dispatch Through Governance

## Contract Rule

P63 must be implemented from the task contracts in
`contracts/os-roadmap/p63-execution-contracts.json`. Those contracts are the
source of truth for starting branch, expected base commit, allowed files,
forbidden files, exact files/modules, expected exports/schemas/data shapes,
narrow scope, safety rules, reuse checks, Command Center UX, theme handling,
Playwright coverage, checker updates, docs, phase status updates, validation
commands, final safety checks, git commands, and final response checklists.

Do not implement a P63 subphase from this document alone. Run
`npm run check:p63-execution-plan` before and after subphase edits.

Each subphase must stay independently commit-ready. If the exact files/modules
list grows beyond the implementation-control limit, split the subphase before
coding.

## Global Safety Boundary

- No provider dispatch.
- No tool dispatch.
- No worker execution or task reruns.
- No project mutation.
- No DB writes or migrations.
- No release/deploy action.
- No DemoApp exposure in full Command Center.
- No project/private raw IDs in primary UX.
- No fake working recovery actions.
- No duplicate helpers when an existing helper can be reused.
- No stale phase status after validation.

## Subphase Sequence

### P63.1 Snapshot Contract + Redaction Policy

Narrow scope: implement only the snapshot envelope, redaction levels, recovery
eligibility fields, and public-safe fixtures.

Required implementation contract:
`nexus-os-p63-1-snapshot-contract-redaction-policy`

Primary validation:

- `npm run check:ai-snapshot-contract`
- `npm run check:p63-execution-plan`
- `npm run check:os-phase-status`
- `npm run check:public-safety`
- `npm run check:format-readability`
- `git diff --check`

### P63.2 Interaction Capture Points

Narrow scope: map existing preview surfaces that can produce snapshot-ready
records and add pure adapter functions for local fixtures only.

Required implementation contract:
`nexus-os-p63-2-interaction-capture-points`

Primary validation:

- `npm run check:ai-snapshot-contract`
- `npm run check:ai-interaction-capture`
- `npm run check:p63-execution-plan`
- `npm run check:os-phase-status`
- `npm run check:public-safety`
- `git diff --check`

### P63.3 Recovery Point Model

Narrow scope: define recovery point shape, parent-child linkage, supersession,
failure classification, and resumability flags from redacted snapshots.

Required implementation contract:
`nexus-os-p63-3-recovery-point-model`

Primary validation:

- `npm run check:ai-recovery-point-model`
- `npm run check:p63-execution-plan`
- `npm run check:os-phase-status`
- `npm run check:state-machine`
- `git diff --check`

### P63.4 Snapshot Store + Retention Preview

Narrow scope: add local preview storage contracts, retention rules, pruning
previews, and safe fixture data for snapshots and recovery points.

Required implementation contract:
`nexus-os-p63-4-snapshot-store-retention-preview`

Primary validation:

- `npm run check:ai-snapshot-store`
- `npm run check:p63-execution-plan`
- `npm run check:os-phase-status`
- `npm run check:public-safety`
- `git diff --check`

### P63.5 Command Center Recovery UX

Narrow scope: add an inspection-only Recovery surface showing redacted
snapshots, recovery posture, trace links, and disabled action previews.

Required implementation contract:
`nexus-os-p63-5-command-center-recovery-ux`

Primary validation:

- `npm run check:command-center-recovery-ux`
- `npm run check:command-center-ux`
- `cd dashboard && npm run build && npm run test:unit && npm run test:pages`
- `npm run check:p63-execution-plan`
- `npm run check:os-phase-status`
- `git diff --check`

### P63.6 Recovery Replay / Resume Preview

Narrow scope: build deterministic plan previews that explain replay/resume
requirements, missing context, blocked actions, and next safe operator choices.

Required implementation contract:
`nexus-os-p63-6-recovery-replay-resume-preview`

Primary validation:

- `npm run check:ai-replay-resume-preview`
- `npm run check:command-center-recovery-ux`
- `npm run check:p63-execution-plan`
- `npm run check:os-phase-status`
- `npm run check:public-safety`
- `git diff --check`

### P63.7 Recovery Tests + Docs + Final Validation

Narrow scope: run final P63 validation, close the parent phase only with
evidence, and prepare P64 as next without enabling P64 behavior.

Required implementation contract:
`nexus-os-p63-7-recovery-tests-docs-final-validation`

Primary validation:

- `npm run check:ai-snapshot-contract`
- `npm run check:ai-interaction-capture`
- `npm run check:ai-recovery-point-model`
- `npm run check:ai-snapshot-store`
- `npm run check:command-center-recovery-ux`
- `npm run check:ai-replay-resume-preview`
- `npm run check:ai-recovery-final`
- `npm run check:p63-execution-plan`
- `npm run check:command-center-ux`
- `npm run check:os-phase-status`
- `npm run check:public-safety`
- `npm run check:format-readability`
- `cd dashboard && npm run build && npm run test:unit && npm run test:pages`
- `git diff --check`

## Completion Standard

P63 is complete only when every P63 subphase contract has real validation
evidence, P63 parent and P63.7 phase status are current, P64 remains planned,
and the final response checklist confirms no forbidden runtime capability was
enabled.
