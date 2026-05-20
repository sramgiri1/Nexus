# P93 Enterprise Live Runtime Expansion

P93 starts after P92 local SQLite runtime closure and the P91 stale-status
cleanup. The goal is to move NEXUS OS toward useful DB-backed live-runtime
workflows while preserving the execution contract.

P93 does not broadly unlock runtime mutation. Only explicitly scoped local
SQLite CRUD may be enabled in later P93 subphases. Provider/model calls, agent
dispatch, tool execution, worker execution, project creation, project mutation,
hosted DBs, network calls, deploy, release, export, package creation, and
provider spend remain blocked unless a later phase explicitly scopes and
validates them.

## P93.1 Schema / Policy / Contract

P93.1 is complete. It defines the implementation-grade contract for enterprise
live-runtime expansion and splits the work into seven subphases:

- P93.1 Schema / Policy / Contract
- P93.2 Enterprise Runtime CRUD Plan Model
- P93.3 Governed Runtime Mutation Request Model
- P93.4 Local CRUD Execution Admission
- P93.5 Command Center Live Runtime UX
- P93.6 Tests / Docs / Roadmap
- P93.7 Final Validation

Validation:

- `npm run check:p931-enterprise-live-runtime-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`

Known limitation: P93.1 is contract-only. It does not modify `db/**`, run an
executor, dispatch agents, execute tools/workers, create or mutate projects,
call providers/models, write DB state, use network calls, deploy, release,
export, package, or spend.

## Next Subphases

P93.2 is next. It must add the local enterprise runtime CRUD plan model without
executing mutations.
