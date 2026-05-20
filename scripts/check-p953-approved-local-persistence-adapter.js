import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { initializeSqliteRuntime } from "../db/sqliteRuntime.js";
import {
  executeFounderPersistenceControlAction,
  validateFounderPersistenceOperatorControls,
} from "../live-ready/founderPersistenceOperatorControls.js";
import { readFileSync } from "node:fs";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p953-approved-local-persistence-adapter-report.md";
const TEST_DB = "local-state/runtime/check-p953.sqlite";

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

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p95-execution-contracts.json");
const docs = readText("docs/architecture/P95_FOUNDER_PERSISTENCE_OPERATOR_CONTROLS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p953 = contract.subphases?.find((entry) => entry.phaseId === "P95.3");

if (existsSync(join(ROOT, TEST_DB))) rmSync(join(ROOT, TEST_DB), { force: true });
const runtime = initializeSqliteRuntime({
  mode: "sqlite-live",
  enableWrites: true,
  dbPath: TEST_DB,
  dryRun: false,
});
const approvedInput = {
  mode: "sqlite-live",
  enableWrites: true,
  dbWritesEnabled: true,
  dbPath: TEST_DB,
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  operatorConfirmedLocalPersistence: true,
  sessionKey: "p953-founder-session",
};
const blocked = executeFounderPersistenceControlAction("save_founder_session", {});
const unknown = executeFounderPersistenceControlAction("unsafe_action", approvedInput);
const deleted = executeFounderPersistenceControlAction("save_founder_session", { ...approvedInput, operation: "delete" });
const write = executeFounderPersistenceControlAction("save_founder_session", approvedInput);
const read = executeFounderPersistenceControlAction("read_founder_session", approvedInput);
const list = executeFounderPersistenceControlAction("list_workstream_plans", approvedInput);
const validation = validateFounderPersistenceOperatorControls({
  ok: true,
  phase: "P95.2",
  data: {
    schemaVersion: "test",
    currentState: "founder_persistence_controls_ready_for_operator_confirmed_local_crud",
    runtimeMode: "test",
    dbMode: "sqlite-live",
    approvalState: { complete: true },
    approvalEvidence: {
      operatorApproval: true,
      rollbackAccepted: true,
      auditAccepted: true,
      validationCommandsAccepted: true,
      sqliteLiveMode: true,
      sqliteWritesEnabled: true,
    },
    localEntitySummaries: [],
    pendingControlActions: [],
    allowedLocalCrudOperations: [],
    forbiddenOperations: [],
    rollbackPlan: { required: true },
    auditRefs: ["reports/p953-approved-local-persistence-adapter-report.md"],
    evidenceRefs: ["reports/p953-approved-local-persistence-adapter-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    nextAction: "test",
    blockers: [],
    disabledReason: "test",
    ownerCapability: "test",
    costImpact: "test",
    commandCenterVisible: true,
  },
});
const serialized = JSON.stringify({ blocked, unknown, deleted, write, read, list });

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p953-approved-local-persistence-adapter"]));
addCheck("contract tracks P95.3 complete", p953?.status === "complete" && p953.allowedFiles?.includes("live-ready/founderPersistenceOperatorControls.js"));
addCheck("isolated SQLite runtime initialized", runtime.initialized === true && runtime.tableCount > 0);
addCheck("blocked action requires operator confirmation", blocked.admitted === false && blocked.localSqlitePersistenceAllowed === false);
addCheck("unknown action blocked", unknown.admitted === false && unknown.errors.length > 0);
addCheck("delete operation blocked", deleted.admitted === false && deleted.errors.some((error) => error.includes("Delete")));
addCheck("approved local write works", write.admitted === true && write.written === true && write.entity === "founder_sessions");
addCheck("approved local read works", read.admitted === true && read.read === true && read.entity === "founder_sessions");
addCheck("approved local list works", list.admitted === true && list.read === true && list.recordSummary?.rawIdsHidden === true);
addCheck("unsafe runtime flags remain false", [blocked, write, read, list].every((result) => result.providerCallsAllowed === false && result.agentDispatchAllowed === false && result.projectMutationAllowed === false && result.hostedDbWritesAllowed === false && result.providerSpendAllowed === false));
addCheck("control validator remains available", validation.valid === false && validation.errors.length > 0);
addCheck("docs record P95.3", docs.includes("P95.3 is complete") && docs.includes("npm run check:p953-approved-local-persistence-adapter"));
addCheck("platform roadmap records P95.3", platformRoadmap.includes("P95.3 is complete") && (platformRoadmap.includes("P95.4 is next") || platformRoadmap.includes("P95.4 is complete")));
addCheck(
  "phase status advanced",
  statusById.get("P95")?.status === "in_progress"
    && statusById.get("P95.3")?.status === "complete"
    && ["P95.3", "P95.4", "P95.5", "P95.6", "P95.7"].includes(status.currentPhase)
    && ["P95.2", "P95.3", "P95.4", "P95.5", "P95.6"].includes(status.previousPhase)
    && ["P95.4", "P95.5", "P95.6", "P95.7", "P96"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P95.3", roadmapById.get("P95.3")?.track === "NEXUS_OS" && roadmapById.get("P95.3")?.status === "complete");
addCheck("P95.4 handoff exists", ["planned", "complete"].includes(statusById.get("P95.4")?.status) && ["planned", "complete"].includes(roadmapById.get("P95.4")?.status));
addCheck("no raw private IDs in adapter output", !/private-project-|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d|Bearer\s+/i.test(serialized));
addCheck("no fake runnable unsafe actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write hosted db now/i.test(serialized));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P95.3 approved local founder persistence adapter.",
        "- Confirms approved local SQLite write/read/list paths reuse P94 CRUD admission.",
        "- Confirms unknown actions, delete, missing approval, hosted DB, project mutation, provider calls, dispatch, deploy, package, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p953-approved-local-persistence-adapter",
        "- npm run check:p952-founder-persistence-control-model",
        "- npm run check:p951-founder-persistence-controls-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P95.3 admits only local SQLite founder workflow records with explicit approval/write evidence. It does not add Command Center UI, hosted DB mutation, project mutation, provider/model calls, agent dispatch, worker/tool execution, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P95.3 Approved Local Persistence Adapter Report", phase: "P95.3" },
);

if (existsSync(join(ROOT, TEST_DB))) rmSync(join(ROOT, TEST_DB), { force: true });

printCheckReport("P95.3 Approved Local Persistence Adapter Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
