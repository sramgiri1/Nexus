# P78.2 Founder Intake Preview Report

## Metadata

- Phase: P78.2
- Generated at: 2026-05-19T14:46:58.066Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: a4706b5
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates P78.2 preview-only founder intake and Q&A records.
- Does not enable autonomous Q&A, provider calls, PRD generation, agent dispatch, self-healing apply, project mutation, DB writes, tool/worker execution, network calls, deploy, release, export, package, auth/session/user/workspace mutation, or provider spend.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| required fields listed | PASS | 36 fields |
| previews validate | PASS |  |
| founder automation disabled | PASS |  |
| agent and healing disabled | PASS |  |
| project DB provider tool worker disabled | PASS |  |
| network deploy release export package spend disabled | PASS |  |
| auth session user workspace disabled | PASS |  |
| question rows and missing answers visible | PASS |  |
| blockers visible | PASS |  |
| forbidden paths visible | PASS |  |
| private IDs tokens and URLs hidden | PASS |  |
| no fake runnable founder action | PASS |  |
| evidence activity and cost visible | PASS |  |
| envelope pass | PASS |  |
## Preview Shape

- founderIntakePreviewId
- founderIdeaSummary
- qnaState
- feasibilityState
- redactionState
- autonomousQnaAllowed
- prdGenerationAllowed
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
- questionRows
- missingAnswers
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
