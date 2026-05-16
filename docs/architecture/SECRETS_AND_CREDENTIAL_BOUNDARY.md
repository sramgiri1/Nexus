# Secrets and Credential Boundary

## Purpose

P59 creates a safe credential reference layer for future provider, tool, DB,
deploy, and integration phases. It models which credentials may be needed
without reading, storing, printing, or resolving raw secret values.

## P59.1 - Secret Reference Model

Secret references are metadata only. They include labels, scopes, providers,
storage posture, allowed capabilities, and approval requirements. `rawValue`
must remain empty and `valueStored` must remain false throughout P59.

## Safety Boundary

NEXUS must not read `.env` files, print environment values, log API keys,
resolve provider credentials, write DB credentials, deploy, sign mobile builds,
or mutate project files in P59.

## Next Steps

P59.2 adds preview-only secret access policy decisions.

## P59.2 - Secret Access Policy

Secret access policy allows metadata-only inspection of secret references when
mode and scope permit it. Raw value resolution is always blocked in P59.
Production-placeholder metadata requires approval, and public/demo access is
denied.

## P59.3 - Redaction Tests

Secret redaction tests scan P59 reports, docs, and UI source touched by this
phase for secret-like output. Scanner fixtures use fake placeholders only and
allowlist the documentation-safe `sk-activation` phrase.
