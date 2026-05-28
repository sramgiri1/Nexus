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
const REPORT_PATH = "reports/p1102-founder-live-operator-decision-ledger-schema-report.md";
const TEST_DB = "local-state/runtime/check-p1102.sqlite";
const LEDGER_ENTITIES = [
  "operator_decision_ledger_entries",
  "operator_decision_ledger_events",
  "operator_decision_ledger_evidence_refs",
];

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
const schema = readJson("db/schema.json");
const schemaSql = readText("db/schema.sql");
const sqliteSchema = loadSqliteSchema();
const contract = readJson("contracts/os-roadmap/p110-founder-live-operator-decision-ledger-persistence-contracts.json");
const plan = readText("docs/architecture/P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const entityByName = new Map((schema.entities || []).map((entry) => [entry.name, entry]));
const p1102 = contract.subphases?.find((entry) => entry.phaseId === "P110.2") || {};
const p1103 = contract.subphases?.find((entry) => entry.phaseId === "P110.3") || {};
const descriptions = Object.fromEntries(LEDGER_ENTITIES.map((entity) => [entity, describeSqliteCrudEntity(entity)]));
const cliAvailable = isSqliteCliAvailable();
const init = cliAvailable
  ? initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: false, reset: true })
  : { initialized: false, tableCount: 0 };

let ledgerEntry = null;
let ledgerEvent = null;
let evidenceRef = null;
let ledgerEntries = [];

