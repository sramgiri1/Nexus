# Format Readability Report

## Metadata

- Generated at: 2026-05-06T10:16:12.201Z
- Validation branch: chore/cross-phase-cleanup
- Validation HEAD: a058918
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Summary

- Files checked: 56

## Warnings

- none

## Failures

- none

## Top Longest Lines

- docs/architecture/AGENT_TASK_CONTEXT.md:5 (300) — Phase 4D adds a lightweight adapter that normalizes task input into a consistent agent context object. It is advisory only in this phase. The adapter gives futu
- docs/architecture/CONTROL_EXECUTION_VERIFICATION_PLANES.md:241 (299) — `memory/safety-events.json` and `memory/system-usage.json` are written by the safety subsystem and budget guard respectively. No agent, hook, or tool can write
- docs/architecture/NEXUS_OS_GLOSSARY.md:308 (297) — A batch task that has been queued to `memory/batch-queue.json` but not yet submitted to the batch API. Deferred batch is the current implementation state — batc
- docs/architecture/AGENTIC_OS_ARCHITECTURE.md:382 (296) — The state machine is the authoritative record of task, gate, and project state. Agents propose state transitions. The state machine validates and commits them.
- docs/architecture/NEXUS_OS_GLOSSARY.md:48 (289) — A high-level goal, product direction, sprint scope, or task objective provided by the operator. Founder intent is the input that NEXUS translates into typed tas
- docs/architecture/AGENTIC_OS_ARCHITECTURE.md:85 (288) — Without domain ownership, multiple agents write to the same artifacts. CORE rewrites a schema that ATLAS owns. SENTINEL approves a gate that AUDITOR should have
- docs/architecture/AGENTIC_OS_ARCHITECTURE.md:403 (288) — An agent that writes `"status": "completed"` to a task is proposing a transition, not committing one. The state machine checks: does the result contain verifiab
- docs/architecture/AGENTIC_OS_ARCHITECTURE.md:121 (286) — An agent that builds an API route has good judgment about whether that route is correct. It does not have authority to decide the route is verified. Judgment an
- docs/architecture/AGENTIC_OS_ARCHITECTURE.md:184 (283) — A vague handoff — "CORE is done, SENTINEL should do QA now" — is not a contract. It contains no scope constraints, no acceptance criteria, no skill requirements
- docs/architecture/AGENTIC_OS_ARCHITECTURE.md:21 (282) — This is not a metaphor. Each statement is a structural rule that defines which part of the system is authoritative for which class of decision. Violations of th
- docs/architecture/AGENTIC_OS_ARCHITECTURE.md:586 (280) — CareLoop parallel execution should not begin until agents have been confirmed as contract-aware, state-machine-aware, model-aware, batch-aware, skill-aware, and
- docs/architecture/CONTROL_EXECUTION_VERIFICATION_PLANES.md:109 (276) — ENGINEER-tier agents (CORE, SWIFT, PIXEL, CANVAS) and PLATFORM-tier agents (FORGE, STREAM, SYNAPSE) cannot enqueue tasks for other agents. If a worker identifie
- docs/architecture/AGENTIC_OS_ARCHITECTURE.md:51 (275) — The operator layer follows the same rule. Humans do not operate NEXUS by editing JSON, poking memory files, or bypassing dispatch. They operate it later through
- docs/architecture/CONTROL_EXECUTION_VERIFICATION_PLANES.md:181 (275) — When AUDITOR finds lint errors, it reports them and sets gate status to FAIL. It does not fix the errors. CORE fixes the errors, re-runs the gate, and re-submit
- docs/architecture/NEXUS_OS_GLOSSARY.md:96 (274) — A bounded area of the system with a designated lead agent and a defined scope of authority. A domain owns the canonical state of its artifacts. Other agents can
- docs/architecture/CONTROL_EXECUTION_VERIFICATION_PLANES.md:52 (273) — NEXUS and SHEPHERD route, plan, and authorize. They do not implement API routes, write SwiftUI views, configure CI pipelines, or produce feature artifacts. A co
- docs/architecture/AGENTIC_OS_ARCHITECTURE.md:451 (272) — The governor runs inside `executeTool` before the tool handler executes. There is no code path that runs a tool without passing through `authorizeAction()`. Age
- docs/architecture/CONTROL_EXECUTION_VERIFICATION_PLANES.md:192 (272) — AUDITOR, SENTINEL, and WARDEN produce evidence. They do not make the release decision. The release decision is NEXUS's responsibility, made via `nexus.decide.re
- docs/architecture/CONTROL_EXECUTION_VERIFICATION_PLANES.md:105 (271) — CORE cannot run `auditor.code.lint` to certify its own output. SWIFT cannot run `sentinel.qa.tests.execute` to certify its own screens. The governor enforces sk
- docs/architecture/NEXUS_OS_GLOSSARY.md:166 (268) — A typed object that specifies a delegation of work. No work moves between agents without a contract. Contracts define scope, authorization, acceptance criteria,

## Result

- PASS
