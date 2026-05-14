# Activating Tasks

## Planned Tasks vs Activated Tasks

- planned tasks are queued in the planning layer
- activated/runtime tasks have moved into governed execution state and can appear in Task Queue, Mission Control, and Agent Workbench

## Task Activation Bridge

Task activation depends on the task activation bridge. When it is available, a planned task can be activated into runtime without bypassing governance.

## What You See in Task Queue

- task title
- owner agent
- user-facing task state
- risk level
- evidence count
- next action

Task Queue is tabbed:

- Planned: planned mission tasks and activation readiness
- Active: queued, running, and verifying tasks
- Review: tasks awaiting operator or auditor review
- Blocked: policy, approval, validation, or capability blockers
- Completed: completed work and evidence summaries
- All Projects: placeholder until Project Registry supports cross-project aggregation

If no project is selected, Task Queue should show start-project guidance instead of demo fallback data.

## Common States

- Planned
- Queued
- Running
- Review
- Blocked
- Implementation done
- Completed
- Not started

## Blocked and Disabled States

Blocked or disabled activation should explain why in user-facing terms. Examples:

- Requires task activation
- Requires worker runtime
- Requires governed provider dispatch

## Evidence Expectations

Activated tasks should accumulate evidence, audit records, and runtime events as governed actions progress.

Use Agent Workbench after activation to inspect the selected task, evidence, review status, context, and activity.