if (cliAvailable && init.initialized) {
  const sqliteInput = { mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB };
  ledgerEntry = insertSqliteEntity("operator_decision_ledger_entries", {
    ledgerEntryId: "p1102-entry",
    publicLabel: "Operator decision ledger entry",
    sourceCandidateLabel: "Decision Ledger Candidate",
    sourceReviewLabel: "Operator Review Audit",
    proposedAgentLane: "Product Strategy",
    proposedOutcome: "Prepare governed work for later review.",
    decisionState: "schema_validated_locally",
    decisionSummary: "Schema validation only; no operator decision captured.",
    nextAction: "Model governed local CRUD admission in P110.3.",
    disabledReason: "P110.2 is schema-only.",
    ownerCapability: "NEXUS Operator Decision Ledger DB",
    ledgerWriteAllowed: false,
    dbWriteAllowed: false,
    hostedDbMutationAllowed: false,
    replayAllowed: false,
    executionUnlockAllowed: false,
    runtimeAdmissionAllowed: false,
    dispatchAllowed: false,
    projectMutationAllowed: false,
    providerSpendAllowed: false,
    evidenceRefs: ["reports/p1102-founder-live-operator-decision-ledger-schema-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
    createdAt: "2026-05-28T00:00:00.000Z",
    updatedAt: "2026-05-28T00:00:00.000Z",
  }, sqliteInput);
  ledgerEvent = insertSqliteEntity("operator_decision_ledger_events", {
    ledgerEventId: "p1102-event",
    ledgerEntryId: "p1102-entry",
    eventType: "schema_validation",
    eventState: "recorded_locally",
    actorLabel: "NEXUS schema checker",
    eventSummary: "Validated local schema mapping without enabling replay or execution.",
    rollbackAvailable: true,
    replayAllowed: false,
    executionUnlockAllowed: false,
    runtimeAdmissionAllowed: false,
    evidenceRefs: ["reports/p1102-founder-live-operator-decision-ledger-schema-report.md"],
    createdAt: "2026-05-28T00:00:00.000Z",
  }, sqliteInput);
  evidenceRef = insertSqliteEntity("operator_decision_ledger_evidence_refs", {
    evidenceRefId: "p1102-evidence",
    ledgerEntryId: "p1102-entry",
    evidenceLabel: "P110.2 schema report",
    evidenceType: "validation_report",
    evidenceLocation: "reports/p1102-founder-live-operator-decision-ledger-schema-report.md",
    redactionRequired: true,
    retainedForAudit: true,
    createdAt: "2026-05-28T00:00:00.000Z",
  }, sqliteInput);
  ledgerEntries = listSqliteEntityRecords("operator_decision_ledger_entries", { limit: 5 }, sqliteInput);
}

const allEntities = listSqliteCrudEntities();
const unsafeSource = [
  schemaSql,
  readText("db/schema.json"),
].join("\n");
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1102-founder-live-operator-decision-ledger-schema"]));
addCheck("contract marks P110.2 complete", p1102.status === "complete" && p1102.allowedFiles?.includes("db/schema.json") && p1102.allowedFiles?.includes("db/schema.sql"));
addCheck("P110.3 remains planned or complete", ["planned", "complete"].includes(p1103.status));
addCheck("decision ledger entities exist in schema", LEDGER_ENTITIES.every((entity) => entityByName.has(entity)));
addCheck("decision ledger entities are redacted low-risk local state", LEDGER_ENTITIES.every((entity) => entityByName.get(entity)?.redactionRequired === true && entityByName.get(entity)?.piiRisk === "low" && /^operator_decision_ledger_/.test(entityByName.get(entity)?.retentionClass || "")));
addCheck("ledger entry shape is complete", entityByName.get("operator_decision_ledger_entries")?.primaryKey === "ledgerEntryId" && entityByName.get("operator_decision_ledger_entries")?.fields?.decisionState === "string" && entityByName.get("operator_decision_ledger_entries")?.fields?.executionUnlockAllowed === "boolean");
addCheck("ledger event shape blocks replay and runtime admission", entityByName.get("operator_decision_ledger_events")?.fields?.replayAllowed === "boolean" && entityByName.get("operator_decision_ledger_events")?.fields?.runtimeAdmissionAllowed === "boolean");
addCheck("ledger evidence shape is display-safe", entityByName.get("operator_decision_ledger_evidence_refs")?.primaryKey === "evidenceRefId" && entityByName.get("operator_decision_ledger_evidence_refs")?.fields?.evidenceLocation === "string" && entityByName.get("operator_decision_ledger_evidence_refs")?.fields?.redactionRequired === "boolean");
addCheck("SQL tables exist", LEDGER_ENTITIES.every((entity) => schemaSql.includes(`CREATE TABLE IF NOT EXISTS ${entity}`)));
addCheck("SQL indexes exist", schemaSql.includes("idx_operator_decision_ledger_entries_decision_state") && schemaSql.includes("idx_operator_decision_ledger_events_event_type") && schemaSql.includes("idx_operator_decision_ledger_evidence_refs_evidence_location"));
addCheck("SQLite schema transforms ledger tables", sqliteSchema.includes("CREATE TABLE IF NOT EXISTS operator_decision_ledger_entries") && sqliteSchema.includes("evidence_refs             TEXT") && !sqliteSchema.includes("JSONB"));
addCheck("CRUD entity descriptions include ledger columns", descriptions.operator_decision_ledger_entries.fields.ledgerEntryId.column === "ledger_entry_id" && descriptions.operator_decision_ledger_events.fields.runtimeAdmissionAllowed.column === "runtime_admission_allowed" && descriptions.operator_decision_ledger_evidence_refs.fields.evidenceLocation.column === "evidence_location");
addCheck("CRUD repository sees ledger entity set", allEntities.length >= 29 && LEDGER_ENTITIES.every((entity) => allEntities.some((entry) => entry.name === entity)));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P110.2 schema validation");
addCheck("isolated DB initializes ledger tables", !cliAvailable || (init.initialized === true && init.tableCount >= 29 && existsSync(join(ROOT, TEST_DB))));
addCheck("isolated ledger records can be inserted", !cliAvailable || (ledgerEntry?.ledgerEntryId === "p1102-entry" && ledgerEvent?.ledgerEventId === "p1102-event" && evidenceRef?.evidenceRefId === "p1102-evidence"));
addCheck("array and boolean fields serialize safely", !cliAvailable || (Array.isArray(ledgerEntry?.evidenceRefs) && ledgerEntry?.executionUnlockAllowed === false && ledgerEvent?.replayAllowed === false && evidenceRef?.redactionRequired === true));
addCheck("isolated ledger records can be listed", !cliAvailable || ledgerEntries.some((entry) => entry.ledgerEntryId === "p1102-entry"));
addCheck("docs record P110.2", /P110\.2 Decision Ledger SQLite Schema[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P110.2", /P110\.2 decision-ledger SQLite schema/.test(readme) && /P110\.3 is next/.test(readme));
addCheck("platform roadmap records P110.2", /P110\.2 is complete/.test(platformRoadmap) && /P110\.3 is next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P110.2"
      && status.previousPhase === "P110.1"
      && status.nextPhase === "P110.3"
      && roadmap.currentPhase === "P110.2"
      && roadmap.previousPhase === "P110.1"
      && roadmap.nextPhase === "P110.3")
    || (status.currentPhase === "P110.3"
      && status.previousPhase === "P110.2"
      && status.nextPhase === "P110.4"
      && roadmap.currentPhase === "P110.3"
      && roadmap.previousPhase === "P110.2"
      && roadmap.nextPhase === "P110.4")
    || (status.currentPhase === "P110.4"
      && status.previousPhase === "P110.3"
      && status.nextPhase === "P110.5"
      && roadmap.currentPhase === "P110.4"
      && roadmap.previousPhase === "P110.3"
      && roadmap.nextPhase === "P110.5")
    || (status.currentPhase === "P110.5"
      && status.previousPhase === "P110.4"
      && status.nextPhase === "P110.6"
      && roadmap.currentPhase === "P110.5"
      && roadmap.previousPhase === "P110.4"
      && roadmap.nextPhase === "P110.6"))
    && statusById.get("P110")?.status === "in_progress"
    && statusById.get("P110.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P110.3")?.status)
    && roadmapById.get("P110.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("no unsafe runtime imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(unsafeSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(unsafeSource));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled/i.test(docsBundle));

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P110.2 local SQLite schema definitions for operator decision ledger entries, events, and evidence references.",
        "- Confirms isolated SQLite initialization and CRUD repository mapping for the new allowlisted local entities.",
        "- Confirms the schema remains display-safe and does not enable hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
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
      body: "- P110.2 is schema-only. It does not add runtime CRUD admission, write persistent runtime data, capture operator decisions, wire Command Center to DB records, unlock execution, admit runtime execution, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P110.2 Founder Live Operator Decision Ledger Schema Report", phase: "P110.2" },
);

printCheckReport("P110.2 Founder Live Operator Decision Ledger Schema Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
