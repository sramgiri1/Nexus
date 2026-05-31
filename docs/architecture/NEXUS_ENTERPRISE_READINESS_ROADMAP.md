# NEXUS Enterprise Readiness Roadmap

This roadmap extends the NEXUS OS roadmap after P132. It defines the remaining
planned enterprise-readiness phases needed for a founder to bring an idea to
NEXUS, complete guided discovery, generate a PRD, coordinate governed agents,
build a product/business workspace, and operate that workflow with enterprise
controls.

P133.1-P133.7 are now complete and P133 is complete. P134.1 through P134.7
are now complete, and P134 is complete.
P134.2 is now complete. P134.3 is the next executable subphase after P134.2
and is also complete.
P134.3 is now complete as a write-plan preview only.
P134.4 is the next executable subphase after P134.3 and is now complete.
P134.4 is now complete as Command Center UX only.
P134.5 is now complete as tests/checkers hardening only.
P134.6 is now complete as docs/roadmap/status closure only.
P134.7 is now complete as final validation only.
P135.1 is now complete as contract/policy/safety-boundary only.
P135.2 is now complete as a read-only auth/tenant model.
P135.3 is now complete as a permission preview only.
P135.4 is now complete as Auth Governance Command Center UX only.
P135.5 is now complete as tests/checkers hardening only.
P135.6 is now complete as docs/roadmap/status closure only.
P135.7 is now complete as final validation only. P135.1 through P135.7 are
now complete, and P135 is complete.
P136.1 is now complete as contract/policy/safety-boundary only.
P136.2 is now complete as a read-only secret/provider/tool governance model.
P136.3 is now complete as a non-runnable provider/tool dry run.
P136.4 is now complete as Provider Governance Command Center UX only.
P136.5 is now complete as tests/checkers hardening only.
P136.6 is now complete as docs/roadmap/status closure only.
P136.7 is now complete as final validation only. P136.1 through P136.7 are
now complete, and P136 is complete.
P137.1 is now complete as contract/policy/safety-boundary only.
P137.2 is now complete as read-only scoped work order model only.
P137.3 is now complete as a local non-runnable dispatch dry run only.
P137.4 is now complete as Agent Flow Command Center UX only.
P137.5 is now complete as tests/checkers hardening only.
P137.6 is now complete as docs/roadmap/status closure only.
P137.7 is now complete as final validation only. P137 is complete.
P138.1 is now complete as contract/policy/safety-boundary only.
P138.2 is now complete as read-only workspace mutation model only.
P138.3 is now complete as non-runnable patch/build preview only.
P138.4 is now complete as Project Build Command Center UX only.
P138.5 is now complete as aggregate tests/checkers only.
P138.6 is now complete as docs/roadmap/status closure only.
P138.7 is now complete as final validation only. P138 is complete.
P139.1 is now complete as contract/policy/safety-boundary only.
P139.2 is now complete as read-only ledger model only.
P139.3 is now complete as read-only evidence preview only.
P139.4 is now complete as read-only Observability Command Center UX only.
P139.5 is now complete as aggregate tests/checkers only.
P139.6 is now complete as docs/roadmap/status closure only.
P139.7 is now complete as final validation only. P139 is complete.
P140.1 is now complete as contract/policy/safety-boundary only.
P140.2 is now complete as read-only backup and retention model only.
P140.3 is now complete as display-safe restore preview only.
P140.4 is now complete as display-safe Backup / DR Command Center UX only.
P140.5 is now complete as aggregate tests/checkers only.
P140.6 is now complete as docs/status closure only.
P140.7 is now complete as final validation only. P140 is complete.
P141.1 is now complete as a security/privacy/compliance contract only.
P141.2 is now complete as a read-only security/privacy/compliance control model
only.
P141.3 is now complete as a display-safe security/privacy/compliance preview
only.
P141.4 is now complete as display-safe Compliance Command Center UX only.
P141.5 is now complete as aggregate tests/checkers only.
P141.6 is now complete as docs/status closure only.
P141.7 is now complete as final validation only. P141 is complete.
P142.1 is now complete as contract/policy/safety-boundary only.
P142.2 is now complete as read-only admin operations settings model only.
P142.3 is now complete as non-runnable admin operations dry run only.
P142.4 is now complete as display-only Settings Command Center UX only.
P142.5 is now complete as aggregate tests/checkers only.
P142.6 is now complete as docs/status closure only.
P142.7 is now complete as final validation only. P142 is complete.
P143.1 is now complete as contract/policy/safety-boundary only.
P143.2 is now complete as a read-only model.
P143.3 is now complete as a non-runnable shipping preview.
P143.4 is now complete as display-only shipping Command Center UX.
P143.5 is now complete as aggregate tests/checkers only.
P143.6 is now complete as docs/status closure only.
P143.7 is now complete as final validation only. P143 is complete.
P144.1 is now complete as contract/policy/safety-boundary only.
P144.2 is now complete as a read-only model.
P144.3 is now complete as a non-runnable billing preview.
P144.4 is now complete as a Cost Center Customer Ops UX.
P144.5 is now complete as aggregate tests/checkers only.
P144.6 is now complete as docs/status closure only.
P144.7-P145 remain planned-only. They do not enable secret
values, credential handling, raw data exposure, compliance certification, legal
attestation, audit export, raw log export, compliance package creation, admin
setting mutation, feature toggles, maintenance execution, backup creation,
restore execution, failover, DB writes, provider/model calls, tool execution,
agent dispatch, project mutation, patch application, build/test execution,
payment collection, invoice creation, usage writes, customer operations,
rollback execution, deploy, release, export, package, network calls, or spend
until each phase/subphase has its own implementation-grade plan, checker
coverage, Command Center UX when applicable, and final validation.

