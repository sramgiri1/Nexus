import {
  P76_3_REQUIRED_FIELDS,
  P76_3_SAMPLE_PREVIEWS,
  buildProjectScopeIsolationPreviewEnvelope,
  createProjectScopeIsolationPreview,
  validateProjectScopeIsolationPreview,
} from "../isolation/p76-3-placeholder.js";
import { P76_2_SAMPLE_CONTRACTS, validateTenantBoundaryContract } from "../isolation/p76-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p763-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const sourceTenantBoundary = P76_2_SAMPLE_CONTRACTS[0];
const generatedPreview = createProjectScopeIsolationPreview({
  tenantBoundary: sourceTenantBoundary,
  evidenceRefs: ["reports/p763-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P76.3"],
});
const previews = [...P76_3_SAMPLE_PREVIEWS, generatedPreview];
const validations = previews.map((preview) => validateProjectScopeIsolationPreview(preview));
const envelope = buildProjectScopeIsolationPreviewEnvelope({
  tenantBoundary: sourceTenantBoundary,
  evidenceRefs: ["reports/p763-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P76.3"],
});
const serialized = JSON.stringify(previews);

addCheck("required fields listed", P76_3_REQUIRED_FIELDS.length >= 39, `${P76_3_REQUIRED_FIELDS.length} fields`);
addCheck("source tenant boundary validates", validateTenantBoundaryContract(sourceTenantBoundary).valid);
addCheck("previews validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("project mutation and cross-project access disabled", previews.every((preview) => preview.projectMutationAllowed === false && preview.crossProjectAccessAllowed === false));
addCheck("tenant mutation disabled", previews.every((preview) => preview.tenantMutationAllowed === false));
addCheck("membership permission role disabled", previews.every((preview) => preview.membershipMutationAllowed === false && preview.permissionMutationAllowed === false && preview.roleMutationAllowed === false));
addCheck("access grants disabled", previews.every((preview) => preview.accessGrantAllowed === false));
addCheck("DB writes disabled", previews.every((preview) => preview.dbWritesAllowed === false));
addCheck("provider/tool/worker disabled", previews.every((preview) => preview.providerDispatchAllowed === false && preview.toolExecutionAllowed === false && preview.workerExecutionAllowed === false));
addCheck("network/spend disabled", previews.every((preview) => preview.networkCallsAllowed === false && preview.providerSpendAllowed === false));
addCheck("deploy/release/export/package disabled", previews.every((preview) => preview.deployExecutionAllowed === false && preview.releaseExecutionAllowed === false && preview.exportExecutionAllowed === false && preview.packageCreationAllowed === false));
addCheck("auth session user workspace disabled", previews.every((preview) => preview.authMutationAllowed === false && preview.sessionMutationAllowed === false && preview.userMutationAllowed === false && preview.workspaceMutationAllowed === false));
addCheck("approval gate required", previews.every((preview) => preview.approvalRequired === true && preview.approvalState.includes("required")));
addCheck("preview rows visible", previews.every((preview) => preview.previewRows.length >= 3));
addCheck("blocked operations visible", previews.every((preview) => preview.blockedOperations.length >= 7));
addCheck("blockers visible", previews.every((preview) => preview.blockers.length >= 6));
addCheck("forbidden paths visible", previews.every((preview) => ["projects/**", "project-roadmap/**", "db/**", "prisma/**", "migrations/**", "providers/**", "tools/**", "worker-runtime/**", "auth/**", "users/**", "rbac/**"].every((path) => preview.forbiddenFiles.includes(path))));
addCheck("private IDs tokens and URLs hidden", !/(?:project|private|token|tenant|workspace)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i.test(serialized));
addCheck("evidence and activity visible", previews.every((preview) => preview.evidenceRefs.length > 0 && preview.activityRefs.length > 0));
addCheck("cost impact visible", previews.every((preview) => preview.costImpact.includes("No project service calls")));
addCheck("no fake runnable project action", previews.every((preview) => !/create project|update project|delete project|grant access|cross-project now|execute now/i.test(preview.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P76.3" && envelope.data.preview.projectMutationAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P76.3 preview-only project scope isolation records.\n- Does not enable project mutation, cross-project access, tenant mutation, access grants, DB writes, provider/tool/worker execution, network calls, deploy, release, export, package, auth/session/user/workspace mutation, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Preview Shape", body: P76_3_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P76.3 Project Scope Isolation Preview Report", phase: "P76.3" },
);

printCheckReport("P76.3 Project Scope Isolation Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
