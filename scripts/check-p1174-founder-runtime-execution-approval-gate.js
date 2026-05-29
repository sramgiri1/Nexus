import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P117_APPROVAL_GATE_PREVIEW_STATES,
  P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PREVIEW_PHASE,
  buildRuntimeExecutionApprovalGatePreviewModel,
  validateRuntimeExecutionApprovalGatePreviewModel,
} from "../live-ready/founderRuntimeExecutionApprovalGate.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1174-founder-runtime-execution-approval-gate-report.md";

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
const contract = readJson("contracts/os-roadmap/p117-founder-runtime-execution-approval-gate-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const source = readText("live-ready/founderRuntimeExecutionApprovalGate.js");
const preview = buildRuntimeExecutionApprovalGatePreviewModel({
  founderIdea: "Build a simple iOS Snake game for the App Store",
  publicLabel: "iOS Snake game approval evidence",
  evidenceSummary: "Validate approval evidence for a simple iOS Snake game build before any runtime execution request.",
});
const validation = validateRuntimeExecutionApprovalGatePreviewModel(preview);
const data = preview.data || {};
const p1174 = subphaseById.get("P117.4") || {};
const p1175 = subphaseById.get("P117.5") || {};
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P117.4";
const allowedFiles = new Set(p1174.allowedFiles || []);
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
const previewSafetyFlags = [
  "localCrudAllowed",
  "dbWriteAllowed",
  "sqliteWriteAllowed",
  "hostedDbMutationAllowed",
  "approvalCaptureAllowed",
  "approvalPersistenceAllowed",
  "approvalDecisionRecorded",
  "runtimeApprovalAllowed",
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1174-founder-runtime-execution-approval-gate"]));
addCheck("preview exports exist", source.includes("buildRuntimeExecutionApprovalGatePreviewModel") && source.includes("validateRuntimeExecutionApprovalGatePreviewModel"));
addCheck("phase constant", P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PREVIEW_PHASE === "P117.4");
addCheck("state constant", Object.values(P117_APPROVAL_GATE_PREVIEW_STATES).includes("founder_runtime_execution_approval_preview_ready_capture_blocked"));
addCheck("approval gate preview validates", validation.valid, validation.errors.join("; "));
addCheck("approval gate preview shape", data.schemaVersion === "1.0" && data.previewMode === "local-only-dry-run" && Boolean(data.approvalGateSummary) && Array.isArray(data.approvalRows) && Array.isArray(data.approvalSections));
addCheck("approval gate rows useful", data.approvalRows?.length === 3 && data.approvalGateSummary?.candidateCount === 3);
addCheck("approval gate sections useful", data.approvalSections?.length === 3 && data.approvalSections.every((section) => section.blockedCount === 3 && section.disabledReason));
addCheck("founder context carried forward safely", data.sourceReviewSummary?.publicLabel?.includes("iOS Snake game") && data.approvalRows?.some((row) => row.proposedOutcome?.includes("later approval review") || row.proposedOutcome?.includes("approval request")));
addCheck("approval writes and persistence blocked", data.approvalGateSummary?.writableCandidateCount === 0 && data.approvalGateSummary?.persistedCandidateCount === 0 && data.approvalGateSummary?.approvalCaptureCandidateCount === 0 && data.approvalGateSummary?.approvalPersistenceCandidateCount === 0 && data.approvalGateSummary?.approveRejectCandidateCount === 0);
addCheck("runtime execution remains blocked", data.approvalGateSummary?.runtimeExecutableCandidateCount === 0 && data.approvalGateSummary?.executableCandidateCount === 0 && data.approvalGateSummary?.executionUnlockCandidateCount === 0 && data.approvalGateSummary?.projectMutationCandidateCount === 0 && data.approvalGateSummary?.hostedDbMutationCandidateCount === 0 && data.approvalGateSummary?.providerSpendCandidateCount === 0);
addCheck("top-level preview safety flags false", allFalse(data, previewSafetyFlags) && allFalse(data, unsafeAuthorityFlags));
addCheck("approval rows safety flags false", data.approvalRows?.every((row) => allFalse(row, previewSafetyFlags) && allFalse(row, unsafeAuthorityFlags)));
addCheck("approval rows include evidence and blockers", data.approvalRows?.every((row) => row.evidenceRefs?.length >= 2 && row.auditRefs?.length >= 1 && row.blockers?.length >= 10 && row.disabledReason));
addCheck("reuses P117.3 approval gate contract", source.includes("buildFounderRuntimeExecutionApprovalGateContract(input)") && source.includes("buildPreviewApprovalGateRow"));
addCheck("reuses P116 runtime execution context", source.includes("buildSafeRuntimeExecutionDbRecord") && source.includes("sourceRuntimeExecutionSummary"));
addCheck("contract marks P117.4 complete", p1174.status === "complete" && ["planned", "complete"].includes(p1175.status));
addCheck("docs record P117.4", /P117\.4 Approval Gate Preview \/ Safe Dry Run[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P117.4", /P117\.4 is complete/.test(platformRoadmap) && (/P117\.5 is next/.test(platformRoadmap) || /P117\.5 is complete/.test(platformRoadmap)));
addCheck("README records P117.4", /P117\.4 approval gate safe dry-run preview/i.test(readme) && (/P117\.5 is next/.test(readme) || /P117\.5 Command Center approval gate UX/.test(readme)));
addCheck(
  "phase status advanced",
  ["P117.4", "P117.5"].includes(status.currentPhase)
    && ["P117.3", "P117.4"].includes(status.previousPhase)
    && ["P117.5", "P117.6"].includes(status.nextPhase)
    && ["P117.4", "P117.5"].includes(roadmap.currentPhase)
    && ["P117.3", "P117.4"].includes(roadmap.previousPhase)
    && ["P117.5", "P117.6"].includes(roadmap.nextPhase)
    && statusById.get("P117")?.status === "in_progress"
    && statusById.get("P117.4")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P117.5")?.status)
    && roadmapById.get("P117.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P117.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P117.4 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("approval gate preview stays Command Center hidden", data.commandCenterVisible === false);
addCheck("approval gate preview avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedData));
addCheck("approval gate preview avoids raw record keys and table names", !/(approvalEvidenceId|runtimeExecutionId|runtimeAdmissionId|dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_runtime_execution_approval_evidence_items|founder_runtime_execution_approval_events|founder_runtime_execution_approval_evidence_refs)/.test(serializedData));
addCheck("approval gate preview avoids unsafe runnable actions", !/approve now|reject now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|unlock execution now/i.test(serializedData));
addCheck("approval gate preview avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedData));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(source) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(source));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P117.4 founder runtime execution approval gate preview.",
        "- Confirms display-safe approval gate candidates are assembled from local approval evidence review context without writes or runtime authority.",
        "- Does not enable approval capture, approval persistence, approve/reject recording, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1174-founder-runtime-execution-approval-gate",
        "- npm run check:p1173-founder-runtime-execution-approval-gate",
        "- npm run check:p1172-founder-runtime-execution-approval-gate",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P117.4 is a local dry-run preview only. It does not write approval evidence records, capture approvals, persist approval decisions, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P117.4 Founder Runtime Execution Approval Gate Preview Report", phase: "P117.4" },
);

printCheckReport("P117.4 Founder Runtime Execution Approval Gate Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
