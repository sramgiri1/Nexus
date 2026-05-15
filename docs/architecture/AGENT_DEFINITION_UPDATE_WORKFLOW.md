# Agent Definition Update Workflow

## Purpose

P49 defines how NEXUS can propose, review, approve, version, and roll back
agent definition changes without silently granting agents more power.

This phase is proposal-first and read-only. It does not mutate `agents/*.md`,
does not enable provider dispatch, does not enable tool or worker execution,
does not write to a production DB, and does not mutate project source.

## P49.1 - Agent Definition Change Proposal

Agent definition changes start as structured proposals. A proposal records the
agent, change type, reason, affected capabilities, permission delta, risk level,
required reviewers, rollback plan, evidence requirements, and status.

Required proposal fields:

- `proposalId`
- `agentId`
- `changeType`
- `requestedBy`
- `reason`
- `affectedCapabilities`
- `permissionDelta`
- `riskLevel`
- `requiredReviewers`
- `rollbackPlan`
- `evidenceRequirements`
- `status`

No proposal can directly mutate an agent definition.

## P49.2 - Boundary Diff

Boundary diff compares the current registry definition with the proposed
definition. It classifies:

- capability additions and removals
- path boundary changes
- tool permission changes
- data classification access changes
- cost budget changes
- approval authority changes

Risky expansions require review. Harmless reductions can be marked low risk but
still remain proposal records.

## P49.3 - AUDITOR / WARDEN Review

AUDITOR reviews correctness, tests, evidence impact, and traceability. WARDEN
reviews safety, privacy, and permission expansion. Reviews are records only.
They do not auto-approve and do not apply changes.

## P49.4 - Human Approval Gate

Allowed proposal states:

- `proposed`
- `under_review`
- `requires_human_approval`
- `approved`
- `rejected`
- `changes_requested`
- `expired`

High-risk or critical proposals require human approval before approval. Human
approval is represented as a local record only.

## P49.5 - Versioning + Rollback

Version records are dry-run metadata. They capture previous version,
proposed version, evidence requirements, and whether an approved proposal is
required. Rollback plans capture the previous version pointer, impacted
boundaries, and verification checklist.

No rollback execution is enabled in P49.

## P49.6 - Command Center UX

Command Center exposes Agent Definition Updates as a read-only Agent Registry
tab. It shows proposals, boundary diff summary, AUDITOR/WARDEN reviews,
approval gate state, and version/rollback posture.

The UI is operator-visible only and does not edit agent files.

## P49.7 - Final Validation

Final validation runs every P49 checker, existing safety checks, dashboard
validation, and confirms:

- no `agents/*.md` files were mutated directly
- no provider/tool/worker/DB execution was enabled
- no project source was modified
- OS phase status marks P49.1 through P49.7 complete
- P50 is next

## Safety Boundary

P49 is workflow and governance only. It defines how future agent definition
updates should be proposed and reviewed. It does not grant runtime permissions.

## Next Phase

P50 - Skill Registry + Skill Authoring Workflow.
