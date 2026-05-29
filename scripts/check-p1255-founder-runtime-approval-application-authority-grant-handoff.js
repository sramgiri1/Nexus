import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildBusinessBuildViewModel,
  buildFounderApprovalApplicationAuthorityGrantHandoffDisplayModel,
} from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1255-founder-runtime-approval-application-authority-grant-handoff-report.md";

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
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|dry run|display-only|read-only|planned-only|local-only|future)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p125-founder-runtime-approval-application-authority-grant-handoff-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1255 = subphaseById.get("P125.5") || {};
const p1256 = subphaseById.get("P125.6") || {};
const plan = readText("docs/architecture/P125_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1254Checker = readText("scripts/check-p1254-founder-runtime-approval-application-authority-grant-handoff.js");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderApprovalApplicationAuthorityGrantHandoffDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const businessBuild = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P125.5";
const allowedFiles = new Set(p1255.allowedFiles || []);
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
const serializedModel = JSON.stringify(displayModel);
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;

function allowedDashboardFile(file) {
  return [
    "dashboard/src/data/businessBuild.js",
    "dashboard/src/pages/CommandCenterV2.jsx",
    "dashboard/tests/routes.spec.js",
  ].includes(file);
}

const zeroSummaryCounts = [
  "handoffCandidateCount",
  "authorityHandoffCandidateCount",
  "grantCandidateCount",
  "authorityGrantCandidateCount",
  "activationCandidateCount",
  "applicationCandidateCount",
  "approvalApplicationCandidateCount",
  "decisionRecordableCandidateCount",
  "approvalDecisionRecordableCandidateCount",
  "dbWritableCandidateCount",
  "runtimeWritableCandidateCount",
  "runtimeExecutableCandidateCount",
  "executionUnlockCandidateCount",
  "agentDispatchCandidateCount",
  "workerExecutionCandidateCount",
  "toolExecutionCandidateCount",
  "projectMutationCandidateCount",
  "hostedDbMutationCandidateCount",
  "networkCallCandidateCount",
  "providerSpendCandidateCount",
].every((field) => displayModel[field] === 0);
const p1255CurrentState = status.currentPhase === "P125.5"
  && status.previousPhase === "P125.4"
  && status.nextPhase === "P125.6"
  && roadmap.currentPhase === "P125.5"
  && roadmap.previousPhase === "P125.4"
  && roadmap.nextPhase === "P125.6";
const p1256StartedState = status.currentPhase === "P125.6"
  && status.previousPhase === "P125.5"
  && status.nextPhase === "P125.7"
  && roadmap.currentPhase === "P125.6"
  && roadmap.previousPhase === "P125.5"
  && roadmap.nextPhase === "P125.7";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1255-founder-runtime-approval-application-authority-grant-handoff"]));
addCheck("display model export exists", typeof buildFounderApprovalApplicationAuthorityGrantHandoffDisplayModel === "function" && dataSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffSafeDryRun"));
addCheck("business build view exposes grant handoff", Boolean(businessBuild.founderApprovalApplicationAuthorityGrantHandoff) && businessBuild.founderApprovalApplicationAuthorityGrantHandoff.currentState === displayModel.currentState);
addCheck("display model shape is useful", displayModel.currentState.includes("Handoff") && displayModel.founderIdea.includes("Snake game") && displayModel.previewMode.includes("Authority Grant Handoff") && displayModel.readinessRowCount === 4 && displayModel.blockedReadinessRowCount === 4);
addCheck("display model sections and rows are useful", displayModel.readinessRows.length === 4 && displayModel.readinessSections.length === 3 && displayModel.readinessRows.every((row) => row.label && row.decisionState && row.nextAction && row.blocker && row.disabledReason && row.ownerCapability));
addCheck("display model summary rows include operator context", ["Owner capability", "Next action", "Disabled reason", "Evidence", "Activity", "Cost impact"].every((label) => displayModel.summaryRows.some((row) => row.label === label)));
addCheck("display model safety rows remain blocked", displayModel.safetyRows.length >= 10 && displayModel.safetyRows.every((row) => row.value === "Blocked"));
addCheck("candidate counts remain zero", zeroSummaryCounts);
addCheck("Command Center renders Business Build handoff card", commandCenterSource.includes("Business Build Approval Application Authority Grant Handoff") && commandCenterSource.includes("Founder approval application authority grant handoff"));
addCheck("Command Center renders Agent Flow handoff card", commandCenterSource.includes("Agent Flow Approval Application Authority Grant Handoff"));
addCheck("Command Center uses existing boundary card", (commandCenterSource.match(/FounderApprovalDecisionBoundaryCard/g) || []).length >= 2 && !/function FounderApprovalApplicationAuthorityGrantHandoff/.test(commandCenterSource));
addCheck("Playwright scoped route test added", routeTests.includes("Approval application authority grant handoff appears only on scoped pages") && routeTests.includes("Business Build Approval Application Authority Grant Handoff") && routeTests.includes("Agent Flow Approval Application Authority Grant Handoff"));
addCheck("Playwright checks themes", routeTests.includes("for (const theme of [\"dark\", \"light\", \"system\"])") && routeTests.includes("Handoff read-only"));
addCheck("Playwright checks excluded routes", routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("toHaveCount(0)"));
addCheck("Playwright checks safety text", routeTests.includes("DemoApp") && routeTests.includes("raw JSON") && routeTests.includes("handoff authority now") && routeTests.includes("founderApprovalApplicationAuthorityGrantHandoff"));
addCheck("contract marks P125.5 complete and P125.6 handoff valid", p1255.status === "complete" && ["planned", "complete"].includes(p1256.status));
addCheck("contract records expected export", p1255.expectedExports?.includes("buildFounderApprovalApplicationAuthorityGrantHandoffDisplayModel"));
addCheck("P125.4 checker accepts P125.5 handoff", p1254Checker.includes("P125.5") && p1254Checker.includes("P125.6") && p1254Checker.includes("p1255StartedState"));
addCheck("docs record P125.5", /P125\.5 Command Center Handoff UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P125.5", /P125\.5 scoped approval application authority grant handoff Command Center UX/i.test(readme) && /P125\.6\s+is\s+next/.test(readme));
addCheck(
  "platform roadmap records P125.5",
  /P125\.5 is complete/.test(platformRoadmap)
    && (/P125\.6\s+is\s+next/.test(platformRoadmap) || /P125\.6 is complete/.test(platformRoadmap)),
);
addCheck(
  "phase status advanced",
  (p1255CurrentState || p1256StartedState)
    && statusById.get("P125")?.status === "in_progress"
    && statusById.get("P125.4")?.status === "complete"
    && statusById.get("P125.5")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P125.6")?.status)
    && roadmapById.get("P125.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P125.5 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => (
    allowedDashboardFile(file)
    || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))
  )),
  enforceCurrentDiffScope ? changed.join(", ") : `P125.5 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("no unauthorized dashboard files changed", !enforceCurrentDiffScope || changed.every((file) => !file.startsWith("dashboard/") || allowedDashboardFile(file)));
addCheck("public docs avoid raw handoff table names", !/(approval_authority_grant_handoff_records|grant_handoff_events|grant_handoff_requests|handoff_boundary_records)/i.test(publicDocsBundle));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedModel));
addCheck("display model avoids raw schema/table names", !/(founderApprovalApplicationAuthorityGrantHandoff|approval_authority_grant_handoff|reports\/p125|P125)/i.test(serializedModel));
addCheck("display model avoids fake runnable actions", !/handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedModel));
addCheck("handoff display avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedModel));
addCheck("dashboard source has no unsafe URLs or DB imports", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(commandCenterSource) && !/CREATE TABLE|INSERT INTO|DELETE FROM|ALTER TABLE|DROP TABLE|postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(commandCenterSource));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /grant handoff is enabled|authority handoff is enabled|approval application authority grant handoff is enabled|grant authority is enabled|approval application authority grant is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P125.5 scoped Command Center approval application authority grant handoff UX.",
        "- Confirms Business Build and Agent Flow render the P125.4 dry-run model through existing card patterns while Chat with NEXUS, Lite, OS Roadmap, Live Readiness, and unrelated pages stay clean.",
        "- Does not hand off authority, grant authority, activate authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime state, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1255.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P125.5 is display-only scoped UX. It does not hand off authority, grant authority, activate authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P125.5 Approval Application Authority Grant Handoff Command Center UX Report", phase: "P125.5" },
);

printCheckReport("P125.5 Approval Application Authority Grant Handoff Command Center UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
