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
const REPORT_PATH = "reports/p1152-founder-live-runtime-admission-readiness-report.md";
const TEST_DB = "local-state/runtime/check-p1152.sqlite";
const RUNTIME_ADMISSION_ENTITIES = [
  "founder_runtime_admission_readiness_items",
  "founder_runtime_admission_events",
  "founder_runtime_admission_evidence_refs",
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
const contract = readJson("contracts/os-roadmap/p115-founder-live-runtime-admission-readiness-contracts.json");
const plan = readText("docs/architecture/P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const entityByName = new Map((schema.entities || []).map((entry) => [entry.name, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1152 = subphaseById.get("P115.2") || {};
const p1153 = subphaseById.get("P115.3") || {};
const p1151Checker = readText("scripts/check-p1151-founder-live-runtime-admission-contract.js");
const descriptions = Object.fromEntries(RUNTIME_ADMISSION_ENTITIES.map((entity) => [entity, describeSqliteCrudEntity(entity)]));
const cliAvailable = isSqliteCliAvailable();
const init = cliAvailable
  ? initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: false, reset: true })
  : { initialized: false, tableCount: 0 };
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P115.2";
const allowedFiles = new Set(p1152.allowedFiles || []);
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

let admissionItem = null;
let admissionEvent = null;
let evidenceRef = null;
let admissionItems = [];

