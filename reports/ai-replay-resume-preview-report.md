# AI Replay Resume Preview Report

## Metadata

- Phase: P63.6
- Generated at: 2026-05-18T14:01:58.243Z
- Validation branch: codex/p63-snapshot-contract
- Validation HEAD: 84b0f00
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Phase: P63.6
- Replay and resume builders produce deterministic previews only.
- No replay, restore, resume, provider dispatch, tool dispatch, worker execution, project mutation, DB write, schema migration, deploy, or queue mutation is enabled.
## Preview States

- preview_only
- blocked
- missing_context
- requires_later_phase
## Checks

| Check | Status | Details |
| --- | --- | --- |
| state covered blocked | PASS |  |
| state covered missing_context | PASS |  |
| Replay preview validates replay_context_missing | PASS |  |
| Replay preview disables execution replay_context_missing | PASS |  |
| Replay preview has required context replay_context_missing | PASS |  |
| Replay preview has disabled reason replay_context_missing | PASS |  |
| Replay preview omits raw private ids replay_context_missing | PASS |  |
| Replay preview validates replay_policy_blocked | PASS |  |
| Replay preview disables execution replay_policy_blocked | PASS |  |
| Replay preview has required context replay_policy_blocked | PASS |  |
| Replay preview has disabled reason replay_policy_blocked | PASS |  |
| Replay preview omits raw private ids replay_policy_blocked | PASS |  |
| Resume preview validates resume_context_missing | PASS |  |
| Resume preview disables execution resume_context_missing | PASS |  |
| Resume preview has required context resume_context_missing | PASS |  |
| Resume preview has disabled reason resume_context_missing | PASS |  |
| Resume preview omits raw private ids resume_context_missing | PASS |  |
| Resume preview validates resume_policy_blocked | PASS |  |
| Resume preview disables execution resume_policy_blocked | PASS |  |
| Resume preview has required context resume_policy_blocked | PASS |  |
| Resume preview has disabled reason resume_policy_blocked | PASS |  |
| Resume preview omits raw private ids resume_policy_blocked | PASS |  |
| replay expected state replay_context_missing | PASS | actual missing_context |
| replay expected state replay_policy_blocked | PASS | actual blocked |
| resume expected state resume_context_missing | PASS | actual missing_context |
| resume expected state resume_policy_blocked | PASS | actual blocked |
| allowed states are preview-safe | PASS |  |
| no fake execution states | PASS |  |
## Failures

- None
## Reuse

- Reused P63 recovery preview vocabulary and checker/report patterns.
- Kept replay/resume as deterministic dry-run style planning data.
- Did not duplicate runtime dispatch, DB, phase-status, report writer, or redaction helpers.
## Result

PASS (28/28)
