# Claude Code Setup for NEXUS

## Official Plugin Policy

Use the official Anthropic marketplace only.

Recommended now:

`/plugin install frontend-design@claude-plugins-official`

Optional later:

`/plugin install github@claude-plugins-official`

## frontend-design Usage

Use only for:

- NEXUS Command Center UI concepts
- investor demo UI
- CareLoop demo UI
- visual polish
- static prototypes

Do not use for:

- runtime code
- governor
- contracts
- state machine
- batch
- DB security
- release decisions

## GitHub Plugin Usage

Optional later only.
Do not grant write authority by default.
Do not allow automatic merges or pushes unless explicitly requested.

## Not Part of Core NEXUS

Do not install as core NEXUS tooling:

- OpenClaw
- Agent Lightning
- Claude-Mem
- Superpowers
- random security packs
- community plugin packs

## Claude Working Rules

Claude should follow `AGENTS.md` manually if Claude Code does not auto-load it.

Claude must:

- obey branch safety
- obey allowed files
- avoid runtime changes unless the phase allows them
- avoid secrets
- show diff summary
- not claim checks passed without output
