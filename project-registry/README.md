# NEXUS Project Registry

P42.1 introduces the schema and policy foundation for the future Project
Registry + Adapter Framework. This directory is metadata-only in P42.1.

## Files

- `project-registry.schema.json`: schema for `projects.json`.
- `nexus-project.schema.json`: future per-project `nexus.project.json` schema.
- `projects.json`: safe baseline registry entries for NEXUS OS, Private Project,
  and DemoApp.
- `project-types.json`: supported and planned project type metadata.
- `index.js`: read-only helpers for safe registry summaries.

## Scope

P42.1 does not implement project loading, project selection, onboarding,
adapter runtime, project mutation, provider calls, DB writes, or worker
execution. Those capabilities remain planned follow-up phases.

## Boundary Rules

- DemoApp is demo-only and must not be the local-private fallback project.
- Private project metadata uses `Private Project` as the public-safe label.
- NEXUS OS is tracked as an OS-scope registry entry, separate from project
  progress.
- `projects.json` must not expose private business details or private source
  paths.

## Next Phase

P42.2 adds the `nexus.project.json` loader and validator. It should reuse these
schemas and keep project profile reads safe and explicit.
