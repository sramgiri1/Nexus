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
