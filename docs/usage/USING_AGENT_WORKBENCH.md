# Using Agent Workbench

## Purpose

Agent Workbench is where operators inspect activated tasks, review governed output, and capture human review decisions.

## How To Use It

1. Open Task Queue and activate a planned task if none are active.
2. Open Agent Workbench.
3. Review the selected task, evidence count, activity count, blockers, and next action.
4. Use the available review controls if the bridge is online.

## Review Actions

Depending on current bridge availability, Workbench can expose:

- Review output
- Request Changes
- Approve plan
- Open evidence

If a control is disabled, the page should explain the reason instead of failing silently.

## Evidence and Audit Linkage

Workbench does not stand alone. It is linked to:

- evidence records
- audit activity
- review decisions
- current task state

## Important Boundaries

- no free agent execution from Workbench
- no provider dispatch from Workbench
- no source mutation from Workbench
- review is governed and evidence-linked
