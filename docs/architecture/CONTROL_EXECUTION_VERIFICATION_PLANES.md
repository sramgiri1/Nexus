# NEXUS Agentic OS — Control, Execution, Verification, and Observability Planes

**Version:** 1.0
**Date:** 2026-05-03

---

## Overview

NEXUS organizes its agents into four planes. Each plane has a distinct purpose, a defined set of members, and rules it cannot violate. The planes are not org-chart tiers — they are architectural separation of concerns.

```
CONTROL PLANE       →  decides, plans, authorizes, routes
EXECUTION PLANE     →  produces artifacts within contracts
VERIFICATION PLANE  →  runs deterministic gates, produces evidence
OBSERVABILITY PLANE →  records, synthesizes, surfaces signals (non-blocking)
```

Work flows from the control plane to the execution plane to the verification plane and back to the control plane for release. The observability plane is parallel and non-blocking. No plane skips another.

---

## Plane 1 — Control Plane

### Members

| Component | Role |
| --- | --- |
| NEXUS | Strategic decision engine, agent dispatcher, release authority |
| SHEPHERD | Sprint plan owner, exit criteria enforcer, dependency tracker |
| Governor (`safety/governor.js`) | Permission enforcer for all sensitive actions |
| Scheduler (`orchestrator/loop.js`) | Task dispatcher, phase sequencer, auto-heal engine |
| State Machine | Task/gate/project state authority |
| Memory (`memory/*.json`) | Typed state store and evidence database |

### Responsibilities

| Responsibility | Owner |
| --- | --- |
| Prioritizing the task queue | NEXUS via `nexus.decide.priority` skill |
| Planning sprint phases and task graph | SHEPHERD + `orchestrator.flow.plan` skill |
| Routing tasks to agents | loop.js — driven by NEXUS decisions |
| Authorizing every sensitive action | Governor — synchronous, before tool execution |
| Maintaining task and gate state | State machine + `memory/task-queue.json` |
| Making GO / NO-GO release decisions | NEXUS via `nexus.decide.release` skill |
| Surfacing blockers to the founder | NEXUS — writes to `memory/founder-actions.json` |

### Rules

**Control agents do not write production code.**

NEXUS and SHEPHERD route, plan, and authorize. They do not implement API routes, write SwiftUI views, configure CI pipelines, or produce feature artifacts. A control agent that writes production code has crossed into the execution plane — this is an architecture violation.

**Control agents do not self-certify gates.**

NEXUS cannot declare a gate passed without evidence from the verification plane. SHEPHERD cannot close a sprint without SENTINEL sign-off. The control plane makes decisions based on evidence produced elsewhere; it does not produce that evidence itself.

**The governor cannot be bypassed.**

Every action in the control plane that touches tools passes through `governor.js`. There is no code path that skips authorization. The governor is not a check on top of the control plane — it is part of the control plane's kernel.

---

## Plane 2 — Execution Plane

### Members

| Agent | Domain | Primary artifact |
| --- | --- | --- |
| CORE | Backend | API routes, Prisma schema, scheduler, notifications |
| SWIFT | iOS | SwiftUI views, API client, session management |
| PIXEL | Web frontend | React dashboards, web product UI |
| CANVAS | Static web | Privacy policy HTML, landing pages |
| PRISM | Design | Design system tokens, component specs |
| FORGE | Platform / DevOps | Railway deploy, secrets, CI/CD |
| STREAM | Data | External API adapters, ingestion pipelines |
| SYNAPSE | AI features | Claude API integration, fallback logic |
| ATLAS | Product | PRD, API contracts, sprint scope decisions |
| RADAR | Strategy | Market gap analysis, TAM sizing |
| MERIDIAN | Strategy | Revenue model, business validation |
| BEACON | Growth | App Store copy, launch emails |
| COMPASS | Growth | ASO keywords, SEO meta tags |
| ORACLE | Analytics | Event schema, PostHog configuration |

### Responsibilities

| Responsibility | Who |
| --- | --- |
| Produce artifacts within approved contract scope | All execution agents |
| Implement features per PRD and API contracts | CORE, SWIFT, PIXEL, CANVAS |
| Provide infrastructure within sprint scope | FORGE |
| Write product documents per founder direction | ATLAS, PRISM |
| Produce market and revenue analysis | RADAR, MERIDIAN |
| Produce growth and analytics artifacts | BEACON, COMPASS, ORACLE |
| Request verification via typed handoff | All execution agents |

