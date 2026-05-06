# Skill Runtime Mapping

**Version:** 1.0  
**Date:** 2026-05-05

---

## Purpose

NEXUS skills are deterministic execution units. Before a skill is scheduled, NEXUS must know which runtime can execute it safely and what evidence the skill should produce.

This document maps the current known skills to runtimes and evidence expectations.

---

## Mapping Table

| Skill | Owner Agent | Runtime | Blocking? | Evidence Produced | Notes |
| --- | --- | --- | --- | --- | --- |
| `auditor.code.lint` | AUDITOR | `node-local` or `linux-container` | Usually blocking for gates | `lint_result` | Suitable for backend, web, and repo lint paths |
| `auditor.code.static_analysis` | AUDITOR | `node-local` or `linux-container` | Usually blocking for gates | `static_analysis_result` | Deterministic scan, no provider dependency |
| `auditor.code.test_coverage` | AUDITOR | `node-local` or `linux-container` for backend or web; `macos-xcode` if iOS coverage | Usually blocking for gates | `test_coverage_result` | Runtime depends on project type |
| `auditor.code.diff_review` | AUDITOR | `node-local` | Usually blocking for gates | `diff_review_result` | Local git diff inspection |
| `sentinel.qa.simulator.run` | SENTINEL | `macos-xcode` | Blocking when required for iOS QA | `simulator_result` | Requires real simulator runtime |
| `sentinel.qa.tests.execute` | SENTINEL | `node-local` or `linux-container` for backend or web; `macos-xcode` for iOS | Blocking for gates | `test_result`, `xcresult` where applicable | Do not route iOS test execution to Linux |
| `sentinel.qa.logs.analyze` | SENTINEL | `node-local` | Usually blocking when attached to gate evidence | `log_analysis_result` | Consumes runtime output and log artifacts |
| `sentinel.qa.security.scan` | SENTINEL | `node-local` or `linux-container` | Blocking for security-sensitive gates | `security_scan_result` | Deterministic security scan |
| `warden.compliance.privacy.check` | WARDEN | `node-local` or `provider-api` depending on mode | Blocking when attached to compliance gate | `privacy_check_result` | Must respect data classification |
| `warden.compliance.permissions.validate` | WARDEN | `node-local`; `macos-xcode` for iOS permission or runtime confirmation | Blocking when attached to compliance gate | `permissions_validation_result` | iOS permission review may require Xcode-hosted runtime |
| `warden.compliance.appstore.check` | WARDEN | `provider-api` realtime or `node-local` checklist mode | Blocking when App Store release claims are in scope | `appstore_policy_result` | Never batch for gate decisions |
| `nexus.read.system_state` | NEXUS | `node-local` | Blocking when used for decisions | `system_state_snapshot` | Reads memory and typed system state |
| `nexus.decide.priority` | NEXUS | `provider-api` realtime | Blocking for live prioritization | `decision_result` | Decision evidence, not direct execution evidence |
| `nexus.decide.release` | NEXUS | `provider-api` realtime | Blocking release path | `release_decision_result`, `release_contract` | Requires gate evidence |
| `orchestrator.flow.plan` | SHEPHERD | `provider-api` realtime or `node-local` deterministic mode later | Blocking for planning path | `plan_result` | Realtime today, deterministic planner possible later |
| `orchestrator.flow.dispatch` | SHEPHERD | `node-local` | Blocking for queue mutation | `dispatch_result` | Queue and contract-aware dispatch action |
| `orchestrator.flow.monitor` | SHEPHERD | `node-local` | Usually blocking for live system state | `queue_state_snapshot` | Observability of queue and execution status |
| `orchestrator.flow.aggregate` | SHEPHERD | `node-local` or `provider-api` depending on mode | Usually non-blocking unless used in live decision path | `aggregate_report` | Informational aggregation only |

---

## Runtime Rules

- Every skill must declare runtime before it is scheduled.
- Skills that touch iOS simulator require `macos-xcode`.
- Blocking gate skills cannot run in `batch-provider`.
- Batch summaries may support reports but cannot pass gates.
- Skill results are evidence; agent claims are not.

---

## Scheduling Guidance

Future runtime integration should select skill runtime from:

1. skill definition
2. project type
3. task contract
4. data classification
5. blocking versus non-blocking role

That means a single skill family can map to different runtimes depending on the project. Example:

- `sentinel.qa.tests.execute` for a Node backend can run in `node-local` or `linux-container`
- `sentinel.qa.tests.execute` for iOS must route to `macos-xcode`

---

## Phase Boundary

This mapping is architecture only in Phase 6.

It does not:

- change runtime dispatch
- implement the Xcode Runner
- add container workers
- add new skills

It defines how later runtime integration should reason about skill placement and evidence production.
