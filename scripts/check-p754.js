import {
  P75_4_REQUIRED_FIELDS,
  P75_4_SAMPLE_RUNBOOKS,
  buildDisasterRecoveryRunbookEnvelope,
  createDisasterRecoveryRunbook,
  validateDisasterRecoveryRunbook,
} from "../backup-dr/p75-4-placeholder.js";
import { P75_3_SAMPLE_PREVIEWS, validateRestorePlanPreview } from "../backup-dr/p75-3-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p754-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const sourceRestorePlan = P75_3_SAMPLE_PREVIEWS[0];
const generatedRunbook = createDisasterRecoveryRunbook({
  restorePlanPreview: sourceRestorePlan,
  evidenceRefs: ["reports/p754-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P75.4"],
});
const runbooks = [...P75_4_SAMPLE_RUNBOOKS, generatedRunbook];
const validations = runbooks.map((runbook) => validateDisasterRecoveryRunbook(runbook));
const envelope = buildDisasterRecoveryRunbookEnvelope({
  restorePlanPreview: sourceRestorePlan,
  evidenceRefs: ["reports/p754-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P75.4"],
});
const serialized = JSON.stringify(runbooks);

addCheck("required fields listed", P75_4_REQUIRED_FIELDS.length >= 34, `${P75_4_REQUIRED_FIELDS.length} fields`);
addCheck("source restore plan validates", validateRestorePlanPreview(sourceRestorePlan).valid);
addCheck("runbooks validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("failover restore backup disabled", runbooks.every((runbook) => runbook.failoverAllowed === false && runbook.restoreExecutionAllowed === false && runbook.backupCreationAllowed === false));
addCheck("overwrite and delete disabled", runbooks.every((runbook) => runbook.overwriteAllowed === false && runbook.deleteAllowed === false));
addCheck("project mutation and DB writes disabled", runbooks.every((runbook) => runbook.projectMutationAllowed === false && runbook.dbWritesAllowed === false));
addCheck("provider/tool/worker disabled", runbooks.every((runbook) => runbook.providerDispatchAllowed === false && runbook.toolExecutionAllowed === false && runbook.workerExecutionAllowed === false));
addCheck("network/spend disabled", runbooks.every((runbook) => runbook.networkCallsAllowed === false && runbook.providerSpendAllowed === false));
addCheck("deploy/release/export/package disabled", runbooks.every((runbook) => runbook.deployExecutionAllowed === false && runbook.releaseExecutionAllowed === false && runbook.exportExecutionAllowed === false && runbook.packageCreationAllowed === false));
addCheck("auth mutation disabled", runbooks.every((runbook) => runbook.authMutationAllowed === false));
addCheck("safety gate blocked", runbooks.every((runbook) => runbook.approvalRequired === true && runbook.safetyGateState.includes("blocked")));
addCheck("runbook rows visible", runbooks.every((runbook) => runbook.runbookRows.length >= 3));
addCheck("blocked operations visible", runbooks.every((runbook) => runbook.blockedOperations.length >= 6));
addCheck("blockers visible", runbooks.every((runbook) => runbook.blockers.length >= 6));
addCheck("forbidden paths visible", runbooks.every((runbook) => ["projects/**", "db/**", "prisma/**", "migrations/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => runbook.forbiddenFiles.includes(path))));
addCheck("private IDs tokens and DR URLs hidden", !/(?:project|private|token|tenant|workspace|runbook)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|s3:\/\/|gs:\/\/|https:\/\/[^"]*(backup|restore|storage|failover|runbook)/i.test(serialized));
addCheck("evidence and activity visible", runbooks.every((runbook) => runbook.evidenceRefs.length > 0 && runbook.activityRefs.length > 0));
addCheck("cost impact visible", runbooks.every((runbook) => runbook.costImpact.includes("No failover calls")));
addCheck("no fake runnable DR action", runbooks.every((runbook) => !/failover now|restore now|execute restore|create backup|overwrite now|delete now/i.test(runbook.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P75.4" && envelope.data.runbook.failoverAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P75.4 preview-only disaster recovery runbook records.\n- Does not enable failover, restore execution, backup creation, overwrite, delete, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, package, auth mutation, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Runbook Shape", body: P75_4_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P75.4 Disaster Recovery Runbook Report", phase: "P75.4" },
);

printCheckReport("P75.4 Disaster Recovery Runbook Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
