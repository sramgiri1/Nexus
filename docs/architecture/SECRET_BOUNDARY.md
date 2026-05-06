# Secret Boundary

**Version:** 1.0  
**Date:** 2026-05-06

---

## Core Rules

- secrets are referenced by name only
- raw secrets never enter agent prompts
- raw secrets never enter LLM context
- raw secrets never enter batch
- raw secrets never enter OpenRouter
- raw secrets never enter logs, evidence, reports, or UI
- agents never request secret values
- tools may use secrets only through an approved secret provider later
- secret access requires purpose, scope, approval if high-risk, and audit

---

## Secret Types

- API keys
- provider keys
- database URLs
- tokens
- refresh tokens
- session tokens
- private keys
- certificates
- passwords
- environment values
- signing credentials

---

## Secret Operations

### Allowed Later

- secret existence check
- secret metadata check
- secret reference by name
- secret rotation plan
- secret access request

### Blocked

- print secret
- echo environment values
- log secret
- put secret in evidence
- send secret to LLM
- put secret in batch
- commit secret
- copy secret to report

---

## Secret Scanning

Secret scanning should happen:

- before model context
- before batch queue
- before log write
- before evidence persistence
- before git commit if implemented later
- before UI or API response

Secret scans are part of the safety boundary, not optional hygiene.

---

## Phase Scope

This phase defines the secret boundary policy and checks only. It does not
implement a live secret provider or runtime enforcement yet.
