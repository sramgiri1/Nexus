# P77.2 Compliance Evidence Index Report

## Metadata

- Phase: P77.2
- Generated at: 2026-05-19T14:36:37.800Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: 758e0b5
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates P77.2 preview-only compliance evidence index records.
- Does not enable certification, legal attestation, audit export, raw log export, package creation, DB writes, project mutation, tenant/access/auth/session/user/workspace mutation, provider/tool/worker execution, network calls, deploy, release, export, or provider spend.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| required fields listed | PASS | 37 fields |
| indexes validate | PASS |  |
| certification and attestation disabled | PASS |  |
| audit and raw log export disabled | PASS |  |
| package creation disabled | PASS |  |
| DB writes and project mutation disabled | PASS |  |
| tenant access auth session user workspace disabled | PASS |  |
| provider/tool/worker disabled | PASS |  |
| network/spend disabled | PASS |  |
| deploy/release/export disabled | PASS |  |
| blocked operations visible | PASS |  |
| blockers visible | PASS |  |
| forbidden paths visible | PASS |  |
| private IDs tokens and URLs hidden | PASS |  |
| evidence and activity visible | PASS |  |
| cost impact visible | PASS |  |
| no fake runnable compliance action | PASS |  |
| envelope pass | PASS |  |
## Index Shape

- complianceEvidenceIndexId
- complianceScope
- evidenceScope
- auditScope
- redactionState
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
- commandCenterVisible
## Result

PASS
