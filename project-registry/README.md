# NEXUS Project Registry

P42.1 introduced the schema and policy foundation for the future Project
Registry + Adapter Framework. P42.2 adds the read-only project profile loader,
validator, bounded discovery, and safe example profiles. P42.3-P42.6 add stack
profiles, dry-run onboarding, local UI project selection, and the read-only
project capability matrix. P42.7 validates and closes the foundation.

## Files

- `project-registry.schema.json`: schema for `projects.json`.
- `nexus-project.schema.json`: future per-project `nexus.project.json` schema.
- `projects.json`: safe baseline registry entries for NEXUS OS, Private Project,
  and DemoApp.
- `project-types.json`: supported and planned project type metadata.
- `projectProfileLoader.js`: safe JSON-only profile loading from approved roots.
- `projectProfileValidator.js`: profile boundary, stack, test suite, and safety
  validation.
- `projectProfileDiscovery.js`: bounded discovery for examples and fixtures.
- `projectProfileSummary.js`: user-facing readiness and profile summaries.
- `stackProfiles.js`: read-only stack profile library.
- `stackProfileModel.js`: stack capability, test-suite, and DB posture helpers.
- `projectOnboarding.js`: dry-run onboarding request validation.
- `projectOnboardingPlan.js`: dry-run project onboarding plan builder.
- `projectCapabilityMatrix.js`: selected-project capability matrix builder.
- `projectCapabilitySummary.js`: user-facing matrix summary helpers.
- `examples/*.json`: read-only example profiles for NEXUS OS, Private Project,
  and Demo Mode.
- `index.js`: read-only helpers for safe registry and profile summaries.

## Scope

P42 implements metadata, dry-run planning, and UI-only selection. It does not
implement adapter runtime, project mutation, provider calls, DB writes, worker
execution, or MCP/tool execution. Those capabilities remain planned follow-up
phases.

## Boundary Rules

- DemoApp is demo-only and must not be the local-private fallback project.
- Private project metadata uses `Private Project` as the public-safe label.
- NEXUS OS is tracked as an OS-scope registry entry, separate from project
  progress.
- `projects.json` must not expose private business details or private source
  paths.
- Project profiles are loaded only from approved roots and must be JSON files.
- Future `projects/*/nexus.project.json` profiles are reserved for later
  onboarding and are not required or created in P42.2.

## Next Phase

P43 adds Scope Boundary + Project Packaging Safety. Adapter runtime remains
disabled until a later governed phase.
