import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { initializeSqliteRuntime, isSqliteCliAvailable } from "../db/sqliteRuntime.js";
import {
  P97_BUSINESS_BUILD_DB_ENTITIES,
  P97_FOUNDER_BUSINESS_BUILD_EXECUTION_PHASE,
  buildFounderBusinessBuildExecutionContract,
  buildSafeBusinessBuildDbRecord,
  executeApprovedBusinessBuildDbCrudRequest,
  validateFounderBusinessBuildExecutionContract,
} from "../live-ready/founderBusinessBuildGovernedExecution.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p973-business-build-crud-model-report.md";
const TEST_DB = "local-state/runtime/check-p973.sqlite";

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

const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readJson("contracts/os-roadmap/p97-execution-contracts.json");
const docs = readText("docs/architecture/P97_FOUNDER_BUSINESS_BUILD_GOVERNED_EXECUTION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const moduleSource = readText("live-ready/founderBusinessBuildGovernedExecution.js");
const p973 = contract.subphases?.find((entry) => entry.phaseId === "P97.3");
const p974 = contract.subphases?.find((entry) => entry.phaseId === "P97.4");
const blockedWorkflow = buildFounderBusinessBuildExecutionContract();
const readyWorkflow = buildFounderBusinessBuildExecutionContract({
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
});
const blockedValidation = validateFounderBusinessBuildExecutionContract(blockedWorkflow);
const readyValidation = validateFounderBusinessBuildExecutionContract(readyWorkflow);
const defaultBlocked = executeApprovedBusinessBuildDbCrudRequest({ sqliteEntity: "business_build_sessions", requestKey: "default-blocked" });
const unapprovedBlocked = executeApprovedBusinessBuildDbCrudRequest(
  { sqliteEntity: "business_build_sessions", requestKey: "unapproved" },
  { execute: true, mode: "sqlite-live", enableWrites: true },
);
const deleteBlocked = executeApprovedBusinessBuildDbCrudRequest(
  { sqliteEntity: "business_build_sessions", requestKey: "delete" },
  { execute: true, operation: "delete", operatorApproval: true, rollbackAccepted: true, auditAccepted: true, validationCommandsAccepted: true, mode: "sqlite-live", enableWrites: true },
);
const outsideAllowlistBlocked = executeApprovedBusinessBuildDbCrudRequest(
  { sqliteEntity: "founder_sessions", requestKey: "outside" },
  { execute: true, operatorApproval: true, rollbackAccepted: true, auditAccepted: true, validationCommandsAccepted: true, mode: "sqlite-live", enableWrites: true },
);

const cliAvailable = isSqliteCliAvailable();
let init = { initialized: false };
let writeResults = [];
let readResult = null;
let updateResult = null;
let listResult = null;

if (cliAvailable) {
  init = initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: false, reset: true });
  const sqliteInput = {
    execute: true,
    operatorApproval: true,
    rollbackAccepted: true,
    auditAccepted: true,
    validationCommandsAccepted: true,
    mode: "sqlite-live",
    enableWrites: true,
    dbPath: TEST_DB,
  };
  for (const entity of P97_BUSINESS_BUILD_DB_ENTITIES) {
    writeResults.push(executeApprovedBusinessBuildDbCrudRequest(
      { sqliteEntity: entity, requestKey: `write-${entity}` },
      { ...sqliteInput, operation: "upsert", record: buildSafeBusinessBuildDbRecord(entity, { buildSessionKey: "p973-check", timestamp: "2026-05-21T00:00:00.000Z" }) },
    ));
  }
  readResult = executeApprovedBusinessBuildDbCrudRequest(
    { sqliteEntity: "business_build_sessions", requestKey: "read-session" },
    { ...sqliteInput, operation: "read", id: "p973-build-p973-check" },
  );
  updateResult = executeApprovedBusinessBuildDbCrudRequest(
    { sqliteEntity: "business_build_sessions", requestKey: "update-session" },
    { ...sqliteInput, operation: "update", id: "p973-build-p973-check", patch: { currentState: "updated_locally", updatedAt: "2026-05-21T00:00:00.000Z" } },
  );
  listResult = executeApprovedBusinessBuildDbCrudRequest(
    { sqliteEntity: "business_build_sessions", requestKey: "list-session" },
    { ...sqliteInput, operation: "list", limit: 10 },
  );
}

const unsafeRuntimeFlags = [
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "localExecutorRunAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "newWorkspaceFileWritesAllowed",
  "existingProjectMutationAllowed",
  "hostedDbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
];

function allFlagsFalse(value = {}) {
  return unsafeRuntimeFlags.every((flag) => value[flag] === false);
}

