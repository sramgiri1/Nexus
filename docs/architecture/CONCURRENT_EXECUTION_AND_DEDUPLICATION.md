# Concurrent Execution and Deduplication

## Purpose

P61 defines how NEXUS will coordinate concurrent work before real parallel
execution is enabled. The phase is preview-only: it models concurrency policy,
locks, duplicate work detection, queue priority, and cancellation readiness
without enforcing runtime behavior.

## Preview-Only Boundary

Concurrency execution is disabled by policy. P61 does not start workers, run
agents, call providers, dispatch tools, write to the DB, mutate project files,
or enforce file locks. All records are deterministic previews for operator
inspection and future governance work.

## P61.1 - Concurrency Policy

`policy/concurrency-policy.json` is the policy source for this phase. It keeps
concurrency execution disabled, limits concurrent preview capacity to one task
per project, repo, and agent, and requires path locks, duplicate detection,
budget checks, and human approval before any future override.

The supporting modules are:

- `concurrency/concurrencySchema.js`
- `concurrency/concurrencyPolicy.js`
- `scripts/check-concurrency-policy.js`

## P61.2 - Lock Preview Model

The lock preview model describes project, repo, path, agent, and capability
locks. It can detect conflicts, but conflict results are warnings and preview
decisions only. No worker is blocked and no filesystem lock is created.

Preview records are redacted, set `previewOnly: true`, and may be stored in
`local-state/runtime/concurrency-locks.jsonl` for checker validation.

## P61.3 - Duplicate Work Detection

Duplicate detection uses deterministic signals only:

- task title
- capability ID
- project ID
- repo ID
- mission ID
- path scope

No embeddings, provider calls, or task merges are used. High-scoring duplicate
candidates can recommend `block_preview`, but no task state changes.

## P61.4 - Queue Priority Preview

The priority model ranks tasks using deterministic fields such as blocked state,
urgency, approvals, risk, dependency readiness, and cost impact. It does not
reorder any worker queue or execute tasks.

## P61.5 - Cancellation Preview

Cancellation previews classify whether a queued or planned task appears safe to
cancel. They do not terminate workers, abort providers or tools, update task
state, or perform cleanup. Any cleanup steps are future-plan notes only.

## P61.6 - Command Center Concurrency UX

Command Center surfaces preview readiness in operator language:

- concurrency execution is not enabled yet
- lock model is preview-ready
- duplicate detection is preview-ready
- priority model is preview-ready
- cancellation model is preview-ready
- worker runtime remains preview-only

The UI must not show raw policy JSON or raw lock records as primary content.
Developer details may reference module names and report paths.

## Safety Rules

P61 preserves these boundaries:

- no true parallel execution
- no real lock enforcement
- no task merging
- no cancellation side effects
- no provider or tool dispatch
- no DB writes
- no project mutation
- no DemoApp fallback outside demo/lite surfaces

## Reports and Checkers

The phase adds these checks:

- `npm run check:concurrency-policy`
- `npm run check:concurrency-locks`
- `npm run check:work-deduplication`
- `npm run check:queue-priority`
- `npm run check:task-cancellation`

Final validation writes `reports/concurrent-execution-final-report.md`.

## Next Phase

P62 - Conversational NEXUS Command Interface.
