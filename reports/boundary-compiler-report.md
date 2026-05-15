# Boundary Compiler Report

## Metadata
- Generated at: 2026-05-15T15:12:46.727Z
- Validation branch: arch/agent-registry-boundary-compiler
- Validation HEAD: e2c931d
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P45.4 - Boundary Compiler

## Summary
- Compiler version: 1.0
- Dry-run only: true
- Example envelopes: 4
- Valid examples: 4
- Runtime enforcement enabled: false

## Example Envelope Summaries
- CORE: UNKNOWN / implementation.scoped_patch / approvals 2 / evidence 3
- SENTINEL: UNKNOWN / verification.qa_gate / approvals 0 / evidence 3
- WARDEN: NEXUS_OS / security.privacy_review / approvals 0 / evidence 3
- AUDITOR: UNKNOWN / verification.review_output / approvals 0 / evidence 3

## Explicit Non-Goals
- No action bridge behavior changed.
- No runtime enforcement enabled.
- No provider/tool dispatch enabled.
- No DB writes enabled.
- No project source mutation enabled.

## Checks
- PASS: Compiler module
- PASS: Envelope module
- PASS: Validator module
- PASS: Dry-run envelope
- PASS: Envelope validates
- PASS: Examples
- PASS: Project/scope metadata
- PASS: Safety policy
- PASS: No private project diff
