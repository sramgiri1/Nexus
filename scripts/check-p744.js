import {
  P74_4_REQUIRED_FIELDS,
  P74_4_SAMPLE_SNAPSHOTS,
  buildObservabilityHealthSnapshotEnvelope,
  createObservabilityHealthSnapshot,
  validateObservabilityHealthSnapshot,
} from "../observability/p74-4-placeholder.js";
import { P74_2_SAMPLE_CONTRACTS, validateTelemetryEventContract } from "../observability/p74-2-placeholder.js";
import { P74_3_SAMPLE_CATALOGS, validateSloObjectiveCatalog } from "../observability/p74-3-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p744-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const sourceTelemetryContract = P74_2_SAMPLE_CONTRACTS[0];
const sourceSloCatalog = P74_3_SAMPLE_CATALOGS[0];
const generatedSnapshot = createObservabilityHealthSnapshot({
  telemetryContract: sourceTelemetryContract,
  sloCatalog: sourceSloCatalog,
  evidenceRefs: ["reports/p744-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P74.4"],
});
const snapshots = [...P74_4_SAMPLE_SNAPSHOTS, generatedSnapshot];
const validations = snapshots.map((snapshot) => validateObservabilityHealthSnapshot(snapshot));
const envelope = buildObservabilityHealthSnapshotEnvelope({
  telemetryContract: sourceTelemetryContract,
  sloCatalog: sourceSloCatalog,
  evidenceRefs: ["reports/p744-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P74.4"],
});
const serialized = JSON.stringify(snapshots);

addCheck("required fields listed", P74_4_REQUIRED_FIELDS.length >= 35, `${P74_4_REQUIRED_FIELDS.length} fields`);
addCheck("source telemetry contract validates", validateTelemetryEventContract(sourceTelemetryContract).valid);
addCheck("source SLO catalog validates", validateSloObjectiveCatalog(sourceSloCatalog).valid);
addCheck("snapshots validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("remediation paging SLO enforcement disabled", snapshots.every((snapshot) => snapshot.remediationAllowed === false && snapshot.pagingAllowed === false && snapshot.sloEnforcementAllowed === false));
addCheck("telemetry export and raw logs disabled", snapshots.every((snapshot) => snapshot.telemetryExportAllowed === false && snapshot.rawLogExposureAllowed === false));
addCheck("project mutation and DB writes disabled", snapshots.every((snapshot) => snapshot.projectMutationAllowed === false && snapshot.dbWritesAllowed === false));
addCheck("provider/tool/worker disabled", snapshots.every((snapshot) => snapshot.providerDispatchAllowed === false && snapshot.toolExecutionAllowed === false && snapshot.workerExecutionAllowed === false));
addCheck("network/spend disabled", snapshots.every((snapshot) => snapshot.networkCallsAllowed === false && snapshot.providerSpendAllowed === false));
addCheck("deploy/release/export/package disabled", snapshots.every((snapshot) => snapshot.deployExecutionAllowed === false && snapshot.releaseExecutionAllowed === false && snapshot.exportExecutionAllowed === false && snapshot.packageCreationAllowed === false));
addCheck("auth mutation disabled", snapshots.every((snapshot) => snapshot.authMutationAllowed === false));
addCheck("snapshot rows visible", snapshots.every((snapshot) => snapshot.snapshotRows.length >= 3));
addCheck("blocked operations visible", snapshots.every((snapshot) => snapshot.blockedOperations.length >= 6));
addCheck("blockers visible", snapshots.every((snapshot) => snapshot.blockers.length >= 5));
addCheck("forbidden paths visible", snapshots.every((snapshot) => ["projects/**", "db/**", "prisma/**", "migrations/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => snapshot.forbiddenFiles.includes(path))));
addCheck("private IDs tokens and telemetry URLs hidden", !/(?:project|private|token|tenant|workspace|incident)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/[^"]*(telemetry|metrics|logs|pager|incident)/i.test(serialized));
addCheck("evidence and activity visible", snapshots.every((snapshot) => snapshot.evidenceRefs.length > 0 && snapshot.activityRefs.length > 0));
addCheck("cost impact visible", snapshots.every((snapshot) => snapshot.costImpact.includes("No paging provider calls")));
addCheck("no fake runnable health action", snapshots.every((snapshot) => !/remediate now|page now|enforce now|send telemetry|execute now/i.test(snapshot.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P74.4" && envelope.data.snapshot.remediationAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P74.4 preview-only observability health and incident snapshot records.\n- Does not enable remediation, paging, SLO enforcement, external telemetry export, raw log exposure, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, package, auth mutation, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Snapshot Shape", body: P74_4_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P74.4 Health Incident Snapshot Report", phase: "P74.4" },
);

printCheckReport("P74.4 Health Incident Snapshot Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
