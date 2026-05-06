# Data Protection and PII Model

**Version:** 1.0  
**Date:** 2026-05-05

---

## Purpose

NEXUS will eventually handle:

- agent memory
- task contracts
- evidence
- logs
- model context
- batch payloads
- database data
- user and project data
- CareLoop data later

Personal or sensitive data must never leak through:

- LLM prompts
- batch payloads
- OpenRouter
- logs
- evidence artifacts
- reports
- UI payloads
- DB agent output

This phase defines the policy, architecture, and validation model only. It does not implement runtime enforcement yet.

The data protection model is part of the wider security boundary:

- default-deny network posture
- default-deny MCP posture
- secret boundary by reference only
- classify, redact, and scan before provider, batch, log, evidence, or UI flow
- human approval for production data access and related high-risk actions

---

## Data Classes

### 1. `public`

Examples:

- public docs
- marketing copy
- public project names
- non-sensitive demo data

### 2. `internal`

Examples:

- internal task summaries
- non-sensitive agent status
- non-sensitive project metadata

### 3. `confidential`

Examples:

- user email
- phone
- names
- business-sensitive plans
- private feedback after redaction need

### 4. `restricted`

Examples:

- raw personal records
- auth or session data
- raw user feedback with personal info
- production DB rows
- health, medical, or care notes if applicable
- private addresses
- payment-like data

### 5. `secret`

Examples:

- API keys
- DB URLs
- passwords
- tokens
- refresh tokens
- private keys
- env values

---

## Rules

- `secret` data never enters LLM context, batch, OpenRouter, logs, evidence, or reports.
- `restricted` data never enters LLM context, batch, OpenRouter, logs, evidence, or reports unless explicitly redacted and approved by future policy.
- `confidential` data requires redaction or approval before entering model context.
- `batch-provider` may only receive `public` or `internal` data by default.
- OpenRouter may only receive `public` or `internal` data by default.
- direct OpenAI or Anthropic may receive `public`, `internal`, and carefully reviewed `confidential` data only when policy allows.
- raw DB rows must not be sent to LLMs.
- raw DB rows must not be sent to batch.
- logs must be redacted.
- evidence should store artifact references or hashes, not sensitive blobs.
- UI should display redacted summaries and evidence references.
- approval is required for production data access, bulk export, schema migrations, and destructive SQL.

---

## Redaction

Examples:

- email → `[REDACTED_EMAIL]`
- phone → `[REDACTED_PHONE]`
- token → `[REDACTED_SECRET]`
- DB URL → `[REDACTED_DB_URL]`
- private key → `[REDACTED_PRIVATE_KEY]`
- user row → `[REDACTED_USER_RECORD]`

Redaction is not optional formatting. It is a required safety step before data is written into:

- model context
- logs
- evidence
- reports
- UI summaries

---

## LLM Context Rule

Before any model call:

```text
classify → redact → scan → approve/block
```

Required behavior:

- classify the payload first
- redact confidential details when needed
- scan for secrets, tokens, credentials, and restricted row-like content
- approve or block based on provider policy

---

## Batch Rule

Before any batch queue:

```text
classify → redact → scan → reject if confidential/restricted/secret
```

Batch is for cost-optimized, non-blocking output only. It does not receive:

- confidential data by default
- restricted data
- secret data
- raw DB rows
- gate or release payloads

---

## Evidence Rule

Before evidence persistence:

```text
classify → redact → store reference/hash → audit
```

Evidence should prefer:

- artifact paths
- hashes
- summaries
- classifications
- audit metadata

Evidence should avoid:

- raw sensitive blobs
- unredacted logs
- raw DB dumps
- direct credential material

---

## Provider Handling

### OpenRouter

Default policy:

- `public` allowed
- `internal` allowed
- `confidential` blocked by default
- `restricted` blocked
- `secret` blocked

### Direct OpenAI / Anthropic

Default policy:

- `public` allowed
- `internal` allowed
- `confidential` allowed only with careful review and task-policy support
- `restricted` blocked
- `secret` blocked

### Local / Deterministic Tooling

Local runtime and deterministic tooling may inspect more than remote providers, but they still must:

- classify
- redact where output leaves the tool boundary
- avoid logging restricted or secret content
- persist only redacted evidence

Provider and network restrictions do not imply that local models are automatically
safe for secrets. Classification, redaction, scanning, and audit still apply.

---

## Database Data Rule

Database-backed memory later does not change the protection model.

Rules that still apply:

- raw DB rows must not go to LLM context
- raw DB rows must not go to batch
- raw DB rows must not be copied into reports
- raw DB rows must not be copied into evidence artifacts
- DB agent output must be summarized, limited, classified, redacted, and audited

Future DB-agent work must go through safe tools and safe views, never raw unrestricted access.

---

## UI Rule

The Command Center should eventually show:

- redacted summaries
- evidence references
- classification markers
- approval state
- audit-linked events

The UI should not show:

- raw secrets
- raw restricted DB rows
- raw confidential artifacts without role-based approval

The current Command Center prototype uses static mock data only.

---

## Memory and Notes

Obsidian is not runtime memory. Runtime memory remains JSON now and will move to
PostgreSQL later through governed API and kernel paths.

Obsidian is not runtime memory.

Human notes may live in Obsidian later for planning, but runtime memory belongs in:

- JSON memory now
- PostgreSQL later

Both still require classification, redaction, scanning, and audit policy.
