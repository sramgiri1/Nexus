# NEXUS Enterprise Readiness Roadmap

This roadmap extends the NEXUS OS roadmap after P132. It defines the remaining
planned enterprise-readiness phases needed for a founder to bring an idea to
NEXUS, complete guided discovery, generate a PRD, coordinate governed agents,
build a product/business workspace, and operate that workflow with enterprise
controls.

P133.1-P133.6 are now complete and P133 is in progress.
P133.7 and P134-P145 remain planned-only. They do not enable DB writes,
provider/model calls, agent dispatch, project mutation, deploy, release,
export, package, network calls, or spend until each phase/subphase has its own
implementation-grade plan, checker coverage, Command Center UX when applicable,
and final validation.

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
- Provider/model calls, tool execution, worker execution, and agent dispatch.
- Project mutation, deploy, release, export, package, and network calls.
- DB/runtime writes, migrations, and hosted DB mutation.
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

Current implementation is on P133.6. P133.7 is the next executable subphase.
P133.7 and P134-P145 are planned-only backlog phases and must not be
treated as complete or live.

## Validation

Required validation for this roadmap update:

- `npm run check:enterprise-readiness-roadmap`
- `npm run check:p1336-founder-idea-to-prd-docs-roadmap`
- `npm run check:p1335-founder-idea-to-prd-tests-checkers`
- `npm run check:p1334-command-center-idea-to-prd-ux`
- `npm run check:p1333-founder-idea-to-prd-preview`
- `npm run check:p1332-founder-idea-to-prd-model`
- `npm run check:p1331-founder-idea-to-prd-productization`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`
