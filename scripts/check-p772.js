import {
  P77_2_REQUIRED_FIELDS,
  P77_2_SAMPLE_INDEXES,
  buildComplianceEvidenceIndexEnvelope,
  createComplianceEvidenceIndex,
  validateComplianceEvidenceIndex,
} from "../compliance/p77-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p772-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedIndex = createComplianceEvidenceIndex({
  evidenceRefs: ["reports/p772-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P77.2"],
});
const indexes = [...P77_2_SAMPLE_INDEXES, generatedIndex];
const validations = indexes.map((index) => validateComplianceEvidenceIndex(index));
const envelope = buildComplianceEvidenceIndexEnvelope({
  evidenceRefs: ["reports/p772-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P77.2"],
});
const serialized = JSON.stringify(indexes);

addCheck("required fields listed", P77_2_REQUIRED_FIELDS.length >= 36, `${P77_2_REQUIRED_FIELDS.length} fields`);
addCheck("indexes validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("certification and attestation disabled", indexes.every((index) => index.certificationAllowed === false && index.legalAttestationAllowed === false));
addCheck("audit and raw log export disabled", indexes.every((index) => index.auditExportAllowed === false && index.rawLogExportAllowed === false));
addCheck("package creation disabled", indexes.every((index) => index.packageCreationAllowed === false));
addCheck("DB writes and project mutation disabled", indexes.every((index) => index.dbWritesAllowed === false && index.projectMutationAllowed === false));
addCheck("tenant access auth session user workspace disabled", indexes.every((index) => index.tenantMutationAllowed === false && index.accessMutationAllowed === false && index.authMutationAllowed === false && index.sessionMutationAllowed === false && index.userMutationAllowed === false && index.workspaceMutationAllowed === false));
addCheck("provider/tool/worker disabled", indexes.every((index) => index.providerDispatchAllowed === false && index.toolExecutionAllowed === false && index.workerExecutionAllowed === false));
addCheck("network/spend disabled", indexes.every((index) => index.networkCallsAllowed === false && index.providerSpendAllowed === false));
addCheck("deploy/release/export disabled", indexes.every((index) => index.deployExecutionAllowed === false && index.releaseExecutionAllowed === false && index.exportExecutionAllowed === false));
addCheck("blocked operations visible", indexes.every((index) => index.blockedOperations.length >= 7));
addCheck("blockers visible", indexes.every((index) => index.blockers.length >= 6));
addCheck("forbidden paths visible", indexes.every((index) => ["projects/**", "project-roadmap/**", "db/**", "prisma/**", "migrations/**", "providers/**", "tools/**", "worker-runtime/**", "auth/**", "users/**", "rbac/**"].every((path) => index.forbiddenFiles.includes(path))));
addCheck("private IDs tokens and URLs hidden", !/(?:project|private|token|tenant|workspace)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i.test(serialized));
addCheck("evidence and activity visible", indexes.every((index) => index.evidenceRefs.length > 0 && index.activityRefs.length > 0));
addCheck("cost impact visible", indexes.every((index) => index.costImpact.includes("No compliance service calls")));
addCheck("no fake runnable compliance action", indexes.every((index) => !/certify now|sign attestation|export audit|download package|create package|execute now/i.test(index.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P77.2" && envelope.data.index.certificationAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P77.2 preview-only compliance evidence index records.\n- Does not enable certification, legal attestation, audit export, raw log export, package creation, DB writes, project mutation, tenant/access/auth/session/user/workspace mutation, provider/tool/worker execution, network calls, deploy, release, export, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Index Shape", body: P77_2_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P77.2 Compliance Evidence Index Report", phase: "P77.2" },
);

printCheckReport("P77.2 Compliance Evidence Index Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
