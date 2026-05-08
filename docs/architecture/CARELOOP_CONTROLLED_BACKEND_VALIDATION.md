# CARELOOP CONTROLLED BACKEND VALIDATION (P30-LOCAL)

## Overview

P30-LOCAL implements the first controlled execution of a backend validation
command through the NEXUS governed local execution path. The command `npm test`
runs inside `projects/careloop` under strict NEXUS governance: no mutation, no
dependency install, no provider/network/DB calls, with output captured,
redacted, and hashed.

## Files

```
command-execution/
├── commandAllowlist.js          ← Exact-match allowlist with blocked pattern check
├── commandPreflight.js          ← Script exists + deps + env check before run
├── controlledCommandRunner.js   ← spawnSync with minimal env + output redaction
└── index.js                     ← Re-exports all three

careloop-readiness/
└── careloopControlledValidation.js  ← Three-step: allowlist → preflight → execute

policy/
├── command-execution-allowlist.json        ← Approved commands (npm test only)
└── careloop-controlled-validation-policy.json  ← Execution flags + mode requirement

contracts/careloop/
└── backend-controlled-validation-contract.json  ← Generated task contract

reports/
├── careloop-backend-validation.json  ← Machine-readable execution record
└── careloop-backend-validation.md    ← Human-readable report with safety flags
```

## Execution Flow

```
runCareLoopBackendControlledValidation()
  │
  ├── 1. validateCommandAgainstAllowlist()   ← blocked patterns + exact match
  │       PASS → continue | BLOCKED → record + return
  │
  ├── 2. runCommandPreflight()               ← script, deps, env check
  │       PASS → continue | BLOCKED → record + return
  │
  └── 3. runControlledCommand()              ← spawnSync, minimal env, redact
          │
          ├── snapshot project tree before
          ├── run: npm test (cwd: projects/careloop)
          ├── redactCommandOutput()          ← strips keys/tokens/URLs
          ├── compare project tree after    ← mutation detection
          └── record: evidence + audit + runtime event
```

## Safety Model

| Constraint | Value |
|---|---|
| `mutationAllowed` | `false` |
| `dependencyInstallAllowed` | `false` |
| `buildExecutionAllowed` | `false` |
| `providerCallsAllowed` | `false` |
| `networkCallsAllowed` | `false` |
| `dbAccessAllowed` | `false` |
| `commandOutputCaptureAllowed` | `true` |
| `commandOutputRedactionRequired` | `true` |
| `testExecutionAllowed` | `true` |

The controlled runner passes only `{PATH, HOME, NODE_PATH, npm_config_cache, TMPDIR}` to the subprocess. Parent-process secrets (API keys, DATABASE_URL) are never inherited.

## Allowlist

`policy/command-execution-allowlist.json` permits exactly one command:

| Command | Args | Working directory | Phase |
|---|---|---|---|
| `npm` | `["test"]` | `projects/careloop` | P30 |

All other commands (`npm install`, `npm run dev`, `npm start`, `npm run migrate`, `npm run studio`, `npm run test:watch`) are explicitly blocked.

## Output Redaction

`redactCommandOutput()` strips patterns matching:
- API keys: `sk-[A-Za-z0-9]{32,}`
- Bearer tokens: `Bearer [A-Za-z0-9._-]{20,}`
- DATABASE_URL lines
- Private key blocks
- `ANTHROPIC_API_KEY=` lines
- `SECRET=` / `PASSWORD=` / `TOKEN=` variable assignments

Output is capped at 4000 chars per stream. A SHA-256 hash of the full output is stored for integrity verification.

## Exit Code Semantics

| Outcome | CLI exit code |
|---|---|
| Tests ran (PASS or FAIL) | `0` — legitimate test result |
| Governance/infra failure (blocked before execution) | `1` |

Test failure is a data point, not a script error. Only infra failures exit 1.

## Runtime Records

All runtime records use abstract IDs to satisfy the write-guard constraint:
- `projectId`: `private-project-01`
- Task records: `taskType: "controlled_validation"`
- All records include `redacted: true` and `classification: "confidential"`

## Command

```bash
NEXUS_MODE=local-private npm run careloop:backend-validate
npm run check:careloop-backend-validation
```

## P31 Status

P31-LOCAL investigated the one failing test (`GET /circles/:id/insights/completion`,
`totals.completed: 0 !== 2`) and identified a `date_window_boundary_bug` with
high confidence. A 1-line fix was applied: `new Date()` → `new Date(Date.now())`
in the completion insights route. All 58 tests now pass (`npm test` exit 0).

## P32 Follow-on

P32-LOCAL does not rerun tests from the dashboard. Instead, it exposes this
governed backend validation history through a generated local-private Command
Center snapshot so operators can review validation state, remediation status,
and redacted runtime records without adding API, DB, or UI mutation.

## Phase

P31-LOCAL on branch `arch/careloop-completion-insights-remediation`.
