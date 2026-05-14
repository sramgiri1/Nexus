# Understanding Evidence, Audit, and Runtime Events

## Evidence

Evidence records prove what governed actions produced. Evidence is the operator-facing proof layer.

Evidence appears in Command Center as timeline, task, agent, project, and
developer-details views. Primary tabs summarize evidence without raw
confidential payloads.

## Audit

Audit records explain who did what, when, and why in a governed path.

## Runtime Events

Runtime events summarize notable execution-stage events in the local runtime flow.

## Why These Records Matter

Together they answer:

- what happened
- who initiated or reviewed it
- what result was produced
- whether the action stayed inside policy

## Redaction

Records are redacted where needed. Primary UX does not expose raw sensitive payloads.

## Why Raw Payloads Are Not Shown

Primary Command Center pages are designed for safe operator visibility.
Raw evidence payloads and raw logs can leak details or create unreadable UX,
so they stay out of primary surfaces.

## Activity Capture

A centralized activity log is underway in P41.8 to unify evidence, audit,
runtime, API, UI, and governed action bridge visibility.

P41.8.3 adds redacted local API and governed action bridge records to
`local-state/runtime/activity.jsonl`. Command Center can read those records
through the local-only `/activity` endpoint and show summarized activity without
exposing raw payloads, raw logs, raw policies, secrets, or private project
source details.

P41.8.4 adds the Command Center Activity Log page. Use it for the centralized
timeline and filters:

- Activity Log shows summarized UI/API/action bridge activity and failures.
- Evidence proves what governed work produced.
- Audit explains review, policy, and governance decisions.
- Runtime events describe local execution-stage state.

The Activity Log groups records by timeline, agent/source, task/project,
failures, API/actions, and correlation ID previews. It does not replace the
Evidence or Audit pages; it gives operators one place to see how those signals
connect.

## Trace View by Correlation ID

P41.8.5 adds trace drilldown from the Activity Log. A correlation ID links the
UI event, local API read, governed action bridge event, task reference, evidence
reference, and audit reference for one operator flow when those records exist.

Use trace view when you need to answer:

- What happened during this specific operator action?
- Which task, agent, evidence record, or audit record was linked?
- Did the flow succeed, fail, block, or require approval?
- Where did the flow stop?

Trace view is still a safe operator summary. It shows timestamps, categories,
sources, event types, redacted summaries, status, and related IDs. It does not
show raw JSONL records, raw logs, raw payloads, secrets, stack traces, or private
project content.

Provider/tool/worker traces, DB-backed activity storage, retention policy,
exports, and telemetry remain future work.
