import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalCaptureBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1187-founder-runtime-approval-capture-boundary-report.md";

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
const contract = readJson("contracts/os-roadmap/p118-founder-runtime-approval-capture-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P118_FOUNDER_RUNTIME_APPROVAL_CAPTURE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1186Checker = readText("scripts/check-p1186-founder-runtime-approval-capture-boundary.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const approvalCaptureCardSource = extractFunction(pageSource, "FounderApprovalCaptureBoundaryCard");
const displayModel = buildFounderApprovalCaptureBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedDisplayModel = JSON.stringify(displayModel);
const p1187 = subphaseById.get("P118.7") || {};
const changed = changedFiles();
const allowedFiles = new Set(p1187.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P118.7";

const p118Scripts = [
  "check:p1181-founder-runtime-approval-capture-boundary-contract",
  "check:p1182-founder-runtime-approval-capture-boundary",
  "check:p1183-founder-runtime-approval-capture-boundary",
  "check:p1184-founder-runtime-approval-capture-boundary",
  "check:p1185-founder-runtime-approval-capture-boundary",
  "check:p1186-founder-runtime-approval-capture-boundary",
  "check:p1187-founder-runtime-approval-capture-boundary",
];
const p118Reports = [
  "reports/p1181-founder-runtime-approval-capture-boundary-contract-report.md",
  "reports/p1182-founder-runtime-approval-capture-boundary-report.md",
  "reports/p1183-founder-runtime-approval-capture-boundary-report.md",
  "reports/p1184-founder-runtime-approval-capture-boundary-report.md",
  "reports/p1185-founder-runtime-approval-capture-boundary-report.md",
  "reports/p1186-founder-runtime-approval-capture-boundary-report.md",
];
const validationCommands = [
  "npm run check:p1187-founder-runtime-approval-capture-boundary",
  "npm run check:p1186-founder-runtime-approval-capture-boundary",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Approval capture boundary appears only on scoped pages\"",
  "cd dashboard && npm run build",
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
const uxText = `${approvalCaptureCardSource}\n${serializedDisplayModel}`;

const p118ClosedState =
  status.currentPhase === "P118.7"
    && status.previousPhase === "P118.6"
    && status.nextPhase === "P119"
    && roadmap.currentPhase === "P118.7"
    && roadmap.previousPhase === "P118.6"
    && roadmap.nextPhase === "P119"
    && statusById.get("P118")?.status === "complete"
    && roadmapById.get("P118")?.status === "complete"
    && statusById.get("P118.7")?.status === "complete"
    && roadmapById.get("P118.7")?.status === "complete"
    && statusById.get("P119")?.status === "planned"
    && roadmapById.get("P119")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1187-founder-runtime-approval-capture-boundary"]));
addCheck("all P118 scripts registered", p118Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P118 reports exist and pass", p118Reports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P118 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("contract handoff points to P119", contract.currentSubphase === "P118.7" && contract.previousSubphase === "P118.6" && contract.nextSubphase === "P119");
addCheck("P118.7 records final validation commands", validationCommands.every((command) => p1187.validationCommands?.includes(command)));
addCheck("P118.7 avoids forbidden file scope", !(p1187.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck(
  "changed files stay in P118.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck("changed files avoid forbidden scope", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("P118.6 checker accepts final handoff", p1186Checker.includes("p1187HandoffState") && p1186Checker.includes("P119"));
addCheck("OS status checker can resolve P119 handoff", osStatusChecker.includes('"P119"') && statusById.has("P119") && roadmapById.has("P119"));
addCheck("phase status closed and handed off", p118ClosedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("phase commits recorded", [statusById.get("P118")?.commit, statusById.get("P118.7")?.commit, roadmapById.get("P118")?.commit, roadmapById.get("P118.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P118")?.commandCenterVisible === true && statusById.get("P118.7")?.commandCenterVisible === true);
addCheck("P119 placeholder is controlled", statusById.get("P119")?.status === "planned" && roadmapById.get("P119")?.status === "planned" && statusById.get("P119")?.checksRun?.length === 0 && roadmapById.get("P119")?.checksRun?.length === 0);
addCheck("P118 plan records final validation", /P118\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P118 is complete/.test(plan) && /P119/.test(plan));
addCheck("platform roadmap records P118 complete", /P118\.7 is complete/.test(platformRoadmap) && /P118 is complete/.test(platformRoadmap) && /P119/.test(platformRoadmap));
addCheck("README records P118 complete", /P118\.7 final validation/i.test(readme) && /P118 is complete/.test(readme) && /P119/.test(readme));
addCheck("dashboard uses browser-safe approval capture display model", businessBuildSource.includes("buildFounderApprovalCaptureBoundaryDisplayModel") && businessBuildSource.includes("Approval capture safe dry-run report"));
addCheck("Command Center approval capture card retained", approvalCaptureCardSource.includes("aria-label=\"Founder runtime approval capture boundary\"") && approvalCaptureCardSource.includes("Capturable candidates") && approvalCaptureCardSource.includes("Blocked rows"));
addCheck("Command Center approval capture surfaces remain scoped", pageSource.includes("Business Build Runtime Approval Capture Boundary") && pageSource.includes("Agent Flow Runtime Approval Capture Boundary") && !pageSource.includes("Lite Runtime Approval Capture Boundary") && !pageSource.includes("Chat Runtime Approval Capture Boundary") && !pageSource.includes("Live Readiness Runtime Approval Capture Boundary"));
addCheck("route coverage retained", routeTests.includes("Approval capture boundary appears only on scoped pages") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness"));
addCheck("display model remains useful", displayModel.currentState && displayModel.previewMode && displayModel.readinessRowCount === 3 && displayModel.readinessRows?.every((row) => row.label && row.nextAction && row.blocker));
addCheck("display model keeps unsafe authority blocked", displayModel.capturableCandidateCount === 0 && displayModel.persistableCandidateCount === 0 && displayModel.decisionRecordableCandidateCount === 0 && displayModel.dbWritableCandidateCount === 0 && displayModel.runtimeExecutableCandidateCount === 0 && displayModel.executionUnlockCandidateCount === 0 && displayModel.agentDispatchCandidateCount === 0 && displayModel.projectMutationCandidateCount === 0 && displayModel.hostedDbMutationCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0);
addCheck("DemoApp not exposed in Command Center source", !pageSource.includes("DemoApp"));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("primary UX avoids raw approval capture keys and table names", !/(approvalEvidenceId|runtimeExecutionId|runtimeAdmissionId|dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|captureRequestRef|captureEventRef|captureEvidenceRef|founderApprovalCapture|approval_capture_)/.test(uxText));
addCheck("primary UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|admit now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now|write approval now|unlock execution now/i.test(uxText));
addCheck("public docs avoid raw approval capture keys and table names", !/(approvalEvidenceId|runtimeExecutionId|runtimeAdmissionId|dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|captureRequestRef|captureEventRef|captureEvidenceRef|founderApprovalCapture|approval_capture_)/.test(publicDocsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|admit now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now|write approval now|unlock execution now/i.test(docsBundle));
addCheck(
  "docs and UX do not claim unsafe authority live",
  !hasUnsafePositiveClaim(
    `${docsBundle}\n${uxText}`,
    /approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|hosted DB mutation is enabled|raw SQL is allowed|runtime execution is enabled|runtime execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|runtime writes are enabled/i,
  ),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P118 founder runtime approval capture boundary closure.",
        "- Confirms parent P118 and all subphases are complete, reports and scripts exist, Command Center approval capture route safety is retained, and P119 is a planned placeholder.",
        "- Does not enable approval capture, approval persistence, approval decision recording, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P118.7 closes P118 validation only. It does not add Command Center source changes, capture approvals, persist approvals, record approve/reject decisions, write DB/runtime records, run runtime work, unlock execution, call providers/models, dispatch agents, execute workers/tools, create or mutate projects, use hosted DBs, run raw SQL, deploy, release, export, package, use network calls, or spend. P119 is planned-only until its own implementation-grade contract is written.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P118.7 Founder Runtime Approval Capture Boundary Final Report", phase: "P118.7" },
);

printCheckReport("P118.7 Founder Runtime Approval Capture Boundary Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
