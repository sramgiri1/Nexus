# P73.3 RBAC Permission Matrix Report

## Metadata

- Phase: P73.3
- Generated at: 2026-05-19T12:28:30.306Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: 2f094d3
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates P73.3 preview-only RBAC permission matrix records.
- Does not enable role assignment, permission mutation, user/session/tenant mutation, login, identity provider calls, token exchange, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, package, or provider spend.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| required fields listed | PASS | 33 fields |
| matrices validate | PASS |  |
| role permission mutation disabled | PASS |  |
| user session tenant mutation disabled | PASS |  |
| login provider token disabled | PASS |  |
| project mutation and DB writes disabled | PASS |  |
| provider/tool/worker disabled | PASS |  |
| network/spend disabled | PASS |  |
| deploy/release/export/package disabled | PASS |  |
| role set visible | PASS |  |
| permission rows display-only | PASS |  |
| blocked operations visible | PASS |  |
| private IDs tokens and auth URLs hidden | PASS |  |
| evidence and activity visible | PASS |  |
| cost impact visible | PASS |  |
| no fake runnable RBAC action | PASS |  |
| envelope pass | PASS |  |
## Matrix Shape

- rbacMatrixId
- identityContractId
- roleSet
- permissionState
- assignmentState
- loginAllowed
- roleMutationAllowed
- permissionMutationAllowed
- userMutationAllowed
- sessionMutationAllowed
- tenantMutationAllowed
- identityProviderCallsAllowed
- tokenExchangeAllowed
- projectMutationAllowed
- dbWritesAllowed
- providerDispatchAllowed
- toolExecutionAllowed
- workerExecutionAllowed
- networkCallsAllowed
- deployExecutionAllowed
- releaseExecutionAllowed
- exportExecutionAllowed
- packageCreationAllowed
- providerSpendAllowed
- permissionRows
- blockedOperations
- disabledReason
- blockers
- evidenceRefs
- activityRefs
- costImpact
- ownerCapability
- nextAction
## Result

PASS
