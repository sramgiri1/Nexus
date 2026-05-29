import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { initializeSqliteRuntime, isSqliteCliAvailable, loadSqliteSchema } from "../db/sqliteRuntime.js";
import {
  describeSqliteCrudEntity,
  insertSqliteEntity,
  listSqliteCrudEntities,
  listSqliteEntityRecords,
} from "../db/sqliteCrudRepository.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1162-founder-live-runtime-execution-readiness-report.md";
const TEST_DB = "local-state/runtime/check-p1162.sqlite";
const RUNTIME_EXECUTION_ENTITIES = [
  "founder_runtime_execution_readiness_items",
  "founder_runtime_execution_events",
  "founder_runtime_execution_evidence_refs",
];

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
const schema = readJson("db/schema.json");
const schemaSql = readText("db/schema.sql");
const sqliteSchema = loadSqliteSchema();
const contract = readJson("contracts/os-roadmap/p116-founder-live-runtime-execution-readiness-contracts.json");
const plan = readText("docs/architecture/P116_FOUNDER_LIVE_RUNTIME_EXECUTION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const entityByName = new Map((schema.entities || []).map((entry) => [entry.name, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1162 = subphaseById.get("P116.2") || {};
const p1163 = subphaseById.get("P116.3") || {};
const p1164 = subphaseById.get("P116.4") || {};
const p1161Checker = readText("scripts/check-p1161-founder-live-runtime-execution-contract.js");
const descriptions = Object.fromEntries(RUNTIME_EXECUTION_ENTITIES.map((entity) => [entity, describeSqliteCrudEntity(entity)]));
const cliAvailable = isSqliteCliAvailable();
const init = cliAvailable
  ? initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: false, reset: true })
  : { initialized: false, tableCount: 0 };
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P116.2";
const allowedFiles = new Set(p1162.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "live-ready/",
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

let executionItem = null;
let executionEvent = null;
let evidenceRef = null;
let executionItems = [];

if (cliAvailable && init.initialized) {
  const sqliteInput = { mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB };
  executionItem = insertSqliteEntity("founder_runtime_execution_readiness_items", {
    runtimeExecutionId: "p1162-runtime-execution",
    runtimeAdmissionId: "p1162-runtime-admission",
    dispatchReadinessId: "p1162-dispatch-readiness",
    assignmentId: "p1162-assignment",
    queueItemId: "p1162-queue-item",
    workOrderId: "p1162-work-order",
    publicLabel: "Founder runtime execution readiness item",
    executionLane: "Founder Runtime",
    executionState: "schema_validated_locally",
    executionSummary: "Schema validation only; no runtime execution or execution unlock.",
    executionTarget: "Local governed runtime execution readiness preview",
    ownerCapability: "NEXUS Founder Runtime Execution DB",
    nextAction: "Model governed local runtime execution CRUD in P116.3.",
    disabledReason: "P116.2 is schema-only.",
    operatorApprovalRequired: true,
    operatorApproved: false,
    localCrudAllowed: false,
    dbWriteAllowed: false,
    hostedDbMutationAllowed: false,
    runtimeAdmissionRequired: true,
    runtimeAdmissionSatisfied: false,
    runtimeExecutionAllowed: false,
    executionUnlockAllowed: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    providerCallAllowed: false,
    agentDispatchAllowed: false,
    projectMutationAllowed: false,
    packageActionAllowed: false,
    deployActionAllowed: false,
    releaseActionAllowed: false,
    exportActionAllowed: false,
    networkCallAllowed: false,
    providerSpendAllowed: false,
    evidenceRefs: ["reports/p1162-founder-live-runtime-execution-readiness-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
    createdAt: "2026-05-29T00:00:00.000Z",
    updatedAt: "2026-05-29T00:00:00.000Z",
  }, sqliteInput);
  executionEvent = insertSqliteEntity("founder_runtime_execution_events", {
    runtimeExecutionEventId: "p1162-runtime-execution-event",
    runtimeExecutionId: "p1162-runtime-execution",
    runtimeAdmissionId: "p1162-runtime-admission",
    dispatchReadinessId: "p1162-dispatch-readiness",
    assignmentId: "p1162-assignment",
    queueItemId: "p1162-queue-item",
    workOrderId: "p1162-work-order",
    eventType: "schema_validation",
    eventState: "recorded_locally",
    actorLabel: "NEXUS schema checker",
    eventSummary: "Validated local runtime execution schema mapping without execution.",
    rollbackAvailable: true,
    runtimeExecutionAllowed: false,
    executionUnlockAllowed: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    providerCallAllowed: false,
    agentDispatchAllowed: false,
    projectMutationAllowed: false,
    networkCallAllowed: false,
    providerSpendAllowed: false,
    evidenceRefs: ["reports/p1162-founder-live-runtime-execution-readiness-report.md"],
    createdAt: "2026-05-29T00:00:00.000Z",
  }, sqliteInput);
  evidenceRef = insertSqliteEntity("founder_runtime_execution_evidence_refs", {
    runtimeExecutionEvidenceRefId: "p1162-runtime-execution-evidence",
    runtimeExecutionId: "p1162-runtime-execution",
    runtimeAdmissionId: "p1162-runtime-admission",
    dispatchReadinessId: "p1162-dispatch-readiness",
    assignmentId: "p1162-assignment",
    queueItemId: "p1162-queue-item",
    workOrderId: "p1162-work-order",
    evidenceLabel: "P116.2 schema report",
    evidenceType: "validation_report",
    evidenceLocation: "reports/p1162-founder-live-runtime-execution-readiness-report.md",
    redactionRequired: true,
    retainedForAudit: true,
    createdAt: "2026-05-29T00:00:00.000Z",
  }, sqliteInput);
  executionItems = listSqliteEntityRecords("founder_runtime_execution_readiness_items", { limit: 5 }, sqliteInput);
}

const allEntities = listSqliteCrudEntities();
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;
const unsafeSource = `${schemaSql}\n${readText("db/schema.json")}`;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1162-founder-live-runtime-execution-readiness"]));
addCheck("contract marks P116.2 complete", p1162.status === "complete" && p1162.allowedFiles?.includes("db/schema.json") && p1162.allowedFiles?.includes("db/schema.sql"));
addCheck("P116.3 remains planned or complete", ["planned", "complete"].includes(p1163.status));
addCheck("P116.4 remains planned or complete", ["planned", "complete"].includes(p1164.status));
addCheck("runtime execution entities exist in schema", RUNTIME_EXECUTION_ENTITIES.every((entity) => entityByName.has(entity)));
addCheck("runtime execution entities are redacted low-risk local state", RUNTIME_EXECUTION_ENTITIES.every((entity) => entityByName.get(entity)?.redactionRequired === true && entityByName.get(entity)?.piiRisk === "low" && /^founder_runtime_execution_/.test(entityByName.get(entity)?.retentionClass || "")));
addCheck("runtime execution item shape is complete", entityByName.get("founder_runtime_execution_readiness_items")?.primaryKey === "runtimeExecutionId" && entityByName.get("founder_runtime_execution_readiness_items")?.fields?.executionState === "string" && entityByName.get("founder_runtime_execution_readiness_items")?.fields?.operatorApproved === "boolean" && entityByName.get("founder_runtime_execution_readiness_items")?.fields?.runtimeExecutionAllowed === "boolean" && entityByName.get("founder_runtime_execution_readiness_items")?.fields?.executionUnlockAllowed === "boolean");
addCheck("runtime execution item shape blocks live authority", ["workerExecutionAllowed", "toolExecutionAllowed", "providerCallAllowed", "agentDispatchAllowed", "projectMutationAllowed", "networkCallAllowed", "providerSpendAllowed"].every((field) => entityByName.get("founder_runtime_execution_readiness_items")?.fields?.[field] === "boolean"));
addCheck("runtime execution event shape blocks execution", entityByName.get("founder_runtime_execution_events")?.fields?.runtimeExecutionAllowed === "boolean" && entityByName.get("founder_runtime_execution_events")?.fields?.executionUnlockAllowed === "boolean" && entityByName.get("founder_runtime_execution_events")?.fields?.workerExecutionAllowed === "boolean" && entityByName.get("founder_runtime_execution_events")?.fields?.projectMutationAllowed === "boolean");
addCheck("runtime execution evidence shape is display-safe", entityByName.get("founder_runtime_execution_evidence_refs")?.primaryKey === "runtimeExecutionEvidenceRefId" && entityByName.get("founder_runtime_execution_evidence_refs")?.fields?.evidenceLocation === "string" && entityByName.get("founder_runtime_execution_evidence_refs")?.fields?.redactionRequired === "boolean");
addCheck("SQL tables exist", RUNTIME_EXECUTION_ENTITIES.every((entity) => schemaSql.includes(`CREATE TABLE IF NOT EXISTS ${entity}`)));
addCheck("SQL indexes exist", schemaSql.includes("idx_founder_runtime_execution_readiness_items_execution_state") && schemaSql.includes("idx_founder_runtime_execution_events_event_type") && schemaSql.includes("idx_founder_runtime_execution_evidence_refs_evidence_location"));
addCheck("SQLite schema transforms runtime execution tables", sqliteSchema.includes("CREATE TABLE IF NOT EXISTS founder_runtime_execution_readiness_items") && sqliteSchema.includes("evidence_refs              TEXT") && !sqliteSchema.includes("JSONB"));
addCheck("CRUD entity descriptions include runtime execution columns", descriptions.founder_runtime_execution_readiness_items.fields.runtimeExecutionId.column === "runtime_execution_id" && descriptions.founder_runtime_execution_events.fields.projectMutationAllowed.column === "project_mutation_allowed" && descriptions.founder_runtime_execution_evidence_refs.fields.evidenceLocation.column === "evidence_location");
addCheck("CRUD repository sees runtime execution entity set", allEntities.length >= 47 && RUNTIME_EXECUTION_ENTITIES.every((entity) => allEntities.some((entry) => entry.name === entity)));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P116.2 schema validation");
addCheck("isolated DB initializes runtime execution tables", !cliAvailable || (init.initialized === true && init.tableCount >= 47 && existsSync(join(ROOT, TEST_DB))));
addCheck("isolated runtime execution records can be inserted", !cliAvailable || (executionItem?.runtimeExecutionId === "p1162-runtime-execution" && executionEvent?.runtimeExecutionEventId === "p1162-runtime-execution-event" && evidenceRef?.runtimeExecutionEvidenceRefId === "p1162-runtime-execution-evidence"));
addCheck("array and boolean fields serialize safely", !cliAvailable || (Array.isArray(executionItem?.evidenceRefs) && executionItem?.operatorApproved === false && executionItem?.runtimeExecutionAllowed === false && executionItem?.executionUnlockAllowed === false && executionEvent?.workerExecutionAllowed === false && evidenceRef?.redactionRequired === true));
addCheck("isolated runtime execution records can be listed", !cliAvailable || executionItems.some((entry) => entry.runtimeExecutionId === "p1162-runtime-execution"));
addCheck("P116.1 checker accepts P116.2 handoff", p1161Checker.includes("P116.2") && p1161Checker.includes("P116.3") && p1161Checker.includes("scope check relaxed"));
addCheck("docs record P116.2", /P116\.2 Local Execution Schema Metadata[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P116.2", /P116\.2 local execution schema metadata/.test(readme) && /P116\.3\s+is\s+next/.test(readme));
addCheck("platform roadmap records P116.2", /P116\.2 is complete/.test(platformRoadmap) && /P116\.3\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P116.2"
      && status.previousPhase === "P116.1"
      && status.nextPhase === "P116.3"
      && roadmap.currentPhase === "P116.2"
      && roadmap.previousPhase === "P116.1"
      && roadmap.nextPhase === "P116.3")
    || (status.currentPhase === "P116.3"
      && status.previousPhase === "P116.2"
      && status.nextPhase === "P116.4"
      && roadmap.currentPhase === "P116.3"
      && roadmap.previousPhase === "P116.2"
      && roadmap.nextPhase === "P116.4")
    || (status.currentPhase === "P116.4"
      && status.previousPhase === "P116.3"
      && status.nextPhase === "P116.5"
      && roadmap.currentPhase === "P116.4"
      && roadmap.previousPhase === "P116.3"
      && roadmap.nextPhase === "P116.5"))
    && statusById.get("P116")?.status === "in_progress"
    && statusById.get("P116.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P116.3")?.status)
    && ["planned", "complete"].includes(statusById.get("P116.4")?.status)
    && roadmapById.get("P116.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P116.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P116.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw runtime execution table names", !/(founder_runtime_execution_readiness_items|founder_runtime_execution_events|founder_runtime_execution_evidence_refs)/.test(publicDocsBundle));
addCheck("no unsafe runtime imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(unsafeSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(unsafeSource));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|runtime execution is live/i.test(docsBundle));

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P116.2 local SQLite schema definitions for founder runtime execution readiness items, runtime execution events, and runtime execution evidence references.",
        "- Confirms isolated SQLite initialization and CRUD repository mapping for the new allowlisted local entities.",
        "- Confirms the schema remains display-safe and does not enable hosted DB mutation, raw SQL, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: [
      "- npm run check:p1162-founder-live-runtime-execution-readiness",
      "- npm run check:p1161-founder-live-runtime-execution-contract",
      "- npm run check:os-phase-status",
      "- npm run check:phase-validation-coverage",
      "- git diff --check",
    ].join("\n") },
    {
      title: "Known Limitations",
      body: "- P116.2 is schema-only. It does not add runtime execution CRUD, write persistent runtime data, execute tools/workers, create or mutate projects, call providers/models, dispatch agents, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P116.2 Founder Live Runtime Execution Readiness Schema Report", phase: "P116.2" },
);

printCheckReport("P116.2 Founder Live Runtime Execution Readiness Schema Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
