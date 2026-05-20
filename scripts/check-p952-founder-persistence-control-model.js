import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P95_FOUNDER_PERSISTENCE_ACTIONS,
  P95_FOUNDER_PERSISTENCE_CONTROLS_PHASE,
  buildFounderPersistenceOperatorControls,
  validateFounderPersistenceOperatorControls,
} from "../live-ready/founderPersistenceOperatorControls.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p952-founder-persistence-control-model-report.md";

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
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readJson("contracts/os-roadmap/p95-execution-contracts.json");
const contractText = readText("contracts/os-roadmap/p95-execution-contracts.json");
const modelText = readText("live-ready/founderPersistenceOperatorControls.js");
const docs = readText("docs/architecture/P95_FOUNDER_PERSISTENCE_OPERATOR_CONTROLS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p952 = contract.subphases?.find((entry) => entry.phaseId === "P95.2");
const p953 = contract.subphases?.find((entry) => entry.phaseId === "P95.3");
const blockedEnvelope = buildFounderPersistenceOperatorControls();
const readyEnvelope = buildFounderPersistenceOperatorControls({
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
});
const blockedValidation = validateFounderPersistenceOperatorControls(blockedEnvelope);
const readyValidation = validateFounderPersistenceOperatorControls(readyEnvelope);
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

function allUnsafeFlagsFalse(envelope) {
  return unsafeRuntimeFlags.every((flag) => envelope.data?.[flag] === false);
}

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p952-founder-persistence-control-model"]));
addCheck("phase export is P95.2", P95_FOUNDER_PERSISTENCE_CONTROLS_PHASE === "P95.2");
addCheck("P95 actions exported", P95_FOUNDER_PERSISTENCE_ACTIONS.length === 4 && P95_FOUNDER_PERSISTENCE_ACTIONS.includes("save_founder_session"));
addCheck("model validates blocked state", blockedValidation.valid, blockedValidation.errors.join("; "));
addCheck("model validates ready state", readyValidation.valid, readyValidation.errors.join("; "));
addCheck("blocked state requires approval evidence", blockedEnvelope.data.currentState === "founder_persistence_controls_blocked_until_approval_evidence" && blockedEnvelope.data.approvalState.complete === false && blockedEnvelope.data.blockers.length > 0);
addCheck("ready state is local-only approved", readyEnvelope.data.currentState === "founder_persistence_controls_ready_for_operator_confirmed_local_crud" && readyEnvelope.data.approvalState.complete === true && readyEnvelope.data.blockers.length === 0);
addCheck("entity summaries are display-safe", readyEnvelope.data.localEntitySummaries?.every((entry) => entry.displaySafe === true && entry.rawIdsHidden === true));
addCheck("pending actions are not fake unsafe actions", readyEnvelope.data.pendingControlActions?.every((action) => action.controlState.includes("operator_confirmed_local") && !/deploy|provider|worker|project/i.test(action.operation)));
addCheck("unsafe runtime flags remain false", allUnsafeFlagsFalse(blockedEnvelope) && allUnsafeFlagsFalse(readyEnvelope));
addCheck("contract marks P95.2 complete", p952?.status === "complete" && ["planned", "complete"].includes(p953?.status));
addCheck("contract expected exports retained", contractText.includes("buildFounderPersistenceOperatorControls") && contractText.includes("validateFounderPersistenceOperatorControls"));
addCheck("model reuses P94 CRUD workflow", modelText.includes("buildFounderRuntimeDbCrudWorkflow") && modelText.includes("P94_FOUNDER_RUNTIME_DB_ENTITIES"));
addCheck("docs record P95.2", docs.includes("P95.2 is complete") && docs.includes("display-safe founder persistence operator control"));
addCheck("platform roadmap records P95.2", platformRoadmap.includes("P95.2 is complete") && (platformRoadmap.includes("P95.3 is next") || platformRoadmap.includes("P95.3 is complete")));
addCheck(
  "phase status advanced",
  statusById.get("P95")?.status === "in_progress"
    && statusById.get("P95.2")?.status === "complete"
    && ["P95.2", "P95.3", "P95.4", "P95.5", "P95.6", "P95.7"].includes(status.currentPhase)
    && ["P95.1", "P95.2", "P95.3", "P95.4", "P95.5", "P95.6"].includes(status.previousPhase)
    && ["P95.3", "P95.4", "P95.5", "P95.6", "P95.7", "P96"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P95.2", roadmapById.get("P95.2")?.track === "NEXUS_OS" && roadmapById.get("P95.2")?.status === "complete");
addCheck("P95.3 handoff exists", ["planned", "complete"].includes(statusById.get("P95.3")?.status) && ["planned", "complete"].includes(roadmapById.get("P95.3")?.status));
addCheck("model does not expose raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify([blockedEnvelope.data, readyEnvelope.data])));
addCheck("model does not invent unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write hosted db now|generate app now/i.test(JSON.stringify([blockedEnvelope.data, readyEnvelope.data])));
addCheck("P95.2 avoids forbidden file scope", !p952.allowedFiles.some((file) => file.startsWith("db/") || file.startsWith("dashboard/src/") || file.startsWith("dashboard/tests/") || file.startsWith("local-state/runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P95.2 founder persistence operator control model.",
        "- Confirms display-safe local entity summaries, approval evidence, rollback/audit references, pending local control actions, and disabled unsafe runtime flags.",
        "- Confirms P95.2 does not write DB state, mutate projects, change Command Center UI, dispatch agents, execute workers/tools, call providers/models, deploy, package, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p952-founder-persistence-control-model",
        "- npm run check:p951-founder-persistence-controls-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P95.2 is a display-safe model only. It does not execute SQLite CRUD, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P95.2 Founder Persistence Control Model Report", phase: "P95.2" },
);

printCheckReport("P95.2 Founder Persistence Control Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
