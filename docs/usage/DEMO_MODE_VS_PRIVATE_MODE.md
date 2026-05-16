# Demo Mode vs Private Mode

## Demo Mode

Demo mode is public-safe and intentionally separate from the full Command
Center. The full Command Center should not use demo fixtures as fallback
identity or project data.

## Local-Private Mode

Local-private mode allows governed access to private-project workflows under stricter boundaries and local-only controls.

## Public-Safe Surfaces

Public-facing surfaces should stay redacted, demo-safe, and free of raw private
internals.

## Private Project Wording

In public-safe docs and broad operator messaging, use “private project” wording
rather than exposing product internals unless a private-mode-only artifact
explicitly requires it.

## Full Command Center Boundary

The full Command Center is not the demo surface. Its primary identity is one of:

- NEXUS OS
- Portfolio
- Selected Project
- No project selected

Demo fixtures are reserved for a future separate Command Center Lite/demo
surface and demo-only tests. Local-private pages must show a selected project
label or no-project state; they must not use demo data as fallback data.

## No Private Project Leakage Rule

Public/demo docs and surfaces must not leak:

- private project names in the wrong context
- private source snippets
- private evidence payloads
- raw `.env` or secrets

## No-Project State

When no project is selected, the safe local-private path is:

1. create, import, or select a project
2. add or generate a project profile
3. define stack and test commands
4. create a mission
5. generate a plan
6. activate the first task

Demo or Lite experiences are separate from the full Command Center and are not
the active project fallback.
