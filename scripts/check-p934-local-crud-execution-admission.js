import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { initializeSqliteRuntime, isSqliteCliAvailable } from "../db/sqliteRuntime.js";
import { getSqliteEntityById } from "../db/sqliteCrudRepository.js";
import { buildGovernedRuntimeMutationRequest } from "../live-ready/governedRuntimeMutationRequest.js";
import {
  P93_ALLOWED_LOCAL_CRUD_ENTITIES,
  buildLocalCrudExecutionAdmission,
  buildSafeLocalCrudRecord,
  executeApprovedLocalCrudMutationRequest,
  validateLocalCrudExecutionAdmission,
} from "../live-ready/localCrudExecutionAdmission.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p934-local-crud-execution-admission-report.md";
const TEST_DB = "local-state/runtime/check-p934.sqlite";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

rmSync(join(ROOT, TEST_DB), { force: true });

const cliAvailable = isSqliteCliAvailable();
const init = cliAvailable
  ? initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: false, reset: true })
  : { initialized: false, tableCount: 0 };

const requestEnvelope = buildGovernedRuntimeMutationRequest();
const requests = requestEnvelope.data?.mutationRequests || [];
const admission = buildLocalCrudExecutionAdmission();
const validation = validateLocalCrudExecutionAdmission(admission);
const disabledResult = executeApprovedLocalCrudMutationRequest(requests[0], {});
const unapprovedResult = executeApprovedLocalCrudMutationRequest(requests[0], {
  execute: true,
  mode: "sqlite-live",
  enableWrites: true,
  dbPath: TEST_DB,
});
const deleteResult = executeApprovedLocalCrudMutationRequest(requests[0], {
  execute: true,
  operation: "delete",
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
  dbPath: TEST_DB,
});
const unknownEntityResult = executeApprovedLocalCrudMutationRequest({
  requestKey: "p934-unknown",
  lane: "unknown",
  sqliteEntity: "projects",
}, {
  execute: true,
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
  dbPath: TEST_DB,
});

const liveOptions = {
  execute: true,
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
  dbPath: TEST_DB,
  timestamp: "2026-05-20T00:00:00.000Z",
};
const liveResults = cliAvailable && init.initialized
  ? requests.map((request) => executeApprovedLocalCrudMutationRequest(request, liveOptions))
  : [];
const readResult = cliAvailable && init.initialized
  ? executeApprovedLocalCrudMutationRequest(requests[0], { ...liveOptions, operation: "read" })
  : { read: false };
const listResult = cliAvailable && init.initialized
  ? executeApprovedLocalCrudMutationRequest(requests[0], { ...liveOptions, operation: "list" })
  : { read: false, records: [] };

