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
