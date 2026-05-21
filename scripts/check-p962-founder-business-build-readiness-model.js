import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P96_FOUNDER_BUSINESS_BUILD_READINESS_PHASE,
  buildFounderBusinessBuildPersistenceSnapshot,
  buildFounderBusinessBuildReadinessViewModel,
  validateFounderBusinessBuildPersistenceSnapshot,
} from "../live-ready/founderBusinessBuildExecutionReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p962-founder-business-build-readiness-model-report.md";

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
const contract = readJson("contracts/os-roadmap/p96-execution-contracts.json");
const contractText = readText("contracts/os-roadmap/p96-execution-contracts.json");
const modelText = readText("live-ready/founderBusinessBuildExecutionReadiness.js");
const docs = readText("docs/architecture/P96_FOUNDER_BUSINESS_BUILD_LOCAL_EXECUTION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p962 = contract.subphases?.find((entry) => entry.phaseId === "P96.2");
const p963 = contract.subphases?.find((entry) => entry.phaseId === "P96.3");
const blockedEnvelope = buildFounderBusinessBuildPersistenceSnapshot();
const readyEnvelope = buildFounderBusinessBuildPersistenceSnapshot({
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
});
const blockedValidation = validateFounderBusinessBuildPersistenceSnapshot(blockedEnvelope);
const readyValidation = validateFounderBusinessBuildPersistenceSnapshot(readyEnvelope);
const viewModel = buildFounderBusinessBuildReadinessViewModel({
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
});
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
  return unsafeRuntimeFlags.every((flag) => envelope.data?.[flag] === false && envelope.data?.runtimeFlags?.[flag] === false);
}

const serialized = JSON.stringify([blockedEnvelope.data, readyEnvelope.data, viewModel]);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p962-founder-business-build-readiness-model"]));
addCheck("phase export is P96.2", P96_FOUNDER_BUSINESS_BUILD_READINESS_PHASE === "P96.2");
addCheck("model validates blocked state", blockedValidation.valid, blockedValidation.errors.join("; "));
addCheck("model validates ready state", readyValidation.valid, readyValidation.errors.join("; "));
addCheck("blocked state requires local evidence", blockedEnvelope.data.currentState === "business_build_local_execution_readiness_blocked_until_evidence" && blockedEnvelope.data.missingEvidence.length > 0 && blockedEnvelope.data.executionReadiness.approvalEvidenceComplete === false);
addCheck("ready state is local-only readiness", readyEnvelope.data.currentState === "business_build_local_execution_readiness_evidence_complete" && readyEnvelope.data.missingEvidence.length === 0 && readyEnvelope.data.executionReadiness.approvalEvidenceComplete === true && readyEnvelope.data.executionReadiness.ready === false);
addCheck("source records are display-safe", readyEnvelope.data.sourceRecords?.length === 4 && readyEnvelope.data.sourceRecords.every((record) => record.rawIdsHidden === true && record.rawTablesHidden === true && !/(founder_sessions|founder_qna_turns|founder_prd_artifacts|founder_workstream_plans)/.test(JSON.stringify(record))));
addCheck("readiness lanes are not executable", readyEnvelope.data.lanes?.every((lane) => lane.executionAllowed === false && lane.dispatchAllowed === false && lane.projectMutationAllowed === false));
addCheck("view model is display-ready", viewModel.readyLaneCount === 0 && viewModel.totalLaneCount === 4 && viewModel.lanes.length === 4 && viewModel.commandCenterVisible === true);
addCheck("unsafe runtime flags remain false", allUnsafeFlagsFalse(blockedEnvelope) && allUnsafeFlagsFalse(readyEnvelope));
addCheck("contract marks P96.2 complete", p962?.status === "complete" && ["planned", "complete"].includes(p963?.status));
addCheck("contract expected exports retained", contractText.includes("buildFounderBusinessBuildPersistenceSnapshot") && contractText.includes("validateFounderBusinessBuildPersistenceSnapshot") && contractText.includes("buildFounderBusinessBuildReadinessViewModel"));
addCheck("model reuses P94 and P95 helpers", modelText.includes("buildFounderRuntimeDbCrudWorkflow") && modelText.includes("buildFounderPersistenceOperatorControls") && modelText.includes("P94_FOUNDER_RUNTIME_DB_ENTITIES"));
addCheck("docs record P96.2", docs.includes("P96.2 is complete") && docs.includes("npm run check:p962-founder-business-build-readiness-model"));
addCheck("platform roadmap records P96.2", platformRoadmap.includes("P96.2 is complete") && (platformRoadmap.includes("P96.3 is next") || platformRoadmap.includes("P96.3 is planned") || platformRoadmap.includes("P96.3 is complete")));
addCheck(
  "phase status advanced",
  ["in_progress", "complete"].includes(statusById.get("P96")?.status)
    && statusById.get("P96.2")?.status === "complete"
    && ["P96.2", "P96.3", "P96.4", "P96.5", "P96.6", "P96.7"].includes(status.currentPhase)
    && ["P96.1", "P96.2", "P96.3", "P96.4", "P96.5", "P96.6"].includes(status.previousPhase)
    && ["P96.3", "P96.4", "P96.5", "P96.6", "P96.7", "P97"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P96.2", roadmapById.get("P96.2")?.track === "NEXUS_OS" && roadmapById.get("P96.2")?.status === "complete");
addCheck("P96.3 handoff exists", ["planned", "complete"].includes(statusById.get("P96.3")?.status) && ["planned", "complete"].includes(roadmapById.get("P96.3")?.status));
addCheck("model does not expose raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized));
addCheck("model does not invent unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write hosted db now|execute now/i.test(serialized));
addCheck("P96.2 avoids forbidden file scope", !p962.allowedFiles.some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("dashboard/src/") || file.startsWith("dashboard/tests/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P96.2 founder Business Build local execution readiness model.",
        "- Confirms display-safe local CRUD readiness summaries for founder session, Q&A turns, PRD artifact, and workstream plans.",
        "- Confirms P96.2 does not render Command Center UI, add local API routes, write DB state by default, dispatch agents, execute workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p962-founder-business-build-readiness-model",
        "- npm run check:p961-founder-business-build-readiness-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P96.2 is a display-safe readiness model only. It does not dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P96.2 Founder Business Build Readiness Model Report", phase: "P96.2" },
);

printCheckReport("P96.2 Founder Business Build Readiness Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
