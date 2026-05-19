import {
  P77_4_REQUIRED_FIELDS,
  P77_4_SAMPLE_PREVIEWS,
  buildControlMappingPreviewEnvelope,
  createControlMappingPreview,
  validateControlMappingPreview,
} from "../compliance/p77-4-placeholder.js";
import { P77_2_SAMPLE_INDEXES, validateComplianceEvidenceIndex } from "../compliance/p77-2-placeholder.js";
import { P77_3_SAMPLE_PREVIEWS, validateAuditTrailExportPreview } from "../compliance/p77-3-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p774-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const sourceIndex = P77_2_SAMPLE_INDEXES[0];
const sourceAuditPreview = P77_3_SAMPLE_PREVIEWS[0];
const generatedPreview = createControlMappingPreview({
  sourceIndex,
  sourceAuditPreview,
  evidenceRefs: ["reports/p774-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P77.4"],
});
const previews = [...P77_4_SAMPLE_PREVIEWS, generatedPreview];
const validations = previews.map((preview) => validateControlMappingPreview(preview));
const envelope = buildControlMappingPreviewEnvelope({
  sourceIndex,
  sourceAuditPreview,
  evidenceRefs: ["reports/p774-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P77.4"],
});
const serialized = JSON.stringify(previews);

addCheck("required fields listed", P77_4_REQUIRED_FIELDS.length >= 39, `${P77_4_REQUIRED_FIELDS.length} fields`);
addCheck("source evidence index validates", validateComplianceEvidenceIndex(sourceIndex).valid);
addCheck("source audit preview validates", validateAuditTrailExportPreview(sourceAuditPreview).valid);
addCheck("previews validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("certification and legal attestation disabled", previews.every((preview) => preview.certificationAllowed === false && preview.legalAttestationAllowed === false));
addCheck("audit and raw log export disabled", previews.every((preview) => preview.auditExportAllowed === false && preview.rawLogExportAllowed === false));
addCheck("package creation disabled", previews.every((preview) => preview.packageCreationAllowed === false));
addCheck("DB writes and project mutation disabled", previews.every((preview) => preview.dbWritesAllowed === false && preview.projectMutationAllowed === false));
addCheck("tenant access auth session user workspace disabled", previews.every((preview) => preview.tenantMutationAllowed === false && preview.accessMutationAllowed === false && preview.authMutationAllowed === false && preview.sessionMutationAllowed === false && preview.userMutationAllowed === false && preview.workspaceMutationAllowed === false));
addCheck("provider/tool/worker disabled", previews.every((preview) => preview.providerDispatchAllowed === false && preview.toolExecutionAllowed === false && preview.workerExecutionAllowed === false));
addCheck("network/spend disabled", previews.every((preview) => preview.networkCallsAllowed === false && preview.providerSpendAllowed === false));
addCheck("deploy/release/export disabled", previews.every((preview) => preview.deployExecutionAllowed === false && preview.releaseExecutionAllowed === false && preview.exportExecutionAllowed === false));
addCheck("approval gate required", previews.every((preview) => preview.approvalRequired === true && preview.approvalState.includes("required")));
addCheck("control rows visible", previews.every((preview) => preview.controlRows.length >= 4));
addCheck("blocked operations visible", previews.every((preview) => preview.blockedOperations.length >= 7));
addCheck("blockers visible", previews.every((preview) => preview.blockers.length >= 6));
addCheck("forbidden paths visible", previews.every((preview) => ["projects/**", "project-roadmap/**", "db/**", "prisma/**", "migrations/**", "providers/**", "tools/**", "worker-runtime/**", "auth/**", "users/**", "rbac/**"].every((path) => preview.forbiddenFiles.includes(path))));
addCheck("private IDs tokens URLs and raw dumps hidden", !/(?:project|private|token|tenant|workspace|attestation|audit)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\/|raw log dump/i.test(serialized));
addCheck("evidence and activity visible", previews.every((preview) => preview.evidenceRefs.length > 0 && preview.activityRefs.length > 0));
addCheck("cost impact visible", previews.every((preview) => preview.costImpact.includes("No certification service calls")));
addCheck("no fake runnable attestation action", previews.every((preview) => !/certify now|sign attestation|legal sign|export audit|download package|create package|execute now/i.test(preview.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P77.4" && envelope.data.preview.legalAttestationAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P77.4 preview-only control mapping and attestation preview records.\n- Does not enable certification, legal attestation, audit export, raw log export, package creation, DB writes, project mutation, tenant/access/auth/session/user/workspace mutation, provider/tool/worker execution, network calls, deploy, release, export, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Preview Shape", body: P77_4_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P77.4 Control Mapping Preview Report", phase: "P77.4" },
);

printCheckReport("P77.4 Control Mapping Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
