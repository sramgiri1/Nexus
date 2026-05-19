import {
  P73_2_REQUIRED_FIELDS,
  P73_2_SAMPLE_CONTRACTS,
  buildIdentitySessionContractEnvelope,
  createIdentitySessionContract,
  validateIdentitySessionContract,
} from "../auth-governance/p73-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p732-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedContract = createIdentitySessionContract({
  evidenceRefs: ["reports/p732-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P73.2"],
});
const contracts = [...P73_2_SAMPLE_CONTRACTS, generatedContract];
const validations = contracts.map((contract) => validateIdentitySessionContract(contract));
const envelope = buildIdentitySessionContractEnvelope({
  evidenceRefs: ["reports/p732-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P73.2"],
});
const serialized = JSON.stringify(contracts);

addCheck("required fields listed", P73_2_REQUIRED_FIELDS.length >= 32, `${P73_2_REQUIRED_FIELDS.length} fields`);
addCheck("contracts validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("login/session/provider disabled", contracts.every((contract) => contract.loginAllowed === false && contract.sessionMutationAllowed === false && contract.identityProviderCallsAllowed === false && contract.tokenExchangeAllowed === false));
addCheck("user role tenant mutation disabled", contracts.every((contract) => contract.userMutationAllowed === false && contract.roleMutationAllowed === false && contract.tenantMutationAllowed === false));
addCheck("project mutation and DB writes disabled", contracts.every((contract) => contract.projectMutationAllowed === false && contract.dbWritesAllowed === false));
addCheck("provider/tool/worker disabled", contracts.every((contract) => contract.providerDispatchAllowed === false && contract.toolExecutionAllowed === false && contract.workerExecutionAllowed === false));
addCheck("network/spend disabled", contracts.every((contract) => contract.networkCallsAllowed === false && contract.providerSpendAllowed === false));
addCheck("deploy/release/export/package disabled", contracts.every((contract) => contract.deployExecutionAllowed === false && contract.releaseExecutionAllowed === false && contract.exportExecutionAllowed === false && contract.packageCreationAllowed === false));
addCheck("blocked operations visible", contracts.every((contract) => contract.blockedOperations.length >= 6));
addCheck("blockers visible", contracts.every((contract) => contract.blockers.length >= 5));
addCheck("forbidden auth paths visible", contracts.every((contract) => ["auth/**", "users/**", "rbac/**", "db/**", "projects/**"].every((path) => contract.forbiddenFiles.includes(path))));
addCheck("private IDs tokens and auth URLs hidden", !/(?:project|private|user|session)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/[^"]*auth/i.test(serialized));
addCheck("evidence and activity visible", contracts.every((contract) => contract.evidenceRefs.length > 0 && contract.activityRefs.length > 0));
addCheck("cost impact visible", contracts.every((contract) => contract.costImpact.includes("No identity provider calls")));
addCheck("no fake runnable auth action", contracts.every((contract) => !/log in now|sign in now|create session|issue token|connect provider|execute now/i.test(contract.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P73.2" && envelope.data.contract.loginAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P73.2 preview-only identity/session contract records.\n- Does not enable login, identity provider calls, token exchange, session mutation, user mutation, role mutation, tenant mutation, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, package, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Contract Shape", body: P73_2_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P73.2 Identity Session Contract Report", phase: "P73.2" },
);

printCheckReport("P73.2 Identity Session Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
