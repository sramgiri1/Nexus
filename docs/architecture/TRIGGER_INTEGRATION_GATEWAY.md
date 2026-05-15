# Trigger + Integration Gateway

P53 defines the governed trigger and integration gateway for NEXUS. The gateway
is a preview and policy layer only: it describes how manual commands, scheduled
events, repository events, ticket events, chat commands, and webhook previews
would map to NEXUS actions in later phases.

P53 does not enable real trigger execution, webhook listeners, schedulers,
provider calls, external network calls, DB writes, worker runtime, or project
mutation.

## P53.1 - Trigger Gateway Schema

P53.1 adds the trigger gateway schema and trigger type model. Each trigger type
documents its source system, allowed scopes, required capabilities, forbidden
actions, evidence requirements, audit requirements, cost policy requirements,
dedupe requirements, and rate limit requirements.

Supported trigger type metadata:

- Manual Command Center preview
- Manual Command Palette preview
- Cron schedule preview
- GitHub event preview
- Jira preview
- Linear preview
- Slack preview
- Teams preview
- API webhook preview

No runtime listeners are enabled. The schema is used by checkers, reports, and
future Command Center preview surfaces only.

## Safety Boundary

- Trigger execution is disabled.
- Webhook listeners are disabled.
- Scheduler and timer registration are disabled.
- Worker runtime is disabled.
- Provider calls and external network calls are disabled.
- DB writes are disabled.
- Project mutation is disabled.
- Credentials and tokens are not used.

## Next Phase

P53.2 adds a manual trigger preview model for Command Center and command
palette actions. It remains dry-run only.
