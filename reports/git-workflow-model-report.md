# NEXUS Git Workflow Model Report

## Metadata
- Generated at: 2026-05-15T13:58:49.986Z
- Validation branch: arch/multi-repo-git-pr-lifecycle
- Validation HEAD: 6a1748f
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P44.3 - Branch / Commit Workflow Model

## Summary
- Change ID: p44-3-sample-change
- Scope: NEXUS_OS_CHANGE
- Repo count: 1
- Proposed branch: nexus/nexus-os-change/p44-3-sample-change
- Requires review: yes
- Requires evidence: yes
- Execution allowed: no

## Allowed Plan Actions
- status
- diff
- branch-plan
- commit-plan

## Forbidden Git Actions
- force-push
- delete-branch
- direct-main-commit
- unreviewed-merge
- branch-create
- commit
- pr-create
- merge
- push

## Non-Goals
- No git branch was created.
- No commit was created.
- No pull request was created.
- No merge, push, provider call, DB write, or project mutation occurred.

## Validation
- modules: PASS
- exports: PASS
- policy: PASS
- workflowPlan: PASS
- safety: PASS
- osPhaseStatus: PASS
- noForbiddenChanges: PASS
- formatting: PASS
- reportWritten: PASS