if (cliAvailable && init.initialized) {
  const sqliteInput = { mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB };
  admissionItem = insertSqliteEntity("founder_runtime_admission_readiness_items", {
    runtimeAdmissionId: "p1152-runtime-admission",
    dispatchReadinessId: "p1152-dispatch-readiness",
    assignmentId: "p1152-assignment",
    queueItemId: "p1152-queue-item",
    workOrderId: "p1152-work-order",
    publicLabel: "Founder runtime admission readiness item",
    admissionLane: "Founder Runtime",
    admissionState: "schema_validated_locally",
    admissionSummary: "Schema validation only; no runtime admission or execution.",
    runtimeTarget: "Local governed runtime admission readiness preview",
    ownerCapability: "NEXUS Founder Runtime Admission DB",
    nextAction: "Model governed local runtime admission CRUD in P115.3.",
    disabledReason: "P115.2 is schema-only.",
    operatorApprovalRequired: true,
    operatorApproved: false,
    localCrudAllowed: false,
    dbWriteAllowed: false,
    hostedDbMutationAllowed: false,
    runtimeAdmissionAllowed: false,
    executionAllowed: false,
    workerExecutionAllowed: false,
    providerCallAllowed: false,
    projectMutationAllowed: false,
    providerSpendAllowed: false,
    evidenceRefs: ["reports/p1152-founder-live-runtime-admission-readiness-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
    createdAt: "2026-05-29T00:00:00.000Z",
    updatedAt: "2026-05-29T00:00:00.000Z",
  }, sqliteInput);
  admissionEvent = insertSqliteEntity("founder_runtime_admission_events", {
    runtimeAdmissionEventId: "p1152-runtime-admission-event",
    runtimeAdmissionId: "p1152-runtime-admission",
    dispatchReadinessId: "p1152-dispatch-readiness",
    assignmentId: "p1152-assignment",
    queueItemId: "p1152-queue-item",
    workOrderId: "p1152-work-order",
    eventType: "schema_validation",
    eventState: "recorded_locally",
    actorLabel: "NEXUS schema checker",
    eventSummary: "Validated local runtime admission schema mapping without runtime admission or execution.",
    rollbackAvailable: true,
    runtimeAdmissionAllowed: false,
    executionAllowed: false,
    workerExecutionAllowed: false,
    projectMutationAllowed: false,
    evidenceRefs: ["reports/p1152-founder-live-runtime-admission-readiness-report.md"],
    createdAt: "2026-05-29T00:00:00.000Z",
  }, sqliteInput);
  evidenceRef = insertSqliteEntity("founder_runtime_admission_evidence_refs", {
    runtimeAdmissionEvidenceRefId: "p1152-runtime-admission-evidence",
    runtimeAdmissionId: "p1152-runtime-admission",
    dispatchReadinessId: "p1152-dispatch-readiness",
    assignmentId: "p1152-assignment",
    queueItemId: "p1152-queue-item",
    workOrderId: "p1152-work-order",
    evidenceLabel: "P115.2 schema report",
    evidenceType: "validation_report",
    evidenceLocation: "reports/p1152-founder-live-runtime-admission-readiness-report.md",
    redactionRequired: true,
    retainedForAudit: true,
    createdAt: "2026-05-29T00:00:00.000Z",
  }, sqliteInput);
  admissionItems = listSqliteEntityRecords("founder_runtime_admission_readiness_items", { limit: 5 }, sqliteInput);
}

const allEntities = listSqliteCrudEntities();
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;
const unsafeSource = `${schemaSql}\n${readText("db/schema.json")}`;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1152-founder-live-runtime-admission-readiness"]));
addCheck("contract marks P115.2 complete", p1152.status === "complete" && p1152.allowedFiles?.includes("db/schema.json") && p1152.allowedFiles?.includes("db/schema.sql"));
addCheck("P115.3 remains planned or complete", ["planned", "complete"].includes(p1153.status));
addCheck("runtime admission entities exist in schema", RUNTIME_ADMISSION_ENTITIES.every((entity) => entityByName.has(entity)));
addCheck("runtime admission entities are redacted low-risk local state", RUNTIME_ADMISSION_ENTITIES.every((entity) => entityByName.get(entity)?.redactionRequired === true && entityByName.get(entity)?.piiRisk === "low" && /^founder_runtime_admission_/.test(entityByName.get(entity)?.retentionClass || "")));
addCheck("runtime admission item shape is complete", entityByName.get("founder_runtime_admission_readiness_items")?.primaryKey === "runtimeAdmissionId" && entityByName.get("founder_runtime_admission_readiness_items")?.fields?.admissionState === "string" && entityByName.get("founder_runtime_admission_readiness_items")?.fields?.operatorApproved === "boolean" && entityByName.get("founder_runtime_admission_readiness_items")?.fields?.runtimeAdmissionAllowed === "boolean" && entityByName.get("founder_runtime_admission_readiness_items")?.fields?.executionAllowed === "boolean");
addCheck("runtime admission event shape blocks execution", entityByName.get("founder_runtime_admission_events")?.fields?.runtimeAdmissionAllowed === "boolean" && entityByName.get("founder_runtime_admission_events")?.fields?.workerExecutionAllowed === "boolean" && entityByName.get("founder_runtime_admission_events")?.fields?.projectMutationAllowed === "boolean");
addCheck("runtime admission evidence shape is display-safe", entityByName.get("founder_runtime_admission_evidence_refs")?.primaryKey === "runtimeAdmissionEvidenceRefId" && entityByName.get("founder_runtime_admission_evidence_refs")?.fields?.evidenceLocation === "string" && entityByName.get("founder_runtime_admission_evidence_refs")?.fields?.redactionRequired === "boolean");
addCheck("SQL tables exist", RUNTIME_ADMISSION_ENTITIES.every((entity) => schemaSql.includes(`CREATE TABLE IF NOT EXISTS ${entity}`)));
addCheck("SQL indexes exist", schemaSql.includes("idx_founder_runtime_admission_readiness_items_admission_state") && schemaSql.includes("idx_founder_runtime_admission_events_event_type") && schemaSql.includes("idx_founder_runtime_admission_evidence_refs_evidence_location"));
addCheck("SQLite schema transforms runtime admission tables", sqliteSchema.includes("CREATE TABLE IF NOT EXISTS founder_runtime_admission_readiness_items") && sqliteSchema.includes("evidence_refs            TEXT") && !sqliteSchema.includes("JSONB"));
addCheck("CRUD entity descriptions include runtime admission columns", descriptions.founder_runtime_admission_readiness_items.fields.runtimeAdmissionId.column === "runtime_admission_id" && descriptions.founder_runtime_admission_events.fields.projectMutationAllowed.column === "project_mutation_allowed" && descriptions.founder_runtime_admission_evidence_refs.fields.evidenceLocation.column === "evidence_location");
addCheck("CRUD repository sees runtime admission entity set", allEntities.length >= 44 && RUNTIME_ADMISSION_ENTITIES.every((entity) => allEntities.some((entry) => entry.name === entity)));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P115.2 schema validation");
addCheck("isolated DB initializes runtime admission tables", !cliAvailable || (init.initialized === true && init.tableCount >= 44 && existsSync(join(ROOT, TEST_DB))));
addCheck("isolated runtime admission records can be inserted", !cliAvailable || (admissionItem?.runtimeAdmissionId === "p1152-runtime-admission" && admissionEvent?.runtimeAdmissionEventId === "p1152-runtime-admission-event" && evidenceRef?.runtimeAdmissionEvidenceRefId === "p1152-runtime-admission-evidence"));
addCheck("array and boolean fields serialize safely", !cliAvailable || (Array.isArray(admissionItem?.evidenceRefs) && admissionItem?.operatorApproved === false && admissionItem?.runtimeAdmissionAllowed === false && admissionItem?.executionAllowed === false && admissionEvent?.workerExecutionAllowed === false && evidenceRef?.redactionRequired === true));
addCheck("isolated runtime admission records can be listed", !cliAvailable || admissionItems.some((entry) => entry.runtimeAdmissionId === "p1152-runtime-admission"));
addCheck("P115.1 checker accepts P115.2 handoff", p1151Checker.includes("P115.2") && p1151Checker.includes("P115.3") && p1151Checker.includes("scope check relaxed"));
addCheck("docs record P115.2", /P115\.2 Local Admission Schema Metadata[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P115.2", /P115\.2 local admission schema metadata/.test(readme) && /P115\.3\s+is\s+next/.test(readme));
addCheck("platform roadmap records P115.2", /P115\.2 is complete/.test(platformRoadmap) && /P115\.3\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  status.currentPhase === "P115.2"
    && status.previousPhase === "P115.1"
    && status.nextPhase === "P115.3"
    && roadmap.currentPhase === "P115.2"
    && roadmap.previousPhase === "P115.1"
    && roadmap.nextPhase === "P115.3"
    && statusById.get("P115")?.status === "in_progress"
    && statusById.get("P115.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P115.3")?.status)
    && roadmapById.get("P115.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P115.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P115.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw runtime admission table names", !/(founder_runtime_admission_readiness_items|founder_runtime_admission_events|founder_runtime_admission_evidence_refs)/.test(publicDocsBundle));
addCheck("no unsafe runtime imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(unsafeSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(unsafeSource));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|runtime execution is enabled|runtime admission is live/i.test(docsBundle));

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P115.2 local SQLite schema definitions for founder runtime admission readiness items, runtime admission events, and runtime admission evidence references.",
        "- Confirms isolated SQLite initialization and CRUD repository mapping for the new allowlisted local entities.",
        "- Confirms the schema remains display-safe and does not enable hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: [
      "- npm run check:p1152-founder-live-runtime-admission-readiness",
      "- npm run check:p1151-founder-live-runtime-admission-contract",
      "- npm run check:os-phase-status",
      "- npm run check:phase-validation-coverage",
      "- git diff --check",
    ].join("\n") },
    {
      title: "Known Limitations",
      body: "- P115.2 is schema-only. It does not add runtime CRUD admission, write persistent runtime data, admit work to runtime, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P115.2 Founder Live Runtime Admission Readiness Schema Report", phase: "P115.2" },
);

printCheckReport("P115.2 Founder Live Runtime Admission Readiness Schema Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
