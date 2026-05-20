# P88 Scoped Execution-Capable Activation Plan

P88 moves NEXUS from explicit live unlock readiness toward scoped, local-only
activation. It is not a broad live switch. Each subphase must define one narrow
activation lane, reuse existing NEXUS OS helpers, preserve Command Center UX, and
validate that unsafe runtime surfaces remain blocked unless a later subphase
explicitly scopes them.

## Safety Rules

- NEXUS OS changes only.
- Do not modify `projects/**`, `careloop/**`, generated app `Sources/Tests`,
  `providers/**`, `tools/**`, `worker-runtime/**`, DB/prisma/migrations,
  deploy/release/export/package roots, or `.env*`.
- Do not enable provider/model calls, agent dispatch, tool execution, worker
  execution, project mutation, DB writes, deploy, release, export, package
  creation, network calls, or provider spend unless that exact lane is scoped and
  validated in its own subphase.
- Do not expose DemoApp in full Command Center.
- Do not expose raw private project IDs.
- Do not invent fake working actions.

## P88.1 Scoped Activation Profile / Contract

P88.1 is complete. It adds a scoped execution-capable activation profile that
reuses P87 explicit live activation, local agent dispatch admission, and
generated workspace admission helpers. It defines local-only future activation
lanes, required gates, evidence, blockers, disabled reason, owner, activity,
cost posture, and validation commands. Every runtime flag remains false.

Validation:

- `npm run check:p881-scoped-execution-activation-profile`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P88.1 is profile-only. It does not wire or run an executor,
dispatch agents, call providers/models, execute tools/workers, mutate projects,
write DB state, use network calls, deploy, release, export, package, or spend.

## Next Subphases

- P88.2 Local Activation Request Model: define an operator-reviewable activation
  request envelope without execution.
- P88.3 Local Executor Admission: define the first executor admission boundary
  without running it.
- P88.4 Command Center UX: show scoped activation lanes and next actions without
  fake runnable actions.
- P88.5 Tests / Checkers: aggregate backend and UX coverage.
- P88.6 Docs / Roadmap: close documentation and status evidence.
- P88.7 Final Validation: final P88 evidence and handoff.
