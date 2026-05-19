import {
  P70_4_REQUIRED_FIELDS,
  P70_4_SAMPLE_GATES,
  buildMitigationReadinessGateEnvelope,
  createMitigationReadinessGate,
  validateMitigationReadinessGate,
} from "../deploy-monitoring/p70-4-placeholder.js";
import { createIncidentSignalPreview } from "../deploy-monitoring/p70-3-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p704-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedGate = createMitigationReadinessGate({
  signal: createIncidentSignalPreview({
    allowedFiles: ["deploy-monitoring/p70-4-placeholder.js"],
    evidenceRefs: ["reports/p704-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P70.4"],
  }),
});
const gates = [...P70_4_SAMPLE_GATES, generatedGate];
const validations = gates.map((gate) => validateMitigationReadinessGate(gate));
const envelope = buildMitigationReadinessGateEnvelope({
  allowedFiles: ["deploy-monitoring/p70-4-placeholder.js"],
  evidenceRefs: ["reports/p704-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P70.4"],
});

addCheck("required fields listed", P70_4_REQUIRED_FIELDS.length >= 32, `${P70_4_REQUIRED_FIELDS.length} fields`);
addCheck("gates validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("approval required", gates.every((gate) => gate.approvalRequired === true && gate.approvalState === "not_requested"));
addCheck("validation rollback evidence ready", gates.every((gate) => gate.validationReady === true && gate.rollbackReady === true && gate.evidenceReady === true));
addCheck("cost reviewed", gates.every((gate) => gate.costReviewed === true));
addCheck("mitigation disabled", gates.every((gate) => gate.mitigationAllowed === false));
addCheck("rollback alert disabled", gates.every((gate) => gate.rollbackExecutionAllowed === false && gate.alertDispatchAllowed === false));
addCheck("deploy incident disabled", gates.every((gate) => gate.deployExecutionAllowed === false && gate.incidentExecutionAllowed === false));
addCheck("project mutation disabled", gates.every((gate) => gate.projectMutationAllowed === false));
addCheck("provider/tool/worker disabled", gates.every((gate) => gate.providerDispatchAllowed === false && gate.toolExecutionAllowed === false && gate.workerExecutionAllowed === false));
addCheck("db/network/spend disabled", gates.every((gate) => gate.dbWritesAllowed === false && gate.networkCallsAllowed === false && gate.providerSpendAllowed === false));
addCheck("blockers visible", gates.every((gate) => gate.blockers.length >= 4));
addCheck("required evidence visible", gates.every((gate) => gate.requiredEvidence.length >= 6));
addCheck("evidence and activity visible", gates.every((gate) => gate.evidenceRefs.length > 0 && gate.activityRefs.length > 0));
addCheck("cost impact visible", gates.every((gate) => gate.costImpact.includes("No provider calls")));
addCheck("no fake runnable action", gates.every((gate) => !/mitigate now|rollback now|alert now|incident now|deploy now|execute now/i.test(gate.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P70.4" && envelope.data.gate.mitigationAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P70.4 mitigation readiness gates.\n- Does not execute mitigation, rollback, alerts, incidents, deploys, project mutation, providers, tools, workers, DB writes, network calls, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Gate Shape", body: P70_4_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P70.4 Mitigation Readiness Gate Report", phase: "P70.4" },
);

printCheckReport("P70.4 Mitigation Readiness Gate Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
