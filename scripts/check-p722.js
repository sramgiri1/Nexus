import {
  P72_2_REQUIRED_FIELDS,
  P72_2_SAMPLE_CONTRACTS,
  buildDbRuntimePrimaryContractEnvelope,
  createDbRuntimePrimaryContract,
  validateDbRuntimePrimaryContract,
} from "../db-runtime/p72-2-placeholder.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const REPORT_PATH = "reports/p722-report.md";
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const generatedContract = createDbRuntimePrimaryContract({
  allowedFiles: ["db-runtime/p72-2-placeholder.js"],
  evidenceRefs: ["reports/p722-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P72.2"],
});
const contracts = [...P72_2_SAMPLE_CONTRACTS, generatedContract];
const validations = contracts.map((contract) => validateDbRuntimePrimaryContract(contract));
const envelope = buildDbRuntimePrimaryContractEnvelope({
  allowedFiles: ["db-runtime/p72-2-placeholder.js"],
  evidenceRefs: ["reports/p722-report.md"],
  activityRefs: ["os-roadmap/phase-status.json#P72.2"],
});
const serialized = JSON.stringify(contracts);

addCheck("required fields listed", P72_2_REQUIRED_FIELDS.length >= 26, `${P72_2_REQUIRED_FIELDS.length} fields`);
addCheck("contracts validate", validations.every((validation) => validation.valid), validations.flatMap((validation) => validation.errors).join("; "));
addCheck("DB and project paths forbidden", contracts.every((contract) => contract.forbiddenFiles.includes("projects/**") && contract.forbiddenFiles.includes("db/**") && contract.forbiddenFiles.includes("prisma/**") && contract.forbiddenFiles.includes("migrations/**")));
addCheck("allowed files avoid DB/project paths", contracts.every((contract) => !contract.allowedFiles.some((filePath) => filePath.startsWith("projects/") || filePath.startsWith("db/") && filePath !== "db-runtime/p72-2-placeholder.js" || filePath.startsWith("prisma/") || filePath.startsWith("migrations/"))));
addCheck("DB writes migrations schema disabled", contracts.every((contract) => contract.dbWritesAllowed === false && contract.migrationsAllowed === false && contract.schemaMutationAllowed === false));
addCheck("project mutation disabled", contracts.every((contract) => contract.projectMutationAllowed === false));
addCheck("provider/tool/worker disabled", contracts.every((contract) => contract.providerDispatchAllowed === false && contract.toolExecutionAllowed === false && contract.workerExecutionAllowed === false));
addCheck("network/spend disabled", contracts.every((contract) => contract.networkCallsAllowed === false && contract.providerSpendAllowed === false));
addCheck("deploy/release/export/package disabled", contracts.every((contract) => contract.deployExecutionAllowed === false && contract.releaseExecutionAllowed === false && contract.exportExecutionAllowed === false && contract.packageCreationAllowed === false));
addCheck("blockers visible", contracts.every((contract) => contract.blockers.length >= 4));
addCheck("private IDs and DB URLs hidden", !/(?:project|private)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/postgres(?:ql)?:\/\//i.test(serialized));
addCheck("evidence and activity visible", contracts.every((contract) => contract.evidenceRefs.length > 0 && contract.activityRefs.length > 0));
addCheck("cost impact visible", contracts.every((contract) => contract.costImpact.includes("No DB service calls")));
addCheck("no fake runnable DB action", contracts.every((contract) => !/write now|migrate now|schema now|run db|execute now/i.test(contract.disabledReason)));
addCheck("envelope pass", envelope.status === "PASS" && envelope.phase === "P72.2" && envelope.data.contract.dbWritesAllowed === false);

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P72.2 display-safe DB runtime primary contract records.\n- Does not write DB state, create migrations, mutate schema, mutate projects, dispatch providers/tools/workers, call network services, deploy, release, export, package, or spend provider budget." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Contract Shape", body: P72_2_REQUIRED_FIELDS.map((field) => `- ${field}`).join("\n") },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P72.2 DB Runtime Primary Contract Report", phase: "P72.2" },
);

printCheckReport("P72.2 DB Runtime Primary Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
