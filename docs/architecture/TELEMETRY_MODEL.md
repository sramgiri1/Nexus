# Telemetry Model

**Version:** 1.0  
**Date:** 2026-05-06

---

## Purpose

Telemetry tracks system health, usage, cost, quality, and risk.

Telemetry is not release evidence by itself. It is an operational observability
surface that helps explain trends, failures, drift, latency, and cost.

Core telemetry families include provider usage, agent metrics, runtime metrics,
gate metrics, safety metrics, and eval metrics.

---

## Telemetry Types

- `task_metrics`
- `agent_metrics`
- `model_usage`
- `provider_usage`
- `cost_metrics`
- `batch_metrics`
- `runtime_metrics`
- `gate_metrics`
- `safety_metrics`
- `approval_metrics`
- `incident_metrics`
- `eval_metrics`
- `artifact_metrics`

---

## Metrics Examples

### Task

- created count
- completed count
- failed count
- blocked count
- average duration
- retry count
- DLQ count

### Agent

- tasks handled
- failure rate
- handoff count
- average duration
- cost
- blocked actions

### Provider

- calls
- tokens
- cost
- failures
- fallback attempts
- policy blocks

### Batch

- submitted
- completed
- reconciled
- failed
- estimated savings

### Runtime

- `node-local` success or fail
- `macos-xcode` success or fail
- Xcode timeout count
- `provider-api` latency
- human approval wait time

### Quality

- gate pass rate
- gate fail rate
- evidence coverage
- eval pass rate

---

## Rules

- telemetry must not include raw secrets
- telemetry should aggregate sensitive data
- telemetry should link to traces and evidence
- cost telemetry supports budget guardrails
- eval telemetry supports agent quality improvement
- telemetry is not release evidence by itself

---

## Telemetry Use

Telemetry should later support:

- Command Center cost and runtime views
- safety and approval monitoring
- provider routing analysis
- quality regressions
- reliability trends
- batch savings analysis
- eval trend reporting

This phase defines the telemetry model, not a live exporter or external service.
