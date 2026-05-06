# NEXUS Repository Operating Rules

## Core Rules

- Never work on `main`.
- Always run before edits:
  - `git branch --show-current`
  - `git status --short`
  - `git rev-parse --short HEAD`
- Stop if the working tree is dirty.
- Use feature branches.
- Respect allowed files and forbidden files from the prompt.
- Do not modify runtime unless the phase explicitly allows it.
- Do not modify model routing, batch, governor, tools, skills, contracts, state-machine, providers, memory, or projects unless explicitly allowed.
- Do not expose secrets.
- Do not add dependencies without approval.
- Do not install plugins automatically.
- Do not add MCP servers automatically.
- Do not make network calls unless the phase explicitly allows it.
- Preserve current behavior unless the phase is runtime integration.
- Use contracts, state-machine rules, and shared agent standards when changing agents.
- Run requested validation commands.
- Show `git diff --stat` and changed files.
- Commit and push only when the prompt explicitly says.
- Do not claim tests pass unless command output proves it.

## Branch Naming

Use:

- `arch/<phase-name>`
- `feat/<feature-name>`
- `fix/<bug-name>`
- `docs/<doc-name>`
- `careloop/<scope>`

Never use `main` for work.

## Commit Message Convention

Use:

- `docs: ...`
- `feat: ...`
- `fix: ...`
- `test: ...`
- `chore: ...`

Examples:

- `docs: retrofit platform agents for Nexus OS`
- `feat: add agent readiness checker`
- `docs: add coding agent tooling alignment`

## Phase Safety

Each phase prompt defines:

- allowed files
- forbidden files
- validation commands
- commit message
- base branch

If the prompt and `AGENTS.md` conflict, follow the stricter rule.

## CareLoop Protection

Do not modify:

- `projects/careloop`
- `projects/careloop-ios`

unless the current phase explicitly allows CareLoop changes.

## Agent Retrofit Rules

When modifying agents:

- inspect `agents/_shared/*`
- preserve useful existing content
- add OS sections consistently
- do not modify unrelated agents
- do not change runtime
- ensure agents do not overclaim authority
- ensure agents do not fabricate skill, test, gate, or evidence results

## Verification Rules

Do not say:

- tests passed
- checks passed
- gate passed
- release ready

unless there is actual command output or evidence.
