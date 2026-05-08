# Private Project Mode

## Overview

NEXUS operates in four modes: `public`, `demo`, `local-private`, and `test`.

Public and demo modes are safe for open sharing, CI pipelines, and presentations. They contain no
references to private project work.

Local-private mode allows NEXUS to operate on private project work — specifically the CareLoop iOS
and backend projects — within the local developer environment. Access is gated by an explicit
allowlist and purpose restrictions.

## Mode Definitions

| Mode | Description | Private Project Access |
|---|---|---|
| `public` | Open repo, safe for sharing | Denied |
| `demo` | Default; DemoApp-only surfaces | Denied |
| `local-private` | Local developer environment | Allowed via allowlist |
| `test` | Validation-only | Allowed via allowlist |

The default mode is `demo`. Unknown mode values fail closed to `demo`.

## Private Project Access Rules

In `local-private` mode, CareLoop and CareLoop iOS are accessible under the following
constraints:

- Access requires the project to be present in `policy/private-project-allowlist.json`.
- Allowed purposes in this phase: `inventory`, `read`.
- Denied purposes in this phase: `write`, `build`, `test`, `execute`, `mutate`, `deploy`.
- Blocked path segments: `.git`, `node_modules`, `.env`, `.env.local`, `config`.
- Blocked extensions: `.pem`, `.key`, `.p12`.
- Absolute paths and path traversal are always denied.

## Allowlist

The allowlist lives at `policy/private-project-allowlist.json`. Each entry declares:

- `projectId` — identifier used to look up access.
- `root` — the relative path from the repo root.
- `allowedModes` — which modes may access this project.
- `allowedPurposes` — what the accessor is allowed to do.
- `deniedPurposes` — explicitly denied actions.

Only projects listed in the allowlist can be accessed in `local-private` mode. Projects not on
the list (such as `shiftpay`) remain blocked regardless of mode.

## Modules

| Module | What it provides |
|---|---|
| `private-mode/privateMode.js` | Mode resolution helpers |
| `private-mode/privateProjectPolicy.js` | Allowlist loading and access validation |
| `private-mode/privateProjectScanner.js` | Top-level inventory scanning and leakage check |
| `private-mode/index.js` | Re-exports all exports |

## Policy Files

| File | Purpose |
|---|---|
| `policy/private-project-mode-policy.json` | Global mode policy: defaults, feature flags |
| `policy/private-project-allowlist.json` | Per-project access entries |

## What This Phase Does Not Allow

- No provider calls, LLM calls, or API requests.
- No database access or server startup.
- No CareLoop build, test, or execution.
- No modification of any CareLoop project files.
- No public exposure of CareLoop source content, architecture, or data.

## How Mode is Resolved

Mode is resolved from the environment variable `NEXUS_MODE`. The `getNexusMode(env)` function
accepts an env object or string and normalizes the value. Unknown or missing values default to
`demo`.

```javascript
import { getNexusMode, isLocalPrivateMode } from './private-mode/index.js';

const mode = getNexusMode(process.env);
if (isLocalPrivateMode(mode)) {
  // private access allowed
}
```

## P27, P28, and P29 Status

P27-LOCAL produced a readiness snapshot confirming CareLoop backend is `READY_FOR_VALIDATION`
and iOS is `READY_FOR_XCODE_INVENTORY`.

P28-LOCAL created the first governed CareLoop task through NEXUS — a SHEPHERD validation plan
for the CareLoop backend. No source mutation, build/test execution, or provider/network/DB
calls were made. Public/demo mode continues to block all private project access.

P29-LOCAL classified CareLoop backend package scripts by execution safety. The AUDITOR
`verification.code_quality_gate` task ran under `local-private` mode. No commands were
executed. `test` is the recommended first controlled validation command (P30).
