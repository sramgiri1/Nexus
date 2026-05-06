# NEXUS Safety Model

NEXUS is designed so that an agent does not get broad authority just because it
can generate text.

## What keeps NEXUS safe

- **Governor** — sensitive actions are expected to flow through a single policy
  boundary
- **Contracts** — work moves through typed scope, not vague prompts
- **State machines** — agents propose transitions; the OS decides whether a
  transition is valid
- **Approvals** — deploys, secrets, migrations, and other high-risk actions
  require explicit human approval
- **Data classification** — public, internal, confidential, restricted, and
  secret data are handled differently
- **Secret boundary** — secrets should never appear in prompts, logs, reports,
  batch payloads, or public UI surfaces

## Gate and release rules

- no gate pass without evidence
- no batch job can satisfy a blocking verification gate
- no release GO without gate evidence
- no approval result replaces verification evidence

## Public-safe defaults

- demo mode is read-only by default
- demo mode uses DemoApp only
- demo mode avoids provider calls, DB access, and secrets
- reports and artifacts are examples, not live customer outputs

## Data and DB safety later

The public demo does not use real user data or DB state. Future DB-backed
operation must preserve:

- data classification
- redaction
- safe result handling
- auditability
- approval for sensitive access

NEXUS treats DB and PII safety as operating-system concerns, not as optional
application concerns.
