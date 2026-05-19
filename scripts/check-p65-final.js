import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { createBatchIntelligenceJob, validateBatchIntelligenceJob } from "../batch-intelligence/batchIntelligenceJob.js";
import { buildWorkloadSelectionPreview, validateWorkloadSelectionPreview } from "../batch-intelligence/workloadSelectionPreview.js";
import { buildBatchIntelligenceSafetyGate, validateBatchIntelligenceSafetyGate } from "../batch-intelligence/batchSafetyGate.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p65-final-report.md";
const STATUS_PATH = "os-roadmap/phase-status.json";
const REQUIRED_REPORTS = [
  "reports/p65-execution-plan-report.md",
  "reports/p65-batch-intelligence-job-report.md",
  "reports/p65-workload-selection-report.md",
  "reports/p65-batch-safety-gate-report.md",
  "reports/p65-command-center-batch-intelligence-ux-report.md",
  "reports/p65-batch-intelligence-final-report.md",
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
  jobId: "p65_final_job_preview",
  requests: [{ inputSummary: "Final redacted P65 validation preview." }],
  evidenceRefs: [REPORT_PATH],
  activityRefs: ["reports/os-phase-status-report.md"],
});
const selection = buildWorkloadSelectionPreview({
  selectionId: "p65_final_selection_preview",
  jobId: "p65_final_selection_job",
  items: [{ itemLabel: "P65 final reports", summary: "Final redacted P65 validation preview.", sourceType: "report" }],
  evidenceRefs: [REPORT_PATH],
  activityRefs: ["reports/os-phase-status-report.md"],
});
const gate = buildBatchIntelligenceSafetyGate({
  gateId: "p65_final_safety_gate",
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
addCheck("P65 subphase status", ["P65.1", "P65.2", "P65.3", "P65.4", "P65.5", "P65.6", "P65.7"].every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("P65 parent status", phaseById.get("P65")?.status === "complete", phaseById.get("P65")?.status || "missing");
addCheck("handoff to P66", status.currentPhase === "P66" && status.previousPhase === "P65" && status.nextPhase === "P67", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("job valid", jobValidation.valid, jobValidation.errors.join("; "));
addCheck("selection valid", selectionValidation.valid, selectionValidation.errors.join("; "));
addCheck("gate valid", gateValidation.valid, gateValidation.errors.join("; "));
addCheck(
  "upload spend execution disabled",
  job.providerUploadAllowed === false &&
    selection.providerUploadAllowed === false &&
    gate.providerUploadAllowed === false &&
    gate.providerSpendAllowed === false &&
    gate.executionAllowed === false,
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
        "- Aggregates P65 final validation and closes the phase.",
        "- Batch intelligence remains preview-only.",
        "- Provider upload, batch submission, provider spend, execution, DB writes, deploy, network calls, workers, and project mutation remain disabled.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Known Limitations",
      body: [
        "- P65 does not enable real provider batch jobs.",
        "- P65 does not upload, submit, poll, reconcile, or execute provider batch workloads.",
        "- Future execution requires a later explicit phase and fresh validation.",
      ].join("\n"),
    },
    { title: "Failures", body: failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n") },
    { title: "Result", body: failures.length === 0 ? "PASS" : "FAIL" },
  ],
  { title: "P65 Final Validation Report", phase: "P65.7" },
);

printCheckReport("P65 Final Validation Check", checks, failures.length === 0 ? "PASS" : "FAIL");
if (failures.length > 0) process.exit(1);
