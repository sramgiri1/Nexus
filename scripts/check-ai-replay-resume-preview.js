import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  RECOVERY_ACTION_PREVIEW_STATES,
  buildReplayPlanPreview,
  validateReplayResumePreview,
} from "../ai-recovery/replayPlanBuilder.js";
import { buildResumePlanPreview } from "../ai-recovery/resumePlanBuilder.js";

const ROOT = process.cwd();
const FIXTURE_PATH = "ai-recovery/fixtures/replay-resume-fixtures.json";
const REPORT_PATH = "reports/ai-replay-resume-preview-report.md";

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
}

function containsRawPrivateId(value) {
  return /(?:project|private)_[A-Za-z0-9_-]{6,}/.test(JSON.stringify(value));
}

const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const fixtures = readJson(FIXTURE_PATH);
const replayPreviews = (fixtures.replay || []).map(buildReplayPlanPreview);
const resumePreviews = (fixtures.resume || []).map(buildResumePlanPreview);
const previews = [...replayPreviews, ...resumePreviews];

for (const state of ["blocked", "missing_context"]) {
  addCheck(`state covered ${state}`, previews.some((preview) => preview.state === state));
}

for (const preview of previews) {
  const validation = validateReplayResumePreview(preview);
  addCheck(`${preview.actionLabel} preview validates ${preview.actionPreviewId}`, validation.valid, validation.errors.join(", "));
  addCheck(`${preview.actionLabel} preview disables execution ${preview.actionPreviewId}`, preview.previewOnly === true && preview.executionEnabled === false);
  addCheck(`${preview.actionLabel} preview has required context ${preview.actionPreviewId}`, preview.requiredContext.length > 0);
  addCheck(`${preview.actionLabel} preview has disabled reason ${preview.actionPreviewId}`, preview.disabledReason.includes("disabled"));
  addCheck(`${preview.actionLabel} preview omits raw private ids ${preview.actionPreviewId}`, !containsRawPrivateId(preview));
}

for (const fixture of fixtures.replay || []) {
  const preview = replayPreviews.find((item) => item.actionPreviewId === fixture.actionPreviewId);
  addCheck(`replay expected state ${fixture.actionPreviewId}`, preview?.state === fixture.expectedState, `actual ${preview?.state}`);
}

for (const fixture of fixtures.resume || []) {
  const preview = resumePreviews.find((item) => item.actionPreviewId === fixture.actionPreviewId);
  addCheck(`resume expected state ${fixture.actionPreviewId}`, preview?.state === fixture.expectedState, `actual ${preview?.state}`);
}

addCheck("allowed states are preview-safe", RECOVERY_ACTION_PREVIEW_STATES.every((state) => state !== "enabled" && state !== "success"));
addCheck("no fake execution states", previews.every((preview) => !["enabled", "success", "executed"].includes(preview.state)));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Phase: P63.6",
        "- Replay and resume builders produce deterministic previews only.",
        "- No replay, restore, resume, provider dispatch, tool dispatch, worker execution, project mutation, DB write, schema migration, deploy, or queue mutation is enabled.",
      ].join("\n"),
    },
    {
      title: "Preview States",
      body: RECOVERY_ACTION_PREVIEW_STATES.map((state) => `- ${state}`).join("\n"),
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
        "- Reused P63 recovery preview vocabulary and checker/report patterns.",
        "- Kept replay/resume as deterministic dry-run style planning data.",
        "- Did not duplicate runtime dispatch, DB, phase-status, report writer, or redaction helpers.",
      ].join("\n"),
    },
    {
      title: "Result",
      body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)`,
    },
  ],
  {
    title: "AI Replay Resume Preview Report",
    phase: "P63.6",
  },
);

printCheckReport("AI Replay Resume Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");

if (failed.length > 0) process.exit(1);
