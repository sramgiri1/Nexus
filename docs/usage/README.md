# NEXUS Usage Guides

## What NEXUS Is

NEXUS is a governed Agentic OS for planning, reviewing, validating, and tracking agentic work through contracts, approvals, evidence, and safety boundaries.

## Who Should Read These Docs

- operators using Command Center
- contributors running NEXUS locally
- reviewers trying to understand current local capabilities

## Current Local Usage Status

NEXUS currently supports a local operator workflow through Command Center, local snapshots, the local API read layer, governed task activation, Agent Workbench review, controlled implementation review, approvals, and visual QA artifacts. Broad autonomous execution, provider dispatch, worker runtime, DB writes, and unified boot are not enabled yet.

## Command Center Guides

- [Getting Started](GETTING_STARTED.md)
- [Command Center Guide](COMMAND_CENTER_GUIDE.md)
- [Starting a Mission](STARTING_A_MISSION.md)
- [Activating Tasks](ACTIVATING_TASKS.md)
- [Using Agent Workbench](USING_AGENT_WORKBENCH.md)
- [Controlled Implementation](CONTROLLED_IMPLEMENTATION.md)
- [Understanding Evidence, Audit, and Runtime Events](UNDERSTANDING_EVIDENCE_AUDIT.md)

## Safety and Mode Guides

- [Running NEXUS Locally](RUNNING_NEXUS_LOCALLY.md)
- [Demo Mode vs Private Mode](DEMO_MODE_VS_PRIVATE_MODE.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [FAQ](FAQ.md)

## Known Limitations

- Unified boot is planned for P41.6.
- DB writes remain disabled by policy.
- Worker runtime is not enabled.
- Governed provider dispatch is not enabled.
- Screenshot audit is a route-wide baseline, not pixel-diff regression.
- `check:public-safety` still has known pre-existing roadmap-doc false positives.
