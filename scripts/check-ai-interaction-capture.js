import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  CAPTURE_SOURCE_TYPES,
  buildInteractionCaptureMap,
  validateCaptureSource,
  validateInteractionCaptureMap,
} from "../ai-recovery/interactionCaptureMap.js";
import { adaptPreviewRecordToSnapshot } from "../ai-recovery/snapshotAdapter.js";

const ROOT = process.cwd();
const FIXTURE_PATH = "ai-recovery/fixtures/capture-map-fixtures.json";
const REPORT_PATH = "reports/ai-interaction-capture-report.md";

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
}

const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const sources = buildInteractionCaptureMap();
const fixtures = readJson(FIXTURE_PATH);
const fixtureRecords = fixtures.records || [];

const mapValidation = validateInteractionCaptureMap(sources);
addCheck("capture map validates", mapValidation.valid, mapValidation.errors.join(", "));

for (const source of sources) {
  const validation = validateCaptureSource(source);
  addCheck(`source ${source.sourceId} validates`, validation.valid, validation.errors.join(", "));
  addCheck(`source ${source.sourceId} has fixture`, fixtureRecords.some((record) => record.sourceId === source.sourceId));
  addCheck(`source ${source.sourceId} is preview only`, source.previewOnly === true && source.persistenceEnabled === false);
  addCheck(`source ${source.sourceId} has readable label`, !source.sourceLabel.includes("_") && source.sourceLabel.length > 3);
}

for (const type of CAPTURE_SOURCE_TYPES) {
  addCheck(`source type covered ${type}`, sources.some((source) => source.sourceType === type));
}

for (const fixture of fixtureRecords) {
  const result = adaptPreviewRecordToSnapshot(fixture);
  addCheck(`fixture adapts ${fixture.sourceId}`, result.ok, result.validation?.errors?.join(", "));
  addCheck(`fixture remains preview-only ${fixture.sourceId}`, result.previewOnly === true && result.persistenceEnabled === false && result.executionEnabled === false);
  addCheck(`fixture hides project/private ids ${fixture.sourceId}`, !JSON.stringify(result.display).includes("projectId") && !JSON.stringify(result.display).includes("private"));
}

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Phase: P63.2",
        "- Preview-only capture map and snapshot adapters.",
        "- No live capture wiring, persistence, provider dispatch, tool dispatch, project mutation, DB write, or deploy action is enabled.",
      ].join("\n"),
    },
    {
      title: "Capture Sources",
      body: sources
        .map((source) => `- ${source.sourceLabel}: ${source.ownerAgent} / ${source.ownerCapability}`)
        .join("\n"),
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
        "- Reused P63.1 snapshot contract and redaction policy.",
        "- Capture sources map existing command timeline, mission composer, worker queue, tool preview, approval, and activity preview shapes.",
        "- No timeline, activity, redaction, or report helper was duplicated.",
      ].join("\n"),
    },
    {
      title: "Result",
      body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)`,
    },
  ],
  {
    title: "AI Interaction Capture Report",
    phase: "P63.2",
  },
);

printCheckReport("AI Interaction Capture Check", checks, failed.length === 0 ? "PASS" : "FAIL");

if (failed.length > 0) process.exit(1);
