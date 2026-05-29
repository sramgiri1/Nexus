import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalDecisionBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1197-founder-runtime-approval-decision-recording-boundary-report.md";

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

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start === -1) return "";
  const next = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, next === -1 ? source.length : next);
}

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 1] || ""} ${line}`;
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|validation-only|final-validation|planned-only|read-only|dry-run)\b/i.test(context);
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
const plan = readText("docs/architecture/P119_FOUNDER_RUNTIME_APPROVAL_DECISION_RECORDING_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1196Checker = readText("scripts/check-p1196-founder-runtime-approval-decision-recording-boundary.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const approvalDecisionCardSource = extractFunction(pageSource, "FounderApprovalDecisionBoundaryCard");
const displayModel = buildFounderApprovalDecisionBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedDisplayModel = JSON.stringify(displayModel);
const p1197 = subphaseById.get("P119.7") || {};
const changed = changedFiles();
const allowedFiles = new Set(p1197.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P119.7";

const p119Scripts = [
  "check:p1191-founder-runtime-approval-decision-recording-boundary-contract",
  "check:p1192-founder-runtime-approval-decision-recording-boundary",
  "check:p1193-founder-runtime-approval-decision-recording-boundary",
  "check:p1194-founder-runtime-approval-decision-recording-boundary",
  "check:p1195-founder-runtime-approval-decision-recording-boundary",
  "check:p1196-founder-runtime-approval-decision-recording-boundary",
  "check:p1197-founder-runtime-approval-decision-recording-boundary",
];
const p119Reports = [
  "reports/p1191-founder-runtime-approval-decision-recording-boundary-contract-report.md",
  "reports/p1192-founder-runtime-approval-decision-recording-boundary-report.md",
  "reports/p1193-founder-runtime-approval-decision-recording-boundary-report.md",
  "reports/p1194-founder-runtime-approval-decision-recording-boundary-report.md",
  "reports/p1195-founder-runtime-approval-decision-recording-boundary-report.md",
  "reports/p1196-founder-runtime-approval-decision-recording-boundary-report.md",
];
const validationCommands = [
  "npm run check:p1197-founder-runtime-approval-decision-recording-boundary",
  "npm run check:p1196-founder-runtime-approval-decision-recording-boundary",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "db/",
  "live-ready/",
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
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const publicDocsBundle = [platformRoadmap, readme].join("\n");
const uxText = `${approvalDecisionCardSource}\n${serializedDisplayModel}`;

const p119ClosedState =
  status.currentPhase === "P119.7"
    && status.previousPhase === "P119.6"
    && status.nextPhase === "P120"
    && roadmap.currentPhase === "P119.7"
    && roadmap.previousPhase === "P119.6"
    && roadmap.nextPhase === "P120"
    && statusById.get("P119")?.status === "complete"
    && roadmapById.get("P119")?.status === "complete"
    && statusById.get("P119.7")?.status === "complete"
    && roadmapById.get("P119.7")?.status === "complete"
    && statusById.get("P120")?.status === "planned"
    && roadmapById.get("P120")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1197-founder-runtime-approval-decision-recording-boundary"]));
addCheck("all P119 scripts registered", p119Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P119 reports exist and pass", p119Reports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P119 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("contract handoff points to P120", contract.currentSubphase === "P119.7" && contract.previousSubphase === "P119.6" && contract.nextSubphase === "P120");
addCheck("P119.7 records final validation commands", validationCommands.every((command) => p1197.validationCommands?.includes(command)));
addCheck("P119.7 avoids forbidden file scope", !(p1197.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck(
  "changed files stay in P119.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck("changed files avoid forbidden scope", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("P119.6 checker accepts final handoff", p1196Checker.includes("p1197HandoffState") && p1196Checker.includes("P119.7"));
addCheck("OS status checker can resolve P120 handoff", osStatusChecker.includes('"P120"') && statusById.has("P120") && roadmapById.has("P120"));
addCheck("phase status closed", p119ClosedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("phase commits recorded", [statusById.get("P119")?.commit, statusById.get("P119.7")?.commit, roadmapById.get("P119")?.commit, roadmapById.get("P119.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P119")?.commandCenterVisible === true && statusById.get("P119.7")?.commandCenterVisible === true);
addCheck("P120 placeholder is controlled", statusById.get("P120")?.status === "planned" && roadmapById.get("P120")?.status === "planned" && statusById.get("P120")?.checksRun?.length === 0 && roadmapById.get("P120")?.checksRun?.length === 0);
addCheck("P119 plan records final validation", /P119\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P119 is complete/.test(plan) && /P120/.test(plan));
addCheck("platform roadmap records P119 complete", /P119\.7 is complete/.test(platformRoadmap) && /P119 is complete/.test(platformRoadmap) && /P120/.test(platformRoadmap));
addCheck("README records P119 complete", /P119\.7 final validation/i.test(readme) && /P119 is complete/.test(readme) && /P120/.test(readme));
addCheck("dashboard uses browser-safe approval decision display model", businessBuildSource.includes("buildFounderApprovalDecisionBoundaryDisplayModel") && businessBuildSource.includes("Approval decision safe dry-run report"));
addCheck("Command Center approval decision card retained", approvalDecisionCardSource.includes("aria-label=\"Founder runtime approval decision boundary\"") && approvalDecisionCardSource.includes("Decision-review candidates") && approvalDecisionCardSource.includes("Blocked rows"));
addCheck("Command Center approval decision surfaces remain scoped", pageSource.includes("Business Build Runtime Approval Decision Boundary") && pageSource.includes("Agent Flow Runtime Approval Decision Boundary") && !pageSource.includes("Lite Runtime Approval Decision Boundary") && !pageSource.includes("Chat Runtime Approval Decision Boundary") && !pageSource.includes("Live Readiness Runtime Approval Decision Boundary"));
addCheck("route coverage retained", routeTests.includes("Approval decision boundary appears only on scoped pages") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness"));
addCheck("display model remains useful", displayModel.currentState && displayModel.previewMode && displayModel.readinessRowCount === 3 && displayModel.readinessRows?.every((row) => row.label && row.nextAction && row.blocker));
addCheck("display model keeps unsafe authority blocked", displayModel.decisionReviewCandidateCount === 0 && displayModel.approvableCandidateCount === 0 && displayModel.rejectableCandidateCount === 0 && displayModel.persistableCandidateCount === 0 && displayModel.decisionRecordableCandidateCount === 0 && displayModel.dbWritableCandidateCount === 0 && displayModel.runtimeExecutableCandidateCount === 0 && displayModel.executionUnlockCandidateCount === 0 && displayModel.agentDispatchCandidateCount === 0 && displayModel.projectMutationCandidateCount === 0 && displayModel.hostedDbMutationCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0);
addCheck("DemoApp not exposed in Command Center source", !pageSource.includes("DemoApp"));
addCheck("primary UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(uxText));
addCheck("primary UX avoids raw approval decision keys and table names", !/(approvalEvidenceId|runtimeExecutionId|decisionRequestRef|decisionEventRef|decisionEvidenceRef|approvalDecisionRecordKey|decisionPreviewKey|sqliteEntity|recordRef|requestKey|founderApprovalDecision|approval_decision_)/.test(uxText));
addCheck("primary UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now|write approval now|unlock execution now/i.test(uxText));
addCheck("public docs avoid raw approval decision keys and table names", !/(approvalEvidenceId|runtimeExecutionId|decisionRequestRef|decisionEventRef|decisionEvidenceRef|approvalDecisionRecordKey|decisionPreviewKey|sqliteEntity|recordRef|requestKey|founderApprovalDecision|approval_decision_|founder_runtime_approval_decision|approval_decision_requests|approval_decision_events|approval_decision_evidence_refs)/.test(publicDocsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now|write approval now|unlock execution now/i.test(docsBundle));
addCheck(
  "docs and UX do not claim unsafe authority live",
  !hasUnsafePositiveClaim(
    `${docsBundle}\n${uxText}`,
    /approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|hosted DB mutation is enabled|raw SQL is allowed|runtime execution is enabled|runtime execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|runtime writes are enabled/i,
  ),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P119 founder runtime approval decision recording boundary closure.",
        "- Confirms parent P119 and all subphases are complete, reports and scripts exist, Command Center approval decision route safety is retained, and P120 is a planned placeholder.",
        "- Does not enable approval capture, approval persistence, approve/reject decision recording, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P119.7 closes P119 validation only. It does not add Command Center source changes, capture approvals, persist approvals, record approve/reject decisions, write DB/runtime records, run runtime work, unlock execution, call providers/models, dispatch agents, execute workers/tools, create or mutate projects, use hosted DBs, run raw SQL, deploy, release, export, package, use network calls, or spend. P120 is planned-only until its own implementation-grade contract is written.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P119.7 Founder Runtime Approval Decision Recording Boundary Final Report", phase: "P119.7" },
);

printCheckReport("P119.7 Founder Runtime Approval Decision Recording Boundary Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
