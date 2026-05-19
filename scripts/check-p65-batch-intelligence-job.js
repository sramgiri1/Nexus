import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  createBatchIntelligenceJob,
  validateBatchIntelligenceJob,
} from "../batch-intelligence/batchIntelligenceJob.js";

const ROOT = process.cwd();
const FIXTURE_PATH = "batch-intelligence/fixtures/batch-intelligence-job-fixtures.json";
const REPORT_PATH = "reports/p65-batch-intelligence-job-report.md";
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
const jobs = fixtures.map((fixture) => ({ name: fixture.name, job: createBatchIntelligenceJob(fixture.input) }));
const validations = jobs.map((entry) => validateBatchIntelligenceJob(entry.job));

addCheck("fixture count", fixtures.length >= 1, `${fixtures.length} fixtures`);
addCheck("job validation", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck(
  "upload disabled",
  jobs.every((entry) =>
    entry.job.uploadAllowed === false &&
    entry.job.providerUploadAllowed === false &&
    entry.job.batchSubmissionAllowed === false &&
    entry.job.providerPollingAllowed === false &&
    entry.job.providerReconciliationAllowed === false
  ),
);
addCheck(
  "execution disabled",
  jobs.every((entry) =>
    entry.job.executionAllowed === false &&
    entry.job.providerDispatchAllowed === false &&
    entry.job.toolExecutionAllowed === false &&
    entry.job.codeExecutionAllowed === false &&
    entry.job.workerExecutionAllowed === false
  ),
);
addCheck(
  "mutation boundaries disabled",
  jobs.every((entry) =>
    entry.job.projectMutationAllowed === false &&
    entry.job.dbWritesAllowed === false &&
    entry.job.deployAllowed === false &&
    entry.job.externalNetworkAllowed === false
  ),
);
addCheck(
  "redaction applied",
  jobs.every((entry) => !JSON.stringify(entry.job).includes("sk-test-secret-value")),
);
addCheck(
  "cost preview only",
  jobs.every((entry) => entry.job.costEstimate?.executionAllowed === false && entry.job.costEstimate?.requestCount === entry.job.requestCount),
);
addCheck(
  "display safe labels",
  jobs.every((entry) => !JSON.stringify(entry.job.safeSummary).includes("projects/")),
);
const p652 = status.phases?.find((phase) => phase.phaseId === "P65.2");
addCheck("P65.2 phase status", p652?.status === "complete", p652?.status || "missing");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates preview-only batch intelligence job records.",
        "- Reuses API batch preview, cost estimate, and redaction helpers.",
        "- Does not enable provider upload, batch submission, provider polling, provider reconciliation, execution, DB writes, deploy, network calls, workers, or project mutation.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Jobs",
      body: jobs.map((entry) => `- ${entry.name}: state=${entry.job.state}; requests=${entry.job.requestCount}; uploadAllowed=${entry.job.uploadAllowed}`).join("\n"),
    },
    { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
    { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
  ],
  { title: "P65 Batch Intelligence Job Report", phase: "P65.2" },
);

printCheckReport("P65 Batch Intelligence Job Check", checks, failures.length === 0 ? "PASS" : "FAIL");
if (failures.length > 0) process.exit(1);
