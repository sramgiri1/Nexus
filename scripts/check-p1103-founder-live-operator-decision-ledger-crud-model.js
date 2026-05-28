import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { initializeSqliteRuntime, isSqliteCliAvailable } from "../db/sqliteRuntime.js";
import {
  P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PHASE,
  P110_OPERATOR_DECISION_LEDGER_DB_ENTITIES,
  buildFounderLiveOperatorDecisionLedgerPersistenceContract,
  buildSafeOperatorDecisionLedgerDbRecord,
  executeApprovedOperatorDecisionLedgerDbCrudRequest,
  validateFounderLiveOperatorDecisionLedgerPersistenceContract,
} from "../live-ready/founderLiveOperatorDecisionLedgerPersistence.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1103-founder-live-operator-decision-ledger-crud-model-report.md";
const TEST_DB = "local-state/runtime/check-p1103.sqlite";

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
const contract = readJson("contracts/os-roadmap/p110-founder-live-operator-decision-ledger-persistence-contracts.json");
const plan = readText("docs/architecture/P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const moduleSource = readText("live-ready/founderLiveOperatorDecisionLedgerPersistence.js");
const p1103 = contract.subphases?.find((entry) => entry.phaseId === "P110.3") || {};
const p1104 = contract.subphases?.find((entry) => entry.phaseId === "P110.4") || {};
const blockedWorkflow = buildFounderLiveOperatorDecisionLedgerPersistenceContract();
const readyWorkflow = buildFounderLiveOperatorDecisionLedgerPersistenceContract({
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
});
const blockedValidation = validateFounderLiveOperatorDecisionLedgerPersistenceContract(blockedWorkflow);
const readyValidation = validateFounderLiveOperatorDecisionLedgerPersistenceContract(readyWorkflow);
const defaultBlocked = executeApprovedOperatorDecisionLedgerDbCrudRequest({ sqliteEntity: "operator_decision_ledger_entries", requestKey: "default-blocked" });
const unapprovedBlocked = executeApprovedOperatorDecisionLedgerDbCrudRequest(
  { sqliteEntity: "operator_decision_ledger_entries", requestKey: "unapproved" },
  { execute: true, mode: "sqlite-live", enableWrites: true },
);
const deleteBlocked = executeApprovedOperatorDecisionLedgerDbCrudRequest(
  { sqliteEntity: "operator_decision_ledger_entries", requestKey: "delete" },
  { execute: true, operation: "delete", operatorApproval: true, rollbackAccepted: true, auditAccepted: true, validationCommandsAccepted: true, mode: "sqlite-live", enableWrites: true },
);
const outsideAllowlistBlocked = executeApprovedOperatorDecisionLedgerDbCrudRequest(
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
  for (const entity of P110_OPERATOR_DECISION_LEDGER_DB_ENTITIES) {
    writeResults.push(executeApprovedOperatorDecisionLedgerDbCrudRequest(
      { sqliteEntity: entity, requestKey: `write-${entity}` },
      { ...sqliteInput, operation: "upsert", record: buildSafeOperatorDecisionLedgerDbRecord(entity, { ledgerKey: "p1103-check", timestamp: "2026-05-28T00:00:00.000Z" }) },
    ));
  }
  readResult = executeApprovedOperatorDecisionLedgerDbCrudRequest(
    { sqliteEntity: "operator_decision_ledger_entries", requestKey: "read-entry" },
    { ...sqliteInput, operation: "read", id: "p1103-ledger-entry-p1103-check" },
  );
  updateResult = executeApprovedOperatorDecisionLedgerDbCrudRequest(
    { sqliteEntity: "operator_decision_ledger_entries", requestKey: "update-entry" },
    { ...sqliteInput, operation: "update", id: "p1103-ledger-entry-p1103-check", patch: { decisionState: "updated_locally", updatedAt: "2026-05-28T00:00:00.000Z" } },
  );
  listResult = executeApprovedOperatorDecisionLedgerDbCrudRequest(
    { sqliteEntity: "operator_decision_ledger_entries", requestKey: "list-entry" },
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1103-founder-live-operator-decision-ledger-crud-model"]));
addCheck("phase export is P110.3", P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PHASE === "P110.3");
addCheck("allowed entity list is scoped", P110_OPERATOR_DECISION_LEDGER_DB_ENTITIES.length === 3 && P110_OPERATOR_DECISION_LEDGER_DB_ENTITIES.every((entity) => entity.startsWith("operator_decision_ledger_")));
addCheck("blocked workflow validates", blockedValidation.valid, blockedValidation.errors.join("; "));
addCheck("ready workflow validates", readyValidation.valid, readyValidation.errors.join("; "));
addCheck("workflow covers local CRUD requests", readyWorkflow.data.localCrudRequests.length === 3 && readyWorkflow.data.allowedLocalCrudOperations.join(",") === "create,read,update,upsert,list");
addCheck("default execution is blocked", defaultBlocked.admitted === false && defaultBlocked.written === false && /execute=true/.test(defaultBlocked.disabledReason));
addCheck("unapproved execution is blocked", unapprovedBlocked.admitted === false && /operator approval/.test(unapprovedBlocked.disabledReason));
addCheck("delete is blocked", deleteBlocked.admitted === false && deleteBlocked.errors.some((error) => /Delete/.test(error)));
addCheck("outside allowlist is blocked", outsideAllowlistBlocked.admitted === false && outsideAllowlistBlocked.errors.some((error) => /not allowed/.test(error)));
addCheck("blocked results keep unsafe flags false", [defaultBlocked, unapprovedBlocked, deleteBlocked, outsideAllowlistBlocked].every(allFlagsFalse));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P110.3 CRUD validation");
addCheck("isolated DB initializes", !cliAvailable || (init.initialized === true && existsSync(join(ROOT, TEST_DB))));
addCheck("approved local CRUD writes ledger records", !cliAvailable || writeResults.length === 3 && writeResults.every((result) => result.ok === true && result.admitted === true && result.written === true && result.hostedDbWritesAllowed === false && result.projectMutationAllowed === false));
addCheck("approved local CRUD reads ledger record", !cliAvailable || readResult?.record?.ledgerEntryId === "p1103-ledger-entry-p1103-check");
addCheck("approved local CRUD updates ledger record", !cliAvailable || updateResult?.record?.decisionState === "updated_locally");
addCheck("approved local CRUD lists ledger records", !cliAvailable || listResult?.records?.some((entry) => entry.ledgerEntryId === "p1103-ledger-entry-p1103-check"));
addCheck("module reuses sqlite repository", moduleSource.includes("insertSqliteEntity") && moduleSource.includes("updateSqliteEntity") && moduleSource.includes("listSqliteEntityRecords"));
addCheck("contract marks P110.3 complete", p1103.status === "complete" && ["planned", "complete"].includes(p1104.status));
addCheck("docs record P110.3", /P110\.3 Governed Local CRUD Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P110.3", /P110\.3 governed local CRUD model/.test(readme) && /P110\.4\s+is\s+next/.test(readme));
addCheck("platform roadmap records P110.3", /P110\.3 is complete/.test(platformRoadmap) && /P110\.4 is next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  status.currentPhase === "P110.3"
    && status.previousPhase === "P110.2"
    && status.nextPhase === "P110.4"
    && statusById.get("P110.3")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P110.4")?.status)
    && roadmap.currentPhase === "P110.3"
    && roadmap.previousPhase === "P110.2"
    && roadmap.nextPhase === "P110.4"
    && roadmapById.get("P110.3")?.status === "complete",
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
        "- Validates P110.3 governed local operator decision ledger CRUD model.",
        "- Confirms approved create/read/update/upsert/list paths for allowlisted local ledger records in an isolated SQLite DB.",
        "- Confirms default execution, unapproved execution, delete, outside allowlist, hosted DB mutation, raw SQL, project mutation, provider/model calls, agent dispatch, worker/tool execution, runtime admission, execution unlock, deploy, release, export, package, network calls, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1103-founder-live-operator-decision-ledger-crud-model",
        "- npm run check:p1102-founder-live-operator-decision-ledger-schema",
        "- npm run check:p1101-founder-live-operator-decision-ledger-persistence-contract",
        "- npm run check:p1097-founder-live-operator-decision-ledger-final",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P110.3 admits local SQLite CRUD only for allowlisted operator decision ledger OS records after explicit local approval gates. It does not wire Command Center to DB records, unlock execution, admit runtime execution, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P110.3 Founder Live Operator Decision Ledger CRUD Model Report", phase: "P110.3" },
);

printCheckReport("P110.3 Founder Live Operator Decision Ledger CRUD Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
