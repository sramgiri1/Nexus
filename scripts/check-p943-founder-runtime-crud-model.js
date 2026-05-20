import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { initializeSqliteRuntime, isSqliteCliAvailable } from "../db/sqliteRuntime.js";
import {
  P94_FOUNDER_RUNTIME_DB_ENTITIES,
  buildFounderRuntimeDbCrudWorkflow,
  buildSafeFounderRuntimeDbRecord,
  executeApprovedFounderRuntimeDbCrudRequest,
  validateFounderRuntimeDbCrudWorkflow,
} from "../live-ready/founderRuntimeDbCrudWorkflow.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p943-founder-runtime-crud-model-report.md";
const TEST_DB = "local-state/runtime/check-p943.sqlite";

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
const contract = readJson("contracts/os-roadmap/p94-execution-contracts.json");
const docs = readText("docs/architecture/P94_FOUNDER_RUNTIME_DB_CRUD_WORKFLOW_WIRING_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p943 = contract.subphases?.find((entry) => entry.phaseId === "P94.3");
const source = readText("live-ready/founderRuntimeDbCrudWorkflow.js");
const workflow = buildFounderRuntimeDbCrudWorkflow({ founderIdeaSummary: "Build a simple iOS Snake game for the App Store" });
const validation = validateFounderRuntimeDbCrudWorkflow(workflow);
const defaultBlocked = executeApprovedFounderRuntimeDbCrudRequest({ sqliteEntity: "founder_sessions", requestKey: "default-blocked" });
const unapprovedBlocked = executeApprovedFounderRuntimeDbCrudRequest(
  { sqliteEntity: "founder_sessions", requestKey: "unapproved" },
  { execute: true, mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB },
);
const deleteBlocked = executeApprovedFounderRuntimeDbCrudRequest(
  { sqliteEntity: "founder_sessions", requestKey: "delete" },
  {
    execute: true,
    operatorApproval: true,
    rollbackAccepted: true,
    auditAccepted: true,
    validationCommandsAccepted: true,
    mode: "sqlite-live",
    enableWrites: true,
    dbPath: TEST_DB,
    operation: "delete",
  },
);
const outsideAllowlistBlocked = executeApprovedFounderRuntimeDbCrudRequest(
  { sqliteEntity: "runtime_tasks", requestKey: "outside" },
  {
    execute: true,
    operatorApproval: true,
    rollbackAccepted: true,
    auditAccepted: true,
    validationCommandsAccepted: true,
    mode: "sqlite-live",
    enableWrites: true,
    dbPath: TEST_DB,
  },
);

const cliAvailable = isSqliteCliAvailable();
const init = cliAvailable
  ? initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: false, reset: true })
  : { initialized: false, tableCount: 0 };
const approvedInput = {
  execute: true,
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
  dbPath: TEST_DB,
  timestamp: "2026-05-20T22:45:00.000Z",
  sessionKey: "snake-ios",
};

