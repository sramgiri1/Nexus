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

## Public-Safe Labels

Project registry entries must include public-safe labels. Local-private project
details must not leak into public-safe docs, reports, demo surfaces, roadmap
views, or raw registry metadata.

## Project Types

`project-registry/project-types.json` records metadata for planned project
families such as OS modules, SaaS/mobile projects, backend services, web apps,
iOS apps, Android apps, libraries, automation tools, data pipelines, and
unknown/unclassified projects.

Project types are metadata only in P42.1. They do not activate adapters.

## Next Phase

P42.2 - `nexus.project.json` Loader + Validator.
