# Behavior Baseline Model

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose

The local behavior baseline model gives NEXUS a deterministic way to notice
when an agent starts behaving differently from what has already been observed.

---

## What The Baseline Tracks

- tool call distribution
- action type distribution
- argument shape signatures
- runtime distribution
- provider distribution
- response classes
- maximum observed chain depth
- maximum observed egress volume
- maximum observed cost

---

## Drift Signals

The local baseline compares a new event against what has already been observed
for that agent.

Examples:

- a new unseen tool after enough samples
- a new provider after enough samples
- a new runtime after enough samples
- deeper delegation chains than usual
- much larger egress volume
- much higher cost

FAIL or BLOCKED results are recorded, but they are not treated as drift by
themselves.

---

## Why This Exists

Privilege answers whether a call should be allowed.

Behavioral monitoring answers whether the call pattern itself is starting to
look unusual, expensive, or unexpectedly broad.

That matters for:

- provider drift
- runtime drift
- tool drift
- model update drift
- expensive egress bursts
- unusual chain-depth expansion

---

## Current Scope

This is local deterministic baseline logic only.

It is not:

- a telemetry exporter
- a DB-backed anomaly system
- a live alerting service
- a full model-eval system

Future telemetry and observability layers can consume the same event structure
later.
