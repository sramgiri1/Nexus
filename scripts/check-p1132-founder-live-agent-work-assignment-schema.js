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
const REPORT_PATH = "reports/p1132-founder-live-agent-work-assignment-schema-report.md";
const TEST_DB = "local-state/runtime/check-p1132.sqlite";
const ASSIGNMENT_ENTITIES = [
  "founder_agent_work_assignments",
  "founder_agent_work_assignment_events",
  "founder_agent_work_assignment_evidence_refs",
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
const contract = readJson("contracts/os-roadmap/p113-founder-live-agent-work-assignment-readiness-contracts.json");
const plan = readText("docs/architecture/P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const entityByName = new Map((schema.entities || []).map((entry) => [entry.name, entry]));
const p1132 = contract.subphases?.find((entry) => entry.phaseId === "P113.2") || {};
const p1133 = contract.subphases?.find((entry) => entry.phaseId === "P113.3") || {};
const p1134 = contract.subphases?.find((entry) => entry.phaseId === "P113.4") || {};
const p1131Checker = readText("scripts/check-p1131-founder-live-agent-work-assignment-contract.js");
const descriptions = Object.fromEntries(ASSIGNMENT_ENTITIES.map((entity) => [entity, describeSqliteCrudEntity(entity)]));
const cliAvailable = isSqliteCliAvailable();
const init = cliAvailable
  ? initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: false, reset: true })
  : { initialized: false, tableCount: 0 };
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P113.2";
const allowedFiles = new Set(p1132.allowedFiles || []);
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

let assignment = null;
let assignmentEvent = null;
let evidenceRef = null;
let assignmentItems = [];

