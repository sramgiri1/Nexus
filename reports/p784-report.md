# P78.4 Agent Workplan Self-Healing Preview Report

## Metadata

- Phase: P78.4
- Generated at: 2026-05-19T15:06:40.910Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: 31b72b5
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

- Validates P78.4 preview-only agent workplan and self-healing records.
- Does not enable agent dispatch, self-healing apply, PRD generation, project mutation, DB writes, provider/tool/worker execution, network calls, deploy, release, export, package, auth/session/user/workspace mutation, certification, attestation, or provider spend.
## Checks

| Check | Status | Details |
| --- | --- | --- |
| required fields listed | PASS | 39 fields |
| source PRD preview validates | PASS |  |
| previews validate | PASS |  |
| founder Q&A and PRD disabled | PASS |  |
| agent and healing disabled | PASS |  |
| project DB provider tool worker disabled | PASS |  |
| network deploy release export package spend disabled | PASS |  |
| auth session user workspace disabled | PASS |  |
| owner capabilities visible | PASS |  |
| task lanes visible | PASS |  |
| validation gates visible | PASS |  |
| healing loops visible and disabled | PASS |  |
| blocked operations visible | PASS |  |
| forbidden paths visible | PASS |  |
| private IDs tokens and URLs hidden | PASS |  |
| no fake runnable agent action | PASS |  |
| evidence activity and cost visible | PASS |  |
| envelope pass | PASS |  |
## Preview Shape

- agentWorkplanPreviewId
- sourcePrdAssemblyPreviewId
- founderIdeaSummary
- agentWorkplanState
- selfHealingState
- ownerCapabilities
- taskLanes
- validationGates
- healingLoops
- blockedOperations
- founderIntakeExecutionAllowed
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
