import {
  P75_3_REQUIRED_FIELDS,
  P75_3_SAMPLE_PREVIEWS,
  buildRestorePlanPreviewEnvelope,
  createRestorePlanPreview,
  validateRestorePlanPreview,
} from "../backup-dr/p75-3-placeholder.js";
import { P75_2_SAMPLE_CONTRACTS, validateBackupInventoryContract } from "../backup-dr/p75-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p753-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const sourceBackupInventory = P75_2_SAMPLE_CONTRACTS[0];
const generatedPreview = createRestorePlanPreview({
  backupInventory: sourceBackupInventory,
  evidenceRefs: ["reports/p753-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P75.3"],
});
const previews = [...P75_3_SAMPLE_PREVIEWS, generatedPreview];
const validations = previews.map((preview) => validateRestorePlanPreview(preview));
const envelope = buildRestorePlanPreviewEnvelope({
  backupInventory: sourceBackupInventory,
  evidenceRefs: ["reports/p753-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P75.3"],
});
const serialized = JSON.stringify(previews);

addCheck("required fields listed", P75_3_REQUIRED_FIELDS.length >= 33, `${P75_3_REQUIRED_FIELDS.length} fields`);
addCheck("source backup inventory validates", validateBackupInventoryContract(sourceBackupInventory).valid);
addCheck("previews validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("restore backup failover disabled", previews.every((preview) => preview.restoreExecutionAllowed === false && preview.backupCreationAllowed === false && preview.failoverAllowed === false));
addCheck("overwrite and delete disabled", previews.every((preview) => preview.overwriteAllowed === false && preview.deleteAllowed === false));
addCheck("project mutation and DB writes disabled", previews.every((preview) => preview.projectMutationAllowed === false && preview.dbWritesAllowed === false));
addCheck("provider/tool/worker disabled", previews.every((preview) => preview.providerDispatchAllowed === false && preview.toolExecutionAllowed === false && preview.workerExecutionAllowed === false));
addCheck("network/spend disabled", previews.every((preview) => preview.networkCallsAllowed === false && preview.providerSpendAllowed === false));
addCheck("deploy/release/export/package disabled", previews.every((preview) => preview.deployExecutionAllowed === false && preview.releaseExecutionAllowed === false && preview.exportExecutionAllowed === false && preview.packageCreationAllowed === false));
addCheck("auth mutation disabled", previews.every((preview) => preview.authMutationAllowed === false));
addCheck("approval gate required", previews.every((preview) => preview.approvalRequired === true && preview.approvalState.includes("required")));
addCheck("preview rows visible", previews.every((preview) => preview.previewRows.length >= 2));
addCheck("blocked operations visible", previews.every((preview) => preview.blockedOperations.length >= 6));
addCheck("blockers visible", previews.every((preview) => preview.blockers.length >= 6));
addCheck("forbidden paths visible", previews.every((preview) => ["projects/**", "db/**", "prisma/**", "migrations/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => preview.forbiddenFiles.includes(path))));
addCheck("private IDs tokens and restore URLs hidden", !/(?:project|private|token|tenant|workspace)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|s3:\/\/|gs:\/\/|https:\/\/[^"]*(backup|restore|storage)/i.test(serialized));
addCheck("evidence and activity visible", previews.every((preview) => preview.evidenceRefs.length > 0 && preview.activityRefs.length > 0));
addCheck("cost impact visible", previews.every((preview) => preview.costImpact.includes("No restore calls")));
addCheck("no fake runnable restore action", previews.every((preview) => !/restore now|execute restore|overwrite now|delete now|backup now|failover now/i.test(preview.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P75.3" && envelope.data.plan.restoreExecutionAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P75.3 preview-only restore plan records.\n- Does not enable restore execution, backup creation, failover, overwrite, delete, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, package, auth mutation, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Preview Shape", body: P75_3_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P75.3 Restore Plan Preview Report", phase: "P75.3" },
);

printCheckReport("P75.3 Restore Plan Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
