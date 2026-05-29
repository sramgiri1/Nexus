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
const REPORT_PATH = "reports/p1142-founder-live-agent-dispatch-readiness-report.md";
const TEST_DB = "local-state/runtime/check-p1142.sqlite";
const DISPATCH_ENTITIES = [
  "founder_agent_dispatch_readiness_items",
  "founder_agent_dispatch_readiness_events",
  "founder_agent_dispatch_readiness_evidence_refs",
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
const contract = readJson("contracts/os-roadmap/p114-founder-live-agent-dispatch-readiness-contracts.json");
const plan = readText("docs/architecture/P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const entityByName = new Map((schema.entities || []).map((entry) => [entry.name, entry]));
const p1142 = contract.subphases?.find((entry) => entry.phaseId === "P114.2") || {};
const p1143 = contract.subphases?.find((entry) => entry.phaseId === "P114.3") || {};
const p1144 = contract.subphases?.find((entry) => entry.phaseId === "P114.4") || {};
const p1141Checker = readText("scripts/check-p1141-founder-live-agent-dispatch-contract.js");
const descriptions = Object.fromEntries(DISPATCH_ENTITIES.map((entity) => [entity, describeSqliteCrudEntity(entity)]));
const cliAvailable = isSqliteCliAvailable();
const init = cliAvailable
  ? initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: false, reset: true })
  : { initialized: false, tableCount: 0 };
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P114.2";
const allowedFiles = new Set(p1142.allowedFiles || []);
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

let dispatchItem = null;
let dispatchEvent = null;
let evidenceRef = null;
let dispatchItems = [];

