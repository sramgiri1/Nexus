import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P113_AGENT_WORK_ASSIGNMENT_READINESS_PREVIEW_STATES,
  P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PREVIEW_PHASE,
  buildAgentWorkAssignmentReadinessViewModel,
  validateAgentWorkAssignmentReadinessViewModel,
} from "../live-ready/founderLiveAgentWorkAssignmentReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1134-founder-live-agent-work-assignment-preview-report.md";

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

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p113-founder-live-agent-work-assignment-readiness-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const source = readText("live-ready/founderLiveAgentWorkAssignmentReadiness.js");
const preview = buildAgentWorkAssignmentReadinessViewModel({
  founderIdea: "Build a simple iOS Snake game for the App Store",
  publicLabel: "iOS Snake game assignment readiness",
  queueSummary: "Validate the iOS Snake game idea, draft PRD readiness, and map agent work assignments.",
});
const validation = validateAgentWorkAssignmentReadinessViewModel(preview);
const data = preview.data || {};
const p1134 = subphaseById.get("P113.4") || {};
const p1135 = subphaseById.get("P113.5") || {};
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P113.4";
const allowedFiles = new Set(p1134.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
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
  "assignmentWriteAllowed",
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1134-founder-live-agent-work-assignment-preview"]));
addCheck("preview exports exist", source.includes("buildAgentWorkAssignmentReadinessViewModel") && source.includes("validateAgentWorkAssignmentReadinessViewModel"));
addCheck("phase constant", P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PREVIEW_PHASE === "P113.4");
addCheck("state constant", Object.values(P113_AGENT_WORK_ASSIGNMENT_READINESS_PREVIEW_STATES).includes("founder_agent_work_assignment_readiness_preview_ready_execution_blocked"));
addCheck("assignment preview validates", validation.valid, validation.errors.join("; "));
addCheck("assignment preview shape", data.schemaVersion === "1.0" && data.previewMode === "local-only-dry-run" && Boolean(data.assignmentReadinessSummary) && Array.isArray(data.assignmentRows) && Array.isArray(data.assignmentSections));
addCheck("assignment rows useful", data.assignmentRows?.length === 3 && data.assignmentReadinessSummary?.candidateCount === 3);
addCheck("assignment sections useful", data.assignmentSections?.length === 3 && data.assignmentSections.every((section) => section.blockedCount === 3 && section.disabledReason));
addCheck("founder context carried forward safely", data.sourceQueueSummary?.publicLabel?.includes("iOS Snake game") && data.sourceQueueSummary?.queueSummary?.includes("PRD readiness"));
addCheck("assignment writes and persistence blocked", data.assignmentReadinessSummary?.writableCandidateCount === 0 && data.assignmentReadinessSummary?.persistedCandidateCount === 0);
addCheck("execution remains blocked", data.assignmentReadinessSummary?.dispatchableCandidateCount === 0 && data.assignmentReadinessSummary?.executableCandidateCount === 0 && data.assignmentReadinessSummary?.projectMutationCandidateCount === 0 && data.assignmentReadinessSummary?.hostedDbMutationCandidateCount === 0 && data.assignmentReadinessSummary?.providerSpendCandidateCount === 0);
addCheck("top-level preview safety flags false", allFalse(data, previewSafetyFlags) && allFalse(data, unsafeRuntimeFlags));
addCheck("assignment rows safety flags false", data.assignmentRows?.every((row) => allFalse(row, previewSafetyFlags) && allFalse(row, unsafeRuntimeFlags)));
addCheck("assignment rows include evidence and blockers", data.assignmentRows?.every((row) => row.evidenceRefs?.length >= 2 && row.auditRefs?.length >= 1 && row.blockers?.length >= 8 && row.disabledReason));
addCheck("reuses P113.3 readiness contract", source.includes("buildFounderLiveAgentWorkAssignmentReadinessContract(input)") && source.includes("buildSafeAgentWorkAssignmentDbRecord(\"founder_agent_work_assignments\""));
addCheck("contract marks P113.4 complete", p1134.status === "complete" && ["planned", "complete"].includes(p1135.status));
addCheck("docs record P113.4", /P113\.4 Assignment Readiness Preview \/ Safe Dry Run[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P113.4", /P113\.4 is complete/.test(platformRoadmap) && (/P113\.5 is next/.test(platformRoadmap) || /P113\.5 is complete/.test(platformRoadmap)));
addCheck("README records P113.4", /P113\.4 assignment readiness preview/.test(readme) && (/P113\.5 is next/.test(readme) || /P113\.5 Command Center agent assignment UX/.test(readme)));
addCheck(
  "phase status advanced",
  ["P113.4", "P113.5"].includes(status.currentPhase)
    && ["P113.3", "P113.4"].includes(status.previousPhase)
    && ["P113.5", "P113.6"].includes(status.nextPhase)
    && ["P113.4", "P113.5"].includes(roadmap.currentPhase)
    && ["P113.3", "P113.4"].includes(roadmap.previousPhase)
    && ["P113.5", "P113.6"].includes(roadmap.nextPhase)
    && statusById.get("P113")?.status === "in_progress"
    && statusById.get("P113.4")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P113.5")?.status)
    && roadmapById.get("P113.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P113.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P113.4 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("assignment preview stays Command Center hidden", data.commandCenterVisible === false);
addCheck("assignment preview avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedData));
addCheck("assignment preview avoids raw assignment keys and table names", !/(assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_agent_work_assignments|founder_agent_work_assignment_events|founder_agent_work_assignment_evidence_refs)/.test(serializedData));
addCheck("assignment preview avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write assignment now/i.test(serializedData));
addCheck("assignment preview avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedData));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(source) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(source));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P113.4 founder live agent work assignment readiness preview.",
        "- Confirms display-safe assignment candidates are assembled from local queue context without assignment writes or runtime authority.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, local assignment writes, runtime admission, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1134-founder-live-agent-work-assignment-preview",
        "- npm run check:p1133-founder-live-agent-work-assignment-crud-model",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P113.4 is a local dry-run preview only. It does not write assignment records, unlock execution, admit runtime execution, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P113.4 Founder Live Agent Work Assignment Preview Report", phase: "P113.4" },
);

printCheckReport("P113.4 Founder Live Agent Work Assignment Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
