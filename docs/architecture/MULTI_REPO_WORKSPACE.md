# Multi-Repo Workspace

## Purpose
P44 introduces a governed, metadata-only model for understanding which repositories belong to NEXUS OS and which repositories belong to projects managed by NEXUS.

The P44.1 registry is intentionally read-only. It does not create git branches, commits, pull requests, merges, pushes, release packages, provider calls, DB writes, or project mutations.

## P44.1 Repo Registry
The repo registry lives in `repo-workspace/` and records safe metadata for:

- NEXUS OS as the platform control-plane repository.
- Private project backend repository references.
- Private project iOS repository references.
- Demo-only repository placeholders.

Each entry includes:

- Repo ID and project ID.
- Label and root.
- Repo type and visibility.
- Owner team and owner agent.
- Allowed scopes.
- Protected and forbidden paths.
- Default branch and current branch metadata.
- Package boundary.

## Safety Boundary
The registry does not inspect private project source contents in detail. Private project roots are represented only as metadata references, and project mutation remains disabled.

P44.1 explicitly disables:

- Git branch creation.
- Git commits.
- Pull request creation.
- Merge, push, release, and deploy actions.
- Provider and tool execution.
- DB writes.
- Private source detailed scanning.

## Command Center Visibility
The Projects page includes a compact Multi-Repo Workspace summary so operators can distinguish OS repositories from project repositories before later Git/PR lifecycle models are added.

## Next P44 Subphases
P44 continues with:

- P44.2 Repo Ownership + Dependency Map.
- P44.3 Branch / Commit Workflow Model.
- P44.4 PR Draft + Evidence Link Model.
- P44.5 Review Comment Ingestion Model.
- P44.6 Merge Gate + Rollback Branch Model.
- P44.7 Multi-Repo Git/PR Final Validation.

## P44.2 Repo Ownership + Dependency Map
P44.2 adds read-only ownership and dependency maps on top of the repo registry.

The ownership map records the owner team, owner agent, package boundary, and
review escalation path for each repo. The dependency map records metadata-only
relationships such as `consumes-api` and `documentation-reference`.

The blast-radius summary is also metadata-only. It can identify that an
OS/project-spanning change needs cross-repo and package-boundary review, but it
does not run git commands, scan private source contents, or mutate any project
files.

## P44.3 Branch / Commit Workflow Model
P44.3 adds a governed git workflow model for branch and commit planning. It
records a change ID, scope, project ID, repo IDs, base branch, proposed branch
name, commit message template, allowed plan-only git actions, forbidden git
actions, review/evidence requirements, and a rollback branch plan.

The model allows only `status`, `diff`, `branch-plan`, and `commit-plan`
metadata. It explicitly forbids direct main commits, unreviewed merges, force
pushes, branch deletion, real branch creation, real commits, pull request
creation, merges, and pushes.

## P44.4 PR Draft + Evidence Link Model
P44.4 adds local PR draft metadata and evidence-link modeling. A draft includes
the source branch plan, target branch, linked mission and task IDs, evidence
IDs, audit IDs, activity correlation IDs, validation summary, risk summary,
rollback plan, human-review requirement, and status.

Drafts remain `draft-metadata-only`. NEXUS does not call GitHub, GitLab, or any
external network API, and it does not create pull requests in this phase.

## P44.5 Review Comment Ingestion Model
P44.5 models review comments from future GitHub, GitLab, local-review, manual,
or future sources. Each comment records source, repo ID, PR draft ID, file path,
line range, author role, classification, assigned agent, required capability,
status, and whether evidence is required.

The ingestion plan is metadata-only. It does not fetch comments from external
systems and does not convert comments into tasks.

## P44.6 Merge Gate + Rollback Branch Model
P44.6 adds metadata-only merge gate evaluation and rollback branch planning. The
gate checks scope classification, project/OS boundary cleanliness, evidence
links, tests required/run status, review status, approvals, rollback plan,
package safety, and cost/risk posture.

The model can produce `not-ready`, `ready-for-review`, `blocked`, or
`approved-for-merge-metadata-only` statuses, but it never performs a merge,
push, release, package creation, or rollback branch creation.

## P44.7 Final Validation
P44.7 closes the P44 track by running the repo registry, repo dependency map,
git workflow model, PR draft model, review ingestion model, merge gate model,
scope boundary, project registry, Command Center UX, docs, architecture diagram,
and public-safety checks.

The final validation confirms the whole P44 lifecycle remains dry-run and
metadata-only. No git branch, commit, pull request, merge, push, release,
deployment, package, provider call, DB write, or project mutation is enabled.
