import {
  P73_4_REQUIRED_FIELDS,
  P73_4_SAMPLE_BOUNDARIES,
  buildMultiUserWorkspaceBoundaryEnvelope,
  createMultiUserWorkspaceBoundary,
  validateMultiUserWorkspaceBoundary,
} from "../auth-governance/p73-4-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p734-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedBoundary = createMultiUserWorkspaceBoundary({
  evidenceRefs: ["reports/p734-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P73.4"],
});
const boundaries = [...P73_4_SAMPLE_BOUNDARIES, generatedBoundary];
const validations = boundaries.map((boundary) => validateMultiUserWorkspaceBoundary(boundary));
const envelope = buildMultiUserWorkspaceBoundaryEnvelope({
  evidenceRefs: ["reports/p734-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P73.4"],
});
const serialized = JSON.stringify(boundaries);

addCheck("required fields listed", P73_4_REQUIRED_FIELDS.length >= 35, `${P73_4_REQUIRED_FIELDS.length} fields`);
addCheck("boundaries validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("workspace tenant mutation disabled", boundaries.every((boundary) => boundary.workspaceMutationAllowed === false && boundary.tenantMutationAllowed === false));
addCheck("user session role permission mutation disabled", boundaries.every((boundary) => boundary.userMutationAllowed === false && boundary.sessionMutationAllowed === false && boundary.roleMutationAllowed === false && boundary.permissionMutationAllowed === false));
addCheck("login provider token disabled", boundaries.every((boundary) => boundary.loginAllowed === false && boundary.identityProviderCallsAllowed === false && boundary.tokenExchangeAllowed === false));
addCheck("project mutation and DB writes disabled", boundaries.every((boundary) => boundary.projectMutationAllowed === false && boundary.dbWritesAllowed === false));
addCheck("provider/tool/worker disabled", boundaries.every((boundary) => boundary.providerDispatchAllowed === false && boundary.toolExecutionAllowed === false && boundary.workerExecutionAllowed === false));
addCheck("network/spend disabled", boundaries.every((boundary) => boundary.networkCallsAllowed === false && boundary.providerSpendAllowed === false));
addCheck("deploy/release/export/package disabled", boundaries.every((boundary) => boundary.deployExecutionAllowed === false && boundary.releaseExecutionAllowed === false && boundary.exportExecutionAllowed === false && boundary.packageCreationAllowed === false));
addCheck("workspace rows display-only", boundaries.every((boundary) => boundary.workspaceRows.length >= 3 && boundary.workspaceRows.every((row) => row.mutationAllowed === false)));
addCheck("blocked operations visible", boundaries.every((boundary) => boundary.blockedOperations.length >= 6));
addCheck("private IDs tokens and auth URLs hidden", !/(?:project|private|user|session|tenant|workspace)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/[^"]*auth/i.test(serialized));
addCheck("evidence and activity visible", boundaries.every((boundary) => boundary.evidenceRefs.length > 0 && boundary.activityRefs.length > 0));
addCheck("cost impact visible", boundaries.every((boundary) => boundary.costImpact.includes("No identity provider calls")));
addCheck("no fake runnable workspace action", boundaries.every((boundary) => !/create tenant|create workspace|add member|assign role now|execute now/i.test(boundary.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P73.4" && envelope.data.boundary.workspaceMutationAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P73.4 preview-only multi-user workspace boundary records.\n- Does not enable tenant creation, workspace mutation, membership mutation, user/session/role/permission mutation, login, identity provider calls, token exchange, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, package, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Boundary Shape", body: P73_4_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P73.4 Multi-user Workspace Boundary Report", phase: "P73.4" },
);

printCheckReport("P73.4 Multi-user Workspace Boundary Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
