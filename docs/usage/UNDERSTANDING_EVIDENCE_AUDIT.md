# Understanding Evidence, Audit, and Runtime Events

## Evidence

Evidence records prove what governed actions produced. Evidence is the operator-facing proof layer.

Evidence appears in Command Center as timeline, task, agent, project, and developer-details views. Primary tabs summarize evidence without raw confidential payloads.

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

Primary Command Center pages are designed for safe operator visibility. Raw evidence payloads and raw logs can leak details or create unreadable UX, so they stay out of primary surfaces.

## Future Activity Model

A centralized activity log is planned for P41.8 to unify evidence, audit, and runtime visibility further.

Until P41.8, pages may show evidence, audit, and runtime events as separate summaries. That separation is intentional and keeps proof, governance, and runtime signals distinct.
