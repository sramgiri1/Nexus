# NEXUS CareLoop Backend Command Classification

## Metadata

- Generated at: 2026-05-08T09:32:33.889Z
- Mode: local-private
- Validation HEAD: (see git log)
- Note: Validation HEAD is the commit checked out when the report was generated.

## Summary

- Total commands classified: 9
- Safe to inspect: 0
- Safe to run later: 1
- Requires approval: 6
- Requires DB: 6
- Requires network: 0
- Requires dependency install: 9
- Blocked for now: 7

## Recommended First Execution

- Command: test
- Phase: P30
- Reason: Existing test script is the safest validation candidate; no DB or network requirement detected.

### Preconditions

- dependencies are installed or install is explicitly approved
- command allowlist permits npm test
- no DB/network requirement detected
- execution is run through controlled local execution path
- output is captured as evidence
- no project mutation

## Command Classifications

### dev

- Category: blocked_for_now
- Risk level: high
- Execution allowed now: false
- Mutation allowed: false
- Requires approval: true
- Requires DB: true
- Requires network: false
- Requires dependency install: true
- Recommended phase: later
- Reason: Starts server process; long-running and requires DB and full dependency stack.

### start

- Category: blocked_for_now
- Risk level: high
- Execution allowed now: false
- Mutation allowed: false
- Requires approval: true
- Requires DB: true
- Requires network: false
- Requires dependency install: true
- Recommended phase: later
- Reason: Starts runtime process; requires full dependency and DB stack.

### migrate

- Category: requires_db
- Risk level: critical
- Execution allowed now: false
- Mutation allowed: false
- Requires approval: true
- Requires DB: true
- Requires network: false
- Requires dependency install: true
- Recommended phase: later
- Reason: Database schema mutation risk; must never run without explicit DB readiness approval.

### generate

- Category: requires_dependency_install
- Risk level: medium
- Execution allowed now: false
- Mutation allowed: false
- Requires approval: false
- Requires DB: false
- Requires network: false
- Requires dependency install: true
- Recommended phase: P31
- Reason: Likely Prisma client generation; safe when dependencies are installed but must be verified first.

### studio

- Category: blocked_for_now
- Risk level: high
- Execution allowed now: false
- Mutation allowed: false
- Requires approval: true
- Requires DB: true
- Requires network: false
- Requires dependency install: true
- Recommended phase: later
- Reason: Starts local UI/server and accesses DB; blocked until DB readiness is approved.

### qa:reset

- Category: requires_db
- Risk level: critical
- Execution allowed now: false
- Mutation allowed: false
- Requires approval: true
- Requires DB: true
- Requires network: false
- Requires dependency install: true
- Recommended phase: later
- Reason: Likely destructive database reset operation; must never run without explicit approval.

### qa:seed:sprint1

- Category: requires_db
- Risk level: high
- Execution allowed now: false
- Mutation allowed: false
- Requires approval: true
- Requires DB: true
- Requires network: false
- Requires dependency install: true
- Recommended phase: later
- Reason: Writes seed data to DB; blocked until DB readiness and approval gate.

### test

- Category: safe_to_run_later
- Risk level: medium
- Execution allowed now: false
- Mutation allowed: false
- Requires approval: false
- Requires DB: false
- Requires network: false
- Requires dependency install: true
- Recommended phase: P30
- Reason: Safest validation candidate; no DB or network required. P30 must first verify dependency availability and command allowlist.

### test:watch

- Category: blocked_for_now
- Risk level: medium
- Execution allowed now: false
- Mutation allowed: false
- Requires approval: false
- Requires DB: false
- Requires network: false
- Requires dependency install: true
- Recommended phase: later
- Reason: Long-running watch mode; not suitable for governed single-run execution.

## Safety

- Commands executed: false
- Project mutation: false
- Provider calls: false
- Network calls: false
- DB access: false
- API server: false
- Dependency install: false
