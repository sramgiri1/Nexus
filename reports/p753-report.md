# P75.3 Restore Plan Preview Report

## Metadata

- Phase: P75.3
- Generated at: 2026-05-19T13:28:26.255Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: ea20628
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates P75.3 preview-only restore plan records.
- Does not enable restore execution, backup creation, failover, overwrite, delete, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, package, auth mutation, or provider spend.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| required fields listed | PASS | 33 fields |
| source backup inventory validates | PASS |  |
| previews validate | PASS |  |
| restore backup failover disabled | PASS |  |
| overwrite and delete disabled | PASS |  |
| project mutation and DB writes disabled | PASS |  |
| provider/tool/worker disabled | PASS |  |
| network/spend disabled | PASS |  |
| deploy/release/export/package disabled | PASS |  |
| auth mutation disabled | PASS |  |
| approval gate required | PASS |  |
| preview rows visible | PASS |  |
| blocked operations visible | PASS |  |
| blockers visible | PASS |  |
| forbidden paths visible | PASS |  |
| private IDs tokens and restore URLs hidden | PASS |  |
| evidence and activity visible | PASS |  |
| cost impact visible | PASS |  |
| no fake runnable restore action | PASS |  |
| envelope pass | PASS |  |
## Preview Shape

- restorePlanId
- sourceBackupInventoryId
- restoreScope
- sourceBackup
- approvalRequired
- approvalState
- restoreExecutionAllowed
- backupCreationAllowed
- failoverAllowed
- overwriteAllowed
- deleteAllowed
- dbWritesAllowed
- projectMutationAllowed
- providerDispatchAllowed
- toolExecutionAllowed
- workerExecutionAllowed
- networkCallsAllowed
- deployExecutionAllowed
- releaseExecutionAllowed
- exportExecutionAllowed
- packageCreationAllowed
- authMutationAllowed
- providerSpendAllowed
- previewRows
- blockedOperations
- disabledReason
- blockers
- forbiddenFiles
- evidenceRefs
- activityRefs
- costImpact
- ownerCapability
- nextAction
## Result

PASS
