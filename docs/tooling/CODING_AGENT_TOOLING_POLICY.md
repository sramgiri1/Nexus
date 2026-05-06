# Coding Agent Tooling Policy

## Purpose

Define how Codex and Claude may be used on NEXUS so tooling assists execution without bypassing contracts, safety controls, or repository operating rules.

## Approved Tooling

Codex:

- `AGENTS.md`
- local Codex skills
- project config
- MCP later only when explicitly reviewed

Claude:

- official Claude Code plugins only
- `frontend-design@claude-plugins-official` for UI concepts
- `github@claude-plugins-official` optional later, only if GitHub operations are intentionally delegated

## Not Approved for Core NEXUS

- community plugin packs
- memory plugins
- OpenClaw
- Agent Lightning as runtime replacement
- broad autonomous assistant plugins
- unreviewed MCP servers
- plugins that run hidden hooks
- plugins that auto-edit repo files without scope control

## Rules

- Codex is the primary implementation tool.
- Claude is an optional design and review tool.
- Plugins and skills assist workflow; they do not replace NEXUS contracts, governor, state machine, or verification gates.
- NEXUS memory and evidence remain the source of truth.
- Coding agents must not bypass branch, scope, or safety rules.
- No plugin should receive secrets.
- No plugin should modify runtime without explicit phase approval.
