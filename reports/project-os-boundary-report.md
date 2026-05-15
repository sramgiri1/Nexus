# NEXUS Project / OS Boundary Report

## Metadata

- Generated at: 2026-05-15T11:39:17.843Z
- Validation branch: arch/scope-boundary-packaging-safety
- Validation HEAD: 3b8e572
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P43.2 - Project vs OS Mutation Boundary

## Summary

- Boundary model: classification and dry-run decision only
- Project mutation: disabled
- OS mutation: disabled
- Cross-cutting changes: review required
- Unknown changes: review required

## Sample Decisions

| Sample | Change scope | Mutation allowed | Requires review | Reason |
| --- | --- | --- | --- | --- |
| NEXUS OS paths | NEXUS_OS_CHANGE | no | no | NEXUS OS mutation is classified but disabled in P43.2. |
| Project paths | PROJECT_CHANGE | no | no | Project mutation is classified but disabled in P43.2. |
| iOS project paths | PROJECT_CHANGE | no | no | Project mutation is classified but disabled in P43.2. |
| Docs paths | NEXUS_OS_CHANGE | no | no | NEXUS OS mutation is classified but disabled in P43.2. |
| Reports paths | NEXUS_OS_CHANGE | no | no | NEXUS OS mutation is classified but disabled in P43.2. |
| Mixed OS + project paths | CROSS_CUTTING_CHANGE | no | yes | Cross-cutting changes require explicit review. |
| Unknown paths | UNKNOWN_CHANGE | no | yes | Unknown changes require review. |

## Limitations

- P43.2 does not enable mutation enforcement.
- P43.2 does not package or export projects.
- Provider/tool/worker execution and DB writes remain disabled.

## Next Phase

P43.3 - Project Export Safety Rules
