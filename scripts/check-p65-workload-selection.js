import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildWorkloadSelectionPreview,
  validateWorkloadSelectionPreview,
} from "../batch-intelligence/workloadSelectionPreview.js";

const ROOT = process.cwd();
const FIXTURE_PATH = "batch-intelligence/fixtures/workload-selection-fixtures.json";
const REPORT_PATH = "reports/p65-workload-selection-report.md";
const STATUS_PATH = "os-roadmap/phase-status.json";

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const checks = [];
const failures = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
  if (!passed) failures.push(`${name}${details ? `: ${details}` : ""}`);
}

const fixtures = readJson(FIXTURE_PATH).fixtures || [];
const status = readJson(STATUS_PATH);
const selections = fixtures.map((fixture) => ({ name: fixture.name, selection: buildWorkloadSelectionPreview(fixture.input) }));
const validations = selections.map((entry) => validateWorkloadSelectionPreview(entry.selection));

addCheck("fixture count", fixtures.length >= 1, `${fixtures.length} fixtures`);
addCheck("selection validation", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck(
  "redaction applied",
  selections.every((entry) => entry.selection.redactionApplied === true && !JSON.stringify(entry.selection).includes("sk-redacted-test-token")),
);
addCheck(
  "project source not read",
  selections.every((entry) =>
    entry.selection.projectSourceReadAllowed === false &&
    entry.selection.selectedItems.every((item) => item.rawSourcePathStored === false)
  ),
);
addCheck(
  "upload and execution disabled",
  selections.every((entry) =>
    entry.selection.uploadAllowed === false &&
    entry.selection.providerUploadAllowed === false &&
    entry.selection.batchSubmissionAllowed === false &&
    entry.selection.executionAllowed === false &&
    entry.selection.workerExecutionAllowed === false
  ),
);
addCheck(
  "mutation boundaries disabled",
  selections.every((entry) =>
    entry.selection.projectMutationAllowed === false &&
    entry.selection.dbWritesAllowed === false &&
    entry.selection.deployAllowed === false &&
    entry.selection.externalNetworkAllowed === false
  ),
);
addCheck(
  "batch job linked",
  selections.every((entry) => entry.selection.batchJob?.phaseId === "P65.2" && entry.selection.batchJob?.requestCount === entry.selection.itemCount),
);
addCheck(
  "display safe labels",
  selections.every((entry) => !JSON.stringify(entry.selection.safeSummary).includes("projects/")),
);
const p653 = status.phases?.find((phase) => phase.phaseId === "P65.3");
addCheck("P65.3 phase status", p653?.status === "complete", p653?.status || "missing");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates redacted workload selection previews for batch intelligence.",
        "- Uses caller-provided summaries only; project source files are not read.",
        "- Provider upload, batch submission, execution, DB writes, deploy, network calls, workers, and project mutation remain disabled.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Selections",
      body: selections.map((entry) => `- ${entry.name}: state=${entry.selection.state}; items=${entry.selection.itemCount}; uploadAllowed=${entry.selection.uploadAllowed}`).join("\n"),
    },
    { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
    { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
  ],
  { title: "P65 Workload Selection Report", phase: "P65.3" },
);

printCheckReport("P65 Workload Selection Check", checks, failures.length === 0 ? "PASS" : "FAIL");
if (failures.length > 0) process.exit(1);
