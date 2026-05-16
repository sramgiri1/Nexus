# Dependency Rules

NEXUS modules should depend in one direction: shared utilities and policy
metadata at the bottom, runtime/domain modules in the middle, and dashboard
views at the edge.

## Allowed Directions

- Dashboard reads view models, route metadata, safe API clients, and static
  report snapshots.
- Local API reads safe normalized data, repositories, redacted reports, and
  health/status metadata.
- Action bridges use policies, mode guards, traffic boundaries, and local-state
  helpers before any governed action.
- Registries expose read-only previews until their runtime phases explicitly
  enable execution.
- Checkers can import modules for validation and write reports.
- Shared utilities can be imported broadly if they stay generic and side-effect
  limited.

## Forbidden Directions

- Policy modules must not import dashboard code.
- Project modules must not import OS runtime internals directly.
- Tools must not bypass policy, traffic plane, permission, or audit boundaries.
- Dashboard must not write files directly.
- Checkers must not mutate private project files unless a dedicated phase
  explicitly allows it.
- Provider/tool dispatch is forbidden before governance phases enable it.
- DB writes are forbidden before the DB primary runtime phase.

## Planned Boundary Checker

`scripts/check-dependency-boundaries.js` is a future checker candidate. It should
verify import directions, forbidden runtime dependencies, and project/OS boundary
separation without executing runtime behavior.
