import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { initializeSqliteRuntime, isSqliteCliAvailable } from "../db/sqliteRuntime.js";
import {
  P116_FOUNDER_LIVE_RUNTIME_EXECUTION_READINESS_PHASE,
  P116_RUNTIME_EXECUTION_DB_ENTITIES,
  buildFounderLiveRuntimeExecutionReadinessContract,
  buildSafeRuntimeExecutionDbRecord,
  executeApprovedRuntimeExecutionDbCrudRequest,
  validateFounderLiveRuntimeExecutionReadinessContract,
} from "../live-ready/founderLiveRuntimeExecutionReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1163-founder-live-runtime-execution-readiness-report.md";
const TEST_DB = "local-state/runtime/check-p1163.sqlite";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function changedFiles() {
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]{1,2}\s+/, ""))
    .map((line) => (line.includes(" -> ") ? line.split(" -> ").pop() : line));
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
const contract = readJson("contracts/os-roadmap/p116-founder-live-runtime-execution-readiness-contracts.json");
const plan = readText("docs/architecture/P116_FOUNDER_LIVE_RUNTIME_EXECUTION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const moduleSource = readText("live-ready/founderLiveRuntimeExecutionReadiness.js");
const p1162Checker = readText("scripts/check-p1162-founder-live-runtime-execution-readiness.js");
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1163 = subphaseById.get("P116.3") || {};
const p1164 = subphaseById.get("P116.4") || {};

const blockedWorkflow = buildFounderLiveRuntimeExecutionReadinessContract();
const readyWorkflow = buildFounderLiveRuntimeExecutionReadinessContract({
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
});
const blockedValidation = validateFounderLiveRuntimeExecutionReadinessContract(blockedWorkflow);
const readyValidation = validateFounderLiveRuntimeExecutionReadinessContract(readyWorkflow);
const defaultBlocked = executeApprovedRuntimeExecutionDbCrudRequest({ sqliteEntity: "founder_runtime_execution_readiness_items", requestKey: "default-blocked" });
const unapprovedBlocked = executeApprovedRuntimeExecutionDbCrudRequest(
  { sqliteEntity: "founder_runtime_execution_readiness_items", requestKey: "unapproved" },
  { execute: true, mode: "sqlite-live", enableWrites: true },
);
const deleteBlocked = executeApprovedRuntimeExecutionDbCrudRequest(
  { sqliteEntity: "founder_runtime_execution_readiness_items", requestKey: "delete" },
  { execute: true, operation: "delete", operatorApproval: true, rollbackAccepted: true, auditAccepted: true, validationCommandsAccepted: true, mode: "sqlite-live", enableWrites: true },
);
const outsideAllowlistBlocked = executeApprovedRuntimeExecutionDbCrudRequest(
  { sqliteEntity: "founder_runtime_admission_readiness_items", requestKey: "outside" },
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
  for (const entity of P116_RUNTIME_EXECUTION_DB_ENTITIES) {
    writeResults.push(executeApprovedRuntimeExecutionDbCrudRequest(
      { sqliteEntity: entity, requestKey: `write-${entity}` },
      { ...sqliteInput, operation: "upsert", record: buildSafeRuntimeExecutionDbRecord(entity, { executionKey: "p1163-check", timestamp: "2026-05-29T00:00:00.000Z" }) },
    ));
  }
  readResult = executeApprovedRuntimeExecutionDbCrudRequest(
    { sqliteEntity: "founder_runtime_execution_readiness_items", requestKey: "read-entry" },
    { ...sqliteInput, operation: "read", id: "p1163-runtime-execution-p1163-check" },
  );
  updateResult = executeApprovedRuntimeExecutionDbCrudRequest(
    { sqliteEntity: "founder_runtime_execution_readiness_items", requestKey: "update-entry" },
    { ...sqliteInput, operation: "update", id: "p1163-runtime-execution-p1163-check", patch: { executionState: "updated_locally", updatedAt: "2026-05-29T00:00:00.000Z" } },
  );
  listResult = executeApprovedRuntimeExecutionDbCrudRequest(
    { sqliteEntity: "founder_runtime_execution_readiness_items", requestKey: "list-entry" },
    { ...sqliteInput, operation: "list", limit: 10 },
  );
}

const unsafeRuntimeFlags = [
  "runtimeAdmissionAllowed",
  "runtimeTransitionAllowed",
  "runtimeExecutionAllowed",
  "executionAllowed",
  "executionUnlockAllowed",
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

const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P116.3";
const allowedFiles = new Set(p1163.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "db/",
  "dashboard/src/",
  "dashboard/tests/",
  "local-state/runtime/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
  ".env",
];
const serialized = JSON.stringify([blockedWorkflow.data, readyWorkflow.data, defaultBlocked, unapprovedBlocked, deleteBlocked, outsideAllowlistBlocked]);
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1163-founder-live-runtime-execution-readiness"]));
addCheck("phase export is P116.3", P116_FOUNDER_LIVE_RUNTIME_EXECUTION_READINESS_PHASE === "P116.3");
addCheck("allowed entity list is scoped", P116_RUNTIME_EXECUTION_DB_ENTITIES.length === 3 && P116_RUNTIME_EXECUTION_DB_ENTITIES.every((entity) => entity.startsWith("founder_runtime_execution")));
addCheck("blocked workflow validates", blockedValidation.valid, blockedValidation.errors.join("; "));
addCheck("ready workflow validates", readyValidation.valid, readyValidation.errors.join("; "));
addCheck("workflow covers local CRUD requests", readyWorkflow.data.localCrudRequests.length === 3 && readyWorkflow.data.allowedLocalCrudOperations.join(",") === "create,read,update,upsert,list");
addCheck("runtime execution remains blocked in workflow", readyWorkflow.data.runtimeExecutionAllowed === false && readyWorkflow.data.executionUnlockAllowed === false && readyWorkflow.data.agentDispatchAllowed === false);
addCheck("default execution is blocked", defaultBlocked.admitted === false && defaultBlocked.written === false && /execute=true/.test(defaultBlocked.disabledReason));
addCheck("unapproved execution is blocked", unapprovedBlocked.admitted === false && /operator approval/.test(unapprovedBlocked.disabledReason));
addCheck("delete is blocked", deleteBlocked.admitted === false && deleteBlocked.errors.some((error) => /Delete/.test(error)));
addCheck("outside allowlist is blocked", outsideAllowlistBlocked.admitted === false && outsideAllowlistBlocked.errors.some((error) => /not allowed/.test(error)));
addCheck("blocked results keep unsafe flags false", [defaultBlocked, unapprovedBlocked, deleteBlocked, outsideAllowlistBlocked].every(allFlagsFalse));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P116.3 CRUD validation");
addCheck("isolated DB initializes", !cliAvailable || (init.initialized === true && existsSync(join(ROOT, TEST_DB))));
addCheck("approved local CRUD writes runtime execution readiness records", !cliAvailable || writeResults.length === 3 && writeResults.every((result) => result.ok === true && result.admitted === true && result.written === true && result.hostedDbWritesAllowed === false && result.runtimeExecutionAllowed === false && result.executionAllowed === false && result.executionUnlockAllowed === false && result.projectMutationAllowed === false));
addCheck("approved local CRUD reads runtime execution readiness record", !cliAvailable || readResult?.record?.runtimeExecutionId === "p1163-runtime-execution-p1163-check");
addCheck("approved local CRUD updates runtime execution readiness record", !cliAvailable || updateResult?.record?.executionState === "updated_locally");
addCheck("approved local CRUD lists runtime execution readiness records", !cliAvailable || listResult?.records?.some((entry) => entry.runtimeExecutionId === "p1163-runtime-execution-p1163-check"));
addCheck("module reuses sqlite repository", moduleSource.includes("insertSqliteEntity") && moduleSource.includes("updateSqliteEntity") && moduleSource.includes("listSqliteEntityRecords"));
addCheck("module reuses runtime admission helper", moduleSource.includes("buildSafeRuntimeAdmissionDbRecord"));
addCheck("contract marks P116.3 complete", p1163.status === "complete" && ["planned", "complete"].includes(p1164.status));
addCheck("docs record P116.3", /P116\.3 Governed Local Execution CRUD Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P116.3", /P116\.3 governed local execution CRUD model/.test(readme) && /P116\.4\s+is\s+next/.test(readme));
addCheck("platform roadmap records P116.3", /P116\.3 is complete/.test(platformRoadmap) && /P116\.4 is next/.test(platformRoadmap));
addCheck("P116.2 checker accepts P116.3 handoff", p1162Checker.includes("P116.3") && p1162Checker.includes("P116.4") && p1162Checker.includes("scope check relaxed"));
addCheck(
  "phase status advanced",
  ["P116.3", "P116.4"].includes(status.currentPhase)
    && ["P116.2", "P116.3"].includes(status.previousPhase)
    && ["P116.4", "P116.5"].includes(status.nextPhase)
    && ["P116.3", "P116.4"].includes(roadmap.currentPhase)
    && ["P116.2", "P116.3"].includes(roadmap.previousPhase)
    && ["P116.4", "P116.5"].includes(roadmap.nextPhase)
    && statusById.get("P116")?.status === "in_progress"
    && statusById.get("P116.3")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P116.4")?.status)
    && ["planned", "complete"].includes(statusById.get("P116.5")?.status)
    && roadmapById.get("P116.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P116.3 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P116.3 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw runtime execution table names", !/(founder_runtime_execution_readiness_items|founder_runtime_execution_events|founder_runtime_execution_evidence_refs)/.test(publicDocsBundle));
addCheck("no raw private IDs exposed", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized));
addCheck("no fake runnable actions", !/run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute runtime now|execute now/i.test(serialized));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(moduleSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(moduleSource));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|runtime execution is live/i.test(docsBundle));

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P116.3 governed local founder runtime execution readiness CRUD model.",
        "- Confirms approved create/read/update/upsert/list paths for allowlisted local runtime execution readiness records in an isolated SQLite DB.",
        "- Confirms default execution, unapproved execution, delete, outside allowlist, hosted DB mutation, raw SQL, project mutation, provider/model calls, agent dispatch, worker/tool execution, runtime execution, execution unlock, deploy, release, export, package, network calls, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1163-founder-live-runtime-execution-readiness",
        "- npm run check:p1162-founder-live-runtime-execution-readiness",
        "- npm run check:p1161-founder-live-runtime-execution-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P116.3 admits local SQLite CRUD only for allowlisted founder runtime execution readiness OS records after explicit local approval gates. It does not wire Command Center to DB records, unlock execution, run workers/tools, dispatch agents, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P116.3 Founder Live Runtime Execution Readiness CRUD Model Report", phase: "P116.3" },
);

printCheckReport("P116.3 Founder Live Runtime Execution Readiness CRUD Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