## Global Subphase Contract

Every P133-P145 phase must split into seven independently commit-ready
subphases:

- `.1` Contract / Policy / Safety Boundary
- `.2` Core Model / Schema / Adapter Boundary
- `.3` Safe Preview / Dry Run
- `.4` Command Center UX
- `.5` Tests / Checkers
- `.6` Docs / Roadmap / Status
- `.7` Final Validation

Every subphase must include:

- Narrow scope and a single owner capability.
- Starting branch and expected base commit.
- Allowed files and forbidden files.
- Exact files/modules to create or update.
- Expected exports, schemas, and data shapes.
- Command Center UX requirements.
- Dark, light, and system theme requirements.
- Playwright coverage when Command Center UX changes.
- Checker updates for backend/kernel behavior.
- Docs, README, roadmap, and OS phase status updates.
- Validation commands.
- Final safety checks.
- Git add, commit, and push commands.
- Final response checklist.

Forbidden by default unless a phase explicitly allows it:

- `projects/**`, `careloop/**`, and `generated-projects/**` changes.
- Forbidden provider/model calls, tool execution, worker execution, and agent dispatch.
- Forbidden project mutation, deploy, release, export, package, and network calls.
- Forbidden DB/runtime writes, migrations, and hosted DB mutation.
- Do not expose raw JSON, raw logs, raw policy dumps, raw table names, raw
  report paths, internal helper IDs, or private project IDs in primary UX.
- DemoApp leakage into full Command Center.
- Provider spend.

## Enterprise Phase Set

