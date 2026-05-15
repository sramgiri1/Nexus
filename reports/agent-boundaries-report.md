# Agent Boundaries Report

## Metadata
- Generated at: 2026-05-15T15:26:36.588Z
- Validation branch: arch/agent-registry-boundary-compiler
- Validation HEAD: 24ead19
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P45.3 - Agent Path / Tool / Data Boundaries

## Summary
- Agents with boundary metadata: 9
- Runtime enforcement enabled: false
- Tool dispatch enabled: false
- Boundary dimensions: path, tool, data, projectScope, changeScope, approval

## Examples
- CORE: Can propose scoped implementation, cannot touch secrets, policies, schema, deploy, or private source without approval.
- SENTINEL: Can validate and test, cannot mutate product code.
- AUDITOR: Can review evidence, cannot approve its own work if acting implementer.
- WARDEN: Can block security/privacy risk, cannot implement product feature code.
- SWIFT: iOS scope only when the iOS runner is enabled.

## Warnings
- SHEPHERD: no approval requirement recorded
- SENTINEL: no approval requirement recorded
- AUDITOR: no approval requirement recorded
- WARDEN: no approval requirement recorded

## Checks
- PASS: Boundary modules
- PASS: Boundary dimensions
- PASS: Required examples
- PASS: Boundaries validate
- PASS: Tool dispatch disabled
- PASS: Metadata only
- PASS: No broad paths
- PASS: No private project diff
