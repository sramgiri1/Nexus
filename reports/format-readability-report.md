# Format Readability Report

## Metadata

- Generated at: 2026-05-19T17:20:40.513Z
- Validation branch: codex/nexus-e2e-phase-validation
- Validation HEAD: 259d04f
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Summary

- Files checked: 471

## Warnings

- docs/architecture/CONTROLLED_IMPLEMENTATION_WORKFLOW.md:9:375
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:74:302
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:79:334
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:81:336
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:82:316
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:84:403
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:91:326
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:92:338
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:94:378
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:95:391
- docs/architecture/LIVE_LOCAL_API_BACKEND.md:5:341
- docs/architecture/LIVE_LOCAL_API_BACKEND.md:13:353
- docs/architecture/TASK_ACTIVATION_AND_AGENT_ASSIGNMENT.md:9:302
- docs/architecture/TEST_SUITE_MANAGER.md:5:382
- docs/architecture/TEST_SUITE_MANAGER.md:67:373
- reports/p786-tests-checkers-docs-report.md:14:306
- reports/p787-final-validation-report.md:15:306
- reports/p787-final-validation-report.md:63:313

## Failures

- none

## Top Longest Lines

- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:84 (403) — \| `compliance_privacy` \| `warden` \| `forge`, `stream`, `synapse`, `canvas`, `compass`, `oracle` \| `warden` \| verification, approval when needed \| `verification.
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:95 (391) — \| `release_control` \| `nexus` \| `shepherd`, `auditor`, `sentinel`, `warden`, `forge` \| `auditor`, `sentinel`, `warden` \| release, verification, approval when co
- docs/architecture/TEST_SUITE_MANAGER.md:5 (382) — The Test Suite Manager (P55) is a **registry and visibility layer only**. It catalogs all known test suites for NEXUS OS and active projects, surfaces them in t
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:94 (378) — \| `demo_showcase` \| `canvas` \| `pixel`, `beacon`, `nexus`, `shepherd` \| `warden`, `auditor`, `sentinel` as public-safety and evidence reviewers \| task, handoff,
- docs/architecture/CONTROLLED_IMPLEMENTATION_WORKFLOW.md:9 (375) — P38 let the operator review and approve tasks without executing anything. P39 crosses the first real write threshold — but deliberately targets a documentation
- docs/architecture/TEST_SUITE_MANAGER.md:67 (373) — The registry provides `evidenceTypes` on each suite record so that downstream agents (AUDITOR, SENTINEL, WARDEN) can plan evidence collection without triggering
- docs/architecture/LIVE_LOCAL_API_BACKEND.md:13 (353) — Before P40, Command Center read from static JavaScript modules (`privateValidationSnapshot.js`, `actionBridgeSnapshot.js`, `runtimeSnapshot.js`). These are gene
- docs/architecture/LIVE_LOCAL_API_BACKEND.md:5 (341) — P40 moves Command Center from generated/static snapshots toward live local API-driven data. It introduces a local-only HTTP server that reads existing JSON/JSON
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:92 (338) — \| `reliability` \| `shepherd` \| `forge`, `relay`, `nexus` \| `auditor`, `sentinel`, `warden` as evidence contributors \| task, handoff, approval when risky \| `orch
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:81 (336) — \| `ai_integration` \| `synapse` \| `forge`, `warden`, `nexus` \| `warden` for data class or provider policy issues \| task, handoff, approval \| `platform.ai_integra
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:79 (334) — \| `deployment` \| `forge` \| `shepherd`, `core`, `swift`, `pixel` \| `warden` for secret or compliance impact \| task, handoff, approval \| `platform.deploy_plan`, `
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:91 (326) — \| `security` \| `warden` \| `forge`, `auditor`, `sentinel`, `synapse` \| `warden` \| verification, approval \| `security.secret_scan`, `verification.compliance_gate`
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:82 (316) — \| `code_quality` \| `auditor` \| `core`, `swift`, `pixel` as remediation owners \| `auditor` \| verification \| `verification.code_quality_gate` \| none for normal ve
- reports/p787-final-validation-report.md:63 (313) — - Founder intake execution, autonomous Q&A, PRD generation, agent dispatch, self-healing apply, DB writes, project mutation, provider/tool/worker execution, net
- reports/p786-tests-checkers-docs-report.md:14 (306) — - Does not enable founder intake execution, autonomous Q&A, PRD generation, agent dispatch, self-healing apply, DB writes, project mutation, provider/tool/worke
- reports/p787-final-validation-report.md:15 (306) — - Does not enable founder intake execution, autonomous Q&A, PRD generation, agent dispatch, self-healing apply, DB writes, project mutation, provider/tool/worke
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:74 (302) — \| `design` \| `prism` \| `atlas`, `pixel`, `swift`, `canvas` \| `warden` when regulated copy or claims exist \| task, handoff \| `orchestration.plan_flow` until a de
- docs/architecture/TASK_ACTIVATION_AND_AGENT_ASSIGNMENT.md:9 (302) — P36 (Agentic Workspace) showed the operator what NEXUS can do. P37 lets the operator start the process by activating the first safe task. Activation is the brid
- docs/architecture/AGENT_TASK_CONTEXT.md:5 (300) — Phase 4D adds a lightweight adapter that normalizes task input into a consistent agent context object. It is advisory only in this phase. The adapter gives futu
- docs/architecture/CONTROL_EXECUTION_VERIFICATION_PLANES.md:241 (299) — `memory/safety-events.json` and `memory/system-usage.json` are written by the safety subsystem and budget guard respectively. No agent, hook, or tool can write

## Result

- PASS
