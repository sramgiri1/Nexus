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
const REPORT_PATH = "reports/p1172-founder-runtime-execution-approval-gate-report.md";
const TEST_DB = "local-state/runtime/check-p1172.sqlite";
const APPROVAL_EVIDENCE_ENTITIES = [
  "founder_runtime_execution_approval_evidence_items",
  "founder_runtime_execution_approval_events",
  "founder_runtime_execution_approval_evidence_refs",
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

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 1] || ""} ${line}`;
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|schema-only|planned-only)\b/i.test(context);
  });
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
const contract = readJson("contracts/os-roadmap/p117-founder-runtime-execution-approval-gate-contracts.json");
const plan = readText("docs/architecture/P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const entityByName = new Map((schema.entities || []).map((entry) => [entry.name, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1172 = subphaseById.get("P117.2") || {};
const p1173 = subphaseById.get("P117.3") || {};
const p1174 = subphaseById.get("P117.4") || {};
const p1171Checker = readText("scripts/check-p1171-founder-runtime-execution-approval-gate-contract.js");
const descriptions = Object.fromEntries(APPROVAL_EVIDENCE_ENTITIES.map((entity) => [entity, describeSqliteCrudEntity(entity)]));
const cliAvailable = isSqliteCliAvailable();
const init = cliAvailable
  ? initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: false, reset: true })
  : { initialized: false, tableCount: 0 };
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P117.2";
const allowedFiles = new Set(p1172.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
  "live-ready/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
  ".env",
];

let approvalEvidenceItem = null;
let approvalEvidenceEvent = null;
let approvalEvidenceRef = null;
let approvalEvidenceItems = [];

if (cliAvailable && init.initialized) {
  const sqliteInput = { mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB };
  approvalEvidenceItem = insertSqliteEntity("founder_runtime_execution_approval_evidence_items", {
    approvalEvidenceId: "p1172-approval-evidence",
    runtimeExecutionId: "p1172-runtime-execution",
    runtimeAdmissionId: "p1172-runtime-admission",
    dispatchReadinessId: "p1172-dispatch-readiness",
    assignmentId: "p1172-assignment",
    queueItemId: "p1172-queue-item",
    workOrderId: "p1172-work-order",
    publicLabel: "Founder runtime execution approval evidence",
    approvalGateState: "schema_validated_locally",
    evidenceState: "ready_for_future_review_model",
    approvalQuestion: "Should this future runtime execution request be eligible for operator review?",
    evidenceSummary: "Schema validation only; approval capture and runtime execution remain blocked.",
    ownerCapability: "NEXUS Runtime Approval Gate",
    nextAction: "Model governed local approval decision review in P117.3.",
    disabledReason: "P117.2 is schema-only.",
    operatorDecisionRequired: true,
    operatorDecisionRecorded: false,
    approvalCaptureAllowed: false,
    approvalPersistenceAllowed: false,
    localCrudAllowed: false,
    dbWriteAllowed: false,
    hostedDbMutationAllowed: false,
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
    evidenceRefs: ["reports/p1172-founder-runtime-execution-approval-gate-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
    createdAt: "2026-05-29T00:00:00.000Z",
    updatedAt: "2026-05-29T00:00:00.000Z",
  }, sqliteInput);
  approvalEvidenceEvent = insertSqliteEntity("founder_runtime_execution_approval_events", {
    approvalEvidenceEventId: "p1172-approval-evidence-event",
    approvalEvidenceId: "p1172-approval-evidence",
    runtimeExecutionId: "p1172-runtime-execution",
    runtimeAdmissionId: "p1172-runtime-admission",
    dispatchReadinessId: "p1172-dispatch-readiness",
    assignmentId: "p1172-assignment",
    queueItemId: "p1172-queue-item",
    workOrderId: "p1172-work-order",
    eventType: "schema_validation",
    eventState: "recorded_locally",
    actorLabel: "NEXUS schema checker",
    eventSummary: "Validated local runtime approval evidence schema mapping without approval capture.",
    rollbackAvailable: true,
    approvalCaptureAllowed: false,
    approvalPersistenceAllowed: false,
    runtimeExecutionAllowed: false,
    executionUnlockAllowed: false,
    workerExecutionAllowed: false,
    toolExecutionAllowed: false,
    providerCallAllowed: false,
    agentDispatchAllowed: false,
    projectMutationAllowed: false,
    networkCallAllowed: false,
    providerSpendAllowed: false,
    evidenceRefs: ["reports/p1172-founder-runtime-execution-approval-gate-report.md"],
    createdAt: "2026-05-29T00:00:00.000Z",
  }, sqliteInput);
  approvalEvidenceRef = insertSqliteEntity("founder_runtime_execution_approval_evidence_refs", {
    approvalEvidenceRefId: "p1172-approval-evidence-ref",
    approvalEvidenceId: "p1172-approval-evidence",
    runtimeExecutionId: "p1172-runtime-execution",
    runtimeAdmissionId: "p1172-runtime-admission",
    dispatchReadinessId: "p1172-dispatch-readiness",
    assignmentId: "p1172-assignment",
    queueItemId: "p1172-queue-item",
    workOrderId: "p1172-work-order",
    evidenceLabel: "P117.2 schema report",
    evidenceType: "validation_report",
    evidenceLocation: "reports/p1172-founder-runtime-execution-approval-gate-report.md",
    redactionRequired: true,
    retainedForAudit: true,
    createdAt: "2026-05-29T00:00:00.000Z",
  }, sqliteInput);
  approvalEvidenceItems = listSqliteEntityRecords("founder_runtime_execution_approval_evidence_items", { limit: 5 }, sqliteInput);
}

const allEntities = listSqliteCrudEntities();
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;
const unsafeSource = `${schemaSql}\n${readText("db/schema.json")}`;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1172-founder-runtime-execution-approval-gate"]));
addCheck("contract marks P117.2 complete", p1172.status === "complete" && p1172.allowedFiles?.includes("db/schema.json") && p1172.allowedFiles?.includes("db/schema.sql"));
addCheck("P117.3 remains planned or complete", ["planned", "complete"].includes(p1173.status));
addCheck("P117.4 remains planned or complete", ["planned", "complete"].includes(p1174.status));
addCheck("approval evidence entities exist in schema", APPROVAL_EVIDENCE_ENTITIES.every((entity) => entityByName.has(entity)));
addCheck("approval evidence entities are redacted low-risk local state", APPROVAL_EVIDENCE_ENTITIES.every((entity) => entityByName.get(entity)?.redactionRequired === true && entityByName.get(entity)?.piiRisk === "low" && /^founder_runtime_execution_approval/.test(entityByName.get(entity)?.retentionClass || "")));
addCheck("approval evidence item shape is complete", entityByName.get("founder_runtime_execution_approval_evidence_items")?.primaryKey === "approvalEvidenceId" && entityByName.get("founder_runtime_execution_approval_evidence_items")?.fields?.approvalGateState === "string" && entityByName.get("founder_runtime_execution_approval_evidence_items")?.fields?.evidenceState === "string" && entityByName.get("founder_runtime_execution_approval_evidence_items")?.fields?.operatorDecisionRecorded === "boolean");
addCheck("approval evidence item blocks approval and execution", ["approvalCaptureAllowed", "approvalPersistenceAllowed", "runtimeExecutionAllowed", "executionUnlockAllowed", "workerExecutionAllowed", "toolExecutionAllowed", "providerCallAllowed", "agentDispatchAllowed", "projectMutationAllowed", "networkCallAllowed", "providerSpendAllowed"].every((field) => entityByName.get("founder_runtime_execution_approval_evidence_items")?.fields?.[field] === "boolean"));
addCheck("approval event shape blocks approval capture", entityByName.get("founder_runtime_execution_approval_events")?.fields?.approvalCaptureAllowed === "boolean" && entityByName.get("founder_runtime_execution_approval_events")?.fields?.approvalPersistenceAllowed === "boolean" && entityByName.get("founder_runtime_execution_approval_events")?.fields?.runtimeExecutionAllowed === "boolean" && entityByName.get("founder_runtime_execution_approval_events")?.fields?.executionUnlockAllowed === "boolean");
addCheck("approval evidence ref shape is display-safe", entityByName.get("founder_runtime_execution_approval_evidence_refs")?.primaryKey === "approvalEvidenceRefId" && entityByName.get("founder_runtime_execution_approval_evidence_refs")?.fields?.evidenceLocation === "string" && entityByName.get("founder_runtime_execution_approval_evidence_refs")?.fields?.redactionRequired === "boolean");
addCheck("SQL tables exist", APPROVAL_EVIDENCE_ENTITIES.every((entity) => schemaSql.includes(`CREATE TABLE IF NOT EXISTS ${entity}`)));
addCheck("SQL indexes exist", schemaSql.includes("idx_founder_runtime_execution_approval_evidence_items_approval_gate_state") && schemaSql.includes("idx_founder_runtime_execution_approval_events_event_type") && schemaSql.includes("idx_founder_runtime_execution_approval_evidence_refs_evidence_location"));
addCheck("SQLite schema transforms approval evidence tables", sqliteSchema.includes("CREATE TABLE IF NOT EXISTS founder_runtime_execution_approval_evidence_items") && sqliteSchema.includes("approval_capture_allowed") && !sqliteSchema.includes("JSONB"));
addCheck("CRUD entity descriptions include approval evidence columns", descriptions.founder_runtime_execution_approval_evidence_items.fields.approvalEvidenceId.column === "approval_evidence_id" && descriptions.founder_runtime_execution_approval_events.fields.approvalPersistenceAllowed.column === "approval_persistence_allowed" && descriptions.founder_runtime_execution_approval_evidence_refs.fields.evidenceLocation.column === "evidence_location");
addCheck("CRUD repository sees approval evidence entity set", allEntities.length >= 50 && APPROVAL_EVIDENCE_ENTITIES.every((entity) => allEntities.some((entry) => entry.name === entity)));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P117.2 schema validation");
addCheck("isolated DB initializes approval evidence tables", !cliAvailable || (init.initialized === true && init.tableCount >= 50 && existsSync(join(ROOT, TEST_DB))));
addCheck("isolated approval evidence records can be inserted", !cliAvailable || (approvalEvidenceItem?.approvalEvidenceId === "p1172-approval-evidence" && approvalEvidenceEvent?.approvalEvidenceEventId === "p1172-approval-evidence-event" && approvalEvidenceRef?.approvalEvidenceRefId === "p1172-approval-evidence-ref"));
addCheck("array and boolean fields serialize safely", !cliAvailable || (Array.isArray(approvalEvidenceItem?.evidenceRefs) && approvalEvidenceItem?.operatorDecisionRecorded === false && approvalEvidenceItem?.approvalCaptureAllowed === false && approvalEvidenceItem?.runtimeExecutionAllowed === false && approvalEvidenceEvent?.approvalPersistenceAllowed === false && approvalEvidenceRef?.redactionRequired === true));
addCheck("isolated approval evidence records can be listed", !cliAvailable || approvalEvidenceItems.some((entry) => entry.approvalEvidenceId === "p1172-approval-evidence"));
addCheck("P117.1 checker accepts P117.2 handoff", p1171Checker.includes("P117.2") && p1171Checker.includes("P117.3") && p1171Checker.includes("scope check relaxed"));
addCheck("docs record P117.2", /P117\.2 Approval Evidence Schema Metadata[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P117.2", /P117\.2 approval evidence schema metadata/i.test(readme) && /P117\.3\s+is\s+next/.test(readme));
addCheck("platform roadmap records P117.2", /P117\.2 is complete/.test(platformRoadmap) && /P117\.3\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P117.2"
      && status.previousPhase === "P117.1"
      && status.nextPhase === "P117.3"
      && roadmap.currentPhase === "P117.2"
      && roadmap.previousPhase === "P117.1"
      && roadmap.nextPhase === "P117.3")
    || (status.currentPhase === "P117.3"
      && status.previousPhase === "P117.2"
      && status.nextPhase === "P117.4"
      && roadmap.currentPhase === "P117.3"
      && roadmap.previousPhase === "P117.2"
      && roadmap.nextPhase === "P117.4")
    || (status.currentPhase === "P117.4"
      && status.previousPhase === "P117.3"
      && status.nextPhase === "P117.5"
      && roadmap.currentPhase === "P117.4"
      && roadmap.previousPhase === "P117.3"
      && roadmap.nextPhase === "P117.5"))
    && statusById.get("P117")?.status === "in_progress"
    && statusById.get("P117.1")?.status === "complete"
    && statusById.get("P117.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P117.3")?.status)
    && ["planned", "complete"].includes(statusById.get("P117.4")?.status)
    && roadmapById.get("P117.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P117.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P117.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw approval evidence table names", !/(founder_runtime_execution_approval_evidence_items|founder_runtime_execution_approval_events|founder_runtime_execution_approval_evidence_refs)/.test(publicDocsBundle));
addCheck("docs avoid fake runnable actions", !/approve now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(docsBundle));
addCheck("no unsafe runtime imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(unsafeSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(unsafeSource));
addCheck(
  "docs do not claim unsafe authority live",
  !hasUnsafePositiveClaim(
    docsBundle,
    /approval capture is enabled|approval persistence is enabled|runtime approval is live|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i,
  ),
);

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P117.2 local SQLite schema definitions for founder runtime execution approval evidence items, approval events, and approval evidence references.",
        "- Confirms isolated SQLite initialization and CRUD repository mapping for the new allowlisted local entities.",
        "- Confirms the schema remains display-safe and does not enable approval capture, approval persistence, hosted DB mutation, raw SQL, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1172-founder-runtime-execution-approval-gate",
        "- npm run check:p1171-founder-runtime-execution-approval-gate-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P117.2 is schema-only. It does not capture approvals, persist approvals, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P117.2 Founder Runtime Execution Approval Gate Schema Report", phase: "P117.2" },
);

printCheckReport("P117.2 Founder Runtime Execution Approval Gate Schema Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
