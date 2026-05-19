# P78.3 PRD Assembly Preview Report

## Metadata

- Phase: P78.3
- Generated at: 2026-05-19T15:02:55.520Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: e63f3b1
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates P78.3 preview-only PRD assembly records.
- Does not enable PRD generation, project file writes, agent dispatch, self-healing apply, project mutation, DB writes, provider/tool/worker execution, network calls, deploy, release, export, package, auth/session/user/workspace mutation, certification, attestation, or provider spend.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| required fields listed | PASS | 43 fields |
| source founder intake validates | PASS |  |
| previews validate | PASS |  |
| founder Q&A and PRD execution disabled | PASS |  |
| project writes and mutation disabled | PASS |  |
| agent dispatch and self-healing disabled | PASS |  |
| DB provider tool worker disabled | PASS |  |
| network deploy release export package spend disabled | PASS |  |
| auth session user workspace disabled | PASS |  |
| PRD sections visible | PASS |  |
| risks and missing inputs visible | PASS |  |
| blocked operations visible | PASS |  |
| forbidden paths visible | PASS |  |
| private IDs tokens and URLs hidden | PASS |  |
| no fake runnable PRD action | PASS |  |
| evidence activity and cost visible | PASS |  |
| envelope pass | PASS |  |
## Preview Shape

- prdAssemblyPreviewId
- sourceFounderIntakePreviewId
- founderIdeaSummary
- prdPreviewState
- problemStatement
- targetAudience
- valueProposition
- mvpScope
- acceptanceCriteria
- riskRows
- missingInputs
- redactionState
- founderIntakeExecutionAllowed
- autonomousQnaAllowed
- prdGenerationAllowed
- projectFileWriteAllowed
- agentDispatchAllowed
- selfHealingApplyAllowed
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
- authMutationAllowed
- sessionMutationAllowed
- userMutationAllowed
- workspaceMutationAllowed
- providerSpendAllowed
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
