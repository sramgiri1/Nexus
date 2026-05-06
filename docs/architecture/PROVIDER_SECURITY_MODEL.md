# Provider Security Model

**Version:** 1.0  
**Date:** 2026-05-06

---

## Provider Classes

- `direct_openai`
- `direct_anthropic`
- `openrouter`
- `local_ollama`
- `batch_openai`
- `batch_anthropic`

---

## Rules

- provider selection follows model routing policy
- agents do not choose arbitrary model or provider
- fallback follows fallback policy
- no fallback on safety, budget, permission, secret, or verification failures
- OpenRouter is low-risk only by default
- batch providers are non-blocking only by default
- local model does not mean safe for secrets
- provider payloads pass classify, redact, and scan before send
- provider responses pass classify, redact, and scan before persistence, log,
  evidence, or UI
- provider usage is audited and cost-tracked

---

## Provider Payload Blocks

Blocked from provider payloads unless a stricter future policy explicitly permits
otherwise:

- secrets
- restricted data
- raw DB rows
- raw production user data
- tokens
- private keys
- unredacted personal data unless explicitly approved and provider-allowed

---

## High-Risk Provider Tasks

The following are high-risk and should use a direct approved provider or a
deterministic skill path, not OpenRouter by default:

- release decisions
- security decisions
- deploy decisions
- compliance or privacy decisions
- production data analysis

---

## Phase Scope

This phase defines provider security policy and validation only. It does not modify
model routing or runtime enforcement.
