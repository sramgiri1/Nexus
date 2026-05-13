# Controlled Implementation

## Purpose

Controlled Implementation is the governed implementation workflow for local NEXUS work. It is intentionally narrower than broad autonomous coding.

## Current Boundary

Current implementation posture is:

- documentation-only or scoped implementation
- source mutation status clearly labeled
- validation and rollback concepts surfaced
- no broad autonomous implementation runtime

## What The Page Shows

- status
- scope
- production behavior changed or not
- owner agent
- validation result
- rollback posture

Developer Details may include internal paths or bridge references, but those are secondary to the operator summary.

## Why Broad Autonomous Implementation Is Not Enabled Yet

- worker runtime is not enabled
- provider dispatch is not enabled
- source mutation is still governed and intentionally constrained
- validation and rollback posture must stay explicit

## Validation and Rollback

Implementation is not just “apply change.” It must also show:

- whether validation ran
- whether rollback is available, not needed, or unavailable
- whether production behavior changed
