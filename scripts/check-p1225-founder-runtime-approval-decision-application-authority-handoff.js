import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalDecisionApplicationAuthorityBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1225-founder-runtime-approval-decision-application-authority-handoff-report.md";

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
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|preview-only|display-only|read-only|future)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p122-founder-runtime-approval-decision-application-authority-handoff-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1225 = subphaseById.get("P122.5") || {};
const p1226 = subphaseById.get("P122.6") || {};
const plan = readText("docs/architecture/P122_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1224Checker = readText("scripts/check-p1224-founder-runtime-approval-decision-application-authority-handoff.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderApprovalDecisionApplicationAuthorityBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedDisplayModel = JSON.stringify(displayModel);
const primaryUxSource = `${pageSource}\n${serializedDisplayModel}`;
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P122.5";
const allowedFiles = new Set(p1225.allowedFiles || []);
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
const p1225HandoffAccepted = (status.currentPhase === "P122.5"
  && status.previousPhase === "P122.4"
  && status.nextPhase === "P122.6"
  && roadmap.currentPhase === "P122.5"
  && roadmap.previousPhase === "P122.4"
  && roadmap.nextPhase === "P122.6")
  || (status.currentPhase === "P122.6"
    && status.previousPhase === "P122.5"
    && status.nextPhase === "P122.7"
    && roadmap.currentPhase === "P122.6"
    && roadmap.previousPhase === "P122.5")
  || (status.currentPhase === "P122.7"
    && status.previousPhase === "P122.6"
    && roadmap.currentPhase === "P122.7"
    && roadmap.previousPhase === "P122.6");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1225-founder-runtime-approval-decision-application-authority-handoff"]));
addCheck("business build exposes browser-safe authority display model", businessBuildSource.includes("buildFounderApprovalDecisionApplicationAuthorityBoundaryDisplayModel") && businessBuildSource.includes("buildFounderApprovalDecisionApplicationAuthorityPreview") && !businessBuildSource.includes("sqliteCrudRepository"));
addCheck("display model shape", displayModel.currentState && displayModel.previewMode && displayModel.readinessRowCount === 4 && displayModel.blockedReadinessRowCount === 4 && Array.isArray(displayModel.readinessRows) && displayModel.readinessRows.length === 4 && Array.isArray(displayModel.summaryRows));
addCheck("display model rows useful", displayModel.readinessRows.every((row) => row.label && row.decisionState && row.nextAction && row.blocker && row.evidenceLocation));
addCheck("display model sections useful", displayModel.readinessSections.every((section) => section.label && section.blockedCount === 4 && section.nextAction));
addCheck(
  "display model safety counts blocked",
  displayModel.authorityCandidateCount === 0
    && displayModel.handoffCandidateCount === 0
    && displayModel.applicationCandidateCount === 0
    && displayModel.approvalApplicationCandidateCount === 0
    && displayModel.decisionRecordableCandidateCount === 0
    && displayModel.approvalDecisionRecordableCandidateCount === 0
    && displayModel.dbWritableCandidateCount === 0
    && displayModel.runtimeWritableCandidateCount === 0
    && displayModel.runtimeExecutableCandidateCount === 0
    && displayModel.executionUnlockCandidateCount === 0
    && displayModel.agentDispatchCandidateCount === 0
    && displayModel.workerExecutionCandidateCount === 0
    && displayModel.toolExecutionCandidateCount === 0
    && displayModel.projectMutationCandidateCount === 0
    && displayModel.hostedDbMutationCandidateCount === 0
    && displayModel.networkCallCandidateCount === 0
    && displayModel.providerSpendCandidateCount === 0,
);
addCheck("Command Center reusable card supports four authority rows", pageSource.includes("maxRows") && pageSource.includes("ccv2-grid--4") && pageSource.includes("summaryRows") && pageSource.includes("ariaLabel") && pageSource.includes("rowAriaSuffix"));
addCheck("authority handoff card rendered on scoped pages only", pageSource.includes("Business Build Approval Application Authority Handoff") && pageSource.includes("Agent Flow Approval Application Authority Handoff") && !pageSource.includes("Lite Approval Application Authority Handoff") && !pageSource.includes("Chat Approval Application Authority Handoff") && !pageSource.includes("Live Readiness Approval Application Authority Handoff"));
addCheck("authority handoff card renders founder-useful state", pageSource.includes("Authority read-only") && serializedDisplayModel.includes("Authority candidates") && serializedDisplayModel.includes("Handoff candidates") && serializedDisplayModel.includes("Network-call candidates") && primaryUxSource.includes("Approval Application Authority Handoff") && primaryUxSource.includes("Execution unlock"));
addCheck("Playwright coverage added", routeTests.includes("Approval application authority handoff appears only on scoped pages") && routeTests.includes("Founder approval application authority handoff") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("Authority scope"));
addCheck("contract marks P122.5 complete", p1225.status === "complete" && ["planned", "complete"].includes(p1226.status));
addCheck("contract records expected export", p1225.expectedExports?.includes("buildFounderApprovalDecisionApplicationAuthorityBoundaryDisplayModel"));
addCheck("P122.4 checker accepts P122.5 handoff", p1224Checker.includes("P122.5") && p1224Checker.includes("P122.6") && p1224Checker.includes("p1224HandoffAccepted"));
addCheck("docs record P122.5", /P122\.5 Command Center Authority Handoff UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P122.5", /P122\.5 is complete/.test(platformRoadmap) && (/P122\.6\s+is\s+next/.test(platformRoadmap) || /P122\.6\s+is\s+complete/.test(platformRoadmap)));
addCheck("README records P122.5", /P122\.5 Command Center approval application authority handoff UX/.test(readme) && (/P122\.6\s+is\s+next/.test(readme) || /P122\.6\s+is\s+complete/.test(readme)));
addCheck(
  "phase status advanced",
  p1225HandoffAccepted
    && statusById.get("P122")?.status === "in_progress"
    && statusById.get("P122.4")?.status === "complete"
    && statusById.get("P122.5")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P122.6")?.status)
    && roadmapById.get("P122.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P122.5 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P122.5 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P122.5 contract avoids forbidden file scope", !(p1225.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("display model avoids raw schema names and record refs", !/(founderApprovalDecisionApplication|approval_decision_application|approval_application_authority|authorityDraftRef|authorityEventRef|authorityEvidenceRef|approvalApplicationAuthorityKey|sqliteEntity|recordRef|requestKey)/i.test(serializedDisplayModel));
addCheck("display model avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedDisplayModel));
addCheck("primary UX avoids internal phase labels and report paths", !/P122|p122\d|reports\/p122/i.test(primaryUxSource));
addCheck("page avoids fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(pageSource));
addCheck("display model avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedDisplayModel));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(pageSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${businessBuildSource}\n${pageSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval decision application is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority handoff is granted/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P122.5 Command Center approval application authority handoff UX.",
        "- Confirms Business Build and Agent Flow render display-safe authority readiness while Chat, Lite, OS Roadmap, and Live Readiness stay clean.",
        "- Does not enable grant, apply, submit, approve, reject, save, decision persistence, approve/reject recording, DB/runtime writes, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1225.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P122.5 renders display-safe authority handoff preview state only. It does not grant authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P122.5 Command Center Approval Application Authority Handoff UX Report", phase: "P122.5" },
);

printCheckReport("P122.5 Command Center Approval Application Authority Handoff UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
