import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { initializeSqliteRuntime, isSqliteCliAvailable } from "../db/sqliteRuntime.js";
import {
  P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PHASE,
  P117_RUNTIME_EXECUTION_APPROVAL_DB_ENTITIES,
  buildFounderRuntimeExecutionApprovalGateContract,
  buildSafeRuntimeExecutionApprovalEvidenceRecord,
  executeApprovedRuntimeExecutionApprovalGateCrudRequest,
  validateFounderRuntimeExecutionApprovalGateContract,
} from "../live-ready/founderRuntimeExecutionApprovalGate.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1173-founder-runtime-execution-approval-gate-report.md";
const TEST_DB = "local-state/runtime/check-p1173.sqlite";

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
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readJson("contracts/os-roadmap/p117-founder-runtime-execution-approval-gate-contracts.json");
const plan = readText("docs/architecture/P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const moduleSource = readText("live-ready/founderRuntimeExecutionApprovalGate.js");
const p1172Checker = readText("scripts/check-p1172-founder-runtime-execution-approval-gate.js");
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1173 = subphaseById.get("P117.3") || {};
const p1174 = subphaseById.get("P117.4") || {};

const blockedWorkflow = buildFounderRuntimeExecutionApprovalGateContract();
const readyWorkflow = buildFounderRuntimeExecutionApprovalGateContract({
  operatorReviewAccepted: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
});
const blockedValidation = validateFounderRuntimeExecutionApprovalGateContract(blockedWorkflow);
const readyValidation = validateFounderRuntimeExecutionApprovalGateContract(readyWorkflow);
const defaultBlocked = executeApprovedRuntimeExecutionApprovalGateCrudRequest({ sqliteEntity: "founder_runtime_execution_approval_evidence_items", requestKey: "default-blocked" });
const unreviewedBlocked = executeApprovedRuntimeExecutionApprovalGateCrudRequest(
  { sqliteEntity: "founder_runtime_execution_approval_evidence_items", requestKey: "unreviewed" },
  { execute: true, mode: "sqlite-live", enableWrites: true },
);
const deleteBlocked = executeApprovedRuntimeExecutionApprovalGateCrudRequest(
  { sqliteEntity: "founder_runtime_execution_approval_evidence_items", requestKey: "delete" },
  { execute: true, operation: "delete", operatorReviewAccepted: true, rollbackAccepted: true, auditAccepted: true, validationCommandsAccepted: true, mode: "sqlite-live", enableWrites: true },
);
const approveBlocked = executeApprovedRuntimeExecutionApprovalGateCrudRequest(
  { sqliteEntity: "founder_runtime_execution_approval_evidence_items", requestKey: "approve" },
  { execute: true, operation: "approve", operatorReviewAccepted: true, rollbackAccepted: true, auditAccepted: true, validationCommandsAccepted: true, mode: "sqlite-live", enableWrites: true },
);
const outsideAllowlistBlocked = executeApprovedRuntimeExecutionApprovalGateCrudRequest(
  { sqliteEntity: "founder_runtime_execution_readiness_items", requestKey: "outside" },
  { execute: true, operatorReviewAccepted: true, rollbackAccepted: true, auditAccepted: true, validationCommandsAccepted: true, mode: "sqlite-live", enableWrites: true },
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
    operatorReviewAccepted: true,
    rollbackAccepted: true,
    auditAccepted: true,
    validationCommandsAccepted: true,
    mode: "sqlite-live",
    enableWrites: true,
    dbPath: TEST_DB,
  };
  for (const entity of P117_RUNTIME_EXECUTION_APPROVAL_DB_ENTITIES) {
    writeResults.push(executeApprovedRuntimeExecutionApprovalGateCrudRequest(
      { sqliteEntity: entity, requestKey: `write-${entity}` },
      { ...sqliteInput, operation: "upsert", record: buildSafeRuntimeExecutionApprovalEvidenceRecord(entity, { evidenceKey: "p1173-check", timestamp: "2026-05-29T00:00:00.000Z" }) },
    ));
  }
  readResult = executeApprovedRuntimeExecutionApprovalGateCrudRequest(
    { sqliteEntity: "founder_runtime_execution_approval_evidence_items", requestKey: "read-entry" },
    { ...sqliteInput, operation: "read", id: "p1173-approval-evidence-p1173-check" },
  );
  updateResult = executeApprovedRuntimeExecutionApprovalGateCrudRequest(
    { sqliteEntity: "founder_runtime_execution_approval_evidence_items", requestKey: "update-entry" },
    { ...sqliteInput, operation: "update", id: "p1173-approval-evidence-p1173-check", patch: { evidenceState: "updated_locally", updatedAt: "2026-05-29T00:00:00.000Z" } },
  );
  listResult = executeApprovedRuntimeExecutionApprovalGateCrudRequest(
    { sqliteEntity: "founder_runtime_execution_approval_evidence_items", requestKey: "list-entry" },
    { ...sqliteInput, operation: "list", limit: 10 },
  );
}

