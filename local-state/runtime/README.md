# Local Runtime State

This directory contains local runtime state for NEXUS development and prototype
work only.

Rules:

- files here are safe local demo and prototype state, not production storage
- append-only JSONL files are used for evidence, audit, approvals, incidents,
  runtime events, and centralized activity events
- `activity.jsonl` is the append-only P41.8.2 activity logger store
- `tasks.json` is the local task store prototype
- no secrets or private project data belong here
- this is not DB primary mode
- local developers may reset this directory when needed
