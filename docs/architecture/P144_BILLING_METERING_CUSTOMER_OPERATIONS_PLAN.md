# P144 Billing, Metering, and Customer Operations Plan

P144 turns enterprise billing, metering, usage visibility, support handoff,
entitlements, invoice previews, and customer operations into governed Command
Center surfaces. It must not enable live billing, payment, customer, support,
DB, provider, network, or spend authority until each subphase has an
implementation-grade plan, tests, checker, docs/status update, and final
validation.

Global safety rules:

- Do not write billing accounts, record usage, create invoices, collect
  payments, mutate subscriptions or entitlements, create support tickets,
  contact customers, or execute customer operations unless a later subphase
  explicitly allows a safe implementation path.
- Do not write DB/runtime state, call providers/models, call payment providers,
  execute tools, start MCP servers, dispatch agents, mutate projects, deploy,
  release, export, package, use network calls, or spend.
- Do not expose raw JSON, raw logs, raw policy dumps, raw billing payloads, raw
  payment payloads, raw customer payloads, raw usage payloads, or private
  project IDs in primary Command Center UX.
- Preserve System, Dark, and Light themes.

## P144.1 Contract / Policy / Safety Boundary

Status: complete

Narrow goal: start P144 with billing, metering, customer operation, support
handoff, entitlement, and invoice preview contracts plus blocked authority
flags, checker coverage, docs/status handoff, and planned-only P144.2 handoff.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `5034d56a`.

Allowed files: package script, P144 contract, P144.1 checker, enterprise
checker, OS status checker, route tests, P144 plan, README, platform roadmap,
enterprise roadmap, OS phase status, phase index, and generated reports.

Forbidden files: project files, generated project files, private project roots,
dashboard source, DB/runtime implementation, providers, tools, worker runtime,
deploy/release/export/package folders, env files, payment provider adapters,
and billing/customer/support mutation paths.

Expected data shape: contract metadata only for billing accounts, usage meters,
invoice previews, entitlements, support handoffs, customer operations, and
blocked authority flags. No runtime export, DB schema, mutation payload,
executable payload, provider call, payment call, network call, or spend data
shape.

Expected exports and schemas: no runtime exports. No DB schema or migration.
No payment provider adapter, invoice creator, subscription mutator, entitlement
writer, usage writer, support ticket writer, customer contact sender,
executable command, or payload writer.

Command Center UX requirements: OS Roadmap must show P144.1 complete and
P144.2 planned-only next. Primary UX must not show fake runnable
billing/customer actions, raw dumps, private IDs, or internal phase labels
outside OS Roadmap. P144.1 does not add a new billing/customer-ops page.

Dark/light/system theme requirements: preserve System, Dark, and Light themes;
validate route-wide Command Center coverage through Playwright.

Playwright tests: add P144.1 OS Roadmap coverage and run focused P144.1 plus
route-wide safety coverage.

Checker updates: add P144.1 checker, update enterprise checker for P144.1
active state, and update OS status checker for P144 subphase IDs.

Docs/README/roadmap updates: README, P144 plan, platform roadmap, enterprise
readiness roadmap, OS phase status, and phase index.

Reports to regenerate: P144.1 report, enterprise readiness report, OS phase
status report, and phase validation coverage report.

OS phase status update: P144 in progress; P144.1 complete; previous P143.7;
next P144.2 planned-only; P145 remains planned-only.

Validation commands:

- `npm run check:p1441-billing-metering-customer-operations`
- `npm run check:p1437-release-deploy-export-package-pipeline-final-validation`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "P144.1|Command Center route-wide UX"`
- `git diff --check`

Final safety checks: no project files, no dashboard source, no DB/runtime
implementation, no provider/tool/worker-runtime changes, no deploy/release/
export/package folders, no env files, no billing/customer mutation authority,
no payment provider calls, no raw payload exposure, no fake working actions,
and no stale placeholder commit marker after the stamp commit.

Git add, commit, and push commands:

- `git add <P144.1 allowed files>`
- `git commit -m "feat(nexus): start p144 billing operations contract"`
- `git add <P144.1 stamp files and refreshed reports>`
- `git commit -m "chore(nexus): stamp p1441 billing operations contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist: branch, commit hash, files changed, implementation,
Command Center UX preservation, tests, checker results, dashboard build/unit/
page results, docs/README/roadmap updates, OS phase status update, evidence
records, safety confirmations, forbidden paths confirmation, known limitations,
and next phase/subphase.

