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

## P54.6 - Batch Result Reconciler Preview

The result reconciler maps preview or mock-safe results back to batch requests using `custom_id`. It detects missing custom
IDs, duplicate custom IDs, unmatched results, and unsafe result payloads.

Rules:

- No provider output download.
- No raw provider payload storage.
- Preview/mock-safe records only.
- Summaries only in reports and Command Center surfaces.

The reconciler exists so future provider dispatch can be added behind governance without changing the evidence and review
contract.

## Next Subphase

P54.7 adds approximate API and batch cost estimation without fetching provider pricing.

## P54.7 - Cost Estimator

The cost estimator provides approximate request and batch cost previews before any future provider execution. It uses local
placeholder pricing policies only and does not fetch real provider pricing.

Outputs include:

- estimated input tokens
- estimated output tokens
- estimated USD when placeholder pricing is known
- unknown cost warnings when pricing is missing
- approval requirement summaries
- execution blocked state

No real provider pricing fetch, network call, API key read, or execution approval bypass is enabled.

## Next Subphase

P54.8 exposes API and batch adapter previews in the Command Center.

## P54.8 - Command Center API / Batch Jobs UX

The Command Center exposes `/command-center/api-batch` as a preview-only operator view for the API and batch adapter layer.

The page shows:

- provider adapters as preview-only
- OpenAI adapter skeleton metadata
- batch job builder readiness
- safe JSONL preview file availability
- external upload disabled
- provider execution disabled
- cost estimate availability
- preview-only result reconciliation
- next dependencies: Cost Center, Worker Runtime, and Provider Dispatch

No UI button uploads a batch, calls a provider, reads credentials, starts a worker, writes DB records, or mutates project
files.

## Next Subphase

P54.9 finalizes validation, regenerates reports from the current branch, and marks P54 complete with P55 next.

## P54.9 - API + Batch Adapter Final Validation

P54 final validation verifies the complete preview-only adapter surface:

- provider adapter interface
- OpenAI-compatible request preview
- batch job builder
- JSONL preview writer
- local batch status tracker
- result reconciliation preview
- cost estimator
- Command Center API / Batch UX

P54 closes with provider calls, external network, API key reads, DB writes, worker runtime, provider polling, batch upload, and
project mutation disabled.

## Next Phase

P55 - Test Suite Manager: Project + OS.
