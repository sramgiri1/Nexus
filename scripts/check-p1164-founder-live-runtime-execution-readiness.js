import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P116_FOUNDER_LIVE_RUNTIME_EXECUTION_READINESS_PREVIEW_PHASE,
  P116_RUNTIME_EXECUTION_READINESS_PREVIEW_STATES,
  buildRuntimeExecutionReadinessViewModel,
  validateRuntimeExecutionReadinessViewModel,
} from "../live-ready/founderLiveRuntimeExecutionReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1164-founder-live-runtime-execution-readiness-report.md";

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
const contract = readJson("contracts/os-roadmap/p116-founder-live-runtime-execution-readiness-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P116_FOUNDER_LIVE_RUNTIME_EXECUTION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const source = readText("live-ready/founderLiveRuntimeExecutionReadiness.js");
const preview = buildRuntimeExecutionReadinessViewModel({
  founderIdea: "Build a simple iOS Snake game for the App Store",
  publicLabel: "iOS Snake game execution readiness",
  executionSummary: "Validate the iOS Snake game idea, confirm PRD readiness, and map runtime execution readiness gates.",
});
const validation = validateRuntimeExecutionReadinessViewModel(preview);
const data = preview.data || {};
const p1164 = subphaseById.get("P116.4") || {};
const p1165 = subphaseById.get("P116.5") || {};
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P116.4";
const allowedFiles = new Set(p1164.allowedFiles || []);
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
  "runtimeAdmissionAllowed",
  "runtimeTransitionAllowed",
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
const previewSafetyFlags = [
  "localCrudAllowed",
  "dbWriteAllowed",
  "sqliteWriteAllowed",
  "hostedDbMutationAllowed",
  "runtimeAdmissionAllowed",
  "runtimeTransitionAllowed",
  "runtimeExecutionAllowed",
  "executionAllowed",
  "executionUnlockAllowed",
  "dispatchAllowed",
  "agentDispatchAllowed",
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1164-founder-live-runtime-execution-readiness"]));
addCheck("preview exports exist", source.includes("buildRuntimeExecutionReadinessViewModel") && source.includes("validateRuntimeExecutionReadinessViewModel"));
addCheck("phase constant", P116_FOUNDER_LIVE_RUNTIME_EXECUTION_READINESS_PREVIEW_PHASE === "P116.4");
addCheck("state constant", Object.values(P116_RUNTIME_EXECUTION_READINESS_PREVIEW_STATES).includes("founder_runtime_execution_readiness_preview_ready_execution_blocked"));
addCheck("runtime execution preview validates", validation.valid, validation.errors.join("; "));
addCheck("runtime execution preview shape", data.schemaVersion === "1.0" && data.previewMode === "local-only-dry-run" && Boolean(data.runtimeExecutionReadinessSummary) && Array.isArray(data.executionRows) && Array.isArray(data.executionSections));
addCheck("runtime execution rows useful", data.executionRows?.length === 3 && data.runtimeExecutionReadinessSummary?.candidateCount === 3);
addCheck("runtime execution sections useful", data.executionSections?.length === 3 && data.executionSections.every((section) => section.blockedCount === 3 && section.disabledReason));
addCheck("founder context carried forward safely", data.sourceAdmissionSummary?.publicLabel?.includes("iOS Snake game") && data.executionRows?.some((row) => row.proposedOutcome?.includes("runtime execution request")));
addCheck("runtime writes and persistence blocked", data.runtimeExecutionReadinessSummary?.writableCandidateCount === 0 && data.runtimeExecutionReadinessSummary?.persistedCandidateCount === 0);
addCheck("runtime execution remains blocked", data.runtimeExecutionReadinessSummary?.runtimeExecutableCandidateCount === 0 && data.runtimeExecutionReadinessSummary?.executableCandidateCount === 0 && data.runtimeExecutionReadinessSummary?.executionUnlockCandidateCount === 0 && data.runtimeExecutionReadinessSummary?.projectMutationCandidateCount === 0 && data.runtimeExecutionReadinessSummary?.hostedDbMutationCandidateCount === 0 && data.runtimeExecutionReadinessSummary?.providerSpendCandidateCount === 0);
addCheck("top-level preview safety flags false", allFalse(data, previewSafetyFlags) && allFalse(data, unsafeRuntimeFlags));
addCheck("runtime execution rows safety flags false", data.executionRows?.every((row) => allFalse(row, previewSafetyFlags) && allFalse(row, unsafeRuntimeFlags)));
addCheck("runtime execution rows include evidence and blockers", data.executionRows?.every((row) => row.evidenceRefs?.length >= 2 && row.auditRefs?.length >= 1 && row.blockers?.length >= 9 && row.disabledReason));
addCheck("reuses P116.3 readiness contract", source.includes("buildFounderLiveRuntimeExecutionReadinessContract(input)") && source.includes("buildSafeRuntimeExecutionDbRecord(\"founder_runtime_execution_readiness_items\""));
addCheck("reuses P115 admission context", source.includes("buildSafeRuntimeAdmissionDbRecord") && source.includes("sourceAdmissionSummary"));
addCheck("contract marks P116.4 complete", p1164.status === "complete" && ["planned", "complete"].includes(p1165.status));
addCheck("docs record P116.4", /P116\.4 Execution Readiness Preview \/ Safe Dry Run[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P116.4", /P116\.4 is complete/.test(platformRoadmap) && (/P116\.5 is next/.test(platformRoadmap) || /P116\.5 is complete/.test(platformRoadmap)));
addCheck("README records P116.4", /P116\.4 runtime execution readiness preview/.test(readme) && (/P116\.5 is next/.test(readme) || /P116\.5 Command Center runtime execution UX/.test(readme)));
addCheck(
  "phase status advanced",
  ["P116.4", "P116.5"].includes(status.currentPhase)
    && ["P116.3", "P116.4"].includes(status.previousPhase)
    && ["P116.5", "P116.6"].includes(status.nextPhase)
    && ["P116.4", "P116.5"].includes(roadmap.currentPhase)
    && ["P116.3", "P116.4"].includes(roadmap.previousPhase)
    && ["P116.5", "P116.6"].includes(roadmap.nextPhase)
    && statusById.get("P116")?.status === "in_progress"
    && statusById.get("P116.4")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P116.5")?.status)
    && roadmapById.get("P116.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P116.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P116.4 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("runtime execution preview stays Command Center hidden", data.commandCenterVisible === false);
addCheck("runtime execution preview avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedData));
addCheck("runtime execution preview avoids raw record keys and table names", !/(runtimeExecutionId|runtimeAdmissionId|dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_runtime_execution_readiness_items|founder_runtime_execution_events|founder_runtime_execution_evidence_refs)/.test(serializedData));
addCheck("runtime execution preview avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|admit now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now/i.test(serializedData));
addCheck("runtime execution preview avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedData));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(source) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(source));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P116.4 founder live runtime execution readiness preview.",
        "- Confirms display-safe runtime execution readiness candidates are assembled from local admission context without writes or runtime authority.",
        "- Does not enable runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1164-founder-live-runtime-execution-readiness",
        "- npm run check:p1163-founder-live-runtime-execution-readiness",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P116.4 is a local dry-run preview only. It does not write readiness records, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P116.4 Founder Live Runtime Execution Readiness Preview Report", phase: "P116.4" },
);

printCheckReport("P116.4 Founder Live Runtime Execution Readiness Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
