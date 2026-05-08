# CARELOOP TEST FAILURE REMEDIATION (P31-LOCAL)

## Purpose

P31-LOCAL follows directly from P30-LOCAL's controlled backend validation, which
revealed one failing test:

```
GET /circles/:id/insights/completion
AssertionError: 0 !== 2  (sprint2.test.js:1888)
```

P31 investigates the root cause, produces a machine-readable remediation plan,
and — if root cause confidence is high and scope is narrow — applies a single
patch and re-validates through the same NEXUS governed execution path.

## Why This Phase Follows Controlled Validation

P30 ran `npm test` for the first time through the NEXUS governed local path.
The output proved the governance machinery works: command allowlist, preflight,
`spawnSync` with minimal env, output capture, redaction, mutation detection.
P30 does not fix bugs — that is P31's responsibility.

## Failing Endpoint and Test

| Field | Value |
|---|---|
| Route | `GET /circles/:id/insights/completion` |
| Test file | `projects/careloop/test/sprint2.test.js` |
| Test line | 1888 |
| Expected | `totals.completed === 2` |
| Actual | `totals.completed === 0` |

## Root Cause

**Category:** `date_window_boundary_bug`
**Confidence:** high

The completion insights route computed `now` via `new Date()` (line ~129 in
`src/routes/circles.js`). Node.js's `new Date()` uses the V8 internal clock —
it is **not** affected by monkey-patching `Date.now`. The test sets:

```javascript
Date.now = () => new Date("2026-04-29T18:00:00.000Z").getTime();
```

The route then computed a `since` window as ~7 days before real system time
(~2026-05-08), placing both completed tasks (2026-04-28, 2026-04-29) outside
the filter window. Result: 0 completed tasks returned.

**Fix (1 line):**
```
- const now = new Date();
+ const now = new Date(Date.now());
```

`new Date(Date.now())` calls the mockable static method, so the test's
`Date.now` override takes effect and the window is anchored to April 2026.

## Investigation Scope

P31 reads only:
- `projects/careloop/test/sprint2.test.js` (failing test context)
- `projects/careloop/src/routes/circles.js` (route handler and query)

P31 does not:
- read `.env`
- read `node_modules`
- access DB directly
- call network or providers
- run migrations or seeds
- start server

## Root-Cause Categories

The classifier can assign one of:

| Category | Meaning |
|---|---|
| `implementation_missing_completion_query` | Route not implemented |
| `wrong_date_field_filter` | Wrong DB field in date filter |
| `wrong_status_filter` | Wrong status enum |
| `wrong_circle_scope_filter` | Circle scoping bug |
| `wrong_member_scope_filter` | Member/admin scoping bug |
| `admin_authorization_scope_bug` | Auth check wrong |
| `date_window_boundary_bug` | Time source not mockable ← **P31 result** |
| `test_data_setup_bug` | Test data missing |
| `response_shape_mapping_bug` | Wrong response field |
| `test_isolation_or_seed_bug` | Test pollution |
| `unknown_needs_manual_review` | Cannot determine automatically |

## Plan-Only Default

By default, `npm run careloop:analyze-test-failure` runs in plan-only mode:
analysis is performed, reports are written, but no source files are modified.

To apply a fix (only if `safeToApplyFixNow: true`):
```bash
NEXUS_MODE=local-private node scripts/careloop-analyze-test-failure.js --apply-narrow-fix
```

## Narrow Fix Rules

P31 may patch source only if:
- `confidence === "high"`
- affected files limited to `projects/careloop/src/` or `projects/careloop/test/`
- no schema changes, no dependency changes, no migration
- no server startup, no provider/network/DB calls
- patch is a minimal diff (single expression change)

## Evidence, Audit, and Runtime Records

All records use abstract IDs to satisfy the write-guard constraint:
- `projectId`: `private-project-01`
- Task records: `taskType: "test_failure_remediation"`
- All records include `redacted: true` and `classification: "confidential"`

## If Fixed and Tests Pass

`npm test` exits 0 through `careloop:backend-validate`. All 58 tests pass.
`check:careloop-backend-validation` shows `Execution: PASS`.
Next phase: Command Center private project validation view integration.

## If Not Fixed

Analysis report documents root cause and why fix was not applied. Next step
is a second remediation pass or manual review. The NEXUS governance trace
(evidence, audit, runtime events) remains intact regardless of outcome.

## If Dependencies or Preflight Block

If `npm test` itself requires missing dependencies or DB, preflight blocks the
execution cleanly. A dependency readiness planning phase would precede re-try.

## Commands

```bash
NEXUS_MODE=local-private npm run careloop:analyze-test-failure
npm run check:careloop-test-remediation
NEXUS_MODE=local-private node scripts/careloop-analyze-test-failure.js --apply-narrow-fix
NEXUS_MODE=local-private npm run careloop:backend-validate
npm run check:careloop-backend-validation
```

## Phase

P31-LOCAL on branch `arch/careloop-completion-insights-remediation`.