Result: complete as contract/policy/safety-boundary work only. P144.2 is
planned-only next. No billing account mutation, usage write, invoice creation,
payment collection, subscription mutation, entitlement grant/revoke, support
ticket creation, customer contact, customer operation execution, DB/runtime
write, provider/model call, payment provider call, tool execution, MCP startup,
agent dispatch, project mutation, deploy, release, export, package, network
call, or spend authority is enabled.

## P144.2 Billing and Meter Model

Status: planned

Narrow goal: add a read-only billing and usage meter model with display-safe
account, usage, invoice preview, entitlement, support handoff, and customer
operation rows while every mutation and spend authority remains blocked.

Scope: NEXUS OS model-only work. It must not add DB schemas, payment provider
calls, customer mutation, support ticket creation, or Command Center action
execution.

Validation: dedicated P144.2 checker, prior P144.1 checker, enterprise
roadmap checker, OS phase status checker, phase validation coverage, dashboard
build/unit checks, focused route coverage, and `git diff --check`.

## P144.3 Billing Preview

Status: planned

Narrow goal: add non-runnable billing/customer-ops previews with disabled
reasons, blockers, evidence refs, and null executable payloads.

Scope: preview-only mapping over P144.2 model data. It must not execute
payment, invoice, subscription, entitlement, support, customer, DB, provider,
network, or spend operations.

Validation: dedicated P144.3 checker, prior P144.2 checker, enterprise
roadmap checker, OS phase status checker, phase validation coverage, dashboard
build/unit checks, focused route coverage, and `git diff --check`.

## P144.4 Customer Operations Command Center UX

Status: planned

Narrow goal: surface display-only billing/customer-ops state in Command Center
with current state, next action, blockers, disabled reason, owner,
evidence/activity location, and cost impact.

Scope: Command Center UX only. It must preserve dark/light/system themes, avoid
raw dumps and private IDs, and keep all billing/customer operations disabled
unless explicitly allowed by a later implementation-grade plan.

Validation: dedicated P144.4 checker, prior P144.3 checker, route-wide
Playwright safety tests, dashboard build/unit checks, enterprise roadmap
checker, OS phase status checker, phase validation coverage, and
`git diff --check`.

## P144.5 Tests / Checkers

Status: planned

Narrow goal: harden P144 aggregate checker, route-wide Command Center safety
coverage, and billing/customer-ops contract/model/preview assertions.

Scope: tests/checkers only. It must not add runtime billing/customer authority,
DB writes, provider calls, network calls, or spend.

Validation: dedicated P144.5 checker, prior P144.4 checker, enterprise
roadmap checker, OS phase status checker, phase validation coverage, dashboard
build/unit checks, route-wide Playwright tests, and `git diff --check`.

## P144.6 Docs / Roadmap / Status

Status: planned

Narrow goal: close P144 docs, README, roadmap, OS phase status, checker
handoff, report freshness, and P144.7 planned-only final validation handoff.

Scope: docs/status/checker closure only. It must not add runtime
billing/customer authority, DB writes, provider calls, network calls, or
spend.

Validation: dedicated P144.6 checker, prior P144.5 checker, enterprise
roadmap checker, OS phase status checker, phase validation coverage, dashboard
build/unit checks, focused route coverage, and `git diff --check`.

## P144.7 Final Validation

Status: planned

Narrow goal: close P144 with final validation evidence, prior report
verification, P144 complete status, and safe planned-only P145 handoff.

Scope: final validation only. It must not enable billing/customer runtime
authority, payment collection, DB writes, provider calls, network calls, or
spend.

Validation: dedicated P144.7 checker, prior P144.6/P144.5 reports,
enterprise roadmap checker, OS phase status checker, phase validation
coverage, dashboard build/unit checks, route-wide Playwright tests, and
`git diff --check`.
