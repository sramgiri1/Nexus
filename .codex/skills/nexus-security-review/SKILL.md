# nexus-security-review

## Name

NEXUS Security Review

## Description

Review security-sensitive changes for data leakage, unsafe execution paths, boundary bypass, and policy drift before they reach commit or release decisions.

## When to Use

Use for changes involving auth, secrets, provider config, network behavior, batch use, logging, DB access, compliance-sensitive content, or any phase that touches safety boundaries.

## Steps

1. Check for secrets exposure.
2. Check for unsafe shell usage.
3. Check for unapproved network egress.
4. Check batch payload risk.
5. Check OpenRouter restricted-data risk.
6. Check approval bypass attempts.
7. Check MCP risk.
8. Check file-boundary bypass.
9. Check DB or personal-data leakage risk.
10. Check logging leakage risk.

## Safety Checks

- Restricted or secret data must never enter LLM context, batch, logs, OpenRouter, or evidence artifacts.
- Flag any unreviewed server, plugin, or automation path that expands execution authority.
- Escalate when the scope requires runtime or security approval not present in the phase.

## Allowed Outputs

- Security findings
- Required fixes
- Blocker summary
- Safe-to-proceed note only when no material issues are found

## Forbidden Actions

- Accepting secrets in repo files
- Allowing hidden execution paths
- Sending restricted data to batch, logs, or OpenRouter
- Treating unreviewed tooling as approved
