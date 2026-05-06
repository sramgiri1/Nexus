# Database Agent Security

**Version:** 1.0  
**Date:** 2026-05-06

---

## Core Principle

The DB agent never gets raw unrestricted DB access.

Correct flow:

```text
DB Agent
→ Database Tool Gateway
→ Data Policy Hook
→ Query Policy
→ Redaction
→ Audit
→ Safe Result
```

This phase defines the security architecture only. It does not implement a real database, credentials, or runtime DB enforcement.

---

## DB Agent Allowed Actions

Allowed:

- inspect schema
- propose schema changes
- create migration plan drafts
- summarize non-sensitive table counts
- query development or demo safe views
- validate indexes or performance posture
- generate migration review notes

Requires approval:

- production query
- bulk export
- user table access
- schema migration
- destructive SQL
- secrets or env access
- production data sampling

Never allowed:

- raw token exposure
- password hash exposure
- API key exposure
- refresh token exposure
- private key exposure
- sending restricted data to LLM, batch, OpenRouter, logs, or evidence
- direct arbitrary SQL against production

---

## Safe Tool Gateway

Future tool names:

- `db.read_schema`
- `db.read_safe_summary`
- `db.run_safe_query`
- `db.create_migration_plan`
- `db.audit_table_access`
- `db.request_approval`

Bad:

- raw arbitrary SQL from agent
- direct DB credentials in prompt
- raw `SELECT * FROM users`
- dumping rows to logs or model context

Good:

- approved tool
- safe view
- row limit
- field allowlist
- redaction
- audit event

The gateway is the boundary between agent intent and any future DB execution.

---

## Query Policy

Every future DB request should declare:

- agent ID
- tool name
- project ID
- environment
- data classification
- row limit
- safe view or approved table target
- approval ID if required

The query policy should block or route for approval when:

- production access is requested
- row limits are missing or excessive
- restricted tables or fields are requested
- destructive SQL is requested
- secrets or credentials would be exposed

---

## DB Roles

Recommended future DB roles:

- `nexus_readonly_agent`
- `nexus_migration_planner`
- `nexus_app_runtime`
- `nexus_admin_human_only`

Principles:

- agents should receive the least privilege possible
- migration planning is not admin execution
- human-only admin paths remain separate from agent paths
- production destructive privileges should not sit inside normal agent credentials

---

## Safe Views

Recommended future safe views:

- `safe_users`
- `safe_projects`
- `safe_tasks`
- `safe_evidence_summary`
- `safe_model_usage`
- `safe_agent_runs`

Safe views should:

- expose only approved columns
- hide secret and restricted fields
- apply redaction where needed
- keep row sets bounded
- be auditable by view name

---

## Audit Events

Every DB action should record:

- `eventType`
- `agentId`
- `tool`
- `table` or `view`
- `classification`
- `rowCount`
- `redacted`
- `approvalId`
- `timestamp`
- `result`
- `blockedReason` if blocked

Audit is not optional. DB access without audit is equivalent to untrusted access.

---

## Result Handling

Safe results should prefer:

- summaries
- counts
- allowed fields only
- redacted records
- artifact references
- classification metadata

Safe results should never include:

- raw secret values
- unrestricted session or auth fields
- unrestricted production user rows
- large dumps copied into logs, reports, or LLM context

Raw DB rows must not be sent to LLMs.
Raw DB rows must not be sent to batch.

---

## Production Access Boundary

Production access should default to deny.

If production access is ever approved later, the path should still require:

- explicit approval
- safe tool path
- classification
- row limit
- redaction
- audit

No agent should receive direct production credentials in prompt context.

---

## Relationship to Operator Platform

The Command Center and future NEXUS API should never bypass this DB boundary.

Correct operator path:

```text
UI → NEXUS API → Governor / Policy → DB Gateway → Safe Result
```

Obsidian is not runtime memory.

Runtime memory stays in:

- JSON now
- PostgreSQL later

Both still require the same classification, redaction, scanning, and audit model.
