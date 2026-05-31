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

Status: complete

Narrow goal: add a read-only billing and usage meter model with display-safe
account, usage, invoice preview, entitlement, support handoff, and customer
operation rows while every mutation and spend authority remains blocked.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `8d4cfdac`.

Allowed files: package script, read-only billing/customer-ops model, P144
contract, P144.2 checker, P144.1 checker handoff, enterprise checker, route
tests, P144 plan, README, platform roadmap, enterprise roadmap, OS phase
status, phase index, and generated reports.

Forbidden files: project files, generated project files, private project
roots, dashboard source, DB/runtime implementation, providers, tools, worker
runtime, deploy/release/export/package folders, env files, payment provider
adapters, and billing/customer/support mutation paths.

Expected exports and schemas:
`BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_PHASE`,
`BILLING_METERING_CUSTOMER_OPERATIONS_MODEL_VERSION`,
`BILLING_METERING_CUSTOMER_OPERATIONS_SAFETY_FLAG_NAMES`,
row builders and validators for billing accounts, usage meters, invoice
previews, entitlements, support handoffs, and customer operations, plus
aggregate model and result-envelope builders. No DB schema or migration.

Expected data shape: read-only billing model with `billingAccounts`,
`usageMeters`, `invoicePreviews`, `entitlements`, `supportHandoffs`,
`customerOperations`, `readinessSummary`, authority/safety flags, zero-spend
`costImpact`, `redactionState`, evidence/activity refs, mode guard,
disabled reason, next action, blockers, and result-envelope data. No mutation
payload, executable payload, provider call, payment call, network call, or
spend data shape.

Command Center UX requirements: OS Roadmap must show P144.2 complete and
P144.3 planned-only next. P144.2 adds no new Command Center billing/customer
page and does not expose the model directly. Primary UX must not show fake
runnable billing/customer actions, raw dumps, private IDs, or internal phase
labels outside OS Roadmap.

Dark/light/system theme requirements: preserve System, Dark, and Light themes;
validate route-wide Command Center coverage through Playwright.

Playwright tests: add P144.2 OS Roadmap coverage, update current-roadmap
assertions from P144.1 to P144.2, and retain route-wide safety coverage.

Checker updates: add P144.2 checker, update P144.1 checker for P144.2 handoff
compatibility, and update enterprise checker for P144.2 active state.

Docs/README/roadmap updates: README, P144 plan, platform roadmap, enterprise
readiness roadmap, OS phase status, and phase index.

Reports to regenerate: P144.2 report, P144.1 report, enterprise readiness
report, OS phase status report, and phase validation coverage report.

OS phase status update: P144 in progress; P144.1 complete; P144.2 complete;
previous P144.1; current P144.2; next P144.3 planned-only; P145 remains
planned-only.

Validation commands:

- `npm run check:p1442-billing-metering-customer-operations`
- `npm run check:p1441-billing-metering-customer-operations`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "P144.2|Command Center route-wide UX"`
- `git diff --check`

Final safety checks: no project files, no dashboard source, no DB/runtime
implementation, no provider/tool/worker-runtime changes, no deploy/release/
export/package folders, no env files, no billing/customer mutation authority,
no payment provider calls, no raw payload exposure, no fake working actions,
and no stale placeholder commit marker after the stamp commit.

Git add, commit, and push commands:

- `git add <P144.2 allowed files>`
- `git commit -m "feat(nexus): add p1442 billing operations model"`
- `git add <P144.2 stamp files and refreshed reports>`
- `git commit -m "chore(nexus): stamp p1442 billing operations model"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist: branch, commit hash, files changed, implementation,
Command Center UX preservation, tests, checker results, dashboard build/unit/
page results, docs/README/roadmap updates, OS phase status update, evidence
records, safety confirmations, forbidden paths confirmation, known limitations,
and next phase/subphase.

Result: complete as read-only model work only. P144.3 is planned-only next.
No billing account mutation, usage write, invoice creation, payment
collection, subscription mutation, entitlement grant/revoke, support ticket
creation, customer contact, customer operation execution, DB/runtime write,
provider/model call, payment provider call, tool execution, MCP startup,
agent dispatch, project mutation, deploy, release, export, package, network
call, or spend authority is enabled.

## P144.3 Billing Preview

Status: complete

Narrow goal: add non-runnable billing/customer-ops previews with disabled
reasons, blockers, evidence refs, and null executable payloads.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `1fb7bb64`.

Allowed files: package script, non-runnable billing/customer-ops preview,
P144 contract, P144.3 checker, P144.2 checker handoff, enterprise checker,
route tests, P144 plan, README, platform roadmap, enterprise roadmap, OS
phase status, phase index, and generated reports.

