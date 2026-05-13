# Reuse and Refactor Guide

## Reuse-First Rule

Before adding a new helper, check whether the repo already has a module for:

- policy loading
- report writing
- redaction
- mode guards
- route metadata
- runtime snapshot normalization

## Avoid Duplicate Implementations

Do not duplicate:

- policy loaders
- report writers
- redaction helpers
- mode guards
- checker output formatters
- runtime snapshot helpers

## Safe Refactor Candidates

Reasonable refactor targets include:

- duplicated route metadata helpers
- repeated markdown report metadata blocks
- repeated snapshot-summary formatting
- repeated Command Center label mapping

## High-Risk Areas

Do not casually refactor:

- `orchestrator/loop.js`
- `orchestrator/runner.js`
- state-machine modules
- provider/tool execution
- project mutation logic
- local-state write boundary
- security and public/private boundary layers

These areas are correctness-sensitive and can break multiple validation phases at once.