const writeResults = [];
let readResult = { record: null };
let listResult = { records: [] };
let updateResult = { record: null };
if (cliAvailable && init.initialized) {
  for (const entity of P94_FOUNDER_RUNTIME_DB_ENTITIES) {
    writeResults.push(executeApprovedFounderRuntimeDbCrudRequest(
      { sqliteEntity: entity, requestKey: `write-${entity}` },
      { ...approvedInput, operation: "create", record: buildSafeFounderRuntimeDbRecord(entity, approvedInput) },
    ));
  }
  readResult = executeApprovedFounderRuntimeDbCrudRequest(
    { sqliteEntity: "founder_sessions", requestKey: "read-session" },
    { ...approvedInput, operation: "read", id: "p943-session-snake-ios" },
  );
  updateResult = executeApprovedFounderRuntimeDbCrudRequest(
    { sqliteEntity: "founder_sessions", requestKey: "update-session" },
    { ...approvedInput, operation: "update", id: "p943-session-snake-ios", patch: { currentState: "prd_ready_locally", updatedAt: "2026-05-20T22:46:00.000Z" } },
  );
  listResult = executeApprovedFounderRuntimeDbCrudRequest(
    { sqliteEntity: "founder_sessions", requestKey: "list-session" },
    { ...approvedInput, operation: "list", limit: 5 },
  );
}

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p943-founder-runtime-crud-model"]));
addCheck("contract tracks P94.3 complete", p943?.status === "complete" && p943.allowedFiles?.includes("live-ready/founderRuntimeDbCrudWorkflow.js"));
addCheck("workflow validates", validation.valid, validation.errors.join("; "));
addCheck("workflow covers founder DB entities", P94_FOUNDER_RUNTIME_DB_ENTITIES.length === 4 && P94_FOUNDER_RUNTIME_DB_ENTITIES.every((entity) => workflow.data?.mutationRequests?.some((request) => request.sqliteEntity === entity)));
addCheck("workflow is display-safe", workflow.data?.founderSession?.publicLabel === "Founder session" && !/private-project-|project_[A-Za-z0-9_-]*\d|token_|tenant_|workspace_|Bearer\s+/i.test(JSON.stringify(workflow.data)));
addCheck("workflow keeps unsafe flags blocked", workflow.data?.providerCallsAllowed === false && workflow.data?.agentDispatchAllowed === false && workflow.data?.projectMutationAllowed === false && workflow.data?.hostedDbWritesAllowed === false && workflow.data?.providerSpendAllowed === false);
addCheck("default admission remains blocked", defaultBlocked.admitted === false && defaultBlocked.written === false && defaultBlocked.disabledReason.includes("execute=true"));
addCheck("unapproved admission remains blocked", unapprovedBlocked.admitted === false && unapprovedBlocked.disabledReason.includes("operator approval"));
addCheck("delete remains blocked", deleteBlocked.admitted === false && deleteBlocked.disabledReason.includes("Delete"));
addCheck("outside allowlist remains blocked", outsideAllowlistBlocked.admitted === false && outsideAllowlistBlocked.errors.some((error) => error.includes("runtime_tasks")));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P94.3 CRUD validation");
addCheck("test DB initialized", !cliAvailable || (init.initialized === true && init.tableCount >= 22 && existsSync(join(ROOT, TEST_DB))));
addCheck("approved local writes work for founder entities", !cliAvailable || writeResults.length === 4 && writeResults.every((result) => result.admitted === true && result.written === true && result.errors.length === 0));
addCheck("read/list operations work through admission", !cliAvailable || (readResult.record?.sessionId === "p943-session-snake-ios" && listResult.records.some((record) => record.sessionId === "p943-session-snake-ios")));
addCheck("update works through admission", !cliAvailable || updateResult.record?.currentState === "prd_ready_locally");
addCheck("write result keeps unsafe runtime blocked", !cliAvailable || writeResults.every((result) => result.hostedDbWritesAllowed === false && result.projectMutationAllowed === false && result.providerSpendAllowed === false && result.agentDispatchAllowed === false));
addCheck("docs record P94.3", docs.includes("P94.3 is complete") && docs.includes("npm run check:p943-founder-runtime-crud-model"));
addCheck("platform roadmap records P94.3", platformRoadmap.includes("P94.3 is complete") && (platformRoadmap.includes("P94.4 is next") || platformRoadmap.includes("P94.4 is complete")));
addCheck(
  "phase status advanced",
  statusById.get("P94.3")?.status === "complete"
    && ["P94.3", "P94.4", "P94.5", "P94.6", "P94.7"].includes(status.currentPhase)
    && ["P94.2", "P94.3", "P94.4", "P94.5", "P94.6"].includes(status.previousPhase)
    && ["P94.4", "P94.5", "P94.6", "P94.7", "P95"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P94.3", roadmapById.get("P94.3")?.status === "complete" && ["planned", "complete"].includes(roadmapById.get("P94.4")?.status));
addCheck("no unsafe imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(source));
addCheck("no raw SQL or delete acceptance", !/rawSqlAccepted:\s*true|deleteSqliteEntity/i.test(source) && source.includes("Delete is not admitted in P94.3."));
addCheck("no fake unsafe runnable actions", !/"dispatch agent now"|"run worker now"|"write project now"|"deploy now"|"spend now"|"call provider now"|"create project now"|"write sqlite now"/i.test(source));

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P94.3 governed local founder runtime DB CRUD model.",
        "- Confirms founder workflow CRUD is allowlisted to P94.2 entities and blocked by default.",
        "- Confirms approved local SQLite create/read/update/list works in an isolated test DB while unsafe runtime actions remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p943-founder-runtime-crud-model",
        "- npm run check:p942-founder-runtime-db-schema",
        "- npm run check:p941-founder-runtime-db-crud-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P94.3 adds local SQLite founder workflow CRUD admission only. It does not wire Command Center to DB records, dispatch agents, execute workers/tools, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P94.3 Founder Runtime CRUD Model Report", phase: "P94.3" },
);

printCheckReport("P94.3 Founder Runtime CRUD Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
