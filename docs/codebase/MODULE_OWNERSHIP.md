# Module Ownership

This document assigns ownership expectations for major NEXUS module families.
Ownership is a maintenance boundary, not an execution permission.

| Area | Owner role | Purpose | Entry points | Allowed dependencies | Forbidden dependencies | Checks | Command Center |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard / Command Center | PRISM + AUDITOR | Operator UX, route visibility, status pages | `dashboard/src/pages/CommandCenterV2.jsx`, `dashboard/src/data/*` | View models, safe API clients, route metadata | Direct file writes, providers, DB writes | `check:command-center-ux`, Playwright | Command Center |
| local-api | AUDITOR | Read-only local summaries and health endpoints | `local-api/server.js`, `local-api/routes/*` | Safe readers, repositories, redaction | Provider calls, private source mutation | `check:live-local-api` | Live API |
| db | AUDITOR | DB foundation and durable-state previews | `db/*`, `local-api/routes/db.js` | Schema, health, repository previews | Production DB writes before DB primary phase | `check:db-foundation` | Durable State |
| os-roadmap | SHEPHERD | NEXUS OS phase catalog and status | `os-roadmap/*.json`, `os-roadmap/updatePhaseStatus.js` | Shared report metadata, JSON status files | Project milestones as OS phases | `check:os-phase-status` | OS Roadmap |
| project-registry | SHEPHERD + WARDEN | Project profile and adapter metadata | `project-registry/*` | Policies, safe profile loaders | Direct private source mutation | `check:project-registry-final-validation` | Projects |
| scope-boundary | WARDEN | Classify OS/project/private boundaries | `scope-boundary/*` | Project registry, policy docs | Runtime bypasses | `check:scope-boundary-final-validation` | Safety Center |
| multi-repo | AUDITOR | Repository registry and PR lifecycle models | `repo-workspace/*`, `git-lifecycle/*` | Project registry metadata | Direct git mutation without governance | `check:multi-repo-git-pr-final-validation` | Projects / Roadmap |
| agent-registry | WARDEN | Agent definitions and boundary compiler | `agent-registry/*` | Capability matrices, policies | Runtime agent definition mutation | `check:agent-registry-final-validation` | Agent Registry |
| scoped-memory | NEXUS + WARDEN | Scoped memory model and packet previews | `memory/*` | Trusted context metadata | Raw private payload exposure | `check:scoped-memory-final-validation` | Memory Center |
| trusted-context | AUDITOR | Data source trust, freshness, lineage | `trusted-context/*` | Memory packet summaries | Runtime injection before governance | `check:trusted-context-final-validation` | Data & Context |
| agent-mesh | SHEPHERD + WARDEN | Governed rooms, messages, handoffs | `agent-mesh/*` | Agent registry, trusted context | Free-form agent messaging | `check-governed-agentic-mesh` | Agent Rooms |
| agent-definition-updates | WARDEN | Proposal-first agent definition changes | `agent-definition-updates/*` | Agent registry, approval gates | Direct definition writes | `check:agent-definition-update-final` | Agent Registry |
| skill-registry | CORE + AUDITOR | Skill registry and authoring previews | `skills-registry/*` | Policy and test requirement metadata | Skill execution before runtime approval | `check:skill-registry` | Skill Registry |
| hook-registry | WARDEN | Safe automation hook metadata | `hooks/*` | Trigger previews, policies | Worker/runtime execution before approval | `check:hook-registry` | Hook Registry |
| tool-mcp-registry | WARDEN + AUDITOR | Tool and MCP governance metadata | `tool-governance/*` | Permissions, adapter previews | MCP/tool execution before gateway phase | `check:tool-governance-final` | Tool Gateway |
| trigger-gateway | SENTINEL | Trigger and integration previews | `trigger-gateway/*`, `integrations/*` | Registry previews | External callbacks or scheduler runtime | `check:trigger-integration-final` | Trigger Gateway |
| api-batch | SENTINEL + AUDITOR | API/batch preview packaging and estimates | `api-batch/*` | Provider registry metadata | Provider calls, uploads, batch submit | `check:api-batch-final` | API / Batch |
| cost-center | NEXUS + AUDITOR | Cost ledger, budget policy, estimate, recorder preview, and enforcement decisions | `cost-center/*` | Shared utilities, cost policy metadata, Command Center view data | Provider calls, billing APIs, DB writes, worker execution, project mutation | `check:cost-center-final-validation` | Cost Center |
| test-suite-manager | SENTINEL | Test suite registry and evidence model | `test-suite/*` | Project/OS metadata | Test execution in registry phase | `check:test-suite-manager-final` | Test Center |
| quality-intelligence | SENTINEL + AUDITOR | Test gap detection and recommendations | `quality-intelligence/*` | Test suite metadata | Test generation or execution | `check:quality-intelligence-final` | Quality Intelligence |
| observability | AUDITOR | Activity, traces, and correlation views | `activity/*` | Redacted event metadata | Raw log exposure | `check:activity-observability-final` | Activity Log |
| shared utilities | NEXUS | Reusable envelopes, reports, guards, redaction | `shared/*` | Node built-ins only where practical | Business logic, provider calls, writes except report writer | `check:codebase-maintainability` | Codebase health docs |

Future phases should update this document when they add a module family, move
ownership, or change dependency direction.
