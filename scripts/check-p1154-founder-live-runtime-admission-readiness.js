import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PREVIEW_PHASE,
  P115_RUNTIME_ADMISSION_READINESS_PREVIEW_STATES,
  buildRuntimeAdmissionReadinessViewModel,
  validateRuntimeAdmissionReadinessViewModel,
} from "../live-ready/founderLiveRuntimeAdmissionReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1154-founder-live-runtime-admission-readiness-report.md";

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
const contract = readJson("contracts/os-roadmap/p115-founder-live-runtime-admission-readiness-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const source = readText("live-ready/founderLiveRuntimeAdmissionReadiness.js");
const preview = buildRuntimeAdmissionReadinessViewModel({
  founderIdea: "Build a simple iOS Snake game for the App Store",
  publicLabel: "iOS Snake game runtime readiness",
  dispatchSummary: "Validate the iOS Snake game idea, confirm PRD readiness, and map runtime admission readiness gates.",
});
const validation = validateRuntimeAdmissionReadinessViewModel(preview);
const data = preview.data || {};
const p1154 = subphaseById.get("P115.4") || {};
const p1155 = subphaseById.get("P115.5") || {};
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P115.4";
const allowedFiles = new Set(p1154.allowedFiles || []);
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1154-founder-live-runtime-admission-readiness"]));
addCheck("preview exports exist", source.includes("buildRuntimeAdmissionReadinessViewModel") && source.includes("validateRuntimeAdmissionReadinessViewModel"));
addCheck("phase constant", P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PREVIEW_PHASE === "P115.4");
addCheck("state constant", Object.values(P115_RUNTIME_ADMISSION_READINESS_PREVIEW_STATES).includes("founder_runtime_admission_readiness_preview_ready_execution_blocked"));
addCheck("runtime preview validates", validation.valid, validation.errors.join("; "));
addCheck("runtime preview shape", data.schemaVersion === "1.0" && data.previewMode === "local-only-dry-run" && Boolean(data.runtimeAdmissionReadinessSummary) && Array.isArray(data.admissionRows) && Array.isArray(data.admissionSections));
addCheck("runtime rows useful", data.admissionRows?.length === 3 && data.runtimeAdmissionReadinessSummary?.candidateCount === 3);
addCheck("runtime sections useful", data.admissionSections?.length === 3 && data.admissionSections.every((section) => section.blockedCount === 3 && section.disabledReason));
addCheck("founder context carried forward safely", data.sourceDispatchSummary?.publicLabel?.includes("iOS Snake game") && data.sourceDispatchSummary?.dispatchSummary?.includes("PRD readiness"));
addCheck("runtime writes and persistence blocked", data.runtimeAdmissionReadinessSummary?.writableCandidateCount === 0 && data.runtimeAdmissionReadinessSummary?.persistedCandidateCount === 0);
addCheck("runtime execution remains blocked", data.runtimeAdmissionReadinessSummary?.runtimeAdmissibleCandidateCount === 0 && data.runtimeAdmissionReadinessSummary?.executableCandidateCount === 0 && data.runtimeAdmissionReadinessSummary?.projectMutationCandidateCount === 0 && data.runtimeAdmissionReadinessSummary?.hostedDbMutationCandidateCount === 0 && data.runtimeAdmissionReadinessSummary?.providerSpendCandidateCount === 0);
addCheck("top-level preview safety flags false", allFalse(data, previewSafetyFlags) && allFalse(data, unsafeRuntimeFlags));
addCheck("runtime rows safety flags false", data.admissionRows?.every((row) => allFalse(row, previewSafetyFlags) && allFalse(row, unsafeRuntimeFlags)));
addCheck("runtime rows include evidence and blockers", data.admissionRows?.every((row) => row.evidenceRefs?.length >= 2 && row.auditRefs?.length >= 1 && row.blockers?.length >= 9 && row.disabledReason));
addCheck("reuses P115.3 readiness contract", source.includes("buildFounderLiveRuntimeAdmissionReadinessContract(input)") && source.includes("buildSafeRuntimeAdmissionDbRecord(\"founder_runtime_admission_readiness_items\""));
addCheck("reuses P114 dispatch context", source.includes("buildSafeAgentDispatchDbRecord") && source.includes("sourceDispatchSummary"));
addCheck("contract marks P115.4 complete", p1154.status === "complete" && ["planned", "complete"].includes(p1155.status));
addCheck("docs record P115.4", /P115\.4 Runtime Admission Preview \/ Safe Dry Run[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P115.4", /P115\.4 is complete/.test(platformRoadmap) && (/P115\.5 is next/.test(platformRoadmap) || /P115\.5 is complete/.test(platformRoadmap)));
addCheck("README records P115.4", /P115\.4 runtime admission readiness preview/.test(readme) && (/P115\.5 is next/.test(readme) || /P115\.5 Command Center runtime admission UX/.test(readme)));
addCheck(
  "phase status advanced",
  ["P115.4", "P115.5"].includes(status.currentPhase)
    && ["P115.3", "P115.4"].includes(status.previousPhase)
    && ["P115.5", "P115.6"].includes(status.nextPhase)
    && ["P115.4", "P115.5"].includes(roadmap.currentPhase)
    && ["P115.3", "P115.4"].includes(roadmap.previousPhase)
    && ["P115.5", "P115.6"].includes(roadmap.nextPhase)
    && statusById.get("P115")?.status === "in_progress"
    && statusById.get("P115.4")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P115.5")?.status)
    && roadmapById.get("P115.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P115.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P115.4 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("runtime preview stays Command Center hidden", data.commandCenterVisible === false);
addCheck("runtime preview avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedData));
addCheck("runtime preview avoids raw record keys and table names", !/(runtimeAdmissionId|dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_runtime_admission_readiness_items|founder_runtime_admission_events|founder_runtime_admission_evidence_refs)/.test(serializedData));
addCheck("runtime preview avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|admit now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now/i.test(serializedData));
addCheck("runtime preview avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedData));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(source) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(source));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P115.4 founder live runtime admission readiness preview.",
        "- Confirms display-safe runtime readiness candidates are assembled from local dispatch context without writes or runtime authority.",
        "- Does not enable runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1154-founder-live-runtime-admission-readiness",
        "- npm run check:p1153-founder-live-runtime-admission-readiness",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P115.4 is a local dry-run preview only. It does not write readiness records, unlock execution, admit runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P115.4 Founder Live Runtime Admission Readiness Preview Report", phase: "P115.4" },
);

printCheckReport("P115.4 Founder Live Runtime Admission Readiness Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
