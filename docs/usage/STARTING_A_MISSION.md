# Starting a Mission

## Mission Control

Mission Control is the primary entry point for starting governed work. It answers what mission is active, what should happen next, and what evidence or safety posture already exists.

## Mission Composer

Mission composition is available through the current local action and planning surfaces. It is designed to turn intent into a governed plan rather than immediately executing work.

## Current Action States

- Generate Plan: available when the current planning bridge is online
- Create Project Brief: available for governed planning flows
- Start Governed Run: only available when the required governed bridge and downstream capabilities are available

When an action is disabled, the UI should explain why using capability language such as:

- Requires governed action bridge
- Requires task activation
- Requires worker runtime

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
