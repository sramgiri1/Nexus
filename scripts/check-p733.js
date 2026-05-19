import {
  P73_3_REQUIRED_FIELDS,
  P73_3_SAMPLE_MATRICES,
  buildRbacPermissionMatrixEnvelope,
  createRbacPermissionMatrix,
  validateRbacPermissionMatrix,
} from "../auth-governance/p73-3-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p733-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedMatrix = createRbacPermissionMatrix({
  evidenceRefs: ["reports/p733-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P73.3"],
});
const matrices = [...P73_3_SAMPLE_MATRICES, generatedMatrix];
const validations = matrices.map((matrix) => validateRbacPermissionMatrix(matrix));
const envelope = buildRbacPermissionMatrixEnvelope({
  evidenceRefs: ["reports/p733-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P73.3"],
});
const serialized = JSON.stringify(matrices);

addCheck("required fields listed", P73_3_REQUIRED_FIELDS.length >= 33, `${P73_3_REQUIRED_FIELDS.length} fields`);
addCheck("matrices validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("role permission mutation disabled", matrices.every((matrix) => matrix.roleMutationAllowed === false && matrix.permissionMutationAllowed === false));
addCheck("user session tenant mutation disabled", matrices.every((matrix) => matrix.userMutationAllowed === false && matrix.sessionMutationAllowed === false && matrix.tenantMutationAllowed === false));
addCheck("login provider token disabled", matrices.every((matrix) => matrix.loginAllowed === false && matrix.identityProviderCallsAllowed === false && matrix.tokenExchangeAllowed === false));
addCheck("project mutation and DB writes disabled", matrices.every((matrix) => matrix.projectMutationAllowed === false && matrix.dbWritesAllowed === false));
addCheck("provider/tool/worker disabled", matrices.every((matrix) => matrix.providerDispatchAllowed === false && matrix.toolExecutionAllowed === false && matrix.workerExecutionAllowed === false));
addCheck("network/spend disabled", matrices.every((matrix) => matrix.networkCallsAllowed === false && matrix.providerSpendAllowed === false));
addCheck("deploy/release/export/package disabled", matrices.every((matrix) => matrix.deployExecutionAllowed === false && matrix.releaseExecutionAllowed === false && matrix.exportExecutionAllowed === false && matrix.packageCreationAllowed === false));
addCheck("role set visible", matrices.every((matrix) => matrix.roleSet.length >= 4));
addCheck("permission rows display-only", matrices.every((matrix) => matrix.permissionRows.length >= 4 && matrix.permissionRows.every((row) => row.mutationAllowed === false)));
addCheck("blocked operations visible", matrices.every((matrix) => matrix.blockedOperations.length >= 6));
addCheck("private IDs tokens and auth URLs hidden", !/(?:project|private|user|session|role)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/[^"]*auth/i.test(serialized));
addCheck("evidence and activity visible", matrices.every((matrix) => matrix.evidenceRefs.length > 0 && matrix.activityRefs.length > 0));
addCheck("cost impact visible", matrices.every((matrix) => matrix.costImpact.includes("No identity provider calls")));
addCheck("no fake runnable RBAC action", matrices.every((matrix) => !/assign role now|grant permission|create user|log in now|execute now/i.test(matrix.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P73.3" && envelope.data.matrix.roleMutationAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P73.3 preview-only RBAC permission matrix records.\n- Does not enable role assignment, permission mutation, user/session/tenant mutation, login, identity provider calls, token exchange, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, package, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Matrix Shape", body: P73_3_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P73.3 RBAC Permission Matrix Report", phase: "P73.3" },
);

printCheckReport("P73.3 RBAC Permission Matrix Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
