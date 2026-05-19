# P71.2 Project Shipping Manifest Contract Report

## Metadata

- Phase: P71.2
- Generated at: 2026-05-19T11:34:48.467Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: a40afee
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates P71.2 display-safe project shipping manifest records.
- Does not create packages, export project files, mutate project source, dispatch providers/tools/workers, write DB state, call network services, deploy, release, or spend provider budget.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| required fields listed | PASS | 26 fields |
| manifests validate | PASS |  |
| projects forbidden | PASS |  |
| allowed files stay out of projects | PASS |  |
| export and package disabled | PASS |  |
| project mutation disabled | PASS |  |
| provider/tool/worker disabled | PASS |  |
| db/network/spend disabled | PASS |  |
| deploy/release disabled | PASS |  |
| blockers visible | PASS |  |
| shipping items visible | PASS |  |
| raw paths hidden | PASS |  |
| private IDs hidden | PASS |  |
| secrets redacted | PASS |  |
| evidence and activity visible | PASS |  |
| cost impact visible | PASS |  |
| no fake runnable action | PASS |  |
| envelope pass | PASS |  |
## Manifest Shape

- shippingId
- projectDisplayName
- exportTarget
- manifestState
- redactionState
- allowedFiles
- forbiddenFiles
- exportAllowed
- packageCreationAllowed
- projectMutationAllowed
- providerDispatchAllowed
- toolExecutionAllowed
- workerExecutionAllowed
- dbWritesAllowed
- networkCallsAllowed
- deployExecutionAllowed
- releaseExecutionAllowed
- providerSpendAllowed
- disabledReason
- blockers
- shippingItems
- evidenceRefs
- activityRefs
- costImpact
- ownerCapability
- nextAction
## Result

PASS
