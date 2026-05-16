# API + Batch Execution Adapter

## Purpose

P54 introduces a preview-only API and batch execution adapter foundation. It prepares NEXUS to package governed provider
requests, estimate costs, build batch previews, and reconcile future results without enabling external provider execution.

## Safety Posture

- No provider calls.
- No external network calls.
- No API keys or credential reads.
- No DB writes.
- No worker runtime.
- No project source mutation.
- No upload or provider polling.
- No raw prompt storage in preview records.

## P54.1 - Provider Adapter Interface

The provider adapter interface defines metadata for future provider integrations while keeping execution disabled. Adapters
declare supported preview modes, supported workloads, forbidden workloads, cost-estimate requirements, and evidence
requirements.

Current preview adapters:

- OpenAI API Preview
- Claude API Preview
- Generic API Preview

Every adapter must keep `externalCallsEnabled: false` in P54. Request previews are redacted summaries only and require
cost estimates, evidence, and human approval before any future execution phase.

## Next Subphase

P54.2 adds an OpenAI-compatible request-shape preview skeleton without importing an SDK, reading API keys, or calling the
network.

## P54.2 - OpenAI API Adapter Skeleton

The OpenAI adapter skeleton models request shape compatibility for future Responses, Chat Completions, Embeddings, and Batch
workloads. It is not an OpenAI client and does not import an SDK.

Preview records include:

- provider ID
- endpoint family
- model policy
- redacted input summary
- cost estimate requirement
- evidence requirement
- execution block reason

No actual OpenAI client is created. API keys are not read. Provider calls and network calls remain disabled.

## Next Subphase

P54.3 adds a batch job builder that prepares preview request objects without uploading or sending them.

## P54.3 - Batch Job Builder

The batch job builder prepares JSONL-like request objects for review. It tracks workload type, provider ID, request count,
custom IDs, cost-estimate requirements, and future reconciliation requirements.

Batch jobs remain preview-only:

- No upload.
- No provider call.
- No external network.
- No raw private source dumps.
- No execution path.

Request records use redacted summaries and require `custom_id` values so a later reconciliation phase can map results safely.

## Next Subphase

P54.4 writes safe local preview JSONL files under `reports/api-batch/` for operator review.

## P54.4 - JSONL Job Writer

The JSONL writer creates safe local preview files under `reports/api-batch/`. These files are review artifacts only. They are
not uploaded to any provider and do not contain raw prompts or private source dumps.

Rules:

- Write only under `reports/api-batch/`.
- Require `custom_id` for every line.
- Store redacted summaries only.
- Keep `externalCallAllowed: false`.
- Keep external upload disabled.

The writer also produces a small JSON summary next to the JSONL preview so checkers and the Command Center can summarize the
artifact without dumping raw records.

## Next Subphase

P54.5 adds local preview status tracking for batch jobs without provider polling.

## P54.5 - Batch Status Tracker Preview

The status tracker records local preview status for batch jobs. Status records are stored as review artifacts under
`reports/api-batch/` and never poll provider APIs.

Supported statuses:

- `preview_created`
- `ready_for_review`
- `blocked`
- `upload_not_enabled`
- `awaiting_future_provider_dispatch`
- `reconciled_preview`

No provider polling, external status calls, raw provider payload storage, upload, or execution is enabled.

## Next Subphase

P54.6 adds a local result reconciler that maps mock-safe preview results by `custom_id`.