const serialized = JSON.stringify([blockedWorkflow.data, readyWorkflow.data, defaultBlocked, unapprovedBlocked, deleteBlocked, outsideAllowlistBlocked]);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p973-business-build-crud-model"]));
addCheck("phase export is P97.3", P97_FOUNDER_BUSINESS_BUILD_EXECUTION_PHASE === "P97.3");
addCheck("allowed entity list is scoped", P97_BUSINESS_BUILD_DB_ENTITIES.length === 4 && P97_BUSINESS_BUILD_DB_ENTITIES.every((entity) => entity.startsWith("business_build_")));
addCheck("blocked workflow validates", blockedValidation.valid, blockedValidation.errors.join("; "));
addCheck("ready workflow validates", readyValidation.valid, readyValidation.errors.join("; "));
addCheck("workflow covers local CRUD requests", readyWorkflow.data.localCrudRequests.length === 4 && readyWorkflow.data.allowedLocalCrudOperations.join(",") === "create,read,update,upsert,list");
addCheck("default execution is blocked", defaultBlocked.admitted === false && defaultBlocked.written === false && /execute=true/.test(defaultBlocked.disabledReason));
addCheck("unapproved execution is blocked", unapprovedBlocked.admitted === false && /operator approval/.test(unapprovedBlocked.disabledReason));
addCheck("delete is blocked", deleteBlocked.admitted === false && deleteBlocked.errors.some((error) => /Delete/.test(error)));
addCheck("outside allowlist is blocked", outsideAllowlistBlocked.admitted === false && outsideAllowlistBlocked.errors.some((error) => /not allowed/.test(error)));
addCheck("blocked results keep unsafe flags false", [defaultBlocked, unapprovedBlocked, deleteBlocked, outsideAllowlistBlocked].every(allFlagsFalse));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P97.3 CRUD validation");
addCheck("isolated DB initializes", !cliAvailable || (init.initialized === true && existsSync(join(ROOT, TEST_DB))));
addCheck("approved local CRUD writes business build records", !cliAvailable || writeResults.length === 4 && writeResults.every((result) => result.ok === true && result.admitted === true && result.written === true && result.hostedDbWritesAllowed === false && result.projectMutationAllowed === false));
addCheck("approved local CRUD reads business build record", !cliAvailable || readResult?.record?.buildSessionId === "p973-build-p973-check");
addCheck("approved local CRUD updates business build record", !cliAvailable || updateResult?.record?.currentState === "updated_locally");
addCheck("approved local CRUD lists business build records", !cliAvailable || listResult?.records?.some((entry) => entry.buildSessionId === "p973-build-p973-check"));
addCheck("module reuses sqlite repository", moduleSource.includes("insertSqliteEntity") && moduleSource.includes("updateSqliteEntity") && moduleSource.includes("listSqliteEntityRecords"));
addCheck("contract marks P97.3 complete", p973?.status === "complete" && ["planned", "complete"].includes(p974?.status));
addCheck("docs record P97.3", docs.includes("P97.3 is complete") && docs.includes("npm run check:p973-business-build-crud-model"));
addCheck("platform roadmap records P97.3", platformRoadmap.includes("P97.3 is complete") && (platformRoadmap.includes("P97.4 is next") || platformRoadmap.includes("P97.4 is planned") || platformRoadmap.includes("P97.4 is complete")));
addCheck(
  "phase status advanced",
  statusById.get("P97.3")?.status === "complete"
    && ["P97.3", "P97.4"].includes(status.currentPhase)
    && ["P97.2", "P97.3"].includes(status.previousPhase)
    && ["P97.4", "P97.5"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P97.3", roadmapById.get("P97.3")?.status === "complete" && ["planned", "complete"].includes(roadmapById.get("P97.4")?.status));
addCheck("no raw private IDs exposed", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized));
addCheck("no fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(serialized));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(moduleSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(moduleSource));

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P97.3 governed local Business Build CRUD model.",
        "- Confirms approved create/read/update/upsert/list paths for allowlisted Business Build records in an isolated SQLite DB.",
        "- Confirms delete, raw SQL, hosted DB mutation, project mutation, provider/model calls, agent dispatch, worker/tool execution, deploy, release, export, package, network calls, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p973-business-build-crud-model",
        "- npm run check:p972-business-build-db-schema",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P97.3 admits local SQLite CRUD only for allowlisted Business Build OS records after explicit local approval gates. It does not dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P97.3 Business Build CRUD Model Report", phase: "P97.3" },
);

printCheckReport("P97.3 Business Build CRUD Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
