# Worker Queue Runtime Engine

## Purpose

P60 introduces the durable worker runtime primitives NEXUS needs before later
concurrent execution phases. It is a foundation phase only: queue records,
leases, heartbeats, retry/timeout policies, dead-letter records, and Command
Center visibility are modeled, but no task execution is enabled.

## Runtime Boundary

The worker runtime policy is `preview_only`.

- Agent execution: disabled
- Tool and MCP execution: disabled
- Provider calls: disabled
- External network calls: disabled
- Project mutation: disabled
- DB writes: disabled
- Arbitrary shell commands: disabled

The policy source is `policy/worker-runtime-policy.json`.

## Models

- Worker queue: `worker-runtime/queueSchema.js` and
  `worker-runtime/workerQueue.js` define preview-only queue items.
- Leases: `worker-runtime/leaseModel.js` models future worker claims without
  running work.
- Heartbeats: `worker-runtime/heartbeatModel.js` models deterministic heartbeat
  records and stale detection without timers or daemons.
- Retry/timeout: `worker-runtime/retryTimeoutModel.js` calculates retry and
  timeout previews without automatic retry loops.
- Dead-letter queue: `worker-runtime/deadLetterQueue.js` models blocked work
  records without automatic requeue.
- Runtime summary: `worker-runtime/runtimeSummary.js` combines preview state for
  reports and operator UX.

## Command Center

The Worker Runtime page is available at `/command-center/workers`.

It shows:

- Worker queue: modeled
- Leases: preview
- Heartbeats: preview
- Retry/timeout: modeled
- Dead-letter queue: modeled
- Runtime execution: not enabled

The page intentionally warns operators that P60 does not execute agents, tools,
providers, DB writes, or project mutations.

## Reports And Checks

- Checker: `npm run check:worker-runtime`
- Status artifact: `reports/worker-runtime-status.json`
- Main report: `reports/worker-runtime-report.md`
- Final report: `reports/worker-runtime-final-report.md`

## Known Limitations

P60 does not start workers, lease real work, retry real tasks, requeue
dead-letter records, call providers, invoke tools, write DB records, or mutate
project files.

## Next Phase

P61 - Concurrent Execution + Work Deduplication.
