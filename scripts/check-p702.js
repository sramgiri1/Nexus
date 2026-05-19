import {
  P70_2_REQUIRED_FIELDS,
  P70_2_SAMPLE_EVENTS,
  buildDeployMonitorEventEnvelope,
  createDeployMonitorEvent,
  validateDeployMonitorEvent,
} from "../deploy-monitoring/p70-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p702-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedEvent = createDeployMonitorEvent({
  allowedFiles: ["deploy-monitoring/p70-2-placeholder.js"],
  evidenceRefs: ["reports/p702-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P70.2"],
});
const events = [...P70_2_SAMPLE_EVENTS, generatedEvent];
const validations = events.map((event) => validateDeployMonitorEvent(event));
const envelope = buildDeployMonitorEventEnvelope({
  allowedFiles: ["deploy-monitoring/p70-2-placeholder.js"],
  evidenceRefs: ["reports/p702-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P70.2"],
});

addCheck("required fields listed", P70_2_REQUIRED_FIELDS.length >= 28, `${P70_2_REQUIRED_FIELDS.length} fields`);
addCheck("events validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("projects forbidden", events.every((event) => event.forbiddenFiles.includes("projects/**") && event.forbiddenFiles.includes("project-roadmap/**")));
addCheck("allowed files stay out of projects", events.every((event) => !event.allowedFiles.some((filePath) => filePath.startsWith("projects/"))));
addCheck("deploy and monitor execution disabled", events.every((event) => event.deployExecutionAllowed === false && event.monitorExecutionAllowed === false));
addCheck("incident mitigation rollback disabled", events.every((event) => event.incidentExecutionAllowed === false && event.mitigationExecutionAllowed === false && event.rollbackExecutionAllowed === false));
addCheck("alert dispatch disabled", events.every((event) => event.alertDispatchAllowed === false));
addCheck("project mutation disabled", events.every((event) => event.projectMutationAllowed === false));
addCheck("provider/tool/worker disabled", events.every((event) => event.providerDispatchAllowed === false && event.toolExecutionAllowed === false && event.workerExecutionAllowed === false));
addCheck("db/network/spend disabled", events.every((event) => event.dbWritesAllowed === false && event.networkCallsAllowed === false && event.providerSpendAllowed === false));
addCheck("blockers visible", events.every((event) => event.blockers.length >= 3));
addCheck("evidence and activity visible", events.every((event) => event.evidenceRefs.length > 0 && event.activityRefs.length > 0));
addCheck("cost impact visible", events.every((event) => event.costImpact.includes("No provider calls")));
addCheck("no fake runnable action", events.every((event) => !/monitor now|alert now|deploy now|rollback now|mitigate now|execute now/i.test(event.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P70.2" && envelope.data.event.alertDispatchAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P70.2 display-safe deploy monitor event records.\n- Does not execute deploy monitors, alerts, incidents, rollback, mitigation, project mutation, providers, tools, workers, DB writes, network calls, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Event Shape", body: P70_2_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P70.2 Deploy Monitor Event Contract Report", phase: "P70.2" },
);

printCheckReport("P70.2 Deploy Monitor Event Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
