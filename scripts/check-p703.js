import {
  P70_3_REQUIRED_FIELDS,
  P70_3_SAMPLE_SIGNALS,
  buildIncidentSignalEnvelope,
  createIncidentSignalPreview,
  validateIncidentSignalPreview,
} from "../deploy-monitoring/p70-3-placeholder.js";
import { createDeployMonitorEvent } from "../deploy-monitoring/p70-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p703-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedSignal = createIncidentSignalPreview({
  monitorEvent: createDeployMonitorEvent({
    allowedFiles: ["deploy-monitoring/p70-3-placeholder.js"],
    evidenceRefs: ["reports/p703-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P70.3"],
  }),
});
const signals = [...P70_3_SAMPLE_SIGNALS, generatedSignal];
const validations = signals.map((signal) => validateIncidentSignalPreview(signal));
const envelope = buildIncidentSignalEnvelope({
  allowedFiles: ["deploy-monitoring/p70-3-placeholder.js"],
  evidenceRefs: ["reports/p703-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P70.3"],
});

addCheck("required fields listed", P70_3_REQUIRED_FIELDS.length >= 29, `${P70_3_REQUIRED_FIELDS.length} fields`);
addCheck("signals validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("projects forbidden", signals.every((signal) => signal.forbiddenFiles.includes("projects/**") && signal.forbiddenFiles.includes("project-roadmap/**")));
addCheck("allowed files stay out of projects", signals.every((signal) => !signal.allowedFiles.some((filePath) => filePath.startsWith("projects/"))));
addCheck("deploy execution disabled", signals.every((signal) => signal.deployExecutionAllowed === false));
addCheck("incident mitigation rollback disabled", signals.every((signal) => signal.incidentExecutionAllowed === false && signal.mitigationExecutionAllowed === false && signal.rollbackExecutionAllowed === false));
addCheck("alert dispatch disabled", signals.every((signal) => signal.alertDispatchAllowed === false));
addCheck("project mutation disabled", signals.every((signal) => signal.projectMutationAllowed === false));
addCheck("provider/tool/worker disabled", signals.every((signal) => signal.providerDispatchAllowed === false && signal.toolExecutionAllowed === false && signal.workerExecutionAllowed === false));
addCheck("db/network/spend disabled", signals.every((signal) => signal.dbWritesAllowed === false && signal.networkCallsAllowed === false && signal.providerSpendAllowed === false));
addCheck("blockers visible", signals.every((signal) => signal.blockers.length >= 4));
addCheck("evidence and activity visible", signals.every((signal) => signal.evidenceRefs.length > 0 && signal.activityRefs.length > 0));
addCheck("cost impact visible", signals.every((signal) => signal.costImpact.includes("No provider calls")));
addCheck("no fake runnable action", signals.every((signal) => !/alert now|incident now|rollback now|mitigate now|deploy now|execute now/i.test(signal.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P70.3" && envelope.data.signal.alertDispatchAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P70.3 incident signal preview records.\n- Does not execute alerts, incidents, rollback, mitigation, deploys, project mutation, providers, tools, workers, DB writes, network calls, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Signal Shape", body: P70_3_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P70.3 Incident Signal Preview Report", phase: "P70.3" },
);

printCheckReport("P70.3 Incident Signal Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
