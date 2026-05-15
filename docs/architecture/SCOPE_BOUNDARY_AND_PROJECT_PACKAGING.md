# Scope Boundary and Project Packaging Safety

## Purpose

P43 defines how NEXUS separates NEXUS OS work, project work, cross-cutting work,
demo work, and unknown work before packaging or export features are introduced.

The boundary matters because NEXUS must be able to reason about platform code
and project code without accidentally mixing OS roadmap progress, private
project progress, demo artifacts, or future export packaging.

## P43.1 Scope

P43.1 adds the scope classification model only. It introduces:

- `scope-boundary/scopeTypes.js`
- `scope-boundary/scopeClassifier.js`
- `scope-boundary/scopePolicy.js`
- `scope-boundary/scopeReport.js`
- `policy/scope-classification-policy.json`
- `scripts/check-scope-classification.js`

P43.1 does not enforce runtime boundaries, mutate project files, package
projects, generate release manifests, call providers, dispatch tools, start
workers, or write to the DB.

## Scope Types

- `NEXUS_OS`: platform modules, Command Center, docs, policies, reports,
  checkers, roadmap data, service runtime, and project registry metadata.
- `PROJECT`: project roots under `projects/` or future registered project
  roots.
- `CROSS_CUTTING`: file sets that include both NEXUS OS and project roots.
- `DEMO`: demo-only surfaces and public demo artifacts.
- `UNKNOWN`: paths that do not match a known OS, project, or demo root.

## Change Types

- `NEXUS_OS_CHANGE`
- `PROJECT_CHANGE`
- `CROSS_CUTTING_CHANGE`
- `DEMO_CHANGE`
- `UNKNOWN_CHANGE`

Cross-cutting and unknown changes require review. Project changes require a
project boundary check. NEXUS OS changes require an OS boundary check.

## Examples

| Example | Classification |
| --- | --- |
| `README.md` | `NEXUS_OS_CHANGE` |
| `dashboard/src/pages/CommandCenterV2.jsx` | `NEXUS_OS_CHANGE` |
| `project-registry/projects.json` | `NEXUS_OS_CHANGE` |
| `projects/private-project/package.json` | `PROJECT_CHANGE` |
| `demo/scenarios/demoapp-sprint.json` | `DEMO_CHANGE` |
| OS path plus project path | `CROSS_CUTTING_CHANGE` |
| Unmapped path | `UNKNOWN_CHANGE` |

## What Is Not Enforced Yet

P43.1 is classification-only. It reports review requirements and boundary
posture, but it does not block runtime behavior. Enforcement belongs to later
P43 subphases.

## P43.2 Project vs OS Mutation Boundary

P43.2 adds dry-run project vs OS path boundary rules and mutation boundary
decisions. It distinguishes NEXUS OS control-plane paths, project paths, iOS
project paths, docs, demo files, runtime state, generated reports, policy files,
dashboard files, and unknown paths.

The P43.2 decision model always returns `mutationAllowed: false`. Cross-cutting
and unknown changes require review, but this phase does not enforce runtime
blocks or enable mutation.

The following remain disabled:

- Project mutation
- Packaging safety execution
- Export pipeline
- Provider dispatch
- Tool dispatch
- Worker runtime
- DB writes

## P43.3 Project Export Safety Rules

P43.3 adds dry-run project export safety rules. The allow list covers
project-owned source, project docs, project tests, project build config,
redacted release manifests, and redacted validation summaries. The deny list
blocks NEXUS OS internals, agents, policies, tools, providers, orchestrator
runtime files, Command Center source, raw evidence/audit/activity ledgers,
local-state runtime files, secrets, key material, demo data, and unredacted
private reports.

The export safety plan is intentionally non-executing:

- `exportAllowed` remains false.
- `dryRunOnly` remains true.
- no package or archive is created.
- project mutation remains disabled.
- provider/tool/worker execution and DB writes remain disabled.

P43.3 prepares the safety model for future packaging without shipping project
files or exposing NEXUS control-plane internals.

## Next Subphases

- P43.2 - Project vs OS Mutation Boundary
- P43.3 - Project Export Safety Rules
- P43.4 - Redacted Release Manifest
- P43.5 - Command Center Scope Boundary UX
- P43.6 - Packaging Safety Checker + Final Validation
