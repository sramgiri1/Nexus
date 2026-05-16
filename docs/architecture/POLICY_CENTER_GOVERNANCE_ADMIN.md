# Policy Center + Governance Admin

## Purpose

P58 adds a preview-only Policy Center foundation for NEXUS governance administration. It makes policy families visible, versioned, diffable, and simulatable without changing runtime enforcement.

## Scope

- Policy registry: read-only catalog of NEXUS policy families.
- Policy versioning: metadata and checksum summaries only.
- Policy diff preview: risk classification without applying changes.
- Policy simulation: redacted decision previews for high-risk requests.
- Exception workflow: time-bound and evidence-bound preview decisions.
- Break-glass model: disabled by default and emergency-only.
- Command Center Policy Center: operator-facing overview and tabbed previews.

## Safety Boundary

P58 does not enable runtime policy overrides, provider/tool dispatch, DB writes, worker execution, project mutation, or release execution. Break-glass is not enabled for live use. Policy details are summarized in primary UX; raw policy payloads belong in developer references only.

## Command Center UX

The Policy Center route uses tabs for Overview, Registry, Versions, Diff Preview, Simulation, Exceptions, Break-Glass, and Developer Details. It shows operator-safe summaries and clear disabled/preview states.

## Validation

P58 is validated by policy registry, versioning, diff, simulation, exception workflow, break-glass, Command Center UX, public safety, docs, OS phase status, and final validation checks.

## Next Phase

P59 - Secrets and Credential Boundary.
