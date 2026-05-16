# Cost Center + Budget Enforcement

P57 adds a governed Cost Center foundation for future NEXUS execution. It
models cost records, budget policies, estimates, preview actual records, and
budget decisions before provider/tool/worker execution is enabled.

## Scope

- P57.1 defines the redacted cost ledger schema and preview ledger report.
- P57.2 defines budget policies for global, project, mission, task, agent,
  skill, hook, tool, trigger, provider, API batch, worker, and OS phase scopes.
- P57.3 estimates costs before future runs using static preview assumptions.
- P57.4 records preview actual costs after future runs without billing APIs.
- P57.5 evaluates budget decisions: `ALLOW`, `BLOCK`,
  `REQUIRE_APPROVAL`, and `RECORD_ONLY`.
- P57.6 exposes Cost Center status, budgets, estimates, ledger, enforcement,
  gaps, and developer references in Command Center.
- P57.7 validates the full P57 surface and makes P58 the next phase.

## Safety Posture

P57 does not spend money. It does not call providers, upload batches, execute
tools, start workers, write to DB, mutate project files, or call external
network services. All cost data is preview metadata and must be labeled as
estimate, preview, or disabled.

## Operator UX

The Command Center Cost Center route is read-only and tabbed:

- Overview: cost readiness and disabled spend posture.
- Budgets: budget scopes and approval threshold preview.
- Estimates: sample estimate records and assumptions.
- Ledger: redacted cost ledger preview.
- Enforcement: budget decision examples.
- Gaps / Next: missing runtime dependencies for real cost capture.
- Developer Details: safe policy/report references only.

## Next Phase

P58 Policy Center + Governance Admin should connect policy administration to
the cost controls modeled in P57, still preserving explicit execution
boundaries.
