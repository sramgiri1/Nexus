import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P112_AGENT_WORK_QUEUE_ADMISSION_PREVIEW_STATES,
  P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PREVIEW_PHASE,
  buildFounderLiveAgentWorkQueueAdmissionPreview,
  validateFounderLiveAgentWorkQueueAdmissionPreview,
} from "../live-ready/founderLiveAgentWorkQueueAdmission.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1124-founder-live-agent-work-queue-admission-preview-report.md";

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
const contract = readJson("contracts/os-roadmap/p112-founder-live-agent-work-queue-admission-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const source = readText("live-ready/founderLiveAgentWorkQueueAdmission.js");
const preview = buildFounderLiveAgentWorkQueueAdmissionPreview({
  founderIdea: "Build a simple iOS Snake game for the App Store",
  publicLabel: "iOS Snake game founder work order",
  workOrderSummary: "Validate the iOS Snake game idea, draft PRD readiness, and map agent work lanes.",
});
const validation = validateFounderLiveAgentWorkQueueAdmissionPreview(preview);
const data = preview.data || {};
const p1124 = subphaseById.get("P112.4") || {};
const p1125 = subphaseById.get("P112.5") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
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
const previewSafetyFlags = [
  "queueWriteAllowed",
  "localCrudAllowed",
  "dbWriteAllowed",
  "sqliteWriteAllowed",
  "hostedDbMutationAllowed",
  "runtimeAdmissionAllowed",
  "runtimeTransitionAllowed",
  "executionAllowed",
  "dispatchAllowed",
  "workerExecutionAllowed",
  "toolExecutionAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "deployAllowed",
  "releaseAllowed",
  "exportAllowed",
  "packageAllowed",
  "spendAllowed",
];
const serializedData = JSON.stringify(data);

function allFalse(target = {}, flags = []) {
  return flags.every((flag) => target[flag] === false);
}

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1124-founder-live-agent-work-queue-admission-preview"]));
addCheck("preview exports exist", source.includes("buildFounderLiveAgentWorkQueueAdmissionPreview") && source.includes("validateFounderLiveAgentWorkQueueAdmissionPreview"));
addCheck("phase constant", P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PREVIEW_PHASE === "P112.4");
addCheck("state constant", Object.values(P112_AGENT_WORK_QUEUE_ADMISSION_PREVIEW_STATES).includes("founder_agent_work_queue_admission_preview_ready_execution_blocked"));
addCheck("queue preview validates", validation.valid, validation.errors.join("; "));
addCheck("queue preview shape", data.schemaVersion === "1.0" && data.previewMode === "local-only-dry-run" && Boolean(data.queueAdmissionSummary) && Array.isArray(data.queueRows) && Array.isArray(data.queueSections));
addCheck("queue rows useful", data.queueRows?.length === 3 && data.queueAdmissionSummary?.candidateCount === 3);
addCheck("queue sections useful", data.queueSections?.length === 3 && data.queueSections.every((section) => section.blockedCount === 3 && section.disabledReason));
addCheck("founder context carried forward safely", data.sourceWorkOrderSummary?.publicLabel?.includes("iOS Snake game") && data.sourceWorkOrderSummary?.workOrderSummary?.includes("PRD readiness"));
addCheck("queue writes and persistence blocked", data.queueAdmissionSummary?.writableCandidateCount === 0 && data.queueAdmissionSummary?.persistedCandidateCount === 0);
addCheck("execution remains blocked", data.queueAdmissionSummary?.dispatchableCandidateCount === 0 && data.queueAdmissionSummary?.executableCandidateCount === 0 && data.queueAdmissionSummary?.projectMutationCandidateCount === 0 && data.queueAdmissionSummary?.hostedDbMutationCandidateCount === 0 && data.queueAdmissionSummary?.providerSpendCandidateCount === 0);
addCheck("top-level preview safety flags false", allFalse(data, previewSafetyFlags) && allFalse(data, unsafeRuntimeFlags));
addCheck("queue rows safety flags false", data.queueRows?.every((row) => allFalse(row, previewSafetyFlags) && allFalse(row, unsafeRuntimeFlags)));
addCheck("queue rows include evidence and blockers", data.queueRows?.every((row) => row.evidenceRefs?.length >= 2 && row.auditRefs?.length >= 1 && row.blockers?.length >= 8 && row.disabledReason));
addCheck("reuses P112.3 admission contract", source.includes("buildFounderLiveAgentWorkQueueAdmissionContract(input)") && source.includes("buildSafeAgentWorkQueueDbRecord(\"founder_agent_work_queue_items\""));
addCheck("contract marks P112.4 complete", p1124.status === "complete" && ["planned", "complete"].includes(p1125.status));
addCheck("docs record P112.4", /P112\.4 Queue Admission Preview \/ Safe Dry Run[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P112.4", /P112\.4 is complete/.test(platformRoadmap) && /P112\.5 is next/.test(platformRoadmap));
addCheck("README records P112.4", /P112\.4 queue admission preview/.test(readme) && /P112\.5 is next/.test(readme));
addCheck(
  "phase status advanced",
  status.currentPhase === "P112.4"
    && status.previousPhase === "P112.3"
    && status.nextPhase === "P112.5"
    && roadmap.currentPhase === "P112.4"
    && roadmap.previousPhase === "P112.3"
    && roadmap.nextPhase === "P112.5"
    && statusById.get("P112")?.status === "in_progress"
    && statusById.get("P112.4")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P112.5")?.status)
    && roadmapById.get("P112.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P112.4 avoids forbidden file scope", !(p1124.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("queue preview stays Command Center hidden", data.commandCenterVisible === false);
addCheck("queue preview avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedData));
addCheck("queue preview avoids raw queue keys and table names", !/(queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_agent_work_queue_items|founder_agent_work_queue_events|founder_agent_work_queue_evidence_refs)/.test(serializedData));
addCheck("queue preview avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write queue now/i.test(serializedData));
addCheck("queue preview avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedData));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(source) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(source));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P112.4 founder live agent work queue admission preview.",
        "- Confirms display-safe queue candidates are assembled from local work order context without queue writes or runtime authority.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, local queue writes, runtime admission, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1124-founder-live-agent-work-queue-admission-preview",
        "- npm run check:p1123-founder-live-agent-work-queue-crud-model",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P112.4 is a local dry-run preview only. It does not write queue records, unlock execution, admit runtime execution, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P112.4 Founder Live Agent Work Queue Admission Preview Report", phase: "P112.4" },
);

printCheckReport("P112.4 Founder Live Agent Work Queue Admission Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