### Rules

**Workers do not mark final completion.**

An execution agent can write to `task-queue.json` to record its result, but it cannot commit a task to `verified` or `released` status. Those transitions belong to the state machine, which requires gate evidence from the verification plane.

**Workers do not pass their own gates.**

CORE cannot run `auditor.code.lint` to certify its own output. SWIFT cannot run `sentinel.qa.tests.execute` to certify its own screens. The governor enforces skill ownership — workers cannot invoke verification skills. If a worker tries, the action is blocked and logged.

**Workers do not schedule arbitrary work.**

ENGINEER-tier agents (CORE, SWIFT, PIXEL, CANVAS) and PLATFORM-tier agents (FORGE, STREAM, SYNAPSE) cannot enqueue tasks for other agents. If a worker identifies additional work that needs to happen, it reports that to its task result. NEXUS or SHEPHERD decide whether to act.

STRATEGY-tier agents (ATLAS, RADAR, MERIDIAN, PRISM, BEACON, COMPASS, ORACLE) can enqueue tasks to NEXUS only. They cannot dispatch directly to engineering agents.

**Workers operate within contract scope.**

Execution agents may only write to `allowedFiles` and may not write to `forbiddenFiles` as specified in their task contract. The file-scope guard enforces this. An agent that writes outside its contract scope has its write blocked and the event logged.

### Execution → Verification Handoff

When an execution agent completes its work, it hands off to AUDITOR via a typed handoff contract. The handoff must include:

```json
{
  "sourceAgent": "core",
  "targetAgent": "auditor",
  "projectId": "careloop",
  "taskType": "verification_gate",
  "objective": "Verify Sprint 2 backend implementation",
  "allowedFiles": ["projects/careloop/src/", "projects/careloop/tests/"],
  "requiredSkills": ["auditor.code.lint", "auditor.code.diff_review", "auditor.code.static_analysis", "auditor.code.test_coverage"],
  "acceptanceCriteria": ["code.lint PASS", "code.diff_review PASS"],
  "riskLevel": "medium",
  "blocking": true,
  "parentTaskId": "task-..."
}
```

---

## Plane 3 — Verification Plane

### Members

| Agent | Skills | Gate produces |
| --- | --- | --- |
| AUDITOR | `code.lint`, `code.static_analysis`, `code.test_coverage`, `code.diff_review` | `reports/auditor/<project>-<date>.json` |
| SENTINEL | `qa.security.scan`, `qa.simulator.run`, `qa.tests.execute`, `qa.logs.analyze` | `reports/sentinel/<project>-qa-<date>.md` |
| WARDEN | `compliance.privacy.check`, `compliance.permissions.validate`, `compliance.appstore.check` | `reports/warden/<project>-compliance-<date>.md` |

### Gate Sequence

```
AUDITOR gate (4 skills, no Claude)
  code.diff_review | code.lint | code.static_analysis | code.test_coverage
  ↓ all PASS
SENTINEL gate (3 skills, no Claude)
  qa.security.scan | qa.simulator.run | qa.tests.execute
  ↓ all PASS
WARDEN gate (2+ skills, no Claude)
  compliance.privacy.check | compliance.permissions.validate
  ↓ all PASS
NEXUS release decision (nexus.decide.release skill)
```

Gate phases are wired with `dependsOn` in the task graph. SENTINEL's gate task cannot enter `running` state until AUDITOR's gate task reaches `verified`. WARDEN cannot run until SENTINEL has passed. This is structural, not advisory.

### Responsibilities

| Responsibility | Owner |
| --- | --- |
| Running all owned skills — no skipping | Each verifier agent |
| Producing gate evidence artifacts | Each verifier agent |
| Writing PASS / FAIL gate report | Each verifier agent |
| Blocking sprint closure on FAIL | Gate `dependsOn` wiring + verifier status |
| Writing QA checklists and sign-off documents | SENTINEL |
| Writing compliance sign-off document | WARDEN |

### Rules

**Verifiers do not fix implementation.**

