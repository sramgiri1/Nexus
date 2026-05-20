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

## Next Subphases

- P91.2 Core Workstream Activation Model: define local workstream activation
  planning data from the P90 PRD artifact.
- P91.3 Safe Activation Review Packet: build a local review packet without
  dispatch or mutation.
- P91.4 Command Center UX: show activation planning state, owner lanes,
  blockers, disabled reasons, evidence, activity, and cost.
- P91.5 Tests / Checkers: aggregate backend and UX validation.
- P91.6 Docs / Roadmap: close docs and status evidence.
- P91.7 Final Validation: close P91 and hand off to the next scoped phase.
