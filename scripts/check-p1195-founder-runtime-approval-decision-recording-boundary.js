import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalDecisionBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1195-founder-runtime-approval-decision-recording-boundary-report.md";

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
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|preview-only|read-only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p119-founder-runtime-approval-decision-recording-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1195 = subphaseById.get("P119.5") || {};
const p1196 = subphaseById.get("P119.6") || {};
const plan = readText("docs/architecture/P119_FOUNDER_RUNTIME_APPROVAL_DECISION_RECORDING_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderApprovalDecisionBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedDisplayModel = JSON.stringify(displayModel);
const primaryUxSource = `${pageSource}\n${serializedDisplayModel}`;
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P119.5";
const allowedFiles = new Set(p1195.allowedFiles || []);
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
const cardUseCount = (pageSource.match(/<FounderApprovalDecisionBoundaryCard/g) || []).length;
const p1195HandoffAccepted = (status.currentPhase === "P119.5"
  && status.previousPhase === "P119.4"
  && status.nextPhase === "P119.6"
  && roadmap.currentPhase === "P119.5"
  && roadmap.previousPhase === "P119.4"
  && roadmap.nextPhase === "P119.6")
  || (status.currentPhase === "P119.6"
    && status.previousPhase === "P119.5"
    && status.nextPhase === "P119.7"
    && roadmap.currentPhase === "P119.6"
    && roadmap.previousPhase === "P119.5"
    && roadmap.nextPhase === "P119.7")
  || (status.currentPhase === "P119.7"
    && status.previousPhase === "P119.6"
    && roadmap.currentPhase === "P119.7"
    && roadmap.previousPhase === "P119.6");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1195-founder-runtime-approval-decision-recording-boundary"]));
addCheck("business build exposes browser-safe display model", businessBuildSource.includes("buildFounderApprovalDecisionBoundaryDisplayModel") && businessBuildSource.includes("buildFounderApprovalDecisionPreview") && !businessBuildSource.includes("sqliteCrudRepository"));
addCheck("display model shape", displayModel.currentState && displayModel.previewMode && displayModel.readinessRowCount === 3 && displayModel.blockedReadinessRowCount === 3 && Array.isArray(displayModel.readinessRows) && displayModel.readinessRows.length === 3);
addCheck("display model rows useful", displayModel.readinessRows.every((row) => row.label && row.decisionState && row.nextAction && row.blocker && row.evidenceLocation));
addCheck("display model sections useful", displayModel.readinessSections.every((section) => section.label && section.blockedCount === 3 && section.nextAction));
addCheck(
  "display model safety counts blocked",
  displayModel.decisionReviewCandidateCount === 0
    && displayModel.approvableCandidateCount === 0
    && displayModel.rejectableCandidateCount === 0
    && displayModel.persistableCandidateCount === 0
    && displayModel.decisionRecordableCandidateCount === 0
    && displayModel.dbWritableCandidateCount === 0
    && displayModel.runtimeExecutableCandidateCount === 0
    && displayModel.executionUnlockCandidateCount === 0
    && displayModel.agentDispatchCandidateCount === 0
    && displayModel.projectMutationCandidateCount === 0
    && displayModel.hostedDbMutationCandidateCount === 0
    && displayModel.providerSpendCandidateCount === 0,
);
addCheck("Command Center card exists", pageSource.includes("function FounderApprovalDecisionBoundaryCard") && pageSource.includes("aria-label=\"Founder runtime approval decision boundary\""));
addCheck("card rendered on scoped pages only", cardUseCount === 2 && pageSource.includes("Business Build Runtime Approval Decision Boundary") && pageSource.includes("Agent Flow Runtime Approval Decision Boundary") && !pageSource.includes("Lite Runtime Approval Decision Boundary") && !pageSource.includes("Chat Runtime Approval Decision Boundary") && !pageSource.includes("Live Readiness Runtime Approval Decision Boundary"));
addCheck("card renders founder-useful state", pageSource.includes("Readiness rows") && pageSource.includes("Blocked rows") && pageSource.includes("Decision-review candidates") && pageSource.includes("Approvable candidates") && pageSource.includes("Rejectable candidates") && pageSource.includes("Decision-recordable candidates") && primaryUxSource.includes("Approval decision") && primaryUxSource.includes("Execution unlock"));
addCheck("Playwright coverage added", routeTests.includes("Approval decision boundary appears only on scoped pages") && routeTests.includes("Founder runtime approval decision boundary") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("Approval decision request"));
addCheck("contract marks P119.5 complete", p1195.status === "complete" && ["planned", "complete"].includes(p1196.status));
addCheck("contract records expected export", p1195.expectedExports?.includes("buildFounderApprovalDecisionBoundaryDisplayModel"));
addCheck("docs record P119.5", /P119\.5 Command Center Approval Decision Boundary UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P119.5", /P119\.5 is complete/.test(platformRoadmap) && /P119\.6\s+is\s+next/.test(platformRoadmap));
addCheck("README records P119.5", /P119\.5 Command Center approval decision boundary UX/.test(readme) && /P119\.6\s+is\s+next/.test(readme));
addCheck(
  "phase status advanced",
  p1195HandoffAccepted
    && statusById.get("P119")?.status === "in_progress"
    && statusById.get("P119.4")?.status === "complete"
    && statusById.get("P119.5")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P119.6")?.status)
    && roadmapById.get("P119.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P119.5 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P119.5 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P119.5 contract avoids forbidden file scope", !(p1195.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("display model avoids raw schema names and record refs", !/(founderApprovalDecision|approval_decision_|decisionRequestRef|decisionEventRef|decisionEvidenceRef|approvalDecisionRecordKey|decisionPreviewKey|sqliteEntity|recordRef|requestKey)/i.test(serializedDisplayModel));
addCheck("display model avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedDisplayModel));
addCheck("primary UX avoids internal phase labels and report paths", !/P119|p119\d|reports\/p119/i.test(primaryUxSource));
addCheck("page avoids fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(pageSource));
addCheck("display model avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedDisplayModel));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(pageSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${businessBuildSource}\n${pageSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P119.5 Command Center approval decision boundary UX.",
        "- Confirms Business Build and Agent Flow render display-safe approval decision readiness while Chat, Lite, OS Roadmap, and Live Readiness stay clean.",
        "- Does not enable submit, approve, reject, save, decision recording, approval persistence, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: p1195.validationCommands.map((command) => `- ${command}`).join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P119.5 renders display-safe approval decision boundary preview state only. It does not accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P119.5 Command Center Approval Decision Boundary UX Report", phase: "P119.5" },
);

printCheckReport("P119.5 Command Center Approval Decision Boundary UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
