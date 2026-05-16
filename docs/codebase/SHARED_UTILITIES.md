# Shared Utilities

P56.8 introduces a shared utility foundation. These modules are available for
future phases, but old checkers and runtime modules are not broadly migrated in
this phase.

## `shared/resultEnvelope.js`

Purpose: standard result envelopes for pass/fail/blocked/skipped outcomes.

Exports: `createResultEnvelope`, `createPassResult`, `createFailResult`,
`createBlockedResult`, `createSkippedResult`, `validateResultEnvelope`,
`normalizeWarnings`, `normalizeErrors`.

Use it for new checkers and preview modules that need structured results. Do not
use it to hide detailed failures.

## `shared/reportMetadata.js`

Purpose: consistent report metadata with generated time, validation branch, and
validation HEAD wording.

Exports: `getGitBranch`, `getGitHead`, `getGeneratedAt`,
`createReportMetadata`, `formatReportMetadataMarkdown`.

Use it before writing new phase reports.

## `shared/reportWriter.js`

Purpose: standard markdown report assembly.

Exports: `writeMarkdownReport`, `buildCheckTable`, `buildWarningsSection`,
`buildLimitationsSection`, `ensureReportDir`.

Use it for new reports. Do not migrate every historical report without a scoped
refactor phase.

## `shared/modeGuard.js`

Purpose: normalize and evaluate `local-private`, `test`, `demo`, `public-safe`,
and `unknown` modes.

Exports: `getNexusMode`, `requireMode`, `isLocalPrivateMode`, `isTestMode`,
`isDemoMode`, `isPublicSafeMode`, `buildModeGuardResult`.

Use it for new guards. Do not replace safety-sensitive mode checks without tests.

## `shared/redaction.js`

Purpose: redact secret-like values and forbidden secret keys.

Exports: `redactValue`, `redactObject`, `containsSecretLikeValue`,
`containsForbiddenSecretKey`, `summarizeRedaction`.

Use it for new reports and previews. Do not replace local API redaction until a
dedicated safety refactor validates behavior.

## `shared/checkResultFormatter.js`

Purpose: standard checker console lines and pass/fail summaries.

Exports: `formatCheckLine`, `formatCheckSummary`, `countPassFail`,
`printCheckReport`, `normalizeCheckStatus`.

Use it in new checkers and opportunistic low-risk migrations.

## `os-roadmap/updatePhaseStatus.js`

Purpose: read, validate, update, and report OS phase status without rewriting
the phase registry by hand.

Exports: `loadPhaseStatus`, `updatePhaseStatus`, `markPhaseComplete`,
`markPhaseCurrent`, `markNextPhase`, `writePhaseStatus`,
`validatePhaseStatus`, `buildPhaseStatusReport`.

Use it for future phase status updates. Do not invent historical commit hashes.
