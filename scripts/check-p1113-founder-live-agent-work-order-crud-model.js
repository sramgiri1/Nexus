import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { initializeSqliteRuntime, isSqliteCliAvailable } from "../db/sqliteRuntime.js";
import {
  P111_AGENT_WORK_ORDER_DB_ENTITIES,
  P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PHASE,
  buildFounderLiveAgentWorkOrderPersistenceContract,
  buildSafeAgentWorkOrderDbRecord,
  executeApprovedAgentWorkOrderDbCrudRequest,
  validateFounderLiveAgentWorkOrderPersistenceContract,
} from "../live-ready/founderLiveAgentWorkOrderPersistence.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1113-founder-live-agent-work-order-crud-model-report.md";
const TEST_DB = "local-state/runtime/check-p1113.sqlite";

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
const contract = readJson("contracts/os-roadmap/p111-founder-live-agent-work-order-persistence-contracts.json");
const plan = readText("docs/architecture/P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const moduleSource = readText("live-ready/founderLiveAgentWorkOrderPersistence.js");
const p1113 = contract.subphases?.find((entry) => entry.phaseId === "P111.3") || {};
const p1114 = contract.subphases?.find((entry) => entry.phaseId === "P111.4") || {};
const blockedWorkflow = buildFounderLiveAgentWorkOrderPersistenceContract();
const readyWorkflow = buildFounderLiveAgentWorkOrderPersistenceContract({
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
});
const blockedValidation = validateFounderLiveAgentWorkOrderPersistenceContract(blockedWorkflow);
const readyValidation = validateFounderLiveAgentWorkOrderPersistenceContract(readyWorkflow);
const defaultBlocked = executeApprovedAgentWorkOrderDbCrudRequest({ sqliteEntity: "founder_agent_work_orders", requestKey: "default-blocked" });
const unapprovedBlocked = executeApprovedAgentWorkOrderDbCrudRequest(
  { sqliteEntity: "founder_agent_work_orders", requestKey: "unapproved" },
  { execute: true, mode: "sqlite-live", enableWrites: true },
);
const deleteBlocked = executeApprovedAgentWorkOrderDbCrudRequest(
  { sqliteEntity: "founder_agent_work_orders", requestKey: "delete" },
  { execute: true, operation: "delete", operatorApproval: true, rollbackAccepted: true, auditAccepted: true, validationCommandsAccepted: true, mode: "sqlite-live", enableWrites: true },
);
const outsideAllowlistBlocked = executeApprovedAgentWorkOrderDbCrudRequest(
  { sqliteEntity: "business_build_sessions", requestKey: "outside" },
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
  for (const entity of P111_AGENT_WORK_ORDER_DB_ENTITIES) {
    writeResults.push(executeApprovedAgentWorkOrderDbCrudRequest(
      { sqliteEntity: entity, requestKey: `write-${entity}` },
      { ...sqliteInput, operation: "upsert", record: buildSafeAgentWorkOrderDbRecord(entity, { workOrderKey: "p1113-check", timestamp: "2026-05-28T00:00:00.000Z" }) },
    ));
  }
  readResult = executeApprovedAgentWorkOrderDbCrudRequest(
    { sqliteEntity: "founder_agent_work_orders", requestKey: "read-entry" },
    { ...sqliteInput, operation: "read", id: "p1113-work-order-p1113-check" },
  );
  updateResult = executeApprovedAgentWorkOrderDbCrudRequest(
    { sqliteEntity: "founder_agent_work_orders", requestKey: "update-entry" },
    { ...sqliteInput, operation: "update", id: "p1113-work-order-p1113-check", patch: { workOrderState: "updated_locally", updatedAt: "2026-05-28T00:00:00.000Z" } },
  );
  listResult = executeApprovedAgentWorkOrderDbCrudRequest(
    { sqliteEntity: "founder_agent_work_orders", requestKey: "list-entry" },
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1113-founder-live-agent-work-order-crud-model"]));
addCheck("phase export is P111.3", P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PHASE === "P111.3");
addCheck("allowed entity list is scoped", P111_AGENT_WORK_ORDER_DB_ENTITIES.length === 3 && P111_AGENT_WORK_ORDER_DB_ENTITIES.every((entity) => entity.startsWith("founder_agent_work_order")));
addCheck("blocked workflow validates", blockedValidation.valid, blockedValidation.errors.join("; "));
addCheck("ready workflow validates", readyValidation.valid, readyValidation.errors.join("; "));
addCheck("workflow covers local CRUD requests", readyWorkflow.data.localCrudRequests.length === 3 && readyWorkflow.data.allowedLocalCrudOperations.join(",") === "create,read,update,upsert,list");
addCheck("default execution is blocked", defaultBlocked.admitted === false && defaultBlocked.written === false && /execute=true/.test(defaultBlocked.disabledReason));
addCheck("unapproved execution is blocked", unapprovedBlocked.admitted === false && /operator approval/.test(unapprovedBlocked.disabledReason));
addCheck("delete is blocked", deleteBlocked.admitted === false && deleteBlocked.errors.some((error) => /Delete/.test(error)));
addCheck("outside allowlist is blocked", outsideAllowlistBlocked.admitted === false && outsideAllowlistBlocked.errors.some((error) => /not allowed/.test(error)));
addCheck("blocked results keep unsafe flags false", [defaultBlocked, unapprovedBlocked, deleteBlocked, outsideAllowlistBlocked].every(allFlagsFalse));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P111.3 CRUD validation");
addCheck("isolated DB initializes", !cliAvailable || (init.initialized === true && existsSync(join(ROOT, TEST_DB))));
addCheck("approved local CRUD writes work order records", !cliAvailable || writeResults.length === 3 && writeResults.every((result) => result.ok === true && result.admitted === true && result.written === true && result.hostedDbWritesAllowed === false && result.projectMutationAllowed === false));
addCheck("approved local CRUD reads work order record", !cliAvailable || readResult?.record?.workOrderId === "p1113-work-order-p1113-check");
addCheck("approved local CRUD updates work order record", !cliAvailable || updateResult?.record?.workOrderState === "updated_locally");
addCheck("approved local CRUD lists work order records", !cliAvailable || listResult?.records?.some((entry) => entry.workOrderId === "p1113-work-order-p1113-check"));
addCheck("module reuses sqlite repository", moduleSource.includes("insertSqliteEntity") && moduleSource.includes("updateSqliteEntity") && moduleSource.includes("listSqliteEntityRecords"));
addCheck("module reuses handoff and admission helpers", moduleSource.includes("buildFounderLiveHandoffWorkOrders") && moduleSource.includes("buildFounderLiveWorkAdmission"));
addCheck("contract marks P111.3 complete", p1113.status === "complete" && ["planned", "complete"].includes(p1114.status));
addCheck("docs record P111.3", /P111\.3 Governed Local Work Order CRUD Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P111.3", /P111\.3 governed local CRUD model/.test(readme) && /P111\.4\s+is\s+next/.test(readme));
addCheck("platform roadmap records P111.3", /P111\.3 is complete/.test(platformRoadmap) && /P111\.4 is next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P111.3"
      && status.previousPhase === "P111.2"
      && status.nextPhase === "P111.4"
      && roadmap.currentPhase === "P111.3"
      && roadmap.previousPhase === "P111.2"
      && roadmap.nextPhase === "P111.4")
    || (status.currentPhase === "P111.4"
      && status.previousPhase === "P111.3"
      && status.nextPhase === "P111.5"
      && roadmap.currentPhase === "P111.4"
      && roadmap.previousPhase === "P111.3"
      && roadmap.nextPhase === "P111.5"))
    && statusById.get("P111.3")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P111.4")?.status)
    && roadmapById.get("P111.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
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
        "- Validates P111.3 governed local founder agent work order CRUD model.",
        "- Confirms approved create/read/update/upsert/list paths for allowlisted local work order records in an isolated SQLite DB.",
        "- Confirms default execution, unapproved execution, delete, outside allowlist, hosted DB mutation, raw SQL, project mutation, provider/model calls, agent dispatch, worker/tool execution, runtime admission, execution unlock, deploy, release, export, package, network calls, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1113-founder-live-agent-work-order-crud-model",
        "- npm run check:p1112-founder-live-agent-work-order-schema",
        "- npm run check:p1111-founder-live-agent-work-order-persistence-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P111.3 admits local SQLite CRUD only for allowlisted founder agent work order OS records after explicit local approval gates. It does not wire Command Center to DB records, unlock execution, admit runtime execution, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P111.3 Founder Live Agent Work Order CRUD Model Report", phase: "P111.3" },
);

printCheckReport("P111.3 Founder Live Agent Work Order CRUD Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
