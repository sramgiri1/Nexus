# Starting a Mission

## Mission Control

Mission Control is the primary entry point for starting governed work. It answers what mission is active, what should happen next, and what evidence or safety posture already exists.

Mission Control is tabbed:

- Overview: active scope, active project, mission, next best action, and system status
- Workflows: Plan, Build, Validate, Review, Govern, Release, Guard, and Freeze options
- Tasks: active and planned task summary
- Agents: owner and assignment posture
- Gates: AUDITOR, SENTINEL, WARDEN, and release blockers
- Evidence: proof records and redacted evidence summaries
- Risks / Approvals: policy, approval, and safety state
- Cost: cost enforcement status and current limitations

## Mission Composer

Mission composition is available through the current local action and planning surfaces. It is designed to turn intent into a governed plan rather than immediately executing work.

If no project is selected, start with project setup instead of using demo data:

1. create or import a project
2. add a project profile
3. define stack and test commands
4. create a mission
5. generate a plan
6. activate the first task

## Current Action States

- Generate Plan: available when the current planning bridge is online
- Create Project Brief: available for governed planning flows
- Start Governed Run: only available when the required governed bridge and downstream capabilities are available

When an action is disabled, the UI should explain why using capability language such as:

- Requires governed action bridge
- Requires task activation
- Requires worker runtime
- Requires generated mission plan
- Requires approved task plan

## Current Limitations

- no broad autonomous execution
- no provider dispatch
- no worker runtime
- no release/deploy execution
- some actions remain planning- or review-only

## Evidence and Audit Expectations

Mission planning and governed follow-on actions should produce:

- audit records for important decisions
- evidence records after governed outputs are produced
- runtime events when local runtime flows are active

See [Understanding Evidence, Audit, and Runtime Events](UNDERSTANDING_EVIDENCE_AUDIT.md).