const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readText("contracts/os-roadmap/p93-execution-contracts.json");
const docs = readText("docs/architecture/P93_ENTERPRISE_LIVE_RUNTIME_EXPANSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const admissionSource = readText("live-ready/localCrudExecutionAdmission.js");
const source = [
  admissionSource,
  readText("scripts/check-p934-local-crud-execution-admission.js"),
].join("\n");
const serialized = JSON.stringify(admission.data || {});
const unsafeImportPattern = new RegExp("from\\\\s+[\"'][^\"']*(projects|careloop|generated-projects|providers|tools|worker-runtime|deploy|release|exports|packages|prisma|migrations)/");

addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P93.4 admission validation");
addCheck("test DB initialized", !cliAvailable || (init.initialized === true && init.tableCount >= 10 && existsSync(join(ROOT, TEST_DB))));
addCheck("admission envelope valid", admission.status === "PASS" && admission.phase === "P93.4" && validation.valid, validation.errors.join("; "));
addCheck("allowed entities match P93 request lanes", P93_ALLOWED_LOCAL_CRUD_ENTITIES.length === requests.length && requests.every((request) => P93_ALLOWED_LOCAL_CRUD_ENTITIES.includes(request.sqliteEntity)));
addCheck("default admission remains blocked", admission.data?.admissionReadiness?.admittedCount === 0 && admission.data?.admissionEntries?.every((entry) => entry.localCrudExecutionAllowed === false && entry.dbWritesAllowed === false));
addCheck("disabled request does not write", disabledResult.ok === true && disabledResult.written === false && disabledResult.admitted === false);
addCheck("unapproved request does not write", unapprovedResult.ok === true && unapprovedResult.written === false && unapprovedResult.admitted === false);
addCheck("delete remains blocked", deleteResult.ok === false && deleteResult.written === false && deleteResult.disabledReason.includes("Delete"));
addCheck("non-allowlisted entity blocked", unknownEntityResult.ok === false && unknownEntityResult.written === false && unknownEntityResult.errors.some((error) => error.includes("not allowed")));
addCheck("approved live writes succeed", !cliAvailable || liveResults.length === requests.length && liveResults.every((result) => result.ok === true && result.admitted === true && result.written === true));
addCheck("records are readable after write", !cliAvailable || liveResults.every((result) => {
  const request = requests.find((item) => item.requestKey === result.requestKey);
  const record = buildSafeLocalCrudRecord(request, liveOptions);
  const primaryKey = Object.keys(record).find((key) => key.endsWith("Id")) || (result.entity === "roadmap_phases" ? "phase" : "");
  return Boolean(getSqliteEntityById(result.entity, record[primaryKey], { mode: "sqlite-live", dbPath: TEST_DB }));
}));
addCheck("read/list operations work through admission", !cliAvailable || (readResult.read === true && readResult.record && listResult.read === true && listResult.records.length >= 1));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p934-local-crud-execution-admission"]));
addCheck("contract tracks P93.4 files", contract.includes("P93.4") && contract.includes("live-ready/localCrudExecutionAdmission.js") && contract.includes("check:p934-local-crud-execution-admission"));
addCheck("docs record P93.4", docs.includes("P93.4 is complete") && docs.includes("npm run check:p934-local-crud-execution-admission"));
addCheck("platform roadmap records P93.4", platformRoadmap.includes("P93.4 is complete") && (platformRoadmap.includes("P93.5 is next") || platformRoadmap.includes("P93.5 is complete")));
addCheck(
  "phase status advanced",
  statusById.get("P93")?.status === "in_progress"
    && statusById.get("P93.4")?.status === "complete"
    && ["P93.4", "P93.5", "P93.6", "P93.7"].includes(status.currentPhase)
    && ["P93.3", "P93.4", "P93.5", "P93.6"].includes(status.previousPhase)
    && ["P93.5", "P93.6", "P93.7"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P93.4", roadmapById.get("P93.4")?.track === "NEXUS_OS" && roadmapById.get("P93.4")?.status === "complete");
addCheck("P93.5 handoff exists", ["planned", "complete"].includes(statusById.get("P93.5")?.status) && ["planned", "complete"].includes(roadmapById.get("P93.5")?.status));
addCheck("no unsafe imports", !unsafeImportPattern.test(source));
addCheck("no raw SQL acceptance", !/rawSqlAccepted\s*:\s*true|rawSql\s*\)/.test(source));
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-01|private-project-governed-build-mission|private_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(serialized + admissionSource));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(serialized));

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P93.4 local CRUD execution admission.",
        "- Confirms approved local SQLite CRUD is limited to the P93 OS runtime entity allowlist.",
        "- Confirms default state remains blocked and explicit operator approval plus sqlite-live/write flags are required before writes.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p934-local-crud-execution-admission",
        "- npm run check:p933-governed-runtime-mutation-request",
        "- npm run check:p932-enterprise-runtime-crud-plan",
        "- npm run check:p931-enterprise-live-runtime-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P93.4 admits local SQLite CRUD only for allowlisted OS runtime entities and only with explicit local approval/write flags. It does not mutate project source files, call providers/models, dispatch agents, execute tools/workers, use hosted DBs, network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P93.4 Local CRUD Execution Admission Report", phase: "P93.4" },
);

printCheckReport("P93.4 Local CRUD Execution Admission Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
