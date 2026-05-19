# P74.2 Telemetry Event Contract Report

## Metadata

- Phase: P74.2
- Generated at: 2026-05-19T12:55:17.872Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: d942967
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates P74.2 preview-only telemetry event contract records.
- Does not enable external telemetry exporters, raw log streaming, raw JSON dumps, raw policy dumps, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, package, auth mutation, or provider spend.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| required fields listed | PASS | 32 fields |
| contracts validate | PASS |  |
| telemetry export and raw logs disabled | PASS |  |
| raw JSON and policy dumps disabled | PASS |  |
| project mutation and DB writes disabled | PASS |  |
| provider/tool/worker disabled | PASS |  |
| network/spend disabled | PASS |  |
| deploy/release/export/package disabled | PASS |  |
| auth mutation disabled | PASS |  |
| blocked operations visible | PASS |  |
| blockers visible | PASS |  |
| forbidden paths visible | PASS |  |
| private IDs tokens and telemetry URLs hidden | PASS |  |
| evidence and activity visible | PASS |  |
| cost impact visible | PASS |  |
| no fake runnable telemetry action | PASS |  |
| envelope pass | PASS |  |
## Contract Shape

- telemetryContractId
- signalType
- sourceSurface
- metricFamily
- aggregationWindow
- redactionState
- telemetryExportAllowed
- rawLogExposureAllowed
- rawJsonDumpAllowed
- rawPolicyDumpAllowed
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
- displayFields
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