if (cliAvailable && init.initialized) {
  const sqliteInput = { mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB };
  dispatchItem = insertSqliteEntity("founder_agent_dispatch_readiness_items", {
    dispatchReadinessId: "p1142-dispatch-readiness",
    assignmentId: "p1142-assignment",
    queueItemId: "p1142-queue-item",
    workOrderId: "p1142-work-order",
    publicLabel: "Founder agent dispatch readiness item",
    dispatchLane: "Product Strategy",
    dispatchState: "schema_validated_locally",
    dispatchSummary: "Schema validation only; no agent dispatch or execution.",
    assignedAgent: "ATLAS",
    dispatchTarget: "Local governed dispatch readiness preview",
    ownerCapability: "NEXUS Founder Agent Dispatch Readiness DB",
    nextAction: "Model governed local dispatch CRUD in P114.3.",
    disabledReason: "P114.2 is schema-only.",
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
    evidenceRefs: ["reports/p1142-founder-live-agent-dispatch-readiness-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
    createdAt: "2026-05-29T00:00:00.000Z",
    updatedAt: "2026-05-29T00:00:00.000Z",
  }, sqliteInput);
  dispatchEvent = insertSqliteEntity("founder_agent_dispatch_readiness_events", {
    dispatchEventId: "p1142-dispatch-event",
    dispatchReadinessId: "p1142-dispatch-readiness",
    assignmentId: "p1142-assignment",
    queueItemId: "p1142-queue-item",
    workOrderId: "p1142-work-order",
    eventType: "schema_validation",
    eventState: "recorded_locally",
    actorLabel: "NEXUS schema checker",
    eventSummary: "Validated local dispatch schema mapping without dispatch or execution.",
    rollbackAvailable: true,
    dispatchAllowed: false,
    executionAllowed: false,
    projectMutationAllowed: false,
    evidenceRefs: ["reports/p1142-founder-live-agent-dispatch-readiness-report.md"],
    createdAt: "2026-05-29T00:00:00.000Z",
  }, sqliteInput);
  evidenceRef = insertSqliteEntity("founder_agent_dispatch_readiness_evidence_refs", {
    dispatchEvidenceRefId: "p1142-dispatch-evidence",
    dispatchReadinessId: "p1142-dispatch-readiness",
    assignmentId: "p1142-assignment",
    queueItemId: "p1142-queue-item",
    workOrderId: "p1142-work-order",
    evidenceLabel: "P114.2 schema report",
    evidenceType: "validation_report",
    evidenceLocation: "reports/p1142-founder-live-agent-dispatch-readiness-report.md",
    redactionRequired: true,
    retainedForAudit: true,
    createdAt: "2026-05-29T00:00:00.000Z",
  }, sqliteInput);
  dispatchItems = listSqliteEntityRecords("founder_agent_dispatch_readiness_items", { limit: 5 }, sqliteInput);
}

const allEntities = listSqliteCrudEntities();
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;
const unsafeSource = `${schemaSql}\n${readText("db/schema.json")}`;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1142-founder-live-agent-dispatch-readiness"]));
addCheck("contract marks P114.2 complete", p1142.status === "complete" && p1142.allowedFiles?.includes("db/schema.json") && p1142.allowedFiles?.includes("db/schema.sql"));
addCheck("P114.3 and P114.4 remain planned or complete", ["planned", "complete"].includes(p1143.status) && ["planned", "complete"].includes(p1144.status));
addCheck("dispatch entities exist in schema", DISPATCH_ENTITIES.every((entity) => entityByName.has(entity)));
addCheck("dispatch entities are redacted low-risk local state", DISPATCH_ENTITIES.every((entity) => entityByName.get(entity)?.redactionRequired === true && entityByName.get(entity)?.piiRisk === "low" && /^founder_agent_dispatch_readiness_/.test(entityByName.get(entity)?.retentionClass || "")));
addCheck("dispatch item shape is complete", entityByName.get("founder_agent_dispatch_readiness_items")?.primaryKey === "dispatchReadinessId" && entityByName.get("founder_agent_dispatch_readiness_items")?.fields?.dispatchState === "string" && entityByName.get("founder_agent_dispatch_readiness_items")?.fields?.operatorApproved === "boolean" && entityByName.get("founder_agent_dispatch_readiness_items")?.fields?.dispatchAllowed === "boolean" && entityByName.get("founder_agent_dispatch_readiness_items")?.fields?.executionAllowed === "boolean");
addCheck("dispatch event shape blocks execution", entityByName.get("founder_agent_dispatch_readiness_events")?.fields?.dispatchAllowed === "boolean" && entityByName.get("founder_agent_dispatch_readiness_events")?.fields?.projectMutationAllowed === "boolean");
addCheck("dispatch evidence shape is display-safe", entityByName.get("founder_agent_dispatch_readiness_evidence_refs")?.primaryKey === "dispatchEvidenceRefId" && entityByName.get("founder_agent_dispatch_readiness_evidence_refs")?.fields?.evidenceLocation === "string" && entityByName.get("founder_agent_dispatch_readiness_evidence_refs")?.fields?.redactionRequired === "boolean");
addCheck("SQL tables exist", DISPATCH_ENTITIES.every((entity) => schemaSql.includes(`CREATE TABLE IF NOT EXISTS ${entity}`)));
addCheck("SQL indexes exist", schemaSql.includes("idx_founder_agent_dispatch_readiness_items_dispatch_state") && schemaSql.includes("idx_founder_agent_dispatch_readiness_events_event_type") && schemaSql.includes("idx_founder_agent_dispatch_readiness_evidence_refs_evidence_location"));
addCheck("SQLite schema transforms dispatch tables", sqliteSchema.includes("CREATE TABLE IF NOT EXISTS founder_agent_dispatch_readiness_items") && sqliteSchema.includes("evidence_refs             TEXT") && !sqliteSchema.includes("JSONB"));
addCheck("CRUD entity descriptions include dispatch columns", descriptions.founder_agent_dispatch_readiness_items.fields.dispatchReadinessId.column === "dispatch_readiness_id" && descriptions.founder_agent_dispatch_readiness_events.fields.projectMutationAllowed.column === "project_mutation_allowed" && descriptions.founder_agent_dispatch_readiness_evidence_refs.fields.evidenceLocation.column === "evidence_location");
addCheck("CRUD repository sees dispatch entity set", allEntities.length >= 41 && DISPATCH_ENTITIES.every((entity) => allEntities.some((entry) => entry.name === entity)));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P114.2 schema validation");
addCheck("isolated DB initializes dispatch tables", !cliAvailable || (init.initialized === true && init.tableCount >= 41 && existsSync(join(ROOT, TEST_DB))));
addCheck("isolated dispatch records can be inserted", !cliAvailable || (dispatchItem?.dispatchReadinessId === "p1142-dispatch-readiness" && dispatchEvent?.dispatchEventId === "p1142-dispatch-event" && evidenceRef?.dispatchEvidenceRefId === "p1142-dispatch-evidence"));
addCheck("array and boolean fields serialize safely", !cliAvailable || (Array.isArray(dispatchItem?.evidenceRefs) && dispatchItem?.operatorApproved === false && dispatchItem?.dispatchAllowed === false && dispatchItem?.executionAllowed === false && dispatchEvent?.projectMutationAllowed === false && evidenceRef?.redactionRequired === true));
addCheck("isolated dispatch records can be listed", !cliAvailable || dispatchItems.some((entry) => entry.dispatchReadinessId === "p1142-dispatch-readiness"));
addCheck("P114.1 checker accepts P114.2 handoff", p1141Checker.includes("P114.2") && p1141Checker.includes("P114.3") && p1141Checker.includes("scope check relaxed"));
addCheck("docs record P114.2", /P114\.2 Agent Dispatch SQLite Schema[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P114.2", /P114\.2 dispatch SQLite schema/.test(readme) && /P114\.3\s+is\s+next/.test(readme));
addCheck("platform roadmap records P114.2", /P114\.2 is complete/.test(platformRoadmap) && /P114\.3\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P114.2"
      && status.previousPhase === "P114.1"
      && status.nextPhase === "P114.3"
      && roadmap.currentPhase === "P114.2"
      && roadmap.previousPhase === "P114.1"
      && roadmap.nextPhase === "P114.3")
    || (status.currentPhase === "P114.3"
      && status.previousPhase === "P114.2"
      && status.nextPhase === "P114.4"
      && roadmap.currentPhase === "P114.3"
      && roadmap.previousPhase === "P114.2"
      && roadmap.nextPhase === "P114.4"))
    && statusById.get("P114")?.status === "in_progress"
    && statusById.get("P114.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P114.3")?.status)
    && ["planned", "complete"].includes(statusById.get("P114.4")?.status)
    && roadmapById.get("P114.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P114.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P114.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw dispatch table names", !/(founder_agent_dispatch_readiness_items|founder_agent_dispatch_readiness_events|founder_agent_dispatch_readiness_evidence_refs)/.test(publicDocsBundle));
addCheck("no unsafe runtime imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(unsafeSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(unsafeSource));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|dispatch execution is enabled|agent dispatch readiness is live/i.test(docsBundle));

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P114.2 local SQLite schema definitions for founder agent dispatch readiness items, dispatch events, and dispatch evidence references.",
        "- Confirms isolated SQLite initialization and CRUD repository mapping for the new allowlisted local entities.",
        "- Confirms the schema remains display-safe and does not enable hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: [
      "- npm run check:p1142-founder-live-agent-dispatch-readiness",
      "- npm run check:p1141-founder-live-agent-dispatch-contract",
      "- npm run check:os-phase-status",
      "- npm run check:phase-validation-coverage",
      "- git diff --check",
    ].join("\n") },
    {
      title: "Known Limitations",
      body: "- P114.2 is schema-only. It does not add runtime CRUD admission, write persistent runtime data, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P114.2 Founder Live Agent Dispatch Readiness Schema Report", phase: "P114.2" },
);

printCheckReport("P114.2 Founder Live Agent Dispatch Readiness Schema Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
