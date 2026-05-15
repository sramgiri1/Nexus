# Project Registry + Adapter Framework

## Purpose

The Project Registry gives NEXUS a durable way to describe the projects it can
reason about without treating demo data, private project progress, and NEXUS OS
platform work as the same thing.

P42 follows the Command Center, documentation, activity, and diagram governance
tracks because the operator surface now needs a safe project identity layer
before adapters, project onboarding, and multi-project execution expand.

## P42.1 Scope

P42.1 is schema and policy only. It adds:

- `project-registry/project-registry.schema.json`
- `project-registry/nexus-project.schema.json`
- `project-registry/projects.json`
- `project-registry/project-types.json`
- `project-registry/index.js`
- `policy/project-registry-policy.json`
- `scripts/check-project-registry-schema.js`

P42.1 does not add project loader runtime, onboarding wizard, Command Center
project selector behavior, stack adapter runtime, project mutation, provider
calls, DB writes, worker runtime, or MCP/tool dispatch.

## Registry Entries

The baseline registry has three safe entries:

- `nexus-os`: internal OS-scope entry for NEXUS OS platform work.
- `private-project-01`: local-private placeholder labeled `Private Project`.
- `demoapp`: demo-only entry for demo mode.

DemoApp must never become the local-private fallback selected project. If no
project is selected, Command Center should show start-project guidance instead
of falling back to demo data.

## Future Project Profiles

Future project profiles use `nexus.project.json`, defined by
`project-registry/nexus-project.schema.json`. The schema supports stack and
test metadata for Node/Fastify, TypeScript/React, Swift/iOS/Xcode,
Kotlin/Android/Gradle, Python/FastAPI/Pytest, Java/Spring/Maven/Gradle,
Postgres/Prisma, SQLite, and MongoDB.

P42.2 adds the safe loader and validator for those profile files.

## P42.2 Scope

P42.2 adds a read-only `nexus.project.json` profile layer:

- `project-registry/projectProfileLoader.js`
- `project-registry/projectProfileValidator.js`
- `project-registry/projectProfileDiscovery.js`
- `project-registry/projectProfileSummary.js`
- safe example profiles under `project-registry/examples`
- `policy/project-profile-loader-policy.json`
- `scripts/check-project-profile-loader.js`

The loader accepts only relative JSON paths under approved roots and blocks
absolute paths, traversal, secret-like paths, `.git`, and `node_modules`. The
validator checks project identity, visibility, project type metadata, profile
boundaries, stack declarations, test suite declarations, DB adapter posture,
demo boundaries, local-private boundaries, and disabled runtime flags.

P42.2 does not add project selector persistence, project onboarding, adapter
runtime execution, project mutation, provider calls, DB writes, worker runtime,
or MCP/tool execution.

## P42.3-P42.7 Foundation

The Project Registry Adapter foundation completes the read-only operator layer
for P42:

- P42.3 adds stack profiles, stack capability extraction, test-suite metadata,
  and disabled-by-default DB/runtime posture.
- P42.4 adds dry-run project onboarding and `nexus:init-project`; it writes only
  local reports and does not create or mutate project files.
- P42.5 adds a Command Center project selector as local UI state only. It uses
  registry-safe labels and does not enable adapters.
- P42.6 adds the Project Capability Matrix for the selected project, showing
  available, gated, and disabled capabilities without executing anything.
- P42.7 validates and closes the P42 foundation, regenerates reports, and sets
  P43 as the next OS phase.

The matrix currently marks mission planning, task activation, Agent Workbench,
controlled implementation, and backend validation as available through existing
governed surfaces. iOS validation requires an iOS/Xcode runner. Provider
dispatch, worker runtime, MCP/tools, DB writes, project mutation, and Adapter
Runtime remain disabled.

P42 is complete through final validation. It is a policy-governed foundation,
not an adapter runtime. Project selector state is local UI-only, project
mutation remains disabled, provider/tool/worker execution remains disabled, and
DB writes remain disabled.

## Public-Safe Labels

Project registry entries must include public-safe labels. Local-private project
details must not leak into public-safe docs, reports, demo surfaces, roadmap
views, or raw registry metadata.

## Project Types

`project-registry/project-types.json` records metadata for planned project
families such as OS modules, SaaS/mobile projects, backend services, web apps,
iOS apps, Android apps, libraries, automation tools, data pipelines, and
unknown/unclassified projects.

Project types are metadata only through P42. They do not activate adapters.

## Next Phase

P43 - Scope Boundary + Project Packaging Safety.

P43.1 starts that sequence with a classification-only model for NEXUS OS,
project, cross-cutting, demo, and unknown changes. It does not enable adapter
runtime, project mutation, packaging/export, provider/tool/worker execution, or
DB writes.