When AUDITOR finds lint errors, it reports them and sets gate status to FAIL. It does not fix the errors. CORE fixes the errors, re-runs the gate, and re-submits. Fixing implementation is an execution plane responsibility. If AUDITOR writes to `src/`, the governor blocks it.

**Verifiers do not modify production source code.**

The file-scope guard in `guardrails/file-scope.json` restricts verifier write access to `reports/<agent>/` and project QA/compliance subdirectories. Verifiers are blocked from writing to `src/`, `app/`, `lib/`, and all system directories. This restriction exists even if a verifier believes it has a good reason to edit source.

**Verifiers do not release.**

AUDITOR, SENTINEL, and WARDEN produce evidence. They do not make the release decision. The release decision is NEXUS's responsibility, made via `nexus.decide.release` after aggregating all three gate results. A verifier that approves a release is acting outside its plane.

**All gate skills must run — no skipping.**

AUDITOR runs all four skills even if the first one fails. Collecting all evidence matters more than stopping early. A gate report that skips skills is not a valid gate report. The governor blocks a gate from being marked PASS if required skills have not run.

**Batch output cannot satisfy gate evidence.**

Gate skills run synchronously and in real-time. A batch job that produces lint output or test results after the fact cannot retroactively satisfy a gate. Gate evidence must be produced by skills run during the gate phase of the task graph.

---

## Plane 4 — Observability Plane

### Members

| Component | Role |
| --- | --- |
| RELAY | Tester feedback synthesis, bug clustering, product signal routing |
| `hooks/index.js` | Lifecycle event observers (on_goal_received, on_step_completed, etc.) |
| `memory/safety-events.json` | Append-only governor block + approval log |
| `memory/system-usage.json` | Token and cost usage per day / month / agent |
| `memory/conversations/<agent>.log` | Per-agent activity log |
| `memory/batch-queue.json` | Batch task lifecycle state |
| `reports/<agent>/` | Full gate outputs, analyses, synthesized documents |

### Responsibilities

| Responsibility | Owner |
| --- | --- |
| Tester feedback synthesis | RELAY |
| Bug clustering and severity routing | RELAY |
| Lifecycle event recording | hooks |
| Safety event audit trail | `safety-events.json` + `safetyLogger.js` |
| Cost and token tracking | `system-usage.json` + `budgetGuard.js` |
| Batch lifecycle visibility | `batch-queue.json` |

### Rules

**Observability does not mutate critical state without validators.**

RELAY can write synthesis documents and route signals to ATLAS and NEXUS via task results. It cannot directly modify `portfolio.json`, `task-queue.json`, or `agent-status.json`. Observability surfaces information; it does not act on it unilaterally.

**Hooks do not bypass the governor.**

Hooks fire at lifecycle transition points. A hook that invokes a tool directly — without going through the tool registry and governor — is an architecture violation. Hooks call into `executeTool` the same way agents do.

**Safety and usage logs are system-owned.**

`memory/safety-events.json` and `memory/system-usage.json` are written by the safety subsystem and budget guard respectively. No agent, hook, or tool can write to them directly. This preserves the integrity of the audit trail — if agents could modify these files, the audit trail would be worthless.

**RELAY activates only on real user signals.**

RELAY does not synthesize hypothetical feedback or invent tester signals. It activates when TestFlight is live and real testers have submitted sessions. Synthetic feedback synthesis is an observability violation.

---

## Plane Interaction Rules

| From | To | Via | Blocked? |
| --- | --- | --- | --- |
| Control | Execution | Typed task contracts | No — this is the primary flow |
| Execution | Verification | Typed handoff contracts | No — required after every build |
| Verification | Control | Evidence artifacts + gate status | No — required to unblock release |
| Execution | Control | Task result + blocker reports | No — agents report back |
| Observability | Control | RELAY synthesis reports | No — routed via NEXUS task |
| Execution | Execution | Direct enqueue | Blocked — workers cannot dispatch workers |
| Verification | Execution | Writing source code | Blocked — verifiers cannot modify source |
| Verification | Control | Marking final release | Blocked — only NEXUS releases |
| Any | Any | Bypassing governor | Blocked — no code path skips governor |
| Any | Audit logs | Direct write | Blocked — audit logs are system-owned |
