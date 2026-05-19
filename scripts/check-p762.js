import {
  P76_2_REQUIRED_FIELDS,
  P76_2_SAMPLE_CONTRACTS,
  buildTenantBoundaryContractEnvelope,
  createTenantBoundaryContract,
  validateTenantBoundaryContract,
} from "../isolation/p76-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p762-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedContract = createTenantBoundaryContract({
  evidenceRefs: ["reports/p762-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P76.2"],
});
const contracts = [...P76_2_SAMPLE_CONTRACTS, generatedContract];
const validations = contracts.map((contract) => validateTenantBoundaryContract(contract));
const envelope = buildTenantBoundaryContractEnvelope({
  evidenceRefs: ["reports/p762-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P76.2"],
});
const serialized = JSON.stringify(contracts);

addCheck("required fields listed", P76_2_REQUIRED_FIELDS.length >= 36, `${P76_2_REQUIRED_FIELDS.length} fields`);
addCheck("contracts validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("tenant mutation disabled", contracts.every((contract) => contract.tenantMutationAllowed === false));
addCheck("membership permission role disabled", contracts.every((contract) => contract.membershipMutationAllowed === false && contract.permissionMutationAllowed === false && contract.roleMutationAllowed === false));
addCheck("access grants disabled", contracts.every((contract) => contract.accessGrantAllowed === false));
addCheck("project mutation and cross-project access disabled", contracts.every((contract) => contract.projectMutationAllowed === false && contract.crossProjectAccessAllowed === false));
addCheck("DB writes disabled", contracts.every((contract) => contract.dbWritesAllowed === false));
addCheck("provider/tool/worker disabled", contracts.every((contract) => contract.providerDispatchAllowed === false && contract.toolExecutionAllowed === false && contract.workerExecutionAllowed === false));
addCheck("network/spend disabled", contracts.every((contract) => contract.networkCallsAllowed === false && contract.providerSpendAllowed === false));
addCheck("deploy/release/export/package disabled", contracts.every((contract) => contract.deployExecutionAllowed === false && contract.releaseExecutionAllowed === false && contract.exportExecutionAllowed === false && contract.packageCreationAllowed === false));
addCheck("auth session user workspace disabled", contracts.every((contract) => contract.authMutationAllowed === false && contract.sessionMutationAllowed === false && contract.userMutationAllowed === false && contract.workspaceMutationAllowed === false));
addCheck("blocked operations visible", contracts.every((contract) => contract.blockedOperations.length >= 7));
addCheck("blockers visible", contracts.every((contract) => contract.blockers.length >= 6));
addCheck("forbidden paths visible", contracts.every((contract) => ["projects/**", "project-roadmap/**", "db/**", "prisma/**", "migrations/**", "providers/**", "tools/**", "worker-runtime/**", "auth/**", "users/**", "rbac/**"].every((path) => contract.forbiddenFiles.includes(path))));
addCheck("private IDs tokens and URLs hidden", !/(?:project|private|token|tenant|workspace)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i.test(serialized));
addCheck("evidence and activity visible", contracts.every((contract) => contract.evidenceRefs.length > 0 && contract.activityRefs.length > 0));
addCheck("cost impact visible", contracts.every((contract) => contract.costImpact.includes("No tenant service calls")));
addCheck("no fake runnable tenant action", contracts.every((contract) => !/create tenant|update tenant|delete tenant|grant access|assign role|execute now/i.test(contract.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P76.2" && envelope.data.contract.tenantMutationAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P76.2 preview-only tenant boundary contract records.\n- Does not enable tenant mutation, membership mutation, permission mutation, role mutation, access grants, project mutation, DB writes, provider/tool/worker execution, network calls, deploy, release, export, package, auth/session/user/workspace mutation, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Contract Shape", body: P76_2_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P76.2 Tenant Boundary Contract Report", phase: "P76.2" },
);

printCheckReport("P76.2 Tenant Boundary Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