Forbidden files: project files, generated project files, private project
roots, dashboard source, DB/runtime implementation, providers, tools, worker
runtime, deploy/release/export/package folders, env files, payment provider
adapters, and billing/customer/support mutation paths.

Expected exports and schemas:
`BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_PHASE`,
`BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_VERSION`,
`BILLING_METERING_CUSTOMER_OPERATIONS_PREVIEW_SAFETY_FLAG_NAMES`,
preview row builder/validator, aggregate preview builder/validator, and
preview result-envelope builder. No DB schema, migration, payment adapter, or
runtime writer.

Expected data shape: non-runnable billing preview with preview rows for
`billing_account`, `usage_meter`, `invoice_preview`, `entitlement`,
`support_handoff`, and `customer_operation` source rows. Each row includes
disabled reason, blockers, owner capability, evidence/activity refs, zero
cost impact, redaction visibility, blocked authority flags, and null
executable, billing, usage, invoice, payment, subscription, entitlement,
support, customer, provider, payment-provider, tool, agent, project,
DB/runtime, deploy/release/export/package, and network payloads.

Command Center UX requirements: OS Roadmap must show P144.3 complete and
P144.4 planned-only next. P144.3 adds no new Command Center billing/customer
page and does not expose raw preview payloads. Primary UX must not show fake
runnable billing/customer actions, raw dumps, private IDs, or internal phase
labels outside OS Roadmap.

Dark/light/system theme requirements: preserve System, Dark, and Light themes;
validate route-wide Command Center coverage through Playwright.

Playwright tests: add P144.3 OS Roadmap coverage, update current-roadmap
assertions from P144.2 to P144.3, and retain route-wide safety coverage.

Checker updates: add P144.3 checker, update P144.2 checker for P144.3 handoff
compatibility, and update enterprise checker for P144.3 active state.

Docs/README/roadmap updates: README, P144 plan, platform roadmap, enterprise
readiness roadmap, OS phase status, and phase index.

Reports to regenerate: P144.3 report, P144.2 report, enterprise readiness
report, OS phase status report, and phase validation coverage report.

OS phase status update: P144 in progress; P144.1-P144.3 complete; previous
P144.2; current P144.3; next P144.4 planned-only; P145 remains planned-only.

Validation commands:

- `npm run check:p1443-billing-metering-customer-operations`
- `npm run check:p1442-billing-metering-customer-operations`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "P144.3|Command Center route-wide UX"`
- `git diff --check`

Final safety checks: no project files, no dashboard source, no DB/runtime
implementation, no provider/tool/worker-runtime changes, no deploy/release/
export/package folders, no env files, no billing/customer mutation authority,
no payment provider calls, no raw payload exposure, no fake working actions,
and no stale placeholder commit marker after the stamp commit.

Git add, commit, and push commands:

- `git add <P144.3 allowed files>`
- `git commit -m "feat(nexus): add p1443 billing operations preview"`
- `git add <P144.3 stamp files and refreshed reports>`
- `git commit -m "chore(nexus): stamp p1443 billing operations preview"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist: branch, commit hash, files changed, implementation,
Command Center UX preservation, tests, checker results, dashboard build/unit/
page results, docs/README/roadmap updates, OS phase status update, evidence
records, safety confirmations, forbidden paths confirmation, known limitations,
and next phase/subphase.

Result: complete as non-runnable billing/customer preview work only. P144.4 is
planned-only next. No billing account mutation, usage write, invoice creation,
payment collection, subscription mutation, entitlement grant/revoke, support
ticket creation, customer contact, customer operation execution, DB/runtime
write, provider/model call, payment provider call, tool execution, MCP
startup, agent dispatch, project mutation, deploy, release, export, package,
network call, or spend authority is enabled.

## P144.4 Customer Operations Command Center UX

Status: complete

Narrow goal: surface display-only billing/customer-ops state in Command Center
with current state, next action, blockers, disabled reason, owner,
evidence/activity location, and cost impact.

Scope: Command Center UX only. It preserves dark/light/system themes, avoids
raw dumps and private IDs, keeps internal phase labels out of the Cost Center
primary UX, and keeps all billing/customer operations disabled unless
explicitly allowed by a later implementation-grade plan.

Validation: dedicated P144.4 checker, prior P144.3 checker, route-wide
Playwright safety tests, dashboard build/unit checks, enterprise roadmap
checker, OS phase status checker, phase validation coverage, and
`git diff --check`.

