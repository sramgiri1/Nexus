# P76.3 Project Scope Isolation Preview Report

## Metadata

- Phase: P76.3
- Generated at: 2026-05-19T13:58:29.616Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: 2fb5b72
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates P76.3 preview-only project scope isolation records.
- Does not enable project mutation, cross-project access, tenant mutation, access grants, DB writes, provider/tool/worker execution, network calls, deploy, release, export, package, auth/session/user/workspace mutation, or provider spend.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| required fields listed | PASS | 39 fields |
| source tenant boundary validates | PASS |  |
| previews validate | PASS |  |
| project mutation and cross-project access disabled | PASS |  |
| tenant mutation disabled | PASS |  |
| membership permission role disabled | PASS |  |
| access grants disabled | PASS |  |
| DB writes disabled | PASS |  |
| provider/tool/worker disabled | PASS |  |
| network/spend disabled | PASS |  |
| deploy/release/export/package disabled | PASS |  |
| auth session user workspace disabled | PASS |  |
| approval gate required | PASS |  |
| preview rows visible | PASS |  |
| blocked operations visible | PASS |  |
| blockers visible | PASS |  |
| forbidden paths visible | PASS |  |
| private IDs tokens and URLs hidden | PASS |  |
| evidence and activity visible | PASS |  |
| cost impact visible | PASS |  |
| no fake runnable project action | PASS |  |
| envelope pass | PASS |  |
## Preview Shape

- projectScopePreviewId
- sourceTenantBoundaryId
- sourceTenantBoundary
- projectScope
- isolationMode
- approvalRequired
- approvalState
- projectMutationAllowed
- crossProjectAccessAllowed
- tenantMutationAllowed
- membershipMutationAllowed
- permissionMutationAllowed
- roleMutationAllowed
- accessGrantAllowed
- dbWritesAllowed
- providerDispatchAllowed
- toolExecutionAllowed
- workerExecutionAllowed
- networkCallsAllowed
- deployExecutionAllowed
- releaseExecutionAllowed
- exportExecutionAllowed
- packageCreationAllowed
- authMutationAllowed
- sessionMutationAllowed
- userMutationAllowed
- workspaceMutationAllowed
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
- commandCenterVisible
## Result

PASS
