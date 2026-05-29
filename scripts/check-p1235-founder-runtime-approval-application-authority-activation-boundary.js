import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalApplicationAuthorityActivationBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1235-founder-runtime-approval-application-authority-activation-boundary-report.md";
const P1234_REPORT_PATH = "reports/p1234-founder-runtime-approval-application-authority-activation-boundary-report.md";

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
const contract = readJson("contracts/os-roadmap/p123-founder-runtime-approval-application-authority-activation-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1235 = subphaseById.get("P123.5") || {};
const p1236 = subphaseById.get("P123.6") || {};
const plan = readText("docs/architecture/P123_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1234Checker = readText("scripts/check-p1234-founder-runtime-approval-application-authority-activation-boundary.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderApprovalApplicationAuthorityActivationBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedDisplayModel = JSON.stringify(displayModel);
const primaryUxSource = `${pageSource}\n${serializedDisplayModel}`;
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P123.5";
const allowedFiles = new Set(p1235.allowedFiles || []);
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
const p1235HandoffAccepted = (status.currentPhase === "P123.5"
  && status.previousPhase === "P123.4"
  && status.nextPhase === "P123.6"
  && roadmap.currentPhase === "P123.5"
  && roadmap.previousPhase === "P123.4"
  && roadmap.nextPhase === "P123.6")
  || (status.currentPhase === "P123.6"
    && status.previousPhase === "P123.5"
    && status.nextPhase === "P123.7"
    && roadmap.currentPhase === "P123.6"
    && roadmap.previousPhase === "P123.5")
  || (status.currentPhase === "P123.7"
    && status.previousPhase === "P123.6"
    && status.nextPhase === "P124"
    && roadmap.currentPhase === "P123.7"
    && roadmap.previousPhase === "P123.6"
    && roadmap.nextPhase === "P124");
const p123ParentStatusAccepted = statusById.get("P123")?.status === "in_progress"
  || (status.currentPhase === "P123.7" && statusById.get("P123")?.status === "complete");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1235-founder-runtime-approval-application-authority-activation-boundary"]));
addCheck("business build exposes browser-safe activation display model", businessBuildSource.includes("buildFounderApprovalApplicationAuthorityActivationBoundaryDisplayModel") && businessBuildSource.includes("buildFounderApprovalApplicationAuthorityActivationPreview") && !businessBuildSource.includes("sqliteCrudRepository"));
addCheck("display model shape", displayModel.currentState && displayModel.previewMode && displayModel.readinessRowCount === 4 && displayModel.blockedReadinessRowCount === 4 && Array.isArray(displayModel.readinessRows) && displayModel.readinessRows.length === 4 && Array.isArray(displayModel.summaryRows));
addCheck("display model rows useful", displayModel.readinessRows.every((row) => row.label && row.decisionState && row.nextAction && row.blocker && row.evidenceLocation));
addCheck("display model sections useful", displayModel.readinessSections.every((section) => section.label && section.blockedCount === 4 && section.nextAction));
addCheck(
  "display model safety counts blocked",
  displayModel.activationCandidateCount === 0
    && displayModel.authorityGrantCandidateCount === 0
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
addCheck("Command Center reusable card supports four activation rows", pageSource.includes("maxRows") && pageSource.includes("ccv2-grid--4") && pageSource.includes("summaryRows") && pageSource.includes("ariaLabel") && pageSource.includes("rowAriaSuffix"));
addCheck("activation boundary card rendered on scoped pages only", pageSource.includes("Business Build Approval Application Authority Activation") && pageSource.includes("Agent Flow Approval Application Authority Activation") && !pageSource.includes("Lite Approval Application Authority Activation") && !pageSource.includes("Chat Approval Application Authority Activation") && !pageSource.includes("Live Readiness Approval Application Authority Activation"));
addCheck("activation boundary card renders founder-useful state", pageSource.includes("Activation read-only") && serializedDisplayModel.includes("Activation candidates") && serializedDisplayModel.includes("Authority grant candidates") && serializedDisplayModel.includes("Network-call candidates") && primaryUxSource.includes("Approval Application Authority Activation") && primaryUxSource.includes("Execution unlock"));
addCheck("Playwright coverage added", routeTests.includes("Approval application authority activation appears only on scoped pages") && routeTests.includes("Founder approval application authority activation") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("Activation scope") && routeTests.includes("Runtime write guard"));
addCheck("contract marks P123.5 complete", p1235.status === "complete" && ["planned", "complete"].includes(p1236.status));
addCheck("contract records expected export", p1235.expectedExports?.includes("buildFounderApprovalApplicationAuthorityActivationBoundaryDisplayModel"));
addCheck("P123.4 checker accepts P123.5 handoff", p1234Checker.includes("P123.5") && p1234Checker.includes("P123.6") && p1234Checker.includes("p1234HandoffAccepted"));
addCheck("docs record P123.5", /P123\.5 Command Center Activation Boundary UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P123.5", /P123\.5 is complete/.test(platformRoadmap) && (/P123\.6\s+is\s+next/.test(platformRoadmap) || /P123\.6\s+is\s+complete/.test(platformRoadmap)));
addCheck("README records P123.5", /P123\.5 Command Center approval application authority activation UX/.test(readme) && (/P123\.6\s+is\s+next/.test(readme) || /P123\.6\s+is\s+complete/.test(readme)));
addCheck(
  "phase status advanced",
  p1235HandoffAccepted
    && p123ParentStatusAccepted
    && statusById.get("P123.4")?.status === "complete"
    && statusById.get("P123.5")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P123.6")?.status)
    && roadmapById.get("P123.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P123.5 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH || file === P1234_REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P123.5 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P123.5 contract avoids forbidden project/runtime scope", !(p1235.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("display model avoids raw schema names and record refs", !/(founderApprovalApplicationAuthorityActivation|approval_authority_activation|activationDraftRef|activationEventRef|activationEvidenceRef|approvalApplicationAuthorityActivationKey|sqliteEntity|recordRef|requestKey)/i.test(serializedDisplayModel));
addCheck("display model avoids unsafe runnable actions", !/run now|execute now|deploy now|activate now|grant authority now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedDisplayModel));
addCheck("primary UX avoids internal phase labels and report paths", !/P123|p123\d|reports\/p123/i.test(primaryUxSource));
addCheck("page avoids fake runnable actions", !/run now|execute now|deploy now|activate now|grant authority now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(pageSource));
addCheck("display model avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedDisplayModel));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(pageSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${businessBuildSource}\n${pageSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /activation is enabled|approval application authority activation is enabled|authority grant is enabled|approval decision application is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|activation authority is granted/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P123.5 Command Center approval application authority activation boundary UX.",
        "- Confirms Business Build and Agent Flow render display-safe activation readiness while Chat, Lite, OS Roadmap, and Live Readiness stay clean.",
        "- Does not enable activation, authority grant, apply, submit, approve, reject, save, decision persistence, approve/reject recording, DB/runtime writes, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1235.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P123.5 renders display-safe activation preview state only. It does not activate authority, grant authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P123.5 Command Center Approval Application Authority Activation UX Report", phase: "P123.5" },
);

printCheckReport("P123.5 Command Center Approval Application Authority Activation UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
