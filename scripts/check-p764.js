import {
  P76_4_REQUIRED_FIELDS,
  P76_4_SAMPLE_PACKETS,
  buildAccessContextPacketPreviewEnvelope,
  createAccessContextPacketPreview,
  validateAccessContextPacketPreview,
} from "../isolation/p76-4-placeholder.js";
import { P76_2_SAMPLE_CONTRACTS, validateTenantBoundaryContract } from "../isolation/p76-2-placeholder.js";
import { P76_3_SAMPLE_PREVIEWS, validateProjectScopeIsolationPreview } from "../isolation/p76-3-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p764-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const sourceTenantBoundary = P76_2_SAMPLE_CONTRACTS[0];
const sourceProjectScope = P76_3_SAMPLE_PREVIEWS[0];
const generatedPacket = createAccessContextPacketPreview({
  tenantBoundaryContract: sourceTenantBoundary,
  projectScopePreview: sourceProjectScope,
  evidenceRefs: ["reports/p764-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P76.4"],
});
const packets = [...P76_4_SAMPLE_PACKETS, generatedPacket];
const validations = packets.map((packet) => validateAccessContextPacketPreview(packet));
const envelope = buildAccessContextPacketPreviewEnvelope({
  tenantBoundaryContract: sourceTenantBoundary,
  projectScopePreview: sourceProjectScope,
  evidenceRefs: ["reports/p764-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P76.4"],
});
const serialized = JSON.stringify(packets);

addCheck("required fields listed", P76_4_REQUIRED_FIELDS.length >= 40, `${P76_4_REQUIRED_FIELDS.length} fields`);
addCheck("source tenant boundary validates", validateTenantBoundaryContract(sourceTenantBoundary).valid);
addCheck("source project scope validates", validateProjectScopeIsolationPreview(sourceProjectScope).valid);
addCheck("packets validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("access grants disabled", packets.every((packet) => packet.accessGrantAllowed === false));
addCheck("role permission membership disabled", packets.every((packet) => packet.roleMutationAllowed === false && packet.permissionMutationAllowed === false && packet.membershipMutationAllowed === false));
addCheck("tenant mutation disabled", packets.every((packet) => packet.tenantMutationAllowed === false));
addCheck("project mutation and cross-project access disabled", packets.every((packet) => packet.projectMutationAllowed === false && packet.crossProjectAccessAllowed === false));
addCheck("DB writes disabled", packets.every((packet) => packet.dbWritesAllowed === false));
addCheck("provider/tool/worker disabled", packets.every((packet) => packet.providerDispatchAllowed === false && packet.toolExecutionAllowed === false && packet.workerExecutionAllowed === false));
addCheck("network/spend disabled", packets.every((packet) => packet.networkCallsAllowed === false && packet.providerSpendAllowed === false));
addCheck("deploy/release/export/package disabled", packets.every((packet) => packet.deployExecutionAllowed === false && packet.releaseExecutionAllowed === false && packet.exportExecutionAllowed === false && packet.packageCreationAllowed === false));
addCheck("auth session user workspace disabled", packets.every((packet) => packet.authMutationAllowed === false && packet.sessionMutationAllowed === false && packet.userMutationAllowed === false && packet.workspaceMutationAllowed === false));
addCheck("approval gate required", packets.every((packet) => packet.approvalRequired === true && packet.approvalState.includes("required")));
addCheck("access packet rows visible", packets.every((packet) => packet.accessPacketRows.length >= 4));
addCheck("blocked operations visible", packets.every((packet) => packet.blockedOperations.length >= 7));
addCheck("blockers visible", packets.every((packet) => packet.blockers.length >= 6));
addCheck("forbidden paths visible", packets.every((packet) => ["projects/**", "project-roadmap/**", "db/**", "prisma/**", "migrations/**", "providers/**", "tools/**", "worker-runtime/**", "auth/**", "users/**", "rbac/**"].every((path) => packet.forbiddenFiles.includes(path))));
addCheck("private IDs tokens and URLs hidden", !/(?:project|private|token|tenant|workspace|access)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i.test(serialized));
addCheck("evidence and activity visible", packets.every((packet) => packet.evidenceRefs.length > 0 && packet.activityRefs.length > 0));
addCheck("cost impact visible", packets.every((packet) => packet.costImpact.includes("No access service calls")));
addCheck("no fake runnable access action", packets.every((packet) => !/grant access|assign role|change permission|create user|login now|execute now/i.test(packet.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P76.4" && envelope.data.packet.accessGrantAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P76.4 preview-only access context packet records.\n- Does not enable access grants, role mutation, permission mutation, tenant mutation, project mutation, DB writes, provider/tool/worker execution, network calls, deploy, release, export, package, auth/session/user/workspace mutation, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Packet Shape", body: P76_4_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P76.4 Access Context Packet Preview Report", phase: "P76.4" },
);

printCheckReport("P76.4 Access Context Packet Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