const unsafeAuthorityFlags = [
  "approvalCaptureAllowed",
  "approvalPersistenceAllowed",
  "approvalDecisionRecorded",
  "runtimeApprovalAllowed",
  "runtimeExecutionAllowed",
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
  return unsafeAuthorityFlags.every((flag) => value[flag] === false);
}

const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P117.3";
const allowedFiles = new Set(p1173.allowedFiles || []);
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
const serialized = JSON.stringify([blockedWorkflow.data, readyWorkflow.data, defaultBlocked, unreviewedBlocked, deleteBlocked, approveBlocked, outsideAllowlistBlocked]);
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1173-founder-runtime-execution-approval-gate"]));
addCheck("phase export is P117.3", P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PHASE === "P117.3");
addCheck("allowed entity list is scoped", P117_RUNTIME_EXECUTION_APPROVAL_DB_ENTITIES.length === 3 && P117_RUNTIME_EXECUTION_APPROVAL_DB_ENTITIES.every((entity) => entity.startsWith("founder_runtime_execution_approval")));
addCheck("blocked workflow validates", blockedValidation.valid, blockedValidation.errors.join("; "));
addCheck("ready workflow validates", readyValidation.valid, readyValidation.errors.join("; "));
addCheck("workflow covers local CRUD requests", readyWorkflow.data.localCrudRequests.length === 3 && readyWorkflow.data.allowedLocalCrudOperations.join(",") === "create,read,update,upsert,list");
addCheck("approval capture remains blocked in workflow", readyWorkflow.data.approvalCaptureAllowed === false && readyWorkflow.data.approvalPersistenceAllowed === false && readyWorkflow.data.approvalDecisionRecorded === false);
addCheck("runtime execution remains blocked in workflow", readyWorkflow.data.runtimeExecutionAllowed === false && readyWorkflow.data.executionUnlockAllowed === false && readyWorkflow.data.agentDispatchAllowed === false);
addCheck("default execution is blocked", defaultBlocked.admitted === false && defaultBlocked.written === false && /execute=true/.test(defaultBlocked.disabledReason));
addCheck("unreviewed execution is blocked", unreviewedBlocked.admitted === false && /operator review/.test(unreviewedBlocked.disabledReason));
addCheck("delete is blocked", deleteBlocked.admitted === false && deleteBlocked.errors.some((error) => /Delete/.test(error)));
addCheck("approve operation is blocked", approveBlocked.admitted === false && approveBlocked.errors.some((error) => /Approval decision capture/.test(error)));
addCheck("outside allowlist is blocked", outsideAllowlistBlocked.admitted === false && outsideAllowlistBlocked.errors.some((error) => /not allowed/.test(error)));
addCheck("blocked results keep unsafe flags false", [defaultBlocked, unreviewedBlocked, deleteBlocked, approveBlocked, outsideAllowlistBlocked].every(allFlagsFalse));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P117.3 CRUD validation");
addCheck("isolated DB initializes", !cliAvailable || (init.initialized === true && existsSync(join(ROOT, TEST_DB))));
addCheck("approved local CRUD writes approval evidence records", !cliAvailable || writeResults.length === 3 && writeResults.every((result) => result.ok === true && result.admitted === true && result.written === true && result.hostedDbWritesAllowed === false && result.approvalCaptureAllowed === false && result.approvalPersistenceAllowed === false && result.approvalDecisionRecorded === false && result.runtimeExecutionAllowed === false && result.executionAllowed === false && result.executionUnlockAllowed === false && result.projectMutationAllowed === false));
addCheck("approved local CRUD reads approval evidence record", !cliAvailable || readResult?.record?.approvalEvidenceId === "p1173-approval-evidence-p1173-check");
addCheck("approved local CRUD updates approval evidence record", !cliAvailable || updateResult?.record?.evidenceState === "updated_locally");
addCheck("approved local CRUD lists approval evidence records", !cliAvailable || listResult?.records?.some((entry) => entry.approvalEvidenceId === "p1173-approval-evidence-p1173-check"));
addCheck("module reuses sqlite repository", moduleSource.includes("insertSqliteEntity") && moduleSource.includes("updateSqliteEntity") && moduleSource.includes("listSqliteEntityRecords"));
addCheck("module reuses runtime execution readiness helper", moduleSource.includes("buildSafeRuntimeExecutionDbRecord"));
addCheck("contract marks P117.3 complete", p1173.status === "complete" && ["planned", "complete"].includes(p1174.status));
addCheck("docs record P117.3", /P117\.3 Governed Local Approval Decision Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P117.3", /P117\.3 governed local approval decision model/i.test(readme) && /P117\.4\s+is\s+next/.test(readme));
addCheck("platform roadmap records P117.3", /P117\.3 is complete/.test(platformRoadmap) && /P117\.4 is next/.test(platformRoadmap));
addCheck("P117.2 checker accepts P117.3 handoff", p1172Checker.includes("P117.3") && p1172Checker.includes("P117.4") && p1172Checker.includes("scope check relaxed"));
addCheck(
  "phase status advanced",
  ["P117.3", "P117.4"].includes(status.currentPhase)
    && ["P117.2", "P117.3"].includes(status.previousPhase)
    && ["P117.4", "P117.5"].includes(status.nextPhase)
    && ["P117.3", "P117.4"].includes(roadmap.currentPhase)
    && ["P117.2", "P117.3"].includes(roadmap.previousPhase)
    && ["P117.4", "P117.5"].includes(roadmap.nextPhase)
    && statusById.get("P117")?.status === "in_progress"
    && statusById.get("P117.3")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P117.4")?.status)
    && ["planned", "complete"].includes(statusById.get("P117.5")?.status)
    && roadmapById.get("P117.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P117.3 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P117.3 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw approval evidence table names", !/(founder_runtime_execution_approval_evidence_items|founder_runtime_execution_approval_events|founder_runtime_execution_approval_evidence_refs)/.test(publicDocsBundle));
addCheck("no raw private IDs exposed", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized));
addCheck("no fake runnable actions", !/approve now|reject now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute runtime now|execute now/i.test(serialized));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(moduleSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(moduleSource));
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
        "- Validates P117.3 governed local founder runtime execution approval evidence review model.",
        "- Confirms approved create/read/update/upsert/list paths for allowlisted local approval evidence records in an isolated SQLite DB.",
        "- Confirms default execution, unreviewed execution, delete, approve/reject operations, outside allowlist, hosted DB mutation, raw SQL, project mutation, provider/model calls, agent dispatch, worker/tool execution, runtime execution, execution unlock, deploy, release, export, package, network calls, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1173-founder-runtime-execution-approval-gate",
        "- npm run check:p1172-founder-runtime-execution-approval-gate",
        "- npm run check:p1171-founder-runtime-execution-approval-gate-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P117.3 admits local SQLite CRUD only for allowlisted runtime execution approval evidence OS records after explicit local review gates. It does not capture approvals, persist approval decisions, wire Command Center to DB records, unlock execution, run workers/tools, dispatch agents, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P117.3 Founder Runtime Execution Approval Gate Model Report", phase: "P117.3" },
);

printCheckReport("P117.3 Founder Runtime Execution Approval Gate Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
