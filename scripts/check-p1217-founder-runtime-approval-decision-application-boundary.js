import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalDecisionApplicationEligibilityMetadata } from "../shared/founderApprovalDecisionApplicationEligibilityMetadata.js";
import {
  buildFounderApprovalDecisionApplicationIntentModel,
  validateFounderApprovalDecisionApplicationIntentModel,
} from "../shared/founderApprovalDecisionApplicationIntentModel.js";
import {
  buildFounderApprovalDecisionApplicationPreview,
  validateFounderApprovalDecisionApplicationPreview,
} from "../shared/founderApprovalDecisionApplicationPreview.js";
import { buildFounderApprovalDecisionApplicationBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1217-founder-runtime-approval-decision-application-boundary-report.md";

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
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|validation-only|final-validation|planned-only|dry-run|preview-only|display-only|read-only|metadata-only|model-only|safe dry-run)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p121-founder-runtime-approval-decision-application-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P121_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1216Checker = readText("scripts/check-p1216-founder-runtime-approval-decision-application-boundary.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1217 = subphaseById.get("P121.7") || {};
const changed = changedFiles();
const allowedFiles = new Set(p1217.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P121.7";

const metadata = buildFounderApprovalDecisionApplicationEligibilityMetadata();
const intentModel = buildFounderApprovalDecisionApplicationIntentModel({
  intentState: "ready_for_safe_dry_run",
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const preview = buildFounderApprovalDecisionApplicationPreview({ intentModel });
const displayModel = buildFounderApprovalDecisionApplicationBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
  applicationPreview: preview,
});
const intentValidation = validateFounderApprovalDecisionApplicationIntentModel(intentModel);
const previewValidation = validateFounderApprovalDecisionApplicationPreview(preview);
const serializedDisplayModel = JSON.stringify(displayModel);

const p121Scripts = [
  "check:p1211-founder-runtime-approval-decision-application-boundary-contract",
  "check:p1212-founder-runtime-approval-decision-application-boundary",
  "check:p1213-founder-runtime-approval-decision-application-boundary",
  "check:p1214-founder-runtime-approval-decision-application-boundary",
  "check:p1215-founder-runtime-approval-decision-application-boundary",
  "check:p1216-founder-runtime-approval-decision-application-boundary",
  "check:p1217-founder-runtime-approval-decision-application-boundary",
];
const p121Reports = [
  "reports/p1211-founder-runtime-approval-decision-application-boundary-contract-report.md",
  "reports/p1212-founder-runtime-approval-decision-application-boundary-report.md",
  "reports/p1213-founder-runtime-approval-decision-application-boundary-report.md",
  "reports/p1214-founder-runtime-approval-decision-application-boundary-report.md",
  "reports/p1215-founder-runtime-approval-decision-application-boundary-report.md",
  "reports/p1216-founder-runtime-approval-decision-application-boundary-report.md",
];
const validationCommands = [
  "npm run check:p1217-founder-runtime-approval-decision-application-boundary",
  "npm run check:p1216-founder-runtime-approval-decision-application-boundary",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Approval decision application boundary appears only on scoped pages\"",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
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
const completedSubphases = ["P121.1", "P121.2", "P121.3", "P121.4", "P121.5", "P121.6", "P121.7"];
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const publicDocsBundle = [platformRoadmap, readme].join("\n");
const primaryUxSource = [businessBuildSource, pageSource, serializedDisplayModel].join("\n");
const zeroDisplayCounts = [
  "applicationCandidateCount",
  "applicableDecisionCount",
  "approvalApplicationCandidateCount",
  "decisionRecordableCandidateCount",
  "approvalDecisionRecordableCandidateCount",
  "dbWritableCandidateCount",
  "runtimeWritableCandidateCount",
  "runtimeExecutableCandidateCount",
  "executionUnlockCandidateCount",
  "agentDispatchCandidateCount",
  "projectMutationCandidateCount",
  "hostedDbMutationCandidateCount",
  "providerSpendCandidateCount",
].every((field) => displayModel[field] === 0);

const p121ClosedState =
  status.currentPhase === "P121.7"
    && status.previousPhase === "P121.6"
    && status.nextPhase === "P122"
    && roadmap.currentPhase === "P121.7"
    && roadmap.previousPhase === "P121.6"
    && roadmap.nextPhase === "P122"
    && statusById.get("P121")?.status === "complete"
    && roadmapById.get("P121")?.status === "complete"
    && completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
    && statusById.get("P122")?.status === "planned"
    && roadmapById.get("P122")?.status === "planned";
const p122StartedState =
  /^P122(?:\.|$)/.test(status.currentPhase || "")
    && status.previousPhase === "P121.7"
    && /^P122(?:\.|$)/.test(roadmap.currentPhase || "")
    && roadmap.previousPhase === "P121.7"
    && statusById.get("P121")?.status === "complete"
    && roadmapById.get("P121")?.status === "complete"
    && completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
    && ["planned", "in_progress", "complete"].includes(statusById.get("P122")?.status)
    && ["planned", "in_progress", "complete"].includes(roadmapById.get("P122")?.status);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1217-founder-runtime-approval-decision-application-boundary"]));
addCheck("all P121 scripts registered", p121Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P121 reports exist and pass", p121Reports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*(PASS|PASS \()/.test(readText(report))));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P121 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("contract handoff points to P122", contract.currentSubphase === "P121.7" && contract.previousSubphase === "P121.6" && contract.nextSubphase === "P122");
addCheck("P121.7 records final validation commands", validationCommands.every((command) => p1217.validationCommands?.includes(command)));
addCheck("P121.7 avoids forbidden file scope", !(p1217.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck(
  "changed files stay in P121.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck("changed files avoid forbidden scope", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("P121.6 checker accepts final handoff", p1216Checker.includes("p1217FinalState") && p1216Checker.includes("P121.7") && p1216Checker.includes("scope check relaxed"));
addCheck("OS status checker recognizes P121", osStatusChecker.includes('"P121"') && statusById.has("P121") && roadmapById.has("P121"));
addCheck("phase status closed or P122 started", p121ClosedState || p122StartedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("phase commits recorded", [statusById.get("P121")?.commit, statusById.get("P121.7")?.commit, roadmapById.get("P121")?.commit, roadmapById.get("P121.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P121")?.commandCenterVisible === true && statusById.get("P121.7")?.commandCenterVisible === true);
addCheck(
  "P122 handoff is planned-only",
  (statusById.get("P122")?.status === "planned"
      && roadmapById.get("P122")?.status === "planned"
      && statusById.get("P122")?.checksRun?.length === 0
      && roadmapById.get("P122")?.checksRun?.length === 0)
    || p122StartedState,
);
addCheck("metadata, intent, and preview validate", metadata.metadataOnly === true && intentValidation.valid && previewValidation.valid, `${intentValidation.errors.join("; ")} ${previewValidation.errors.join("; ")}`.trim());
addCheck("P121 plan records final validation", /P121\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P121 is complete/.test(plan) && /P122/.test(plan));
addCheck("platform roadmap records P121 complete", /P121\.7 is complete/.test(platformRoadmap) && /P121 is complete/.test(platformRoadmap) && /P122/.test(platformRoadmap));
addCheck("README records P121 complete", /P121\.7 final validation/i.test(readme) && /P121 is complete/.test(readme) && /P122/.test(readme));
addCheck("dashboard uses browser-safe application display model", businessBuildSource.includes("buildFounderApprovalDecisionApplicationBoundaryDisplayModel") && businessBuildSource.includes("Approval decision application safe dry-run report"));
addCheck("Command Center application card retained", pageSource.includes("Business Build Approval Decision Application Boundary") && pageSource.includes("Agent Flow Approval Decision Application Boundary") && pageSource.includes("Application read-only"));
addCheck("Command Center application surfaces remain scoped", !pageSource.includes("Lite Approval Decision Application Boundary") && !pageSource.includes("Chat Approval Decision Application Boundary") && !pageSource.includes("Live Readiness Approval Decision Application Boundary"));
addCheck("route coverage retained", routeTests.includes("Approval decision application boundary appears only on scoped pages") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("system"));
addCheck("display model remains useful", displayModel.currentState && displayModel.previewMode && displayModel.readinessRowCount === 3 && displayModel.readinessRows?.every((row) => row.label && row.nextAction && row.blocker));
addCheck("display model keeps unsafe authority blocked", zeroDisplayCounts);
addCheck("DemoApp not exposed in Command Center source", !pageSource.includes("DemoApp"));
addCheck("primary UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("primary UX avoids raw application keys and table names", !/(founderApprovalDecisionApplication|approval_decision_application|applicationDraftRef|applicationEventRef|applicationEvidenceRef|approvalDecisionApplicationKey|sqliteEntity|recordRef|requestKey)/i.test(serializedDisplayModel));
addCheck("primary UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now|write approval now|unlock execution now/i.test(primaryUxSource));
addCheck("public docs avoid raw application keys and table names", !/(founderApprovalDecisionApplication|approval_decision_application|applicationDraftRef|applicationEventRef|applicationEvidenceRef|approvalDecisionApplicationKey|sqliteEntity|recordRef|requestKey|approval_decision_application_|founder_runtime_approval_decision_application)/i.test(publicDocsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now|write approval now|unlock execution now/i.test(docsBundle));
addCheck(
  "docs and UX do not claim unsafe authority live",
  !hasUnsafePositiveClaim(
    `${docsBundle}\n${primaryUxSource}`,
    /approval decision application is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|hosted DB mutation is enabled|raw SQL is allowed|runtime execution is enabled|runtime execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|runtime writes are enabled/i,
  ),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P121 founder runtime approval decision application boundary closure.",
        "- Confirms parent P121 and all subphases are complete, reports and scripts exist, Command Center application route safety is retained, and P122 is a planned-only handoff.",
        "- Does not apply approval decisions, capture approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, run raw SQL, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P121.7 closes P121 validation only. It does not apply approval decisions, capture approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, create or mutate projects, use hosted DBs, run raw SQL, deploy, release, export, package, use network calls, or spend. P122 is planned-only until its own implementation-grade contract is written.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P121.7 Founder Runtime Approval Decision Application Boundary Final Report", phase: "P121.7" },
);

printCheckReport("P121.7 Founder Runtime Approval Decision Application Boundary Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
