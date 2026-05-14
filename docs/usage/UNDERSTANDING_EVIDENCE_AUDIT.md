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

Until the full Activity Log and trace view are complete, pages may show
evidence, audit, activity, and runtime events as separate summaries. That
separation is intentional and keeps proof, governance, and runtime signals
distinct.
