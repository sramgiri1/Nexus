import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { createBatchIntelligenceJob, validateBatchIntelligenceJob } from "../batch-intelligence/batchIntelligenceJob.js";
import { buildWorkloadSelectionPreview, validateWorkloadSelectionPreview } from "../batch-intelligence/workloadSelectionPreview.js";
import { buildBatchIntelligenceSafetyGate, validateBatchIntelligenceSafetyGate } from "../batch-intelligence/batchSafetyGate.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p65-batch-intelligence-final-report.md";
const STATUS_PATH = "os-roadmap/phase-status.json";
const REQUIRED_REPORTS = [
  "reports/p65-execution-plan-report.md",
  "reports/p65-batch-intelligence-job-report.md",
  "reports/p65-workload-selection-report.md",
  "reports/p65-batch-safety-gate-report.md",
  "reports/p65-command-center-batch-intelligence-ux-report.md",
];

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function hasPassResult(relativePath) {
  const body = read(relativePath);
  return body.includes("## Result") && body.includes("PASS");
}

const checks = [];
const failures = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
  if (!passed) failures.push(`${name}${details ? `: ${details}` : ""}`);
}

const status = readJson(STATUS_PATH);
const phaseById = new Map((status.phases || []).map((phase) => [phase.phaseId, phase]));
const job = createBatchIntelligenceJob({
  jobId: "p65_aggregate_job_preview",
  workloadType: "test_gap_analysis",
  requests: [{ inputSummary: "Aggregate redacted P65 report validation." }],
  evidenceRefs: [REPORT_PATH],
  activityRefs: ["reports/os-phase-status-report.md"],
});
const selection = buildWorkloadSelectionPreview({
  selectionId: "p65_aggregate_selection_preview",
  jobId: "p65_aggregate_selection_job",
  items: [{ itemLabel: "P65 reports", summary: "Aggregate redacted P65 report validation.", sourceType: "report" }],
  evidenceRefs: [REPORT_PATH],
  activityRefs: ["reports/os-phase-status-report.md"],
});
const gate = buildBatchIntelligenceSafetyGate({
  gateId: "p65_aggregate_safety_gate",
  redactionEvidencePresent: true,
  dataClassification: "internal",
  selection,
  evidenceRefs: [REPORT_PATH],
  activityRefs: ["reports/os-phase-status-report.md"],
});

const jobValidation = validateBatchIntelligenceJob(job);
const selectionValidation = validateWorkloadSelectionPreview(selection);
const gateValidation = validateBatchIntelligenceSafetyGate(gate);

addCheck("required reports exist", REQUIRED_REPORTS.every((report) => existsSync(join(ROOT, report))), REQUIRED_REPORTS.filter((report) => !existsSync(join(ROOT, report))).join(", "));
addCheck("required reports pass", REQUIRED_REPORTS.every(hasPassResult), REQUIRED_REPORTS.filter((report) => !hasPassResult(report)).join(", "));
addCheck("P65.1-P65.6 status", ["P65.1", "P65.2", "P65.3", "P65.4", "P65.5", "P65.6"].every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("job valid", jobValidation.valid, jobValidation.errors.join("; "));
addCheck("selection valid", selectionValidation.valid, selectionValidation.errors.join("; "));
addCheck("gate valid", gateValidation.valid, gateValidation.errors.join("; "));
addCheck(
  "upload disabled",
  job.providerUploadAllowed === false &&
    selection.providerUploadAllowed === false &&
    gate.providerUploadAllowed === false &&
    gate.batchSubmissionAllowed === false,
);
addCheck(
  "execution disabled",
  job.executionAllowed === false &&
    selection.executionAllowed === false &&
    gate.executionAllowed === false &&
    gate.workerExecutionAllowed === false,
);
addCheck(
  "mutation boundaries disabled",
  job.projectMutationAllowed === false &&
    selection.projectMutationAllowed === false &&
    gate.projectMutationAllowed === false &&
    gate.dbWritesAllowed === false &&
    gate.deployAllowed === false &&
    gate.externalNetworkAllowed === false,
);
addCheck("Command Center UX preserved", hasPassResult("reports/p65-command-center-batch-intelligence-ux-report.md"));

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P65 batch intelligence checks through P65.5.",
        "- Provider upload, batch submission, provider spend, execution, DB writes, deploy, network calls, workers, and project mutation remain disabled.",
        "- Command Center surfaces remain display-only.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Known Limitations",
      body: [
        "- P65.6 does not close P65.",
        "- P65 does not enable real provider batch jobs.",
        "- Final validation is still required before parent P65 closure.",
      ].join("\n"),
    },
    { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
    { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
  ],
  { title: "P65 Batch Intelligence Final Report", phase: "P65.6" },
);

printCheckReport("P65 Batch Intelligence Final Check", checks, failures.length === 0 ? "PASS" : "FAIL");
if (failures.length > 0) process.exit(1);
