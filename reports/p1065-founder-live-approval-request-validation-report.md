# P106.5 Founder Live Approval Request Validation Report

## Metadata

- Phase: P106.5
- Generated at: 2026-05-28T18:17:42.442Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: 68fae29a
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates aggregate P106 founder live approval request coverage across contract, schema, model, queue preview, Command Center UX, route tests, docs, reports, and phase status.
- Confirms approval request queue UX remains display-safe, useful, and non-runnable.
- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, approval request submission/capture/persistence/writes, runtime admission, execution unlock, or spend.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| package script registered | PASS |  |
| all P106 scripts registered | PASS |  |
| all prior P106 reports exist | PASS |  |
| contract marks P106.1-P106.5 complete | PASS |  |
| contract keeps P106.6 planned or complete | PASS |  |
| contract records aggregate validation commands | PASS |  |
| P106.5 avoids forbidden file scope | PASS |  |
| dashboard data and page still expose queue UX | PASS |  |
| route safety coverage retained | PASS |  |
| queue UX remains useful | PASS |  |
| queue unsafe counts remain zero | PASS |  |
| queue rows remain blocked | PASS |  |
| chat and lite stay clean in source | PASS |  |
| docs record P106.5 | PASS |  |
| platform roadmap records P106.5 | PASS |  |
| README records P106.5 | PASS |  |
| phase status advanced | PASS | P106.6/P106.5/P106.7 |
| aggregate UX avoids raw private IDs | PASS |  |
| aggregate UX avoids raw packet keys | PASS |  |
| aggregate UX avoids fake unsafe runnable actions | PASS |  |
| aggregate UX avoids raw dumps | PASS |  |
| DemoApp not exposed in Command Center source | PASS |  |
## Validation Commands

- npm run check:p1065-founder-live-approval-request-validation
- npm run check:p1064-command-center-approval-request-ux
- cd dashboard && npx playwright test tests/routes.spec.js --grep "Founder live approval request queue appears on non-chat founder routes"
- cd dashboard && npm run build
- npm run check:p1063-founder-live-approval-request-queue-preview
- npm run check:p1062-founder-live-approval-request-model
- npm run check:p1061-founder-live-approval-request-boundary-contract
- npm run check:os-phase-status
- npm run check:phase-validation-coverage
- git diff --check
## Known Limitations

- P106.5 is validation only. It does not submit approval requests, capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.
## Result

PASS (22/22)
