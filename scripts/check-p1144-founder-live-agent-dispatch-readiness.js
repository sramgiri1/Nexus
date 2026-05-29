import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P114_AGENT_DISPATCH_READINESS_PREVIEW_STATES,
  P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PREVIEW_PHASE,
  buildAgentDispatchReadinessViewModel,
  validateAgentDispatchReadinessViewModel,
} from "../live-ready/founderLiveAgentDispatchReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1144-founder-live-agent-dispatch-readiness-report.md";

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
const contract = readJson("contracts/os-roadmap/p114-founder-live-agent-dispatch-readiness-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const source = readText("live-ready/founderLiveAgentDispatchReadiness.js");
const preview = buildAgentDispatchReadinessViewModel({
  founderIdea: "Build a simple iOS Snake game for the App Store",
  publicLabel: "iOS Snake game dispatch readiness",
  assignmentSummary: "Validate the iOS Snake game idea, draft PRD readiness, and map founder agent dispatch lanes.",
});
const validation = validateAgentDispatchReadinessViewModel(preview);
const data = preview.data || {};
const p1144 = subphaseById.get("P114.4") || {};
const p1145 = subphaseById.get("P114.5") || {};
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P114.4";
const allowedFiles = new Set(p1144.allowedFiles || []);
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
  "dispatchWriteAllowed",
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1144-founder-live-agent-dispatch-readiness"]));
addCheck("preview exports exist", source.includes("buildAgentDispatchReadinessViewModel") && source.includes("validateAgentDispatchReadinessViewModel"));
addCheck("phase constant", P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PREVIEW_PHASE === "P114.4");
addCheck("state constant", Object.values(P114_AGENT_DISPATCH_READINESS_PREVIEW_STATES).includes("founder_agent_dispatch_readiness_preview_ready_execution_blocked"));
addCheck("dispatch preview validates", validation.valid, validation.errors.join("; "));
addCheck("dispatch preview shape", data.schemaVersion === "1.0" && data.previewMode === "local-only-dry-run" && Boolean(data.dispatchReadinessSummary) && Array.isArray(data.dispatchRows) && Array.isArray(data.dispatchSections));
addCheck("dispatch rows useful", data.dispatchRows?.length === 3 && data.dispatchReadinessSummary?.candidateCount === 3);
addCheck("dispatch sections useful", data.dispatchSections?.length === 3 && data.dispatchSections.every((section) => section.blockedCount === 3 && section.disabledReason));
addCheck("founder context carried forward safely", data.sourceAssignmentSummary?.publicLabel?.includes("iOS Snake game") && data.sourceAssignmentSummary?.assignmentSummary?.includes("PRD readiness"));
addCheck("dispatch writes and persistence blocked", data.dispatchReadinessSummary?.writableCandidateCount === 0 && data.dispatchReadinessSummary?.persistedCandidateCount === 0);
addCheck("execution remains blocked", data.dispatchReadinessSummary?.dispatchableCandidateCount === 0 && data.dispatchReadinessSummary?.executableCandidateCount === 0 && data.dispatchReadinessSummary?.projectMutationCandidateCount === 0 && data.dispatchReadinessSummary?.hostedDbMutationCandidateCount === 0 && data.dispatchReadinessSummary?.providerSpendCandidateCount === 0);
addCheck("top-level preview safety flags false", allFalse(data, previewSafetyFlags) && allFalse(data, unsafeRuntimeFlags));
addCheck("dispatch rows safety flags false", data.dispatchRows?.every((row) => allFalse(row, previewSafetyFlags) && allFalse(row, unsafeRuntimeFlags)));
addCheck("dispatch rows include evidence and blockers", data.dispatchRows?.every((row) => row.evidenceRefs?.length >= 2 && row.auditRefs?.length >= 1 && row.blockers?.length >= 8 && row.disabledReason));
addCheck("reuses P114.3 readiness contract", source.includes("buildFounderLiveAgentDispatchReadinessContract(input)") && source.includes("buildSafeAgentDispatchDbRecord(\"founder_agent_dispatch_readiness_items\""));
addCheck("reuses P113 assignment context", source.includes("buildSafeAgentWorkAssignmentDbRecord") && source.includes("sourceAssignmentSummary"));
addCheck("contract marks P114.4 complete", p1144.status === "complete" && ["planned", "complete"].includes(p1145.status));
addCheck("docs record P114.4", /P114\.4 Dispatch Readiness Preview \/ Safe Dry Run[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P114.4", /P114\.4 is complete/.test(platformRoadmap) && (/P114\.5 is next/.test(platformRoadmap) || /P114\.5 is complete/.test(platformRoadmap)));
addCheck("README records P114.4", /P114\.4 dispatch readiness preview/.test(readme) && (/P114\.5 is next/.test(readme) || /P114\.5 Command Center agent dispatch UX/.test(readme)));
addCheck(
  "phase status advanced",
  ["P114.4", "P114.5"].includes(status.currentPhase)
    && ["P114.3", "P114.4"].includes(status.previousPhase)
    && ["P114.5", "P114.6"].includes(status.nextPhase)
    && ["P114.4", "P114.5"].includes(roadmap.currentPhase)
    && ["P114.3", "P114.4"].includes(roadmap.previousPhase)
    && ["P114.5", "P114.6"].includes(roadmap.nextPhase)
    && statusById.get("P114")?.status === "in_progress"
    && statusById.get("P114.4")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P114.5")?.status)
    && roadmapById.get("P114.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P114.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P114.4 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("dispatch preview stays Command Center hidden", data.commandCenterVisible === false);
addCheck("dispatch preview avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedData));
addCheck("dispatch preview avoids raw dispatch keys and table names", !/(dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_agent_dispatch_readiness_items|founder_agent_dispatch_readiness_events|founder_agent_dispatch_readiness_evidence_refs)/.test(serializedData));
addCheck("dispatch preview avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write dispatch now/i.test(serializedData));
addCheck("dispatch preview avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedData));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(source) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(source));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P114.4 founder live agent dispatch readiness preview.",
        "- Confirms display-safe dispatch candidates are assembled from local assignment context without dispatch writes or runtime authority.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, local dispatch writes, runtime admission, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1144-founder-live-agent-dispatch-readiness",
        "- npm run check:p1143-founder-live-agent-dispatch-readiness",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P114.4 is a local dry-run preview only. It does not write dispatch records, unlock execution, admit runtime execution, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P114.4 Founder Live Agent Dispatch Readiness Preview Report", phase: "P114.4" },
);

printCheckReport("P114.4 Founder Live Agent Dispatch Readiness Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