| Phase | Title | Enterprise Outcome | Planned Subphases |
| --- | --- | --- | --- |
| P133 | Founder Idea-to-PRD Productization | Founder-facing idea intake becomes a usable guided workflow with structured Q&A, feasibility framing, PRD versioning, and agent handoff readiness. | P133.1 Contract; P133.2 Intake/PRD model; P133.3 safe PRD preview; P133.4 clean chat/PRD UX; P133.5 tests/checkers; P133.6 docs/status; P133.7 final validation |
| P134 | Durable DB and CRUD Runtime | NEXUS gets a governed durable data layer for OS-owned founder/business records with clear migration, repository, and rollback boundaries. | P134.1 Contract; P134.2 schema/repository model; P134.3 write preview; P134.4 DB status UX; P134.5 tests/checkers; P134.6 docs/status; P134.7 final validation |
| P135 | Identity, Tenant, Roles, and Permissions | Enterprise identity, tenant isolation, RBAC, session state, and permission checks become explicit gates for every sensitive workflow. | P135.1 Contract; P135.2 auth/tenant model; P135.3 permission preview; P135.4 auth governance UX; P135.5 tests/checkers; P135.6 docs/status; P135.7 final validation |
| P136 | Secrets, Providers, and Tool Governance | Provider credentials, model access, tool contracts, budgets, and approvals are governed before any live external execution. | P136.1 Contract; P136.2 secret/provider model; P136.3 provider dry run; P136.4 governance UX; P136.5 tests/checkers; P136.6 docs/status; P136.7 final validation |
| P137 | Agent Work Order Runtime | Agents receive scoped work orders, budgets, memory packets, evidence packets, and policy limits without loading full registries into context. | P137.1 Contract; P137.2 work order model; P137.3 dispatch dry run; P137.4 agent flow UX; P137.5 tests/checkers; P137.6 docs/status; P137.7 final validation |
| P138 | Project Workspace Mutation and Build Pipeline | NEXUS can safely plan, apply, test, and roll back project changes under explicit project boundaries and approval gates. | P138.1 Contract; P138.2 workspace mutation model; P138.3 patch/build preview; P138.4 project build UX; P138.5 tests/checkers; P138.6 docs/status; P138.7 final validation |
| P139 | Evidence, Audit, Observability, and Cost Ledger | Every material action has evidence, audit/activity records, observability signals, and cost attribution suitable for enterprise review. | P139.1 Contract; P139.2 ledger model; P139.3 evidence preview; P139.4 observability UX; P139.5 tests/checkers; P139.6 docs/status; P139.7 final validation |
| P140 | Backup, Recovery, DR, and Retention | Enterprise backup, recovery, disaster recovery, retention, and restore drills are defined and validated before production reliance. | P140.1 Contract; P140.2 backup/retention model; P140.3 restore preview; P140.4 recovery UX; P140.5 tests/checkers; P140.6 docs/status; P140.7 final validation |
| P141 | Security, Privacy, and Compliance Controls | Security posture, privacy boundaries, compliance evidence, policy enforcement, and data handling controls are explicit and testable. | P141.1 Contract; P141.2 control model; P141.3 compliance preview; P141.4 compliance UX; P141.5 tests/checkers; P141.6 docs/status; P141.7 final validation |
| P142 | Admin Operations and Runtime Settings | Enterprise operators get safe admin settings, feature gates, maintenance controls, and operational state without raw internals. | P142.1 Contract; P142.2 settings model; P142.3 admin dry run; P142.4 settings UX; P142.5 tests/checkers; P142.6 docs/status; P142.7 final validation |
| P143 | Release, Deploy, Export, and Package Pipeline | Release, deployment, export, package creation, provenance, and rollback are governed by explicit approval and evidence gates. | P143.1 Contract; P143.2 release model; P143.3 deploy/export preview; P143.4 shipping UX; P143.5 tests/checkers; P143.6 docs/status; P143.7 final validation |
| P144 | Billing, Metering, and Customer Operations | Enterprise billing, metering, usage visibility, support handoff, and customer operations are connected to cost and audit controls. | P144.1 Contract; P144.2 billing/meter model; P144.3 billing preview; P144.4 customer ops UX; P144.5 tests/checkers; P144.6 docs/status; P144.7 final validation |
| P145 | Enterprise Certification and GA Readiness | NEXUS reaches a final enterprise readiness gate with end-to-end founder workflow validation, security review, load checks, recovery checks, and release signoff. | P145.1 Contract; P145.2 certification matrix; P145.3 E2E rehearsal; P145.4 readiness UX; P145.5 tests/checkers; P145.6 docs/status; P145.7 final validation |

## Current Handoff

Current implementation has closed P135.1 through P135.7 and P135 is complete.
P136.1 is now complete as a secrets/provider/tool governance contract and
safety boundary. P136.2 is now complete as a read-only secret/provider/tool
governance model. P136.3 is now complete as a non-runnable provider/tool dry
run. P136.4 is now complete as Provider Governance Command Center UX only.
P136.5 is now complete as tests/checkers hardening only.
P136.6 is now complete as docs/roadmap/status closure only.
P136.7 is now complete as final validation only. P136.1 through P136.7 are
now complete, and P136 is complete.
P137.1 is now complete as contract/policy/safety-boundary only.
P137.2 is now complete as read-only scoped work order model only.
P137.3 is now complete as a local non-runnable dispatch dry run only.
P137.4 is now complete as Agent Flow Command Center UX only.
P137.5 is now complete as tests/checkers hardening only.
P137.6 is now complete as docs/roadmap/status closure only.
P137.7 is now complete as final validation only. P137 is complete.
P138.1 is now complete as contract/policy/safety-boundary only.
P138.2 is now complete as read-only workspace mutation model only.
P138.3 is now complete as non-runnable patch/build preview only.
P138.4 is now complete as Project Build Command Center UX only.
P138.5 is now complete as aggregate tests/checkers only.
P138.6 is now complete as docs/roadmap/status closure only.
P138.7 is now complete as final validation only. P138 is complete.
P139.1 is now complete as contract/policy/safety-boundary only.
P139.2 is now complete as read-only ledger model only.
P139.3 is now complete as read-only evidence preview only.
P139.4 is now complete as read-only Observability Command Center UX only.
P139.5 is now complete as aggregate tests/checkers only.
P139.6 is now complete as docs/roadmap/status closure only.
P139.7 is now complete as final validation only. P139 is complete.
P140.1 is now complete as contract/policy/safety-boundary only.
P140.2 is now complete as read-only backup and retention model only.
P140.3 is now complete as display-safe restore preview only.
P140.4 is now complete as display-safe Backup / DR Command Center UX only.
P140.5 is now complete as aggregate tests/checkers only.
P140.6 is now complete as docs/status closure only.
P140.7 is now complete as final validation only. P140 is complete.
P141.1 is now complete as a security/privacy/compliance contract only.
P141.2 is now complete as a read-only security/privacy/compliance control model
only.
P141.3 is now complete as a display-safe security/privacy/compliance preview
only.
P141.4 is now complete as display-safe Compliance Command Center UX only.
P141.5 is now complete as aggregate tests/checkers only.
P141.6 is now complete as docs/status closure only.
P141.7 is now complete as final validation only. P141 is complete.
P142.1 is now complete as contract/policy/safety-boundary only.
P142.2 is now complete as read-only admin operations settings model only.
P142.3 is now complete as non-runnable admin operations dry run only.
P142.4 is now complete as display-only Settings Command Center UX only.
P142.5 is now complete as aggregate tests/checkers only.
P142.6 is now complete as docs/status closure only.
P142.7 is now complete as final validation only. P142 is complete.
P143.1 is now complete as contract/policy/safety-boundary only.
P143.2 is now complete as a read-only model.
P143.3 is now complete as a non-runnable shipping preview.
P143.4 is now complete as display-only shipping Command Center UX.
P143.5 is now complete as aggregate tests/checkers only.
P143.6 is now complete as docs/status closure only.
P143.7 is now complete as final validation only. P143 is complete.
P144.1 is now complete as contract/policy/safety-boundary only.
P144.2 is now complete as a read-only model.
P144.3 is now complete as a non-runnable billing preview.
P144.4 is now complete as a Cost Center Customer Ops UX.
P144.5 is now complete as aggregate tests/checkers only.
P144.6 is now complete as docs/status closure only.
P144.7-P145 are planned-only backlog phases and must not be
treated as complete or live.

