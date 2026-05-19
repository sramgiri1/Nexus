# P76.4 Access Context Packet Preview Report

## Metadata

- Phase: P76.4
- Generated at: 2026-05-19T14:01:39.036Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: 853bbe1
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates P76.4 preview-only access context packet records.
- Does not enable access grants, role mutation, permission mutation, tenant mutation, project mutation, DB writes, provider/tool/worker execution, network calls, deploy, release, export, package, auth/session/user/workspace mutation, or provider spend.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| required fields listed | PASS | 40 fields |
| source tenant boundary validates | PASS |  |
| source project scope validates | PASS |  |
| packets validate | PASS |  |
| access grants disabled | PASS |  |
| role permission membership disabled | PASS |  |
| tenant mutation disabled | PASS |  |
| project mutation and cross-project access disabled | PASS |  |
| DB writes disabled | PASS |  |
| provider/tool/worker disabled | PASS |  |
| network/spend disabled | PASS |  |
| deploy/release/export/package disabled | PASS |  |
| auth session user workspace disabled | PASS |  |
| approval gate required | PASS |  |
| access packet rows visible | PASS |  |
| blocked operations visible | PASS |  |
| blockers visible | PASS |  |
| forbidden paths visible | PASS |  |
| private IDs tokens and URLs hidden | PASS |  |
| evidence and activity visible | PASS |  |
| cost impact visible | PASS |  |
| no fake runnable access action | PASS |  |
| envelope pass | PASS |  |
## Packet Shape

- accessContextPacketId
- sourceTenantBoundaryId
- sourceProjectScopePreviewId
- accessContextMode
- tenantBoundary
- projectScope
- approvalRequired
- approvalState
- accessGrantAllowed
- roleMutationAllowed
- permissionMutationAllowed
- membershipMutationAllowed
- tenantMutationAllowed
- projectMutationAllowed
- crossProjectAccessAllowed
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
- accessPacketRows
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
