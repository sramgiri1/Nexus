import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { classifySelfHealingFailure, validateSelfHealingFailureClassification } from "../self-healing/failureClassification.js";
import { createRecoveryPlanPreview, validateRecoveryPlanPreview } from "../self-healing/recoveryPlanPreview.js";
import { evaluateHealingSafetyGate, validateHealingSafetyGate } from "../self-healing/healingSafetyGate.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p66-self-healing-final-report.md";
const REQUIRED_REPORTS = [
  "reports/p66-execution-plan-report.md",
  "reports/p66-failure-classification-report.md",
  "reports/p66-recovery-plan-preview-report.md",
  "reports/p66-healing-safety-gate-report.md",
  "reports/p66-command-center-self-healing-ux-report.md",
  "reports/command-center-ux-report.md",
];

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const sample = {
  failureId: "aggregate-preview",
  failureClass: "transient_failure",
  sourceSurface: "runtime",
  summary: "Aggregate preview validates the self-healing chain.",
  evidenceRefs: ["reports/p66-healing-safety-gate-report.md"],
  activityRefs: ["reports/os-phase-status-report.md"],
  approvalEvidencePresent: true,
  costApproved: true,
};

const classification = classifySelfHealingFailure(sample);
const plan = createRecoveryPlanPreview(sample);
const gate = evaluateHealingSafetyGate({ plan, approvalEvidencePresent: true, costApproved: true });
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((phase) => [phase.phaseId, phase]));

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

addCheck("required reports exist", REQUIRED_REPORTS.every((path) => existsSync(join(ROOT, path))), REQUIRED_REPORTS.join(", "));
addCheck("required reports pass", REQUIRED_REPORTS.every((path) => read(path).includes("PASS")));
addCheck("classification valid", validateSelfHealingFailureClassification(classification).valid);
addCheck("recovery plan valid", validateRecoveryPlanPreview(plan).valid);
addCheck("healing gate valid", validateHealingSafetyGate(gate).valid);
addCheck("execution disabled", [classification, plan, gate].every((item) => item.executionAllowed === false));
addCheck("mutation disabled", [classification, plan, gate].every((item) => item.mutationAllowed === false));
addCheck("automatic retry disabled", [classification, plan, gate].every((item) => item.automaticRetryAllowed === false));
addCheck("provider spend disabled", [classification, plan, gate].every((item) => item.providerSpendAllowed === false));
addCheck("db deploy disabled", gate.dbWriteAllowed === false && gate.deployAllowed === false);
addCheck("Command Center UX preserved", read("reports/command-center-ux-report.md").includes("PASS"));
addCheck(
  "P66 subphase status",
  ["P66.1", "P66.2", "P66.3", "P66.4", "P66.5", "P66.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete"),
);
addCheck("P66 next phase", statusById.get("P66")?.nextPhase === "P66.7", statusById.get("P66")?.nextPhase || "missing");
addCheck("roadmap pointer", status.currentPhase === "P66" && status.nextPhase === "P66.7", `${status.currentPhase}/${status.nextPhase}`);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P66.1 through P66.6 validation.",
        "- Confirms self-healing remains preview-only and non-executing.",
        "- Does not run providers, tools, workers, DB writes, deploy, network calls, or project mutation.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P66 Self-Healing Final Precheck Report", phase: "P66.6" },
);

printCheckReport("P66 Self-Healing Final Precheck", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
