# NEXUS Project Registry Schema Report

## Metadata

- Generated at: 2026-05-15T02:44:32.235Z
- Validation branch: arch/project-registry-schema-policy
- Validation HEAD: 8ec2a4c
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P42.1 - Project Registry Schema + Policy

## Summary

- Registry projects: 3
- Default project: private-project-01
- Project selector enabled: no
- Adapter runtime enabled: no
- Demo fallback allowed: no

## Baseline Entries

| Project | Scope | Visibility | Status | Boundary |
| --- | --- | --- | --- | --- |
| NEXUS OS | os | internal | active | platform |
| Private Project | project | local-private | active | local-private only |
| DemoApp | demo | demo | active | demo-only |

## Checks

- Schemas: PASS
- Registry: PASS
- Project types: PASS
- Exports: PASS
- Policy: PASS
- Demo boundary: PASS
- Private project placeholder: PASS
- Command Center UX: PASS
- OS phase status: PASS
- No forbidden changes: PASS
- Formatting/readability: PASS

## Failures

- None

## Result

PASS
