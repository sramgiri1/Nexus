# Public / Private Mode Boundary

## Purpose

NEXUS contains two classes of content:

1. **Public / demo content** — DemoApp project data, demo contracts, demo reports, dashboard
   surfaces, architecture documentation, README. Safe to share openly and commit to a public repo.

2. **Private / local content** — CareLoop iOS and backend projects, private memory state,
   private sprint history. Lives only in the local developer environment and must never appear in
   public-facing surfaces.

This document defines the strict boundary between the two.

## Public Surface Boundary

The following file types and directories are public surfaces. They must never contain private
project names, project paths, private API keys, database URLs, email addresses, or personal data:

- `README.md`
- `docs/demo-walkthrough.md`, `docs/safety-model.md`, `docs/use-cases.md`, `docs/roadmap.md`
- `docs/PUBLIC_REPO_BOUNDARY.md`
- `docs/architecture/DEMO_SHOWCASE_MODE.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `docs/architecture/AGENTIC_OS_ARCHITECTURE.md`
- `demo/` — all files
- `dashboard/src/` — all files
- `dashboard/tests/` — all files

The scanner at `private-mode/privateProjectScanner.js` enforces this via
`validateNoPrivateLeakageInPublicMode()`, which checks the above files for private project name
patterns at script runtime.

## Private Boundary

The following are private and must not be published, demo'd, or exposed in public surfaces:

- `projects/careloop/` — CareLoop backend source
- `projects/careloop-ios/` — CareLoop iOS source
- Private sprint history, CareLoop memory state, and local-only reports
- Any file that references CareLoop by name in a public surface context

## Exception Files

The following files may reference private project names in the context of describing the boundary
itself. They are not public surfaces:

- `docs/architecture/PRIVATE_PROJECT_MODE.md` (this file)
- `docs/architecture/PUBLIC_PRIVATE_MODE_BOUNDARY.md` (this file)
- `docs/architecture/COMMAND_CENTER_PRIVATE_PROJECT_VIEW.md`
- `private-mode/` — all modules
- `policy/private-project-mode-policy.json`
- `policy/private-project-allowlist.json`
- `policy/command-center-private-validation-policy.json`
- `scripts/check-private-project-mode.js`
- `scripts/generate-private-validation-snapshot.js`
- `scripts/check-command-center-private-validation.js`
- `reports/private-project-mode-report.md`
- `reports/private-validation-snapshot.json`
- `reports/command-center-private-validation-report.md`
- `docs/PRIVATE_PROJECT_BOUNDARY.md`

## Enforcement

| Guard | What it does |
|---|---|
| `check:public-safety` | Scans public surfaces for banned project terms, secrets, private data |
| `check:private-project-mode` | Validates private boundary modules, policies, access rules, leakage scan |
| `validateNoPrivateLeakageInPublicMode()` | Runtime function that errors if private names appear in public surface files |

## Mode Segregation Rule

- `public` and `demo` modes: private project access is always denied, regardless of allowlist.
- `local-private` mode: private project access is allowed only for allowlisted projects/paths/purposes.
- `public` and `demo` modes must always be default-safe and produce no private output.

## When to Run These Checks

Run `npm run check:public-safety` before any commit that touches public surfaces, README, docs,
dashboard, or demo artifacts.

Run `npm run check:private-project-mode` after any changes to private-mode modules, policies, or
the private boundary documentation.

Both checks must pass before committing work that touches either surface.

When private-branch validation regenerates `reports/public-safety-report.md`,
restore the committed public-safe baseline before guarded-task checks if the
report metadata leaks private branch names. This is a validation hygiene step,
not a relaxation of the public boundary.
