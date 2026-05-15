# NEXUS Repo Dependency Map Report

## Metadata
- Generated at: 2026-05-15T13:58:49.822Z
- Validation branch: arch/multi-repo-git-pr-lifecycle
- Validation HEAD: 6a1748f
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P44.2 - Repo Ownership + Dependency Map

## Summary
- Owners mapped: 4
- Relationships mapped: 4
- Cross-repo review required for sample: yes
- Git actions allowed: no

## Ownership Map
| Repo | Owner Team | Owner Agent | Boundary |
| --- | --- | --- | --- |
| nexus-os | platform | NEXUS | os |
| private-project-backend | project | CORE | project |
| private-project-ios | project | SWIFT | project |
| demo-project | demo | PRISM | demo |

## Dependency Map
| From | To | Relationship | Review |
| --- | --- | --- | --- |
| private-project-ios | private-project-backend | consumes-api | required |
| nexus-os | private-project-backend | documentation-reference | required |
| nexus-os | private-project-ios | documentation-reference | required |
| demo-project | nexus-os | documentation-reference | not required |

## Non-Goals
- No runtime behavior changed.
- No git branch, commit, PR, merge, or push action executed.
- No project source was mutated or deeply scanned.

## Validation
- modules: PASS
- exports: PASS
- policy: PASS
- ownership: PASS
- dependencyMap: PASS
- blastRadius: PASS
- commandCenter: PASS
- osPhaseStatus: PASS
- noForbiddenChanges: PASS
- formatting: PASS
- reportWritten: PASS


