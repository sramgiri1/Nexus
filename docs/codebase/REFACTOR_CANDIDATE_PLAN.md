# Refactor Candidate Plan

## Purpose

This plan translates the reuse audit and shared helper catalog into refactor
candidates. It is intentionally not an implementation plan for this phase.
P41.7.3 records what should be extracted later, why it matters, what risk it
carries, and which tests would be required.

## Refactor Risk Model

- Low risk:
  Checker/report/docs helpers that can be validated with deterministic output.
- Medium risk:
  Action envelopes, JSONL stores, runtime snapshot helpers, or dashboard source
  labels that touch local state or UI contracts.
- High risk:
  Mode guards, redaction, safe file boundaries, write guards, state machines,
  and runtime/security decision paths.

## Candidates by Risk

### Low Risk

- Extract shared report writer.
- Extract shared check result formatter.
- Reuse Command Center route matrix in tests.
- Extract docs link checker helper.

### Medium Risk

- Extract action response envelope.
- Extract JSONL store helper.
- Extract runtime snapshot guard.

### High Risk

- Defer mode guard extraction.
- Defer redaction helper extraction.
- Defer safe file boundary extraction.
- Defer local-state write guard extraction.
- Defer state machine wrappers.

## Candidates by Priority

### First

- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- docs link checker helper
- route matrix reuse in tests

### Soon

- action response envelope
- JSONL store helper
- runtime snapshot guard

### Later

- mode guard
- redaction helper
- safe file boundary
- local-state write guard
- state machine wrappers

## Why No Broad Refactor Is Done in This Phase

P41.7.3 is a planning and catalog phase. Broad refactors would hide behavioral
risk inside documentation work and would make validation ambiguous. The correct
sequence is catalog, candidate plan, scoped refactor, targeted tests, and then
report updates.

## Recommended Future Refactor Subphases

- P41.7.3a / future: shared report writer extraction
- P41.7.3b / future: check result formatter extraction
- P41.7.3c / future: runtime snapshot helper extraction
- P41.7.3d / future: action response envelope extraction

None of these are implemented now.
