# Identity Propagation

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose

Identity propagation ensures NEXUS does not lose track of who originated a
request as that request moves through agents, capabilities, tools, and
providers.

---

## Identity Components

### Originating user

Every call should preserve the original user identity when one exists.

That includes:

- `userId`
- `role`
- `authType`
- `scopes`

### Session

Every call should carry a session boundary:

- `sessionId`
- `source`
- `startedAt`

### Delegation chain

Every hop should record:

- who delegated
- who received the work
- why it was delegated
- which capability justified it
- when the hop occurred

### Agent identity and version

The acting agent must be identifiable per call:

- `agentId`
- `agentVersion`
- `agentGroup`
- `agentPlane`

### Request identity

The request surface must remain stable:

- `requestId`
- `taskId`
- `projectId`
- `correlationId`
- `idempotencyKey`

---

## Rules

- originating user is required
- session is required
- delegation chain must be explicit
- service accounts must not erase the originating user
- same agent called by different users may have different scopes
- scopes must be evaluated per call, not once per process
- demo and test identities are allowed, but they should remain labeled as such

---

## Why It Matters

Without identity propagation, NEXUS can lose the difference between:

- a founder request
- a demo request
- a test harness request
- an agent-internal delegation
- a future API request

That would break both privilege and accountability.

---

## Future Integration

The local identity context model is designed to plug into future:

- dashboard sessions
- API sessions
- approval workflows
- runtime traffic enforcement
- evidence and audit trails

This phase adds the identity helper and validation rules only. It does not wire
them into every runtime path yet.
