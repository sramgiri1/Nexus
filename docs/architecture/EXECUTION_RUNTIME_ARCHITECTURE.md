# Execution Runtime Architecture

**Version:** 1.0  
**Date:** 2026-05-05

---

## Purpose

NEXUS is runtime-aware. Agents do not just need the right contract and skill. They also need the right execution environment.

Execution is runtime-aware.  
NEXUS must know where a task can safely run before scheduling it.

This document defines the execution runtimes that future runtime integration will target without changing dispatch behavior in this phase.

---

## Runtime Catalog

| Runtime | Purpose | Typical work |
| --- | --- | --- |
| `node-local` | Local Node.js execution on the orchestrator host | contract checks, state-machine checks, readiness checks, local scripts, lightweight backend or web checks |
| `linux-container` | Future containerized execution worker | backend tests, frontend tests, lint, static analysis, build checks, sandboxed command execution |
| `macos-xcode` | macOS-hosted iOS build and simulator execution | `xcodebuild`, `xcrun simctl`, Swift tests, UI tests, `xcresult` collection |
| `provider-api` | Realtime model execution through approved providers | planning, reasoning, structured analysis, controlled report generation, policy-approved release decisions |
| `batch-provider` | Async provider batch execution | non-blocking summaries, reports, variants, clustering, cost optimization |
| `mcp-server` | Future controlled external tool servers | GitHub, Jira, browser, DB, and other registered integrations after approval |
| `human-approval` | Manual approval checkpoint | deploy approval, secrets approval, migration approval, production data approval, release approval if configured |

---

## Runtime 1 — `node-local`

### Purpose

- local Node.js execution
- contract checks
- state-machine checks
- readiness checks
- backend or web local checks
- lightweight scripts

### Use Cases

- `check:agent-os-readiness`
- `check:agent-context`
- local diff review helpers
- queue and memory inspection
- deterministic repo scans

### Constraints

- shares the orchestrator host, so it must stay bounded
- suitable for deterministic scripts and lightweight command execution
- not a substitute for isolated CI or macOS-specific tooling

---

## Runtime 2 — `linux-container`

### Purpose

- future containerized execution
- backend tests
- frontend tests
- lint
- static analysis
- build checks
- sandboxed command execution

### Use Cases

- Node backend test suites
- React or web build checks
- ESLint and static analysis
- isolated command execution with controlled mounts

### Constraints

- Linux containers cannot run Xcode or iOS simulator
- container jobs still require contract scope, command policy, and evidence capture
- container runtime is not implemented in this phase

---

## Runtime 3 — `macos-xcode`

### Purpose

- iOS build and test execution
- simulator lifecycle management
- `xcodebuild`
- `xcrun simctl`
- Swift tests
- UI tests
- `xcresult` artifacts

### Use Cases

- iOS unit tests
- iOS UI tests
- simulator-driven QA flows
- permissions and Info.plist validation that require actual Apple toolchain context

### Constraints

- required for iOS validation
- runs on a macOS host or macOS CI worker
- not replaceable by normal Linux Docker
- must produce structured evidence for SENTINEL

---

## Runtime 4 — `provider-api`

### Purpose

- realtime model calls through OpenAI, Anthropic, or other approved providers
- planning
- reasoning
- controlled report generation
- release decisions only where policy allows

### Use Cases

- NEXUS priority and release decisions
- SHEPHERD planning
- strategy summaries that are not deterministic skills
- policy-approved product or growth artifact generation

### Constraints

- governed by model routing and fallback policy
- restricted or secret data must not enter provider context when policy forbids it
- provider output is not execution evidence unless recorded as structured model result

---

## Runtime 5 — `batch-provider`

### Purpose

- async batch jobs
- non-blocking summaries, reports, variants, clustering
- cost optimization

### Use Cases

- market scan summaries
- pricing variants
- feedback clustering
- marketing copy variants
- ASO and SEO keyword variants

### Constraints

- batch cannot pass gates
- batch cannot execute tools
- batch cannot release GO
- batch cannot process restricted or secret data
- batch output must reconcile before downstream use

---

## Runtime 6 — `mcp-server`

### Purpose

- future controlled external tool servers
- GitHub, Jira, browser, DB, and similar integrations when approved

### Use Cases

- issue management
- external browsing with policy boundaries
- controlled database or ticket system access

### Constraints

- MCP servers require registration
- capability policy is required
- security review is required
- no MCP runtime is introduced in this phase

---

## Runtime 7 — `human-approval`

### Purpose

- deploy approval
- secrets approval
- migration approval
- production data approval
- release GO approval if configured
- real batch enablement approval if configured

### Use Cases

- production deploy
- environment or secret change
- CI or CD pipeline change
- database migration
- production analytics or data access

### Constraints

- approval does not replace gate evidence
- approval outcome must be captured as evidence
- high-risk tasks remain blocked until approval evidence exists

---

## Routing Rules

The runtime choice must be derived before scheduling real execution.

| Task class | Required runtime |
| --- | --- |
| iOS simulator tasks | `macos-xcode` |
| `xcodebuild` tasks | `macos-xcode` |
| backend Node tests | `node-local` or `linux-container` |
| frontend tests | `node-local` or `linux-container` |
| verification gate skills | deterministic skill path on the appropriate runtime |
| release decisions | realtime, evidence-driven control path through `provider-api` or deterministic control skills where applicable |
| batch-friendly non-blocking summaries | `batch-provider` |
| high-risk deploy, secrets, migration, production data tasks | `human-approval` plus the required execution runtime |

Additional rules:

- verification gates use deterministic skills
- batch tasks cannot execute tools or pass gates
- provider-api work must still observe model routing and data classification rules
- human approval is additive, not substitutive
- runtime work should eventually emit enough heartbeat and evidence detail to support
  reclaim, retry, recovery, and incident handling

---

## Scheduling Principle

Future runtime integration should separate three questions before execution:

1. Can this agent do this work?
2. Can this task run in this runtime?
3. What evidence must come back before state changes are allowed?

That means runtime selection is not just an implementation detail. It is part of the execution contract.

Runtime selection is also part of the security boundary. A runtime is only valid if:

- the task is allowed there
- the command family is allowed there
- the path boundary is allowed there
- data classification is allowed there
- network and provider policy are allowed there
- approval exists when required

---

## Architecture Boundaries

Phase 6 is architecture only.

This document does not:

- modify `orchestrator/loop.js`
- modify `orchestrator/runner.js`
- implement linux workers
- implement the macOS Xcode Runner
- implement sandbox enforcement
- implement live network controls
- implement live approval gates
- implement durable leases or worker heartbeats
- add Dockerfiles
- add MCP servers
- change state-machine behavior

It defines the runtime model that later implementation phases must follow.