Result: complete as display-only Cost Center Customer Ops UX. It adds a
Customer Ops tab with readable billing accounts, usage meters, invoice
previews, entitlements, support handoffs, and customer operations. Each row
shows current state, next action, blocker, disabled reason, owner, evidence,
activity, and zero-spend cost impact without billing/customer mutation,
payment collection, DB/runtime writes, provider/model calls, network calls, or
spend. P144.5 is planned-only next.

## P144.5 Tests / Checkers

Status: complete

Narrow goal: harden P144 aggregate checker, route-wide Command Center safety
coverage, and billing/customer-ops contract/model/preview assertions.

Scope: tests/checkers only. It must not add runtime billing/customer authority,
DB writes, provider calls, network calls, or spend.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `97dd7d58`.

Allowed files: package script, P144.5 aggregate checker, P144.4 checker
handoff, enterprise checker, route tests, P144 contract, P144 plan, README,
platform roadmap, enterprise readiness roadmap, OS phase status, phase index,
and generated reports.

Forbidden files: project files, generated project files, private project
roots, dashboard source outside tests, DB/runtime implementation, providers,
tools, worker runtime, deploy/release/export/package folders, env files,
payment provider adapters, and billing/customer/support mutation paths.

Expected exports and schemas: no runtime exports, no DB schema, no migration,
no payment adapter, no writer, no executable command, and no mutation payload.
P144.5 adds checker-only aggregate validation over the existing P144.2 model,
P144.3 preview, and P144.4 Command Center view model.

Expected data shape: aggregate checker/report metadata only, including prior
report pass status, model validation result, preview validation result,
Command Center display projection coverage, route safety assertions,
docs/status handoff, and blocked-authority safety checks.

Command Center UX requirements: OS Roadmap must show P144.5 complete and
P144.6 planned-only next. Cost Center Customer Ops must remain display-only
with current state, next action, blockers, disabled reason, owner,
evidence/activity location, and zero-spend cost impact. Primary UX must not
show raw JSON, raw logs, raw policy dumps, internal phase labels outside OS
Roadmap, demo surfaces, private IDs, raw billing/payment/customer payloads, or
fake runnable billing/customer actions.

Dark/light/system theme requirements: preserve System, Dark, and Light themes;
validate focused P144.5 and route-wide Command Center coverage through
Playwright.

Playwright tests: add P144.5 OS Roadmap and Cost Center aggregate coverage,
preserve route-wide safety tests, and verify dark/light/system theme behavior
on Customer Ops.

Checker updates: add P144.5 checker, update P144.4 checker for P144.5 handoff
compatibility, and update enterprise readiness checker for P144.5 active-state
compatibility.

Docs/README/roadmap updates: README, P144 plan, platform roadmap, enterprise
readiness roadmap, OS phase status, and phase index.

Reports to regenerate: P144.5 report, P144.4 report, enterprise readiness
report, OS phase status report, and phase validation coverage report.

OS phase status update: P144 in progress; P144.1-P144.5 complete; previous
P144.4; current P144.5; next P144.6 planned-only; P145 remains planned-only.

Validation: dedicated P144.5 checker, prior P144.4 checker, enterprise
roadmap checker, OS phase status checker, phase validation coverage, dashboard
build/unit checks, route-wide Playwright tests, and `git diff --check`.

Validation commands:

- `npm run check:p1445-billing-metering-customer-operations`
- `npm run check:p1444-billing-metering-customer-operations`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "P144.5"`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Final safety checks: no project files, no dashboard source outside tests, no
DB/runtime implementation, no provider/tool/worker-runtime changes, no
deploy/release/export/package folders, no env files, no billing/customer
mutation authority, no payment provider calls, no raw payload exposure, no
fake working actions, and no stale placeholder commit marker after the stamp
commit.

Git add, commit, and push commands:

- `git add <P144.5 allowed files>`
- `git commit -m "feat(nexus): add p1445 billing operations aggregate checks"`
- `git add <P144.5 stamp files and refreshed reports>`
- `git commit -m "chore(nexus): stamp p1445 billing operations aggregate checks"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist: branch, commit hash, files changed, implementation,
Command Center UX preservation, tests, checker results, dashboard build/unit/
page results, docs/README/roadmap updates, OS phase status update, evidence
records, safety confirmations, forbidden paths confirmation, known limitations,
and next phase/subphase.

Result: complete as tests/checkers hardening only. P144.6 is planned-only
next. No billing account mutation, usage write, invoice creation, payment
collection, subscription mutation, entitlement grant/revoke, support ticket
creation, customer contact, customer operation execution, DB/runtime write,
provider/model call, payment provider call, tool execution, MCP startup, agent
dispatch, project mutation, deploy, release, export, package, network call, or
spend authority is enabled.

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
