# P71.3 Export Package Preview Report

## Metadata

- Phase: P71.3
- Generated at: 2026-05-19T11:37:34.226Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: 1f0b37d
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates P71.3 preview-only export package records.
- Does not create package artifacts, export project files, mutate project source, dispatch providers/tools/workers, write DB state, call network services, deploy, release, or spend provider budget.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| required fields listed | PASS | 25 fields |
| previews validate | PASS |  |
| artifact not created | PASS |  |
| no package artifact on disk | PASS |  |
| projects and artifacts forbidden | PASS |  |
| export and package disabled | PASS |  |
| project mutation disabled | PASS |  |
| provider/tool/worker disabled | PASS |  |
| db/network/spend disabled | PASS |  |
| deploy/release disabled | PASS |  |
| preview items visible | PASS |  |
| preview items stay preview-only | PASS |  |
| blocked items visible | PASS |  |
| private IDs hidden | PASS |  |
| evidence and activity visible | PASS |  |
| cost impact visible | PASS |  |
| no fake runnable action | PASS |  |
| envelope pass | PASS |  |
## Preview Shape

- packagePreviewId
- shippingId
- projectDisplayName
- packageState
- artifactCreated
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
- previewItems
- blockedItems
- evidenceRefs
- activityRefs
- costImpact
- ownerCapability
- nextAction
## Result

PASS
