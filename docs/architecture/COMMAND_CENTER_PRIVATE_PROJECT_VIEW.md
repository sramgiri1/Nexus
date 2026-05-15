# Command Center Private Project View

## Purpose

P32-LOCAL adds a read-only Command Center view for governed private-project
validation state. It follows the P31 remediation phase and makes the private
validation story visible without exposing source snippets, secrets, or mutation
controls in the UI.

## Why This Follows P31

P31 completed a real governed private-project remediation cycle:

- inventory and readiness
- validation planning
- command classification
- controlled backend validation
- remediation planning and narrow fix
- post-fix validation with a clean governed backend pass

The Command Center now needs a truthful local-private surface for that
sequence.

## Current Phase

This phase is a read-only private-project validation view driven by a generated
snapshot.

The browser cannot safely read arbitrary local files or private artifacts at
runtime. Until a governed read API exists, NEXUS generates a browser-safe
module from generated reports, contracts, and local runtime records.

## What Is Shown

- current private-project validation status
- latest backend validation result
- latest remediation status
- validation timeline from P27 through P31
- linked reports and contracts
- redacted evidence, audit, and runtime-event references
- governance posture
- known validation hygiene notes
- next recommended governed step

## What Is Not Shown

- source snippets
- secret values
- `.env` content
- private product descriptions
- direct source-file inspection details

## Why the UI Stays Read-only

- no live API exists yet
- no DB mirror exists yet
- no UI mutation bridge exists yet
- no provider calls are allowed
- no backend test execution is allowed from the UI

Operators can regenerate the snapshot locally, but the UI itself cannot run,
fix, approve, or mutate anything in this phase.

## Snapshot Generation

The generated snapshot is generated with:

```bash
NEXUS_MODE=local-private npm run generate:private-validation-snapshot
```

This writes:

- `reports/private-validation-snapshot.json`
- `dashboard/src/data/privateValidationSnapshot.js`

The dashboard consumes the generated JS module and never reads the private
filesystem directly at browser runtime.

## P48.8 Projects Operating Surface

The Projects route now presents private project context as a tabbed operating
surface:

- Portfolio
- Active Project
- Stack Profile
- Capabilities
- Milestones
- Gaps
- Adapter / Settings

The active project label is primary. Environment and mode badges are secondary.
`DemoApp` is allowed only on the demo route or demo-only artifacts. Raw project
IDs, mission IDs, and file paths belong in Developer Details, not the primary
operator view.

Adapter runtime, provider/tool/worker dispatch, DB writes, and project mutation
remain disabled by policy.

## Known Validation Hygiene

Private branches have one known non-blocking validation hygiene item:

- if `reports/public-safety-report.md` is regenerated on a private branch and
  includes private branch names in metadata, restore it to the committed
  public-safe baseline before running guarded-task checks

This does not weaken public safety. It preserves the public-safe report
baseline while allowing private-branch validation work to continue locally.

## What Is Not Implemented

- no API
- no DB
- no UI actions
- no provider calls
- no network calls
- no backend test execution from UI
- no project mutation from the UI

## Next Phase

The next governed step after a validated private-project snapshot is a Command
Center action bridge for governed private-project tasks, or the next controlled
implementation task under the same local-private safety boundary.
