# Scoped Memory Runtime Stores

This directory contains safe local JSONL metadata fixtures for P46 scoped
memory validation. Records are summaries only. They must not contain secrets,
raw private source, raw prompts, raw logs, or unrelated project memory.

Runtime memory injection is not enabled in P46.

## P63.4 AI Snapshot Store Boundary

P63.4 adds a preview-only snapshot store contract for redacted AI interaction
snapshots and recovery points. The store shape is intended for inspection and
future Command Center Recovery UX only.

No DB writes, schema migrations, provider dispatch, tool execution, project
mutation, restore, replay, resume, delete, export, or deploy behavior is enabled
by the P63.4 snapshot store. Retention and pruning output is dry-run metadata
only, and stored fixture content must remain redacted summary data.
