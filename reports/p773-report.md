# P77.3 Audit Trail Export Preview Report

## Metadata

- Phase: P77.3
- Generated at: 2026-05-19T14:24:44.150Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: e185a10
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates P77.3 preview-only audit trail export preview records.
- Does not enable audit export, raw log export, package creation, certification, legal attestation, DB writes, project mutation, tenant/access/auth/session/user/workspace mutation, provider/tool/worker execution, network calls, deploy, release, export, or provider spend.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| required fields listed | PASS | 39 fields |
| source evidence index validates | PASS |  |
| previews validate | PASS |  |
| certification and attestation disabled | PASS |  |
| audit and raw log export disabled | PASS |  |
| package creation disabled | PASS |  |
| DB writes and project mutation disabled | PASS |  |
| tenant access auth session user workspace disabled | PASS |  |
| provider/tool/worker disabled | PASS |  |
| network/spend disabled | PASS |  |
| deploy/release/export disabled | PASS |  |
| approval gate required | PASS |  |
| preview rows visible | PASS |  |
| blocked operations visible | PASS |  |
| blockers visible | PASS |  |
| forbidden paths visible | PASS |  |
| private IDs tokens URLs and raw dumps hidden | PASS |  |
| evidence and activity visible | PASS |  |
| cost impact visible | PASS |  |
| no fake runnable audit action | PASS |  |
| envelope pass | PASS |  |
## Preview Shape

- auditTrailExportPreviewId
- sourceComplianceEvidenceIndexId
- complianceScope
- auditScope
- exportMode
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
