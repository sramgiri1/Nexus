# P72.2 DB Runtime Primary Contract Report

## Metadata

- Phase: P72.2
- Generated at: 2026-05-19T11:57:14.676Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: 4e218ef
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates P72.2 display-safe DB runtime primary contract records.
- Does not write DB state, create migrations, mutate schema, mutate projects, dispatch providers/tools/workers, call network services, deploy, release, export, package, or spend provider budget.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| required fields listed | PASS | 26 fields |
| contracts validate | PASS |  |
| DB and project paths forbidden | PASS |  |
| allowed files avoid DB/project paths | PASS |  |
| DB writes migrations schema disabled | PASS |  |
| project mutation disabled | PASS |  |
| provider/tool/worker disabled | PASS |  |
| network/spend disabled | PASS |  |
| deploy/release/export/package disabled | PASS |  |
| blockers visible | PASS |  |
| private IDs and DB URLs hidden | PASS |  |
| evidence and activity visible | PASS |  |
| cost impact visible | PASS |  |
| no fake runnable DB action | PASS |  |
| envelope pass | PASS |  |
## Contract Shape

- runtimeId
- dbPrimaryState
- fallbackState
- migrationState
- allowedFiles
- forbiddenFiles
- dbWritesAllowed
- migrationsAllowed
- schemaMutationAllowed
- projectMutationAllowed
- providerDispatchAllowed
- toolExecutionAllowed
- workerExecutionAllowed
- networkCallsAllowed
- deployExecutionAllowed
- releaseExecutionAllowed
- exportExecutionAllowed
- packageCreationAllowed
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
