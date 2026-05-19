import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { classifySelfHealingFailure } from "../self-healing/failureClassification.js";
import { createRecoveryPlanPreview } from "../self-healing/recoveryPlanPreview.js";
import { evaluateHealingSafetyGate } from "../self-healing/healingSafetyGate.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p66-final-report.md";
const REQUIRED_REPORTS = [
  "reports/p66-execution-plan-report.md",
  "reports/p66-self-healing-final-report.md",
  "reports/p66-command-center-self-healing-ux-report.md",
  "reports/p66-healing-safety-gate-report.md",
  "reports/p66-recovery-plan-preview-report.md",
  "reports/p66-failure-classification-report.md",
  "reports/command-center-ux-report.md",
];

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((phase) => [phase.phaseId, phase]));
const sample = {
  failureId: "p66-final-preview",
  failureClass: "transient_failure",
  sourceSurface: "runtime",
  summary: "Final P66 validation preview.",
  evidenceRefs: ["reports/p66-final-report.md"],
  activityRefs: ["reports/os-phase-status-report.md"],
};
const classification = classifySelfHealingFailure(sample);
const plan = createRecoveryPlanPreview(sample);
const gate = evaluateHealingSafetyGate({ plan, approvalEvidencePresent: true, costApproved: true });

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

addCheck("required reports exist", REQUIRED_REPORTS.every((path) => existsSync(join(ROOT, path))), `${REQUIRED_REPORTS.length} reports`);
addCheck("required reports pass", REQUIRED_REPORTS.every((path) => read(path).includes("PASS")));
addCheck("P66 subphase status", ["P66.1", "P66.2", "P66.3", "P66.4", "P66.5", "P66.6", "P66.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("P66 parent status", statusById.get("P66")?.status === "complete", statusById.get("P66")?.status || "missing");
addCheck("handoff to P67", status.currentPhase === "P67" && status.previousPhase === "P66" && status.nextPhase === "P68", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("classification preview valid", classification.executionAllowed === false && classification.mutationAllowed === false);
addCheck("recovery plan preview valid", plan.executionAllowed === false && plan.automaticRetryAllowed === false);
addCheck("healing gate preview valid", gate.executionAllowed === false && gate.dbWriteAllowed === false && gate.deployAllowed === false);
addCheck("provider spend disabled", [classification, plan, gate].every((item) => item.providerSpendAllowed === false));
addCheck("Command Center UX preserved", read("reports/command-center-ux-report.md").includes("PASS"));
addCheck("Recovery UX visible", read("dashboard/src/utils/recoveryPreview.js").includes("Self-Healing Failure Loop"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P66 Self-Healing Failure Loop.",
        "- Confirms self-healing is governed preview-only.",
        "- Does not enable recovery execution, automatic retry, provider/tool execution, or provider spend.",
        "- Source mutation, project mutation, DB writes, deploy, release, and network calls remain disabled.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P66 Final Validation Report", phase: "P66.7" },
);

printCheckReport("P66 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
