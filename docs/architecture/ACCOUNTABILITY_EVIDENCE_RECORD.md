# Accountability Evidence Record

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose

NEXUS should be able to prove what happened on a call without storing raw
prompt text, raw model response text, or raw retrieved context.

The accountability evidence record is the local per-call proof object for that
purpose.

---

## What It Captures

Each record links:

- session ID
- originating user
- delegation chain
- agent ID and version
- capability ID
- task and project IDs
- action type
- runtime and provider
- prompt, retrieved-context, and response classifications
- downstream tool call references
- policy decision
- input, output, and record hashes

---

## Why It Uses Hashes

Hashes let NEXUS preserve a stable accountability trail without storing raw
sensitive content inside the runtime proof record.

That means the record stores:

- classifications
- references
- policy outcomes
- hashes

It does not store:

- raw prompts
- raw model outputs
- raw retrieved private context
- raw secrets

---

## Redaction

Every accountability evidence record is redacted by default.

The record is intended for:

- local audit surfaces
- evidence linkage
- traffic-plane traceability
- future durable audit storage

It is not intended to become a secret-bearing transcript.

---

## Relationship To Observability

The accountability evidence record complements:

- traces
- evidence lineage
- artifact references
- audit events
- policy decisions

It gives the runtime plane a small, deterministic, per-call proof object even
before a full observability pipeline exists.
