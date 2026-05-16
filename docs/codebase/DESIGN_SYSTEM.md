# Command Center Design System

Command Center UI should remain readable, scoped, and operator-focused as the
platform grows.

## Theme Rules

- Use existing theme tokens and CSS variables.
- Preserve System, Dark, and Light modes.
- Do not introduce hardcoded colors unless a token does not exist and the new
  token is documented.

## Component Patterns

- `PageHeader` / page head: clear page title, current state, and key actions.
- `PageHero`: concise current mission or scope summary.
- `CommandTabs`: reusable tabs for dense pages; every tab needs useful content
  or a useful empty state.
- `StatusBadge`: user-facing status such as Ready, Read-only, Planned, Blocked,
  or Disabled by policy.
- `EmptyState`: explain what is missing and the next safe action.
- `DeveloperDetails`: raw IDs, paths, and internal metadata belong here, not in
  primary UX.

## Copy Rules

- No raw IDs in primary UX unless the ID is the user-facing object.
- No raw JSON, raw logs, raw policy dumps, secrets, or private payloads in
  primary UX.
- Demo data belongs only in Demo Mode.
- Phase labels belong on OS Roadmap; operator pages should use capability
  language.
- Disabled actions need reasons.
- Every page needs a heading, current state, and next action or empty state.

P56.8 documents this system only. Broad component refactors are deferred.
