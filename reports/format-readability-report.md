# Format Readability Report

## Metadata

- Generated at: 2026-05-08T00:21:42.837Z
- Validation branch: arch/careloop-first-governed-validation-task
- Validation HEAD: 2e61b5a
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Summary

- Files checked: 124

## Warnings

- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:74:302
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:79:334
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:81:336
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:82:316
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:84:403
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:91:326
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:92:338
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:94:378
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:95:391

## Failures

- none

## Top Longest Lines

- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:84 (403) — \| `compliance_privacy` \| `warden` \| `forge`, `stream`, `synapse`, `canvas`, `compass`, `oracle` \| `warden` \| verification, approval when needed \| `verification.
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:95 (391) — \| `release_control` \| `nexus` \| `shepherd`, `auditor`, `sentinel`, `warden`, `forge` \| `auditor`, `sentinel`, `warden` \| release, verification, approval when co
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:94 (378) — \| `demo_showcase` \| `canvas` \| `pixel`, `beacon`, `nexus`, `shepherd` \| `warden`, `auditor`, `sentinel` as public-safety and evidence reviewers \| task, handoff,
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:92 (338) — \| `reliability` \| `shepherd` \| `forge`, `relay`, `nexus` \| `auditor`, `sentinel`, `warden` as evidence contributors \| task, handoff, approval when risky \| `orch
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:81 (336) — \| `ai_integration` \| `synapse` \| `forge`, `warden`, `nexus` \| `warden` for data class or provider policy issues \| task, handoff, approval \| `platform.ai_integra
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:79 (334) — \| `deployment` \| `forge` \| `shepherd`, `core`, `swift`, `pixel` \| `warden` for secret or compliance impact \| task, handoff, approval \| `platform.deploy_plan`, `
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:91 (326) — \| `security` \| `warden` \| `forge`, `auditor`, `sentinel`, `synapse` \| `warden` \| verification, approval \| `security.secret_scan`, `verification.compliance_gate`
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:82 (316) — \| `code_quality` \| `auditor` \| `core`, `swift`, `pixel` as remediation owners \| `auditor` \| verification \| `verification.code_quality_gate` \| none for normal ve
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:74 (302) — \| `design` \| `prism` \| `atlas`, `pixel`, `swift`, `canvas` \| `warden` when regulated copy or claims exist \| task, handoff \| `orchestration.plan_flow` until a de
- docs/architecture/AGENT_TASK_CONTEXT.md:5 (300) — Phase 4D adds a lightweight adapter that normalizes task input into a consistent agent context object. It is advisory only in this phase. The adapter gives futu
- docs/architecture/CONTROL_EXECUTION_VERIFICATION_PLANES.md:241 (299) — `memory/safety-events.json` and `memory/system-usage.json` are written by the safety subsystem and budget guard respectively. No agent, hook, or tool can write
- docs/architecture/NEXUS_OS_GLOSSARY.md:308 (297) — A batch task that has been queued to `memory/batch-queue.json` but not yet submitted to the batch API. Deferred batch is the current implementation state — batc
- docs/architecture/AGENTIC_OS_ARCHITECTURE.md:485 (296) — The state machine is the authoritative record of task, gate, and project state. Agents propose state transitions. The state machine validates and commits them.
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:73 (295) — \| `product_definition` \| `atlas` \| `shepherd`, `prism`, `core`, `swift`, `pixel` \| `auditor`, `warden` \| task, handoff \| `orchestration.plan_flow` until a dedic
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:78 (292) — \| `static_content` \| `canvas` \| `prism`, `beacon`, `pixel` \| `warden` when claims, privacy, or store copy are involved \| task, handoff \| `implementation.static_
- docs/architecture/NEXUS_OS_GLOSSARY.md:48 (289) — A high-level goal, product direction, sprint scope, or task objective provided by the operator. Founder intent is the input that NEXUS translates into typed tas
- docs/architecture/AGENTIC_OS_ARCHITECTURE.md:170 (288) — Without domain ownership, multiple agents write to the same artifacts. CORE rewrites a schema that ATLAS owns. SENTINEL approves a gate that AUDITOR should have
- docs/architecture/AGENTIC_OS_ARCHITECTURE.md:506 (288) — An agent that writes `"status": "completed"` to a task is proposing a transition, not committing one. The state machine checks: does the result contain verifiab
- docs/architecture/DOMAIN_OWNERSHIP_POLICY.md:90 (287) — \| `analytics` \| `oracle` \| `stream`, `relay`, `warden` \| `warden` for user-data implications \| task, handoff, approval \| `growth.analytics_schema`, `data.safe_d
- docs/architecture/AGENTIC_OS_ARCHITECTURE.md:206 (286) — An agent that builds an API route has good judgment about whether that route is correct. It does not have authority to decide the route is verified. Judgment an

## Result

- PASS
