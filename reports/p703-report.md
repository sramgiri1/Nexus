# P70.3 Incident Signal Preview Report

## Metadata

- Phase: P70.3
- Generated at: 2026-05-19T11:11:30.713Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: b480924
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates P70.3 incident signal preview records.
- Does not execute alerts, incidents, rollback, mitigation, deploys, project mutation, providers, tools, workers, DB writes, network calls, or provider spend.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| required fields listed | PASS | 29 fields |
| signals validate | PASS |  |
| projects forbidden | PASS |  |
| allowed files stay out of projects | PASS |  |
| deploy execution disabled | PASS |  |
| incident mitigation rollback disabled | PASS |  |
| alert dispatch disabled | PASS |  |
| project mutation disabled | PASS |  |
| provider/tool/worker disabled | PASS |  |
| db/network/spend disabled | PASS |  |
| blockers visible | PASS |  |
| evidence and activity visible | PASS |  |
| cost impact visible | PASS |  |
| no fake runnable action | PASS |  |
| envelope pass | PASS |  |
## Signal Shape

- signalId
- monitorId
- deployId
- targetKind
- incidentState
- severity
- summary
- environmentLabel
- allowedFiles
- forbiddenFiles
- deployExecutionAllowed
- incidentExecutionAllowed
- mitigationExecutionAllowed
- rollbackExecutionAllowed
- alertDispatchAllowed
- projectMutationAllowed
- providerDispatchAllowed
- toolExecutionAllowed
- workerExecutionAllowed
- dbWritesAllowed
- networkCallsAllowed
- providerSpendAllowed
- disabledReason
- blockers
- evidenceRefs
- activityRefs
- costImpact
- ownerCapability
- nextAction
## Result

PASS
