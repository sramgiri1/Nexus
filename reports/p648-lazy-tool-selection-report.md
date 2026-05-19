# P64.8 Lazy Tool Selection Report

## Metadata

- Phase: P64.8.3
- Generated at: 2026-05-19T00:46:54.452Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: 35dec9b
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates selected lazy tool contract packets for code-mode preview.
- Stores contract summaries only; raw input/output schemas and raw MCP schemas are excluded.
- Does not execute code, providers, tools, project mutation, DB writes, deploy, network calls, workers, or bulk schema loading.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| fixture count | PASS | 2 fixtures |
| packet validation | PASS |  |
| allowed and blocked cases | PASS |  |
| expectations match | PASS |  |
| execution disabled | PASS |  |
| mutation boundaries disabled | PASS |  |
| bulk loading blocked | PASS |  |
| selected summaries only | PASS |  |
| display safe labels | PASS |  |
| P64.8.3 phase status | PASS | complete |
## Packets

- selected metadata contracts: state=ready_preview; selected=2; budgetAllowed=true
- bulk schema request blocked: state=blocked_preview; selected=1; budgetAllowed=false
## Failures

- None
## Result

PASS
