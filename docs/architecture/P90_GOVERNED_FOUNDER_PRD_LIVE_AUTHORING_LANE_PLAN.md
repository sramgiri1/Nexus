# P90 Governed Founder PRD Live Authoring Lane Plan

P90 starts the first narrow live lane after P89: local founder PRD authoring.
This is not agent dispatch, project generation, provider execution, DB writes,
deploy, export, package creation, or spend. P90 must only make a deterministic
local PRD authoring path live after the exact subphase scopes and validates it.

## Safety Rules

- NEXUS OS changes only.
- Do not modify `projects/**`, `careloop/**`, generated app `Sources/Tests`,
  `providers/**`, `tools/**`, `worker-runtime/**`, DB/prisma/migrations,
  deploy/release/export/package roots, or `.env*`.
- Do not enable provider/model calls, agent dispatch, tool execution, worker
  execution, project mutation, DB writes, deploy, release, export, package
  creation, network calls, or provider spend unless that exact lane is scoped
  and validated in its own subphase.
- Do not expose DemoApp in full Command Center.
- Do not expose raw private project IDs.
- Do not invent fake working actions.

## P90.1 Schema / Policy / Contract

P90.1 is complete. It defines the implementation-grade P90 execution contract
for the governed local founder PRD authoring lane. The lane is intentionally
narrow: it may later turn collected founder context into a local PRD authoring
result envelope, while project mutation, provider/model calls, agent dispatch,
DB writes, deploy/release/export/package actions, network calls, and spend
remain blocked.

Validation:

- `npm run check:p901-founder-prd-live-lane-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P90.1 is schema, policy, and contract only. It does not run an
executor, dispatch agents, execute tools/workers, mutate projects, call
providers/models, write DB state, use network calls, deploy, release, export,
package, or spend.

## Next Subphases

- P90.2 Core Local PRD Model: define deterministic local PRD authoring records.
- P90.3 Safe Local PRD Authoring: produce a local result envelope without
  provider calls, agent dispatch, or project mutation.
- P90.4 Command Center UX: show the PRD lane as real local state with blockers,
  owner, evidence, activity, and cost.
- P90.5 Tests / Checkers: aggregate backend and UX validation.
- P90.6 Docs / Roadmap: close docs and status evidence.
- P90.7 Final Validation: close P90 and hand off to the next scoped phase.
