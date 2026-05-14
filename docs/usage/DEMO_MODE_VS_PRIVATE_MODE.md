# Demo Mode vs Private Mode

## Demo Mode

Demo mode is public-safe and DemoApp-oriented. It is designed for safe demonstrations without exposing private-project details.

## Local-Private Mode

Local-private mode allows governed access to private-project workflows under stricter boundaries and local-only controls.

## Public-Safe Surfaces

Public-facing surfaces should stay:

- DemoApp-only where applicable
- private-project safe
- redacted
- free of raw private internals

## Private Project Wording

In public-safe docs and broad operator messaging, use “private project” wording
rather than exposing product internals unless a private-mode-only artifact
explicitly requires it.

## DemoApp Boundary

DemoApp content belongs on Demo Mode surfaces. It should not leak into local-private Mission Control or Workspace primary UX.

Allowed DemoApp locations:

- `/command-center/demo`
- demo-only fixtures
- demo-only tests that explicitly validate Demo Mode

Local-private pages must show `Private Project`, an approved selected project
label, or a no-project state. They must not use DemoApp as fallback data.

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

Opening Demo Mode is allowed for public-safe demonstration, but Demo Mode is not the active project fallback.
