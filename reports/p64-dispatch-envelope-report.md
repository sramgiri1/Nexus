# P64 Dispatch Envelope Report

## Metadata

- Phase: P64.2
- Generated at: 2026-05-18T23:04:18.225Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: 0115ea8
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates pure P64.2 dispatch envelopes and policy decisions.
- Does not execute providers, tools, project mutation, DB writes, deploy, network calls, or worker runtime.
- Fixtures use public-safe labels and redacted payload summaries.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| fixture count | PASS | 2 fixtures |
| envelope validation | PASS |  |
| policy validation | PASS |  |
| result envelope reuse | PASS |  |
| execution disabled | PASS |  |
| mutation boundaries disabled | PASS |  |
| redaction applied | PASS |  |
| display safe labels | PASS |  |
| P64 remains in progress | PASS | in_progress |
| P64.2 phase status | PASS | complete |
## Validated Fixtures

- provider preview request: DENIED; P64.2 defines governed dispatch envelopes only; execution is not enabled.
- tool preview request: DENIED; P64.2 defines governed dispatch envelopes only; execution is not enabled.
## Failures

- None
## Result

PASS
