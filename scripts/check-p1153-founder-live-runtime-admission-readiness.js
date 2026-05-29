import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { initializeSqliteRuntime, isSqliteCliAvailable } from "../db/sqliteRuntime.js";
import {
  P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PHASE,
  P115_RUNTIME_ADMISSION_DB_ENTITIES,
  buildFounderLiveRuntimeAdmissionReadinessContract,
  buildSafeRuntimeAdmissionDbRecord,
  executeApprovedRuntimeAdmissionDbCrudRequest,
  validateFounderLiveRuntimeAdmissionReadinessContract,
} from "../live-ready/founderLiveRuntimeAdmissionReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1153-founder-live-runtime-admission-readiness-report.md";
const TEST_DB = "local-state/runtime/check-p1153.sqlite";

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
const contract = readJson("contracts/os-roadmap/p115-founder-live-runtime-admission-readiness-contracts.json");
const plan = readText("docs/architecture/P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const moduleSource = readText("live-ready/founderLiveRuntimeAdmissionReadiness.js");
const p1152Checker = readText("scripts/check-p1152-founder-live-runtime-admission-readiness.js");
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1153 = subphaseById.get("P115.3") || {};
const p1154 = subphaseById.get("P115.4") || {};

const blockedWorkflow = buildFounderLiveRuntimeAdmissionReadinessContract();
const readyWorkflow = buildFounderLiveRuntimeAdmissionReadinessContract({
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
});
const blockedValidation = validateFounderLiveRuntimeAdmissionReadinessContract(blockedWorkflow);
const readyValidation = validateFounderLiveRuntimeAdmissionReadinessContract(readyWorkflow);
const defaultBlocked = executeApprovedRuntimeAdmissionDbCrudRequest({ sqliteEntity: "founder_runtime_admission_readiness_items", requestKey: "default-blocked" });
const unapprovedBlocked = executeApprovedRuntimeAdmissionDbCrudRequest(
  { sqliteEntity: "founder_runtime_admission_readiness_items", requestKey: "unapproved" },
  { execute: true, mode: "sqlite-live", enableWrites: true },
);
const deleteBlocked = executeApprovedRuntimeAdmissionDbCrudRequest(
  { sqliteEntity: "founder_runtime_admission_readiness_items", requestKey: "delete" },
  { execute: true, operation: "delete", operatorApproval: true, rollbackAccepted: true, auditAccepted: true, validationCommandsAccepted: true, mode: "sqlite-live", enableWrites: true },
);
const outsideAllowlistBlocked = executeApprovedRuntimeAdmissionDbCrudRequest(
  { sqliteEntity: "founder_agent_dispatch_readiness_items", requestKey: "outside" },
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
  for (const entity of P115_RUNTIME_ADMISSION_DB_ENTITIES) {
    writeResults.push(executeApprovedRuntimeAdmissionDbCrudRequest(
      { sqliteEntity: entity, requestKey: `write-${entity}` },
      { ...sqliteInput, operation: "upsert", record: buildSafeRuntimeAdmissionDbRecord(entity, { admissionKey: "p1153-check", timestamp: "2026-05-29T00:00:00.000Z" }) },
    ));
  }
  readResult = executeApprovedRuntimeAdmissionDbCrudRequest(
    { sqliteEntity: "founder_runtime_admission_readiness_items", requestKey: "read-entry" },
    { ...sqliteInput, operation: "read", id: "p1153-runtime-admission-p1153-check" },
  );
  updateResult = executeApprovedRuntimeAdmissionDbCrudRequest(
    { sqliteEntity: "founder_runtime_admission_readiness_items", requestKey: "update-entry" },
    { ...sqliteInput, operation: "update", id: "p1153-runtime-admission-p1153-check", patch: { admissionState: "updated_locally", updatedAt: "2026-05-29T00:00:00.000Z" } },
  );
  listResult = executeApprovedRuntimeAdmissionDbCrudRequest(
    { sqliteEntity: "founder_runtime_admission_readiness_items", requestKey: "list-entry" },
    { ...sqliteInput, operation: "list", limit: 10 },
  );
}

const unsafeRuntimeFlags = [
  "runtimeAdmissionAllowed",
  "runtimeTransitionAllowed",
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
const enforceCurrentDiffScope = status.currentPhase === "P115.3";
const allowedFiles = new Set(p1153.allowedFiles || []);
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1153-founder-live-runtime-admission-readiness"]));
addCheck("phase export is P115.3", P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PHASE === "P115.3");
addCheck("allowed entity list is scoped", P115_RUNTIME_ADMISSION_DB_ENTITIES.length === 3 && P115_RUNTIME_ADMISSION_DB_ENTITIES.every((entity) => entity.startsWith("founder_runtime_admission")));
addCheck("blocked workflow validates", blockedValidation.valid, blockedValidation.errors.join("; "));
addCheck("ready workflow validates", readyValidation.valid, readyValidation.errors.join("; "));
addCheck("workflow covers local CRUD requests", readyWorkflow.data.localCrudRequests.length === 3 && readyWorkflow.data.allowedLocalCrudOperations.join(",") === "create,read,update,upsert,list");
addCheck("runtime admission remains blocked in workflow", readyWorkflow.data.runtimeAdmissionAllowed === false && readyWorkflow.data.executionAllowed === false && readyWorkflow.data.agentDispatchAllowed === false);
addCheck("default execution is blocked", defaultBlocked.admitted === false && defaultBlocked.written === false && /execute=true/.test(defaultBlocked.disabledReason));
addCheck("unapproved execution is blocked", unapprovedBlocked.admitted === false && /operator approval/.test(unapprovedBlocked.disabledReason));
addCheck("delete is blocked", deleteBlocked.admitted === false && deleteBlocked.errors.some((error) => /Delete/.test(error)));
addCheck("outside allowlist is blocked", outsideAllowlistBlocked.admitted === false && outsideAllowlistBlocked.errors.some((error) => /not allowed/.test(error)));
addCheck("blocked results keep unsafe flags false", [defaultBlocked, unapprovedBlocked, deleteBlocked, outsideAllowlistBlocked].every(allFlagsFalse));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P115.3 CRUD validation");
addCheck("isolated DB initializes", !cliAvailable || (init.initialized === true && existsSync(join(ROOT, TEST_DB))));
addCheck("approved local CRUD writes runtime admission readiness records", !cliAvailable || writeResults.length === 3 && writeResults.every((result) => result.ok === true && result.admitted === true && result.written === true && result.hostedDbWritesAllowed === false && result.runtimeAdmissionAllowed === false && result.executionAllowed === false && result.projectMutationAllowed === false));
addCheck("approved local CRUD reads runtime admission readiness record", !cliAvailable || readResult?.record?.runtimeAdmissionId === "p1153-runtime-admission-p1153-check");
addCheck("approved local CRUD updates runtime admission readiness record", !cliAvailable || updateResult?.record?.admissionState === "updated_locally");
addCheck("approved local CRUD lists runtime admission readiness records", !cliAvailable || listResult?.records?.some((entry) => entry.runtimeAdmissionId === "p1153-runtime-admission-p1153-check"));
addCheck("module reuses sqlite repository", moduleSource.includes("insertSqliteEntity") && moduleSource.includes("updateSqliteEntity") && moduleSource.includes("listSqliteEntityRecords"));
addCheck("module reuses dispatch helper", moduleSource.includes("buildSafeAgentDispatchDbRecord"));
addCheck("contract marks P115.3 complete", p1153.status === "complete" && ["planned", "complete"].includes(p1154.status));
addCheck("docs record P115.3", /P115\.3 Governed Local Admission CRUD Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P115.3", /P115\.3 governed local admission CRUD model/.test(readme) && /P115\.4\s+is\s+next/.test(readme));
addCheck("platform roadmap records P115.3", /P115\.3 is complete/.test(platformRoadmap) && /P115\.4 is next/.test(platformRoadmap));
addCheck("P115.2 checker accepts P115.3 handoff", p1152Checker.includes("P115.3") && p1152Checker.includes("P115.4") && p1152Checker.includes("scope check relaxed"));
addCheck(
  "phase status advanced",
  ["P115.3", "P115.4"].includes(status.currentPhase)
    && ["P115.2", "P115.3"].includes(status.previousPhase)
    && ["P115.4", "P115.5"].includes(status.nextPhase)
    && ["P115.3", "P115.4"].includes(roadmap.currentPhase)
    && ["P115.2", "P115.3"].includes(roadmap.previousPhase)
    && ["P115.4", "P115.5"].includes(roadmap.nextPhase)
    && statusById.get("P115")?.status === "in_progress"
    && statusById.get("P115.3")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P115.4")?.status)
    && ["planned", "complete"].includes(statusById.get("P115.5")?.status)
    && roadmapById.get("P115.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P115.3 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P115.3 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw runtime admission table names", !/(founder_runtime_admission_readiness_items|founder_runtime_admission_events|founder_runtime_admission_evidence_refs)/.test(publicDocsBundle));
addCheck("no raw private IDs exposed", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized));
addCheck("no fake runnable actions", !/admit runtime now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(serialized));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(moduleSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(moduleSource));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|runtime execution is enabled|runtime admission is live/i.test(docsBundle));

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P115.3 governed local founder runtime admission readiness CRUD model.",
        "- Confirms approved create/read/update/upsert/list paths for allowlisted local runtime admission readiness records in an isolated SQLite DB.",
        "- Confirms default execution, unapproved execution, delete, outside allowlist, runtime admission, execution unlock, hosted DB mutation, raw SQL, project mutation, provider/model calls, agent dispatch, worker/tool execution, deploy, release, export, package, network calls, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1153-founder-live-runtime-admission-readiness",
        "- npm run check:p1152-founder-live-runtime-admission-readiness",
        "- npm run check:p1151-founder-live-runtime-admission-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P115.3 admits local SQLite CRUD only for allowlisted founder runtime admission readiness OS records after explicit local approval gates. It does not wire Command Center to DB records, unlock execution, admit runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P115.3 Founder Live Runtime Admission Readiness CRUD Model Report", phase: "P115.3" },
);

printCheckReport("P115.3 Founder Live Runtime Admission Readiness CRUD Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