if (cliAvailable && init.initialized) {
  const sqliteInput = { mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB };
  assignment = insertSqliteEntity("founder_agent_work_assignments", {
    assignmentId: "p1132-assignment",
    queueItemId: "p1132-queue-item",
    workOrderId: "p1132-work-order",
    publicLabel: "Founder agent work assignment readiness item",
    assignmentLane: "Product Strategy",
    assignmentState: "schema_validated_locally",
    assignmentSummary: "Schema validation only; no agent dispatch or execution.",
    assignedAgent: "ATLAS",
    ownerCapability: "NEXUS Founder Agent Work Assignment DB",
    nextAction: "Model governed local assignment CRUD in P113.3.",
    disabledReason: "P113.2 is schema-only.",
    operatorApprovalRequired: true,
    operatorApproved: false,
    localCrudAllowed: false,
    dbWriteAllowed: false,
    hostedDbMutationAllowed: false,
    dispatchAllowed: false,
    executionAllowed: false,
    workerExecutionAllowed: false,
    runtimeAdmissionAllowed: false,
    projectMutationAllowed: false,
    providerSpendAllowed: false,
    evidenceRefs: ["reports/p1132-founder-live-agent-work-assignment-schema-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
    createdAt: "2026-05-28T00:00:00.000Z",
    updatedAt: "2026-05-28T00:00:00.000Z",
  }, sqliteInput);
  assignmentEvent = insertSqliteEntity("founder_agent_work_assignment_events", {
    assignmentEventId: "p1132-assignment-event",
    assignmentId: "p1132-assignment",
    queueItemId: "p1132-queue-item",
    workOrderId: "p1132-work-order",
    eventType: "schema_validation",
    eventState: "recorded_locally",
    actorLabel: "NEXUS schema checker",
    eventSummary: "Validated local assignment schema mapping without dispatch or execution.",
    rollbackAvailable: true,
    dispatchAllowed: false,
    executionAllowed: false,
    projectMutationAllowed: false,
    evidenceRefs: ["reports/p1132-founder-live-agent-work-assignment-schema-report.md"],
    createdAt: "2026-05-28T00:00:00.000Z",
  }, sqliteInput);
  evidenceRef = insertSqliteEntity("founder_agent_work_assignment_evidence_refs", {
    assignmentEvidenceRefId: "p1132-assignment-evidence",
    assignmentId: "p1132-assignment",
    queueItemId: "p1132-queue-item",
    workOrderId: "p1132-work-order",
    evidenceLabel: "P113.2 schema report",
    evidenceType: "validation_report",
    evidenceLocation: "reports/p1132-founder-live-agent-work-assignment-schema-report.md",
    redactionRequired: true,
    retainedForAudit: true,
    createdAt: "2026-05-28T00:00:00.000Z",
  }, sqliteInput);
  assignmentItems = listSqliteEntityRecords("founder_agent_work_assignments", { limit: 5 }, sqliteInput);
}

const allEntities = listSqliteCrudEntities();
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const unsafeSource = `${schemaSql}\n${readText("db/schema.json")}`;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1132-founder-live-agent-work-assignment-schema"]));
addCheck("contract marks P113.2 complete", p1132.status === "complete" && p1132.allowedFiles?.includes("db/schema.json") && p1132.allowedFiles?.includes("db/schema.sql"));
addCheck("P113.3 and P113.4 remain planned or complete", ["planned", "complete"].includes(p1133.status) && ["planned", "complete"].includes(p1134.status));
addCheck("assignment entities exist in schema", ASSIGNMENT_ENTITIES.every((entity) => entityByName.has(entity)));
addCheck("assignment entities are redacted low-risk local state", ASSIGNMENT_ENTITIES.every((entity) => entityByName.get(entity)?.redactionRequired === true && entityByName.get(entity)?.piiRisk === "low" && /^founder_agent_work_assignment_/.test(entityByName.get(entity)?.retentionClass || "")));
addCheck("assignment item shape is complete", entityByName.get("founder_agent_work_assignments")?.primaryKey === "assignmentId" && entityByName.get("founder_agent_work_assignments")?.fields?.assignmentState === "string" && entityByName.get("founder_agent_work_assignments")?.fields?.operatorApproved === "boolean" && entityByName.get("founder_agent_work_assignments")?.fields?.dispatchAllowed === "boolean" && entityByName.get("founder_agent_work_assignments")?.fields?.executionAllowed === "boolean");
addCheck("assignment event shape blocks execution", entityByName.get("founder_agent_work_assignment_events")?.fields?.dispatchAllowed === "boolean" && entityByName.get("founder_agent_work_assignment_events")?.fields?.projectMutationAllowed === "boolean");
addCheck("assignment evidence shape is display-safe", entityByName.get("founder_agent_work_assignment_evidence_refs")?.primaryKey === "assignmentEvidenceRefId" && entityByName.get("founder_agent_work_assignment_evidence_refs")?.fields?.evidenceLocation === "string" && entityByName.get("founder_agent_work_assignment_evidence_refs")?.fields?.redactionRequired === "boolean");
addCheck("SQL tables exist", ASSIGNMENT_ENTITIES.every((entity) => schemaSql.includes(`CREATE TABLE IF NOT EXISTS ${entity}`)));
addCheck("SQL indexes exist", schemaSql.includes("idx_founder_agent_work_assignments_assignment_state") && schemaSql.includes("idx_founder_agent_work_assignment_events_event_type") && schemaSql.includes("idx_founder_agent_work_assignment_evidence_refs_evidence_location"));
addCheck("SQLite schema transforms assignment tables", sqliteSchema.includes("CREATE TABLE IF NOT EXISTS founder_agent_work_assignments") && sqliteSchema.includes("evidence_refs             TEXT") && !sqliteSchema.includes("JSONB"));
addCheck("CRUD entity descriptions include assignment columns", descriptions.founder_agent_work_assignments.fields.assignmentId.column === "assignment_id" && descriptions.founder_agent_work_assignment_events.fields.projectMutationAllowed.column === "project_mutation_allowed" && descriptions.founder_agent_work_assignment_evidence_refs.fields.evidenceLocation.column === "evidence_location");
addCheck("CRUD repository sees assignment entity set", allEntities.length >= 38 && ASSIGNMENT_ENTITIES.every((entity) => allEntities.some((entry) => entry.name === entity)));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P113.2 schema validation");
addCheck("isolated DB initializes assignment tables", !cliAvailable || (init.initialized === true && init.tableCount >= 38 && existsSync(join(ROOT, TEST_DB))));
addCheck("isolated assignment records can be inserted", !cliAvailable || (assignment?.assignmentId === "p1132-assignment" && assignmentEvent?.assignmentEventId === "p1132-assignment-event" && evidenceRef?.assignmentEvidenceRefId === "p1132-assignment-evidence"));
addCheck("array and boolean fields serialize safely", !cliAvailable || (Array.isArray(assignment?.evidenceRefs) && assignment?.operatorApproved === false && assignment?.dispatchAllowed === false && assignment?.executionAllowed === false && assignmentEvent?.projectMutationAllowed === false && evidenceRef?.redactionRequired === true));
addCheck("isolated assignment records can be listed", !cliAvailable || assignmentItems.some((entry) => entry.assignmentId === "p1132-assignment"));
addCheck("P113.1 checker accepts P113.2 handoff", p1131Checker.includes("P113.2") && p1131Checker.includes("P113.3") && p1131Checker.includes("scope check relaxed"));
addCheck("docs record P113.2", /P113\.2 Agent Work Assignment SQLite Schema[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P113.2", /P113\.2 work assignment SQLite schema/.test(readme) && /P113\.3\s+is\s+next/.test(readme));
addCheck("platform roadmap records P113.2", /P113\.2 is complete/.test(platformRoadmap) && /P113\.3\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P113.2"
      && status.previousPhase === "P113.1"
      && status.nextPhase === "P113.3"
      && roadmap.currentPhase === "P113.2"
      && roadmap.previousPhase === "P113.1"
      && roadmap.nextPhase === "P113.3")
    || (status.currentPhase === "P113.3"
      && status.previousPhase === "P113.2"
      && status.nextPhase === "P113.4"
      && roadmap.currentPhase === "P113.3"
      && roadmap.previousPhase === "P113.2"
      && roadmap.nextPhase === "P113.4"))
    && statusById.get("P113")?.status === "in_progress"
    && statusById.get("P113.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P113.3")?.status)
    && ["planned", "complete"].includes(statusById.get("P113.4")?.status)
    && roadmapById.get("P113.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P113.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P113.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("no unsafe runtime imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(unsafeSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(unsafeSource));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|assignment execution is enabled|work assignment execution is enabled/i.test(docsBundle));

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P113.2 local SQLite schema definitions for founder agent work assignments, assignment events, and assignment evidence references.",
        "- Confirms isolated SQLite initialization and CRUD repository mapping for the new allowlisted local entities.",
        "- Confirms the schema remains display-safe and does not enable hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: [
      "- npm run check:p1132-founder-live-agent-work-assignment-schema",
      "- npm run check:p1131-founder-live-agent-work-assignment-contract",
      "- npm run check:os-phase-status",
      "- npm run check:phase-validation-coverage",
      "- git diff --check",
    ].join("\n") },
    {
      title: "Known Limitations",
      body: "- P113.2 is schema-only. It does not add runtime CRUD admission, write persistent runtime data, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P113.2 Founder Live Agent Work Assignment Schema Report", phase: "P113.2" },
);

printCheckReport("P113.2 Founder Live Agent Work Assignment Schema Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
