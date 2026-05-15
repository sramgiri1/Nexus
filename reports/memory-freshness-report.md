# Memory Freshness Report

## Metadata
- Generated at: 2026-05-15T15:49:49.007Z
- Validation branch: arch/scoped-memory-architecture
- Validation HEAD: b4b91af
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P46.5 - Memory Freshness + Staleness

## Summary
- Freshness states: fresh, stale_pending_validation, expired, invalidated, unknown
- Invalidation affected items: 3
- Promotion candidates: 2
- Auto-promotion enabled: false
- Runtime injection enabled: false

## Checks
- PASS: Freshness modules exist
- PASS: Fresh state assessed
- PASS: Project change marks stale
- PASS: Expired state assessed
- PASS: Mark stale helper
- PASS: Invalidation plan
- PASS: Promotion candidates are proposals
- PASS: No raw private content in reports
- PASS: Package script exists
- PASS: P46.5 status visible
- PASS: P46.6 next
- PASS: No private project diff

## Next Phase
P46.6 - Command Center Memory Center
