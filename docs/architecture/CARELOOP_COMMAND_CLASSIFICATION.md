# CareLoop Backend Command Classification

## Purpose

P29-LOCAL classifies CareLoop backend package scripts by execution safety, producing
a machine-readable command classification report and a recommended first controlled
validation command for P30.

No commands are executed in this phase.

## Why Classification Follows Validation Planning

P28-LOCAL (CareLoop First Governed Validation Task) produced a SHEPHERD validation plan
with a list of safe-next-checks. The plan's first check was a backend package script
review. P29 implements that review by classifying each discovered script before any
controlled execution is attempted.

Classification decouples inspection from execution. NEXUS can reason about which
commands are safe, when they require approval, and what preconditions must be met —
all without running anything.

## What This Phase Does Not Do

- No command execution.
- No npm install, npm test, or npm run of any kind.
- No Prisma commands.
- No server startup.
- No DB access.
- No provider, network, or API calls.
- No source file mutation.
- No reading of .env or secret files.
- No extraction of source code contents.

## Classification Categories

| Category | Description |
| --- | --- |
| `safe_to_run_later` | No DB or network required; safe candidate for controlled execution |
| `requires_dependency_install` | Safe in principle but needs dependency verification first |
| `requires_approval` | Must have explicit human or NEXUS approval before running |
| `requires_db` | Needs active database connection; blocked until DB readiness gate |
| `requires_network` | Needs outbound network access; blocked until network policy approval |
| `blocked_for_now` | Server-starting, long-running, or destructive; not yet eligible |
| `safe_to_inspect` | Unknown script with no high-risk name pattern |

## Risk Levels

| Level | Description |
| --- | --- |
| `low` | Classification-only; no execution risk |
| `medium` | Safe to inspect or run later with dependency verification |
| `high` | Server or long-running process; blocked until readiness gate |
| `critical` | Database mutation or destructive reset; requires explicit approval |

## Classification Results

| Script | Category | Risk | Recommended Phase |
| --- | --- | --- | --- |
| `dev` | blocked\_for\_now | high | later |
| `start` | blocked\_for\_now | high | later |
| `migrate` | requires\_db | critical | later |
| `generate` | requires\_dependency\_install | medium | P31 |
| `studio` | blocked\_for\_now | high | later |
| `qa:reset` | requires\_db | critical | later |
| `qa:seed:sprint1` | requires\_db | high | later |
| `test` | safe\_to\_run\_later | medium | P30 |
| `test:watch` | blocked\_for\_now | medium | later |

## How Recommended First Execution Is Selected

`recommendFirstControlledValidationCommand()` selects the safest candidate in this order:

1. `test` — if present and not classified as DB/network dependent.
2. `generate` — if clearly non-destructive and dependency readiness is known.
3. `package-script-review` — fallback if no safe candidate exists.

The selected command for P30 is `test`. Preconditions before P30 execution:

- dependencies are installed or install is explicitly approved
- command allowlist permits npm test
- no DB or network requirement detected
- execution is run through controlled local execution path
- output is captured as evidence
- no project mutation

## Local Task and Evidence Records

P29-LOCAL routes classification through the governed local path:

- local task record: `taskType: "command_classification"`, `state: "implementation_done"`
- evidence: `type: "careloop_backend_command_classification"`, `redacted: true`
- audit event: `eventType: "careloop_command_classification_completed"`, `redacted: true`
- runtime event: `eventType: "governed_command_classification_completed"`, `redacted: true`

All records use abstract IDs (`private-project-01`) to satisfy write guards.

## Reports and Contract

| File | Description |
| --- | --- |
| `reports/careloop-command-classification.json` | Machine-readable classification with commands, summary, recommendation |
| `reports/careloop-command-classification.md` | Human-readable classification summary |
| `contracts/careloop/backend-command-classification-contract.json` | AUDITOR task contract |

## Next Phase

P30-LOCAL: Controlled backend validation execution. The `test` script is the
recommended first command. P30 must first verify dependency availability and
confirm the command is in the NEXUS command allowlist before executing through
the controlled local execution path.

## Public and Demo Surfaces

Public and demo mode surfaces remain DemoApp-only. Private project names do not
appear in public surfaces. All private project references in docs use
"private project" language.
