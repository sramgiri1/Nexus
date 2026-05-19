import {
  P74_2_REQUIRED_FIELDS,
  P74_2_SAMPLE_CONTRACTS,
  buildTelemetryEventContractEnvelope,
  createTelemetryEventContract,
  validateTelemetryEventContract,
} from "../observability/p74-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p742-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedContract = createTelemetryEventContract({
  evidenceRefs: ["reports/p742-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P74.2"],
});
const contracts = [...P74_2_SAMPLE_CONTRACTS, generatedContract];
const validations = contracts.map((contract) => validateTelemetryEventContract(contract));
const envelope = buildTelemetryEventContractEnvelope({
  evidenceRefs: ["reports/p742-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P74.2"],
});
const serialized = JSON.stringify(contracts);

addCheck("required fields listed", P74_2_REQUIRED_FIELDS.length >= 32, `${P74_2_REQUIRED_FIELDS.length} fields`);
addCheck("contracts validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("telemetry export and raw logs disabled", contracts.every((contract) => contract.telemetryExportAllowed === false && contract.rawLogExposureAllowed === false));
addCheck("raw JSON and policy dumps disabled", contracts.every((contract) => contract.rawJsonDumpAllowed === false && contract.rawPolicyDumpAllowed === false));
addCheck("project mutation and DB writes disabled", contracts.every((contract) => contract.projectMutationAllowed === false && contract.dbWritesAllowed === false));
addCheck("provider/tool/worker disabled", contracts.every((contract) => contract.providerDispatchAllowed === false && contract.toolExecutionAllowed === false && contract.workerExecutionAllowed === false));
addCheck("network/spend disabled", contracts.every((contract) => contract.networkCallsAllowed === false && contract.providerSpendAllowed === false));
addCheck("deploy/release/export/package disabled", contracts.every((contract) => contract.deployExecutionAllowed === false && contract.releaseExecutionAllowed === false && contract.exportExecutionAllowed === false && contract.packageCreationAllowed === false));
addCheck("auth mutation disabled", contracts.every((contract) => contract.authMutationAllowed === false));
addCheck("blocked operations visible", contracts.every((contract) => contract.blockedOperations.length >= 6));
addCheck("blockers visible", contracts.every((contract) => contract.blockers.length >= 5));
addCheck("forbidden paths visible", contracts.every((contract) => ["projects/**", "db/**", "prisma/**", "migrations/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => contract.forbiddenFiles.includes(path))));
addCheck("private IDs tokens and telemetry URLs hidden", !/(?:project|private|token|tenant|workspace)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/[^"]*(telemetry|metrics|logs)/i.test(serialized));
addCheck("evidence and activity visible", contracts.every((contract) => contract.evidenceRefs.length > 0 && contract.activityRefs.length > 0));
addCheck("cost impact visible", contracts.every((contract) => contract.costImpact.includes("No telemetry exporter calls")));
addCheck("no fake runnable telemetry action", contracts.every((contract) => !/export now|stream logs|send telemetry|write metrics|execute now/i.test(contract.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P74.2" && envelope.data.contract.telemetryExportAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P74.2 preview-only telemetry event contract records.\n- Does not enable external telemetry exporters, raw log streaming, raw JSON dumps, raw policy dumps, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, package, auth mutation, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Contract Shape", body: P74_2_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P74.2 Telemetry Event Contract Report", phase: "P74.2" },
);

printCheckReport("P74.2 Telemetry Event Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