## Validation

Required validation for this roadmap update:

- `npm run check:p1421-admin-operations-runtime-settings`
- `npm run check:p1422-admin-operations-runtime-settings`
- `npm run check:p1423-admin-operations-runtime-settings`
- `npm run check:p1424-admin-operations-runtime-settings`
- `npm run check:p1425-admin-operations-runtime-settings`
- `npm run check:p1426-admin-operations-runtime-settings-docs-roadmap`
- `npm run check:p1427-admin-operations-runtime-settings-final-validation`
- `npm run check:p1431-release-deploy-export-package-pipeline`
- `npm run check:p1435-release-deploy-export-package-pipeline`
- `npm run check:p1436-release-deploy-export-package-pipeline-docs-roadmap`
- `npm run check:p1437-release-deploy-export-package-pipeline-final-validation`
- `npm run check:p1441-billing-metering-customer-operations`
- `npm run check:p1417-security-privacy-compliance-controls-final-validation`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:p1384-project-workspace-mutation-build-pipeline`
- `npm run check:p1383-project-workspace-mutation-build-pipeline`
- `npm run check:p1382-project-workspace-mutation-build-pipeline`
- `npm run check:p1381-project-workspace-mutation-build-pipeline`
- `npm run check:p1366-secrets-providers-tool-governance-docs-roadmap`
- `npm run check:p1365-secrets-providers-tool-governance-tests-checkers`
- `npm run check:p1364-provider-governance-command-center-ux`
- `npm run check:p1363-provider-dry-run`
- `npm run check:p1362-secret-provider-model`
- `npm run check:p1361-secrets-providers-tool-governance`
- `npm run check:p1357-identity-tenant-roles-permissions-final-validation`
- `npm run check:p1356-identity-tenant-roles-permissions-docs-roadmap`
- `npm run check:p1355-identity-tenant-roles-permissions-tests-checkers`
- `npm run check:p1354-auth-governance-command-center-ux`
- `npm run check:p1353-permission-preview`
- `npm run check:p1352-auth-tenant-model`
- `npm run check:p1351-identity-tenant-roles-permissions`
- `npm run check:p1347-durable-db-crud-runtime-final-validation`
- `npm run check:p1346-durable-db-crud-runtime-docs-roadmap`
- `npm run check:p1345-durable-db-crud-runtime-tests-checkers`
- `npm run check:p1344-durable-db-crud-runtime-command-center-ux`
- `npm run check:p1343-durable-db-crud-runtime-write-plan-preview`
- `npm run check:p1342-durable-db-crud-runtime-schema-model`
- `npm run check:p1341-durable-db-crud-runtime`
- `npm run check:p1337-founder-idea-to-prd-final-validation`
- `npm run check:p1336-founder-idea-to-prd-docs-roadmap`
- `npm run check:p1335-founder-idea-to-prd-tests-checkers`
- `npm run check:p1334-command-center-idea-to-prd-ux`
- `npm run check:p1333-founder-idea-to-prd-preview`
- `npm run check:p1332-founder-idea-to-prd-model`
- `npm run check:p1331-founder-idea-to-prd-productization`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`
