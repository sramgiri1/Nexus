import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  SNAPSHOT_RETENTION_CLASSES,
  SNAPSHOT_RETENTION_POLICY,
  validateSnapshotRetentionPolicy,
} from "../ai-recovery/retentionPolicy.js";
import {
  buildSnapshotStoreFixtureInputs,
  buildSnapshotStorePreview,
  validateSnapshotStoreRecord,
  validateSnapshotStoreSource,
} from "../ai-recovery/snapshotStore.js";

const ROOT = process.cwd();
const FIXTURE_PATH = "ai-recovery/fixtures/snapshot-store-fixtures.json";
const README_PATH = "memory/runtime/README.md";
const REPORT_PATH = "reports/ai-snapshot-store-report.md";

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
}

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function containsRawPrivateId(value) {
  return /(?:project|private)_[A-Za-z0-9_-]{6,}/.test(JSON.stringify(value));
}

const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const fixtures = readJson(FIXTURE_PATH);
const inputs = buildSnapshotStoreFixtureInputs(fixtures);
const preview = buildSnapshotStorePreview(inputs, { now: fixtures.prunePreviewNow });
const retentionValidation = validateSnapshotRetentionPolicy(SNAPSHOT_RETENTION_POLICY);

addCheck("retention policy validates", retentionValidation.valid, retentionValidation.errors.join(", "));
addCheck("retention policy preview only", SNAPSHOT_RETENTION_POLICY.previewOnly === true);
addCheck("retention policy disables DB writes", SNAPSHOT_RETENTION_POLICY.durableDbWritesEnabled === false);
addCheck("retention policy disables delete/export", SNAPSHOT_RETENTION_POLICY.deleteEnabled === false && SNAPSHOT_RETENTION_POLICY.exportEnabled === false);

for (const retentionClass of SNAPSHOT_RETENTION_CLASSES) {
  addCheck(`retention class covered ${retentionClass}`, inputs.some((input) => input.retentionClass === retentionClass));
}

for (let index = 0; index < inputs.length; index += 1) {
  const input = inputs[index];
  const sourceValidation = validateSnapshotStoreSource(input);
  const record = preview.records[index];
  const recordValidation = validateSnapshotStoreRecord(record);

  addCheck(`source validates ${input.retentionClass}`, sourceValidation.valid, [
    ...sourceValidation.snapshotValidation.errors,
    ...sourceValidation.recoveryValidation.errors,
  ].join(", "));
  addCheck(`store record validates ${input.retentionClass}`, recordValidation.valid, recordValidation.errors.join(", "));
  addCheck(`store record is preview-only ${input.retentionClass}`, record.previewOnly === true && record.durableDbWritesEnabled === false);
  addCheck(`recovery actions disabled ${input.retentionClass}`, record.executionEnabled === false && record.restoreEnabled === false && record.replayEnabled === false && record.resumeEnabled === false);
  addCheck(`primary display omits raw private ids ${input.retentionClass}`, !containsRawPrivateId(record.displayTitle) && !containsRawPrivateId(preview.display[index]));
}

addCheck("store preview validates", preview.validation.valid);
addCheck("store preview disables writes", preview.previewOnly === true && preview.durableDbWritesEnabled === false);
addCheck("prune preview is dry-run", preview.prunePreview.previewOnly === true && preview.prunePreview.dryRun === true);
addCheck("prune preview disables deletion", preview.prunePreview.deleteEnabled === false);
addCheck("prune preview finds expired fixture", preview.prunePreview.pruneCandidates.length >= 1);
addCheck("display data is UX-safe", preview.display.every((item) => (
  item.title
  && item.timestamp
  && item.scope
  && item.redaction
  && item.retention
  && item.recoveryPosture
  && item.disabledReason
  && !containsRawPrivateId(item)
)));

const runtimeReadme = readText(README_PATH);
addCheck("runtime README documents P63.4 boundary", runtimeReadme.includes("P63.4") && runtimeReadme.includes("preview-only"));
addCheck("runtime README rejects DB persistence", runtimeReadme.includes("No DB writes"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Phase: P63.4",
        "- Snapshot store and retention behavior are preview-only.",
        "- No provider dispatch, tool dispatch, project mutation, worker execution, DB write, schema migration, deploy, restore, replay, resume, delete, or export behavior is enabled.",
      ].join("\n"),
    },
    {
      title: "Retention Classes",
      body: SNAPSHOT_RETENTION_CLASSES.map((retentionClass) => {
        const policy = SNAPSHOT_RETENTION_POLICY.classes[retentionClass];
        return `- ${retentionClass}: ${policy.label}, ${policy.days} days`;
      }).join("\n"),
    },
    {
      title: "Preview Data Shape",
      body: [
        "- `storeRecordId`, `snapshotId`, `recoveryPointId`, `displayTitle`, `createdAt`, `expiresAt`, `retentionClass`, `redactionLevel`, `prunePreview`",
        "- Command Center display fields: title, timestamp, scope, redaction, retention, recovery posture, next action, disabled reason.",
      ].join("\n"),
    },
    {
      title: "Checks",
      body: buildCheckTable(checks),
    },
    {
      title: "Failures",
      body: failed.length === 0 ? "- None" : failed.map((check) => `- ${check.name}: ${check.details}`).join("\n"),
    },
    {
      title: "Reuse",
      body: [
        "- Reused P63 snapshot validation and recovery point validation modules.",
        "- Reused shared report writer and check result formatter.",
        "- Did not duplicate report writers, redaction helpers, phase-status updaters, mode guards, or result envelopes.",
      ].join("\n"),
    },
    {
      title: "Result",
      body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)`,
    },
  ],
  {
    title: "AI Snapshot Store Report",
    phase: "P63.4",
  },
);

printCheckReport("AI Snapshot Store Check", checks, failed.length === 0 ? "PASS" : "FAIL");

if (failed.length > 0) process.exit(1);
