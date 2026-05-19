# P77.4 Control Mapping Preview Report

## Metadata

- Phase: P77.4
- Generated at: 2026-05-19T14:32:51.279Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: f9f3a05
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates P77.4 preview-only control mapping and attestation preview records.
- Does not enable certification, legal attestation, audit export, raw log export, package creation, DB writes, project mutation, tenant/access/auth/session/user/workspace mutation, provider/tool/worker execution, network calls, deploy, release, export, or provider spend.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| required fields listed | PASS | 39 fields |
| source evidence index validates | PASS |  |
| source audit preview validates | PASS |  |
| previews validate | PASS |  |
| certification and legal attestation disabled | PASS |  |
| audit and raw log export disabled | PASS |  |
| package creation disabled | PASS |  |
| DB writes and project mutation disabled | PASS |  |
| tenant access auth session user workspace disabled | PASS |  |
| provider/tool/worker disabled | PASS |  |
| network/spend disabled | PASS |  |
| deploy/release/export disabled | PASS |  |
| approval gate required | PASS |  |
| control rows visible | PASS |  |
| blocked operations visible | PASS |  |
| blockers visible | PASS |  |
| forbidden paths visible | PASS |  |
| private IDs tokens URLs and raw dumps hidden | PASS |  |
| evidence and activity visible | PASS |  |
| cost impact visible | PASS |  |
| no fake runnable attestation action | PASS |  |
| envelope pass | PASS |  |
## Preview Shape

- controlMappingPreviewId
- sourceComplianceEvidenceIndexId
- sourceAuditTrailExportPreviewId
- controlMappingScope
- attestationMode
- approvalRequired
- approvalState
- certificationAllowed
- legalAttestationAllowed
- auditExportAllowed
- rawLogExportAllowed
- packageCreationAllowed
- dbWritesAllowed
- projectMutationAllowed
- tenantMutationAllowed
- accessMutationAllowed
- providerDispatchAllowed
- toolExecutionAllowed
- workerExecutionAllowed
- networkCallsAllowed
- deployExecutionAllowed
- releaseExecutionAllowed
- exportExecutionAllowed
- authMutationAllowed
- sessionMutationAllowed
- userMutationAllowed
- workspaceMutationAllowed
- providerSpendAllowed
- controlRows
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
