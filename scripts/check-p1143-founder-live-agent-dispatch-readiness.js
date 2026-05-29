import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { initializeSqliteRuntime, isSqliteCliAvailable } from "../db/sqliteRuntime.js";
import {
  P114_AGENT_DISPATCH_DB_ENTITIES,
  P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PHASE,
  buildFounderLiveAgentDispatchReadinessContract,
  buildSafeAgentDispatchDbRecord,
  executeApprovedAgentDispatchDbCrudRequest,
  validateFounderLiveAgentDispatchReadinessContract,
} from "../live-ready/founderLiveAgentDispatchReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1143-founder-live-agent-dispatch-readiness-report.md";
const TEST_DB = "local-state/runtime/check-p1143.sqlite";

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
const contract = readJson("contracts/os-roadmap/p114-founder-live-agent-dispatch-readiness-contracts.json");
const plan = readText("docs/architecture/P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const moduleSource = readText("live-ready/founderLiveAgentDispatchReadiness.js");
const p1143 = contract.subphases?.find((entry) => entry.phaseId === "P114.3") || {};
const p1144 = contract.subphases?.find((entry) => entry.phaseId === "P114.4") || {};
const blockedWorkflow = buildFounderLiveAgentDispatchReadinessContract();
const readyWorkflow = buildFounderLiveAgentDispatchReadinessContract({
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
});
const blockedValidation = validateFounderLiveAgentDispatchReadinessContract(blockedWorkflow);
const readyValidation = validateFounderLiveAgentDispatchReadinessContract(readyWorkflow);
const defaultBlocked = executeApprovedAgentDispatchDbCrudRequest({ sqliteEntity: "founder_agent_dispatch_readiness_items", requestKey: "default-blocked" });
const unapprovedBlocked = executeApprovedAgentDispatchDbCrudRequest(
  { sqliteEntity: "founder_agent_dispatch_readiness_items", requestKey: "unapproved" },
  { execute: true, mode: "sqlite-live", enableWrites: true },
);
const deleteBlocked = executeApprovedAgentDispatchDbCrudRequest(
  { sqliteEntity: "founder_agent_dispatch_readiness_items", requestKey: "delete" },
  { execute: true, operation: "delete", operatorApproval: true, rollbackAccepted: true, auditAccepted: true, validationCommandsAccepted: true, mode: "sqlite-live", enableWrites: true },
);
const outsideAllowlistBlocked = executeApprovedAgentDispatchDbCrudRequest(
  { sqliteEntity: "founder_agent_work_assignments", requestKey: "outside" },
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
  for (const entity of P114_AGENT_DISPATCH_DB_ENTITIES) {
    writeResults.push(executeApprovedAgentDispatchDbCrudRequest(
      { sqliteEntity: entity, requestKey: `write-${entity}` },
      { ...sqliteInput, operation: "upsert", record: buildSafeAgentDispatchDbRecord(entity, { dispatchKey: "p1143-check", timestamp: "2026-05-29T00:00:00.000Z" }) },
    ));
  }
  readResult = executeApprovedAgentDispatchDbCrudRequest(
    { sqliteEntity: "founder_agent_dispatch_readiness_items", requestKey: "read-entry" },
    { ...sqliteInput, operation: "read", id: "p1143-dispatch-p1143-check" },
  );
  updateResult = executeApprovedAgentDispatchDbCrudRequest(
    { sqliteEntity: "founder_agent_dispatch_readiness_items", requestKey: "update-entry" },
    { ...sqliteInput, operation: "update", id: "p1143-dispatch-p1143-check", patch: { dispatchState: "updated_locally", updatedAt: "2026-05-29T00:00:00.000Z" } },
  );
  listResult = executeApprovedAgentDispatchDbCrudRequest(
    { sqliteEntity: "founder_agent_dispatch_readiness_items", requestKey: "list-entry" },
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

const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P114.3";
const allowedFiles = new Set(p1143.allowedFiles || []);
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1143-founder-live-agent-dispatch-readiness"]));
addCheck("phase export is P114.3", P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PHASE === "P114.3");
addCheck("allowed entity list is scoped", P114_AGENT_DISPATCH_DB_ENTITIES.length === 3 && P114_AGENT_DISPATCH_DB_ENTITIES.every((entity) => entity.startsWith("founder_agent_dispatch_readiness")));
addCheck("blocked workflow validates", blockedValidation.valid, blockedValidation.errors.join("; "));
addCheck("ready workflow validates", readyValidation.valid, readyValidation.errors.join("; "));
addCheck("workflow covers local CRUD requests", readyWorkflow.data.localCrudRequests.length === 3 && readyWorkflow.data.allowedLocalCrudOperations.join(",") === "create,read,update,upsert,list");
addCheck("default execution is blocked", defaultBlocked.admitted === false && defaultBlocked.written === false && /execute=true/.test(defaultBlocked.disabledReason));
addCheck("unapproved execution is blocked", unapprovedBlocked.admitted === false && /operator approval/.test(unapprovedBlocked.disabledReason));
addCheck("delete is blocked", deleteBlocked.admitted === false && deleteBlocked.errors.some((error) => /Delete/.test(error)));
addCheck("outside allowlist is blocked", outsideAllowlistBlocked.admitted === false && outsideAllowlistBlocked.errors.some((error) => /not allowed/.test(error)));
addCheck("blocked results keep unsafe flags false", [defaultBlocked, unapprovedBlocked, deleteBlocked, outsideAllowlistBlocked].every(allFlagsFalse));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P114.3 CRUD validation");
addCheck("isolated DB initializes", !cliAvailable || (init.initialized === true && existsSync(join(ROOT, TEST_DB))));
addCheck("approved local CRUD writes dispatch records", !cliAvailable || writeResults.length === 3 && writeResults.every((result) => result.ok === true && result.admitted === true && result.written === true && result.hostedDbWritesAllowed === false && result.projectMutationAllowed === false));
addCheck("approved local CRUD reads dispatch record", !cliAvailable || readResult?.record?.dispatchReadinessId === "p1143-dispatch-p1143-check");
addCheck("approved local CRUD updates dispatch record", !cliAvailable || updateResult?.record?.dispatchState === "updated_locally");
addCheck("approved local CRUD lists dispatch records", !cliAvailable || listResult?.records?.some((entry) => entry.dispatchReadinessId === "p1143-dispatch-p1143-check"));
addCheck("module reuses sqlite repository", moduleSource.includes("insertSqliteEntity") && moduleSource.includes("updateSqliteEntity") && moduleSource.includes("listSqliteEntityRecords"));
addCheck("module reuses assignment helper", moduleSource.includes("buildSafeAgentWorkAssignmentDbRecord"));
addCheck("contract marks P114.3 complete", p1143.status === "complete" && ["planned", "complete"].includes(p1144.status));
addCheck("docs record P114.3", /P114\.3 Governed Local Dispatch CRUD Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P114.3", /P114\.3 governed local dispatch CRUD model/.test(readme) && /P114\.4\s+is\s+next/.test(readme));
addCheck("platform roadmap records P114.3", /P114\.3 is complete/.test(platformRoadmap) && /P114\.4 is next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ["P114.3", "P114.4"].includes(status.currentPhase)
    && ["P114.2", "P114.3"].includes(status.previousPhase)
    && ["P114.4", "P114.5"].includes(status.nextPhase)
    && ["P114.3", "P114.4"].includes(roadmap.currentPhase)
    && ["P114.2", "P114.3"].includes(roadmap.previousPhase)
    && ["P114.4", "P114.5"].includes(roadmap.nextPhase)
    && statusById.get("P114")?.status === "in_progress"
    && statusById.get("P114.3")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P114.4")?.status)
    && ["planned", "complete"].includes(statusById.get("P114.5")?.status)
    && roadmapById.get("P114.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P114.3 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P114.3 forbidden path check relaxed for ${status.currentPhase}`,
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
        "- Validates P114.3 governed local founder agent dispatch readiness CRUD model.",
        "- Confirms approved create/read/update/upsert/list paths for allowlisted local dispatch readiness records in an isolated SQLite DB.",
        "- Confirms default execution, unapproved execution, delete, outside allowlist, hosted DB mutation, raw SQL, project mutation, provider/model calls, agent dispatch, worker/tool execution, runtime admission, execution unlock, deploy, release, export, package, network calls, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1143-founder-live-agent-dispatch-readiness",
        "- npm run check:p1142-founder-live-agent-dispatch-readiness",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P114.3 admits local SQLite CRUD only for allowlisted founder agent dispatch readiness OS records after explicit local approval gates. It does not wire Command Center to DB records, unlock execution, admit runtime execution, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P114.3 Founder Live Agent Dispatch Readiness CRUD Model Report", phase: "P114.3" },
);

printCheckReport("P114.3 Founder Live Agent Dispatch Readiness CRUD Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
