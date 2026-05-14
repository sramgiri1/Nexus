# Shared Helper Catalog

## Purpose

The shared helper catalog turns the P41.7.2 reuse audit into a maintained list
of existing and proposed helpers. It tells future phases which helper should be
reused, which helper can be extracted first, and which boundaries should remain
phase-local until a dedicated refactor phase exists.

## Current Problem

NEXUS has repeated patterns across checkers, reports, policies, route metadata,
local-state readers, action bridges, and runtime summaries. Some repetition is
acceptable while boundaries are still changing, but unchecked duplication makes
future Codex and API-backed work more likely to drift or bypass existing safety
rules.

## Helper Categories

- policy and configuration loading
- mode and boundary guards
- report writing and checker formatting
- redaction and safe response shaping
- runtime snapshot and file-boundary helpers
- JSONL stores and append-only records
- action response envelopes
- Command Center route and capability metadata
- OS phase status and roadmap helpers
- future activity and cost event helpers

## Existing Helpers to Reuse

| Helper | Existing module | Use now |
| --- | --- | --- |
| Safe file boundary | `local-state/safeFileReader.js` | Reuse for local file reads instead of creating duplicate readers. |
| Local API response envelope | `local-api/safeResponse.js` | Reuse for local API responses and safe errors. |
| Command Center route matrix | `dashboard/src/data/commandCenterRoutes.js` | Reuse for route headings, sidebar state, and planned routes. |
| Capability readiness model | `dashboard/src/data/capabilityReadiness.js` | Reuse for user-facing capability state and disabled reasons. |

## Proposed Shared Helpers

| Helper | Proposed module | Risk | Priority | Status |
| --- | --- | --- | --- | --- |
| Policy Loader | `shared/policyLoader.js` | medium | soon | planned |
| Mode Guard | `shared/modeGuard.js` | medium | later | planned |
| Report Writer | `shared/reportWriter.js` | low | first | planned |
| Check Result Formatter | `shared/checkResultFormatter.js` | low | first | planned |
| JSONL Store Helper | `local-state/jsonlStore.js` | medium | soon | planned |
| Action Response Envelope | `shared/actionResponseEnvelope.js` | medium | soon | planned |
| OS Phase Status Helper | `os-roadmap/phaseStatus.js` | medium | soon | planned |

## First Safe Refactor Candidates

- Extract shared report writer.
- Extract shared check result formatter.
- Reuse Command Center route matrix in tests and audit scripts.
- Extract docs link checker helper.

These candidates are low-risk because they can be tested through checker output
and report snapshots without changing runtime behavior.

## High-Risk Refactors to Avoid for Now

- mode guard extraction
- redaction helper extraction
- safe file boundary extraction
- local-state write guard extraction
- state machine wrappers
- activity logger runtime wiring

These areas touch security, runtime state, public/private boundaries, or
governed execution. They require a dedicated refactor phase with focused
validation.

## How Future Phases Should Use This Catalog

1. Check this catalog before adding a helper.
2. Reuse an existing helper when the boundary matches.
3. If a planned helper fits but is not implemented, document phase-local
   duplication and add a refactor candidate.
4. Do not extract high-risk helpers unless the phase explicitly owns that
   boundary and validation plan.
5. Update the catalog when a helper moves from planned to existing.

## Relationship to P41.7.2 Reuse Audit

P41.7.2 identified duplicate patterns. P41.7.3 converts those findings into a
helper catalog and refactor candidate plan. It does not implement the helpers
or change runtime behavior.
