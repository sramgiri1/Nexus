# Testing Strategy

NEXUS uses layered validation so new phases can be checked without enabling
unsafe runtime behavior.

## Test Categories

- Schema checks validate object shape and required fields.
- Policy checks validate disabled execution, write, provider, tool, worker, and
  DB flags.
- Module/export checks verify public functions remain available.
- Checker scripts validate phase outputs and write reports.
- Route/Playwright tests verify Command Center pages, tabs, themes, and copy.
- Docs coverage tests verify local links and public-safe wording.
- Public/private/demo safety tests verify data boundaries.
- Phase status tests verify OS roadmap status consistency.
- Screenshot/visual audits catch broad UX regressions.
- Integration/dry-run tests validate boot or runtime plans without unsafe
  execution.
- Cost governance checks validate ledgers, budgets, estimates, preview actuals,
  and budget decisions without provider calls or real spend.
- Policy Center checks validate policy registry, versions, diff previews,
  simulations, exception workflows, break-glass previews, and Command Center UX
  without changing runtime enforcement.
- Secret boundary checks validate reference-only credential metadata and scan
  P59 outputs for secret-like strings without reading `.env` files.

## Update Rule

If a phase changes route labels, page state, Command Center UX, or behavior, it
must update old tests and remove obsolete assertions. Failing tests should
usually be treated as stale-contract evidence or real regression evidence, not
ignored.

## Safety Rule

Do not run private project tests, Prisma commands, provider calls, xcodebuild, or
workflow execution unless a phase explicitly allows it.
