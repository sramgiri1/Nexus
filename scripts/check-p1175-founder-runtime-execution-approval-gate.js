import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderRuntimeExecutionApprovalGateDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1175-founder-runtime-execution-approval-gate-report.md";

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
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderRuntimeExecutionApprovalGateDisplayModel("Build a simple iOS Snake game for the App Store");
const p1175 = subphaseById.get("P117.5") || {};
const p1176 = subphaseById.get("P117.6") || {};
const cardUseCount = (pageSource.match(/<FounderRuntimeExecutionApprovalGateCard/g) || []).length;
const serializedDisplayModel = JSON.stringify(displayModel);
const primaryUxSource = `${pageSource}\n${serializedDisplayModel}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P117.5";
const allowedFiles = new Set(p1175.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "db/",
  "live-ready/",
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1175-founder-runtime-execution-approval-gate"]));
addCheck("business build uses browser-safe P117 display model", businessBuildSource.includes("buildFounderRuntimeExecutionApprovalGateDisplayModel") && !businessBuildSource.includes("founderRuntimeExecutionApprovalGate.js"));
addCheck("dashboard avoids node-only approval gate import", !businessBuildSource.includes("sqliteRuntime") && !businessBuildSource.includes("sqliteCrudRepository") && !pageSource.includes("founderRuntimeExecutionApprovalGate.js"));
addCheck("display model shape", displayModel.currentState && displayModel.previewMode && displayModel.candidateCount === 3 && displayModel.blockedCandidateCount === 3 && Array.isArray(displayModel.approvalGateRows) && displayModel.approvalGateRows.length === 3);
addCheck("display model rows useful", displayModel.approvalGateRows.every((row) => row.proposedApprovalLane && row.sourceRuntimeLane && row.nextAction && row.blocker && row.evidenceLocation));
addCheck("display model sections useful", displayModel.approvalGateSections.every((section) => section.label && section.blockedCount === 3 && section.nextAction));
addCheck(
  "display model safety counts blocked",
  displayModel.writableCandidateCount === 0
    && displayModel.persistedCandidateCount === 0
    && displayModel.approvalCaptureCandidateCount === 0
    && displayModel.approvalPersistenceCandidateCount === 0
    && displayModel.approvalDecisionRecordedCount === 0
    && displayModel.executableCandidateCount === 0
    && displayModel.executionUnlockCandidateCount === 0
    && displayModel.projectMutationCandidateCount === 0
    && displayModel.hostedDbMutationCandidateCount === 0
    && displayModel.providerSpendCandidateCount === 0,
);
addCheck("Command Center card exists", pageSource.includes("function FounderRuntimeExecutionApprovalGateCard") && pageSource.includes("aria-label=\"Runtime execution approval gate\""));
addCheck("card rendered on Business Build and Agent Flow only", cardUseCount === 2 && pageSource.includes("Business Build Runtime Execution Approval Gate") && pageSource.includes("Agent Flow Runtime Execution Approval Gate") && !pageSource.includes("Lite Runtime Execution Approval Gate") && !pageSource.includes("Chat Runtime Execution Approval Gate") && !pageSource.includes("Live Readiness Runtime Execution Approval Gate"));
addCheck("card renders founder-useful state", pageSource.includes("Approval candidates") && pageSource.includes("Blocked candidates") && pageSource.includes("Writable candidates") && pageSource.includes("Captured approvals") && pageSource.includes("Executable candidates") && primaryUxSource.includes("Approval capture") && primaryUxSource.includes("Execution unlock"));
addCheck("Playwright coverage added", routeTests.includes("Runtime execution approval gate appears only on Business Build and Agent Flow") && routeTests.includes("Runtime execution approval gate") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("Founder Intent Evidence"));
addCheck("contract marks P117.5 complete", p1175.status === "complete" && ["planned", "complete"].includes(p1176.status));
addCheck("docs record P117.5", /P117\.5 Command Center Approval Gate UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P117.5", /P117\.5 is complete/.test(platformRoadmap) && (/P117\.6 is next/.test(platformRoadmap) || /P117\.6 is complete/.test(platformRoadmap)));
addCheck("README records P117.5", /P117\.5 Command Center approval gate UX/.test(readme) && (/P117\.6 is next/.test(readme) || /P117\.6 approval gate validation/.test(readme)));
addCheck(
  "phase status advanced",
  ["P117.5", "P117.6", "P117.7"].includes(status.currentPhase)
    && ["P117.4", "P117.5", "P117.6"].includes(status.previousPhase)
    && ["P117.6", "P117.7", "P118"].includes(status.nextPhase)
    && ["P117.5", "P117.6", "P117.7"].includes(roadmap.currentPhase)
    && ["P117.4", "P117.5", "P117.6"].includes(roadmap.previousPhase)
    && ["P117.6", "P117.7", "P118"].includes(roadmap.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P117")?.status)
    && statusById.get("P117.5")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P117.6")?.status)
    && roadmapById.get("P117.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P117.5 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P117.5 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P117.5 contract avoids forbidden file scope", !(p1175.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("display model avoids raw approval/runtime keys and table names", !/(approvalEvidenceId|runtimeExecutionId|runtimeAdmissionId|dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_runtime_execution_|founder_runtime_admission_|founder_runtime_execution_approval_)/.test(serializedDisplayModel));
addCheck("display model avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|admit now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now/i.test(serializedDisplayModel));
addCheck("primary UX avoids internal phase labels and report paths", !/P117|p117\d|reports\/p117/i.test(primaryUxSource));
addCheck("page/test avoid fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|admit now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now/i.test(pageSource));
addCheck("no raw dumps introduced", !/raw JSON|raw logs|raw policy dump/i.test(serializedDisplayModel));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(pageSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${businessBuildSource}\n${pageSource}`));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P117.5 Command Center runtime execution approval gate UX.",
        "- Confirms Business Build and Agent Flow render display-safe approval gate candidates while Chat/Lite and Live Readiness stay clean.",
        "- Confirms the UX stays read-only and does not expose approval capture, approval persistence, approval decision recording, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1175-founder-runtime-execution-approval-gate",
        "- npm run check:p1174-founder-runtime-execution-approval-gate",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Runtime execution approval gate appears only on Business Build and Agent Flow\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P117.5 renders display-safe runtime execution approval gate preview state only. It does not write approval evidence records, capture approvals, persist decisions, record approve/reject decisions, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P117.5 Command Center Runtime Execution Approval Gate UX Report", phase: "P117.5" },
);

printCheckReport("P117.5 Command Center Runtime Execution Approval Gate UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
