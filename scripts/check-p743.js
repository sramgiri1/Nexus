import {
  P74_3_REQUIRED_FIELDS,
  P74_3_SAMPLE_CATALOGS,
  buildSloObjectiveCatalogEnvelope,
  createSloObjectiveCatalog,
  validateSloObjectiveCatalog,
} from "../observability/p74-3-placeholder.js";
import { P74_2_SAMPLE_CONTRACTS, validateTelemetryEventContract } from "../observability/p74-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p743-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const sourceTelemetryContract = P74_2_SAMPLE_CONTRACTS[0];
const generatedCatalog = createSloObjectiveCatalog({
  telemetryContract: sourceTelemetryContract,
  evidenceRefs: ["reports/p743-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P74.3"],
});
const catalogs = [...P74_3_SAMPLE_CATALOGS, generatedCatalog];
const validations = catalogs.map((catalog) => validateSloObjectiveCatalog(catalog));
const envelope = buildSloObjectiveCatalogEnvelope({
  telemetryContract: sourceTelemetryContract,
  evidenceRefs: ["reports/p743-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P74.3"],
});
const serialized = JSON.stringify(catalogs);

addCheck("required fields listed", P74_3_REQUIRED_FIELDS.length >= 34, `${P74_3_REQUIRED_FIELDS.length} fields`);
addCheck("source telemetry contract validates", validateTelemetryEventContract(sourceTelemetryContract).valid);
addCheck("catalogs validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("SLO enforcement paging remediation disabled", catalogs.every((catalog) => catalog.enforcementAllowed === false && catalog.pagingAllowed === false && catalog.remediationAllowed === false));
addCheck("telemetry export and raw logs disabled", catalogs.every((catalog) => catalog.telemetryExportAllowed === false && catalog.rawLogExposureAllowed === false));
addCheck("project mutation and DB writes disabled", catalogs.every((catalog) => catalog.projectMutationAllowed === false && catalog.dbWritesAllowed === false));
addCheck("provider/tool/worker disabled", catalogs.every((catalog) => catalog.providerDispatchAllowed === false && catalog.toolExecutionAllowed === false && catalog.workerExecutionAllowed === false));
addCheck("network/spend disabled", catalogs.every((catalog) => catalog.networkCallsAllowed === false && catalog.providerSpendAllowed === false));
addCheck("deploy/release/export/package disabled", catalogs.every((catalog) => catalog.deployExecutionAllowed === false && catalog.releaseExecutionAllowed === false && catalog.exportExecutionAllowed === false && catalog.packageCreationAllowed === false));
addCheck("auth mutation disabled", catalogs.every((catalog) => catalog.authMutationAllowed === false));
addCheck("objective rows visible", catalogs.every((catalog) => catalog.objectiveRows.length >= 2));
addCheck("blocked operations visible", catalogs.every((catalog) => catalog.blockedOperations.length >= 6));
addCheck("blockers visible", catalogs.every((catalog) => catalog.blockers.length >= 5));
addCheck("forbidden paths visible", catalogs.every((catalog) => ["projects/**", "db/**", "prisma/**", "migrations/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => catalog.forbiddenFiles.includes(path))));
addCheck("private IDs tokens and telemetry URLs hidden", !/(?:project|private|token|tenant|workspace|slo)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/[^"]*(telemetry|metrics|logs|pager)/i.test(serialized));
addCheck("evidence and activity visible", catalogs.every((catalog) => catalog.evidenceRefs.length > 0 && catalog.activityRefs.length > 0));
addCheck("cost impact visible", catalogs.every((catalog) => catalog.costImpact.includes("No paging service calls")));
addCheck("no fake runnable SLO action", catalogs.every((catalog) => !/enforce now|page now|remediate now|send telemetry|execute now/i.test(catalog.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P74.3" && envelope.data.catalog.enforcementAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P74.3 preview-only SLO objective catalog records.\n- Does not enable SLO enforcement, paging, remediation, external telemetry export, raw log exposure, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, package, auth mutation, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Catalog Shape", body: P74_3_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P74.3 SLO Objective Catalog Report", phase: "P74.3" },
);

printCheckReport("P74.3 SLO Objective Catalog Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
