# P91 Governed Founder Workstream Activation Planning

P91 starts after P90 local founder PRD authoring. The goal is to plan how the
local PRD artifact can map into governed workstream activation review.
P91 does not enable provider/model calls, agent dispatch, tool execution, worker
execution, project creation, project mutation, DB writes, deploy, release,
export, package creation, network calls, or provider spend.

## Safety Rules

- NEXUS OS changes only.
- Do not modify `projects/**`, `careloop/**`, generated app `Sources/Tests`,
  `providers/**`, `tools/**`, `worker-runtime/**`, DB/prisma/migrations,
  deploy/release/export/package roots, or `.env*`.
- Do not enable provider/model calls, agent dispatch, tool execution, worker
  execution, project creation, project mutation, DB writes, deploy, release,
  export, package creation, network calls, or provider spend unless that exact
  lane is scoped and validated in its own subphase.
- Do not expose DemoApp in full Command Center.
- Do not expose raw private project IDs.
- Do not invent fake working actions.

## P91.1 Schema / Policy / Contract

P91.1 is complete. It defines the implementation-grade execution contract for
governed founder workstream activation planning. The lane is intentionally
narrow: later subphases may map the P90 local PRD artifact to local workstream
activation review data, but agent dispatch, project mutation, provider/model
calls, DB writes, deploy/release/export/package actions, network calls, and
spend remain blocked.

Validation:

- `npm run check:p911-founder-workstream-activation-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P91.1 is schema, policy, and contract only. It does not run an
executor, dispatch agents, execute tools/workers, create or mutate projects,
call providers/models, write DB state, use network calls, deploy, release,
export, package, or spend.

## P91.2 Core Workstream Activation Model

P91.2 is complete. It adds a deterministic local founder workstream activation
planning model that reuses the P90 safe PRD artifact and maps it into product,
design, engineering, go-to-market, finance, operations, legal, and support
review lanes. The model records lane objectives, owner capabilities, required
evidence, readiness, blockers, disabled reasons, evidence, activity, cost
posture, and unsafe runtime flags blocked.

Validation:

- `npm run check:p912-founder-workstream-activation-model`
- `npm run check:p911-founder-workstream-activation-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P91.2 is a local model only. It does not run an executor,
dispatch agents, execute tools/workers, create or mutate projects, call
providers/models, write DB state, use network calls, deploy, release, export,
package, or spend.

## P91.3 Safe Activation Review Packet

P91.3 is complete. It builds a deterministic local activation review packet from
the P91.2 workstream activation model. The packet includes review items,
operator checklist, readiness, blockers, disabled reasons, evidence, activity,
cost posture, and unsafe runtime flags blocked.

Validation:

- `npm run check:p913-founder-activation-review-packet`
- `npm run check:p912-founder-workstream-activation-model`
- `npm run check:p911-founder-workstream-activation-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P91.3 is a local review packet only. It does not run an
executor, dispatch agents, execute tools/workers, create or mutate projects,
call providers/models, write DB state, use network calls, deploy, release,
export, package, or spend.

## P91.4 Command Center Workstream Activation UX

P91.4 is complete. It exposes the P91.3 activation review packet in the
Business Build Command Center page as a dedicated Activation Review tab. The
tab shows local review state, readiness count, owner capability, owner lanes,
operator checklist, blockers, evidence, activity, cost posture, and explicit
blocked safety rows.

Validation:

- `npm run check:p914-command-center-workstream-activation-ux`
- `npm run check:p913-founder-activation-review-packet`
- `npm run check:p912-founder-workstream-activation-model`
- `npm run check:p911-founder-workstream-activation-contract`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "Business Build Activation Review"`
- `cd dashboard && npm run build`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P91.4 is Command Center UX only. It does not run an executor,
dispatch agents, execute tools/workers, create or mutate projects, call
providers/models, write DB state, use network calls, deploy, release, export,
package, or spend.

## Next Subphases

## P91.5 Tests / Checkers

P91.5 is complete. It adds aggregate validation for the P91 founder workstream
activation lane. The checker verifies P91.1 through P91.4 reports, package
scripts, committed status evidence, activation plan validation, review packet
validation, Business Build Activation Review wiring, Playwright coverage, docs,
roadmap, and safety boundaries.

Validation:

- `npm run check:p915-tests-checkers`
- `npm run check:p914-command-center-workstream-activation-ux`
- `npm run check:p913-founder-activation-review-packet`
- `npm run check:p912-founder-workstream-activation-model`
- `npm run check:p911-founder-workstream-activation-contract`

Known limitation: P91.5 is validation aggregation only. It does not run an
executor, dispatch agents, execute tools/workers, create or mutate projects,
call providers/models, write DB state, use network calls, deploy, release,
export, package, or spend.

## Next Subphases

## P91.6 Docs / Roadmap

P91.6 is complete. It closes the P91 plan doc, platform roadmap, execution
contract, OS roadmap, phase status, and evidence reports before final
validation. The closure preserves the display-only activation review boundary
and keeps the P91.7 handoff explicit.

Validation:

- `npm run check:p916-docs-roadmap`
- `npm run check:p915-tests-checkers`
- `npm run check:p914-command-center-workstream-activation-ux`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`

Known limitation: P91.6 is docs and roadmap closure only. It does not run an
executor, dispatch agents, execute tools/workers, create or mutate projects,
call providers/models, write DB state, use network calls, deploy, release,
export, package, or spend.

## Next Subphases

P91.7 is next.

- P91.7 Final Validation: close P91 and hand off back to the post-P92 live-runtime roadmap.
