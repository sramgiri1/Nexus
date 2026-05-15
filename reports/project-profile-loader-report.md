# NEXUS Project Profile Loader Report

## Metadata

- Generated at: 2026-05-15T03:58:32.357Z
- Validation branch: arch/project-registry-adapter-overnight
- Validation HEAD: 276bfb4
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P42.2 - Project Profile Loader + Validator

## Summary

- Profiles discovered: 4
- Profiles valid: 3
- Planned profile roots: 1
- Project selector enabled: no
- Adapter runtime enabled: no
- Project mutation allowed: no

## Example Profiles

| Profile | Project | Visibility | Valid |
| --- | --- | --- | --- |
| project-registry/examples/private-project.nexus.project.json | Private Project | local-private | yes |
| project-registry/examples/demoapp.nexus.project.json | DemoApp | demo | yes |
| project-registry/examples/nexus-os.nexus.project.json | NEXUS OS | internal | yes |

## Checks

- Modules: PASS
- Exports: PASS
- Policy: PASS
- Example profiles: PASS
- Loader: PASS
- Validator: PASS
- Discovery: PASS
- Boundary safety: PASS
- Command Center UX: PASS
- OS phase status: PASS
- No forbidden changes: PASS
- Formatting/readability: PASS

## Failures

- None

## Explicit Non-Goals

- No project selector behavior was added.
- No adapter runtime execution was added.
- No project mutation was added.
- No provider calls, external network calls, DB writes, worker runtime, or MCP/tool execution were added.

## Next Phase

P42.3 - Stack Profile Model

## Result

PASS
