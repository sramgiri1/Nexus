import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderRuntimeExecutionApprovalGateDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1177-founder-runtime-execution-approval-gate-report.md";

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
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|validation-only|final-validation|planned-only|read-only)\b/i.test(context);
  });
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
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1176Checker = readText("scripts/check-p1176-founder-runtime-execution-approval-gate.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const approvalGateCardSource = extractFunction(pageSource, "FounderRuntimeExecutionApprovalGateCard");
const displayModel = buildFounderRuntimeExecutionApprovalGateDisplayModel("Build a simple iOS Snake game for the App Store");
const serializedDisplayModel = JSON.stringify(displayModel);
const p1177 = subphaseById.get("P117.7") || {};
const changed = changedFiles();
const allowedFiles = new Set(p1177.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P117.7";

const p117Scripts = [
  "check:p1171-founder-runtime-execution-approval-gate-contract",
  "check:p1172-founder-runtime-execution-approval-gate",
  "check:p1173-founder-runtime-execution-approval-gate",
  "check:p1174-founder-runtime-execution-approval-gate",
  "check:p1175-founder-runtime-execution-approval-gate",
  "check:p1176-founder-runtime-execution-approval-gate",
  "check:p1177-founder-runtime-execution-approval-gate",
];
const p117Reports = [
  "reports/p1171-founder-runtime-execution-approval-gate-contract-report.md",
  "reports/p1172-founder-runtime-execution-approval-gate-report.md",
  "reports/p1173-founder-runtime-execution-approval-gate-report.md",
  "reports/p1174-founder-runtime-execution-approval-gate-report.md",
  "reports/p1175-founder-runtime-execution-approval-gate-report.md",
  "reports/p1176-founder-runtime-execution-approval-gate-report.md",
];
const validationCommands = [
  "npm run check:p1177-founder-runtime-execution-approval-gate",
  "npm run check:p1176-founder-runtime-execution-approval-gate",
  "npm run check:p1175-founder-runtime-execution-approval-gate",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Runtime execution approval gate appears only on Business Build and Agent Flow\"",
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
const uxText = `${approvalGateCardSource}\n${serializedDisplayModel}`;

const p117ClosedState =
  status.currentPhase === "P117.7"
    && status.previousPhase === "P117.6"
    && status.nextPhase === "P118"
    && roadmap.currentPhase === "P117.7"
    && roadmap.previousPhase === "P117.6"
    && roadmap.nextPhase === "P118"
    && statusById.get("P117")?.status === "complete"
    && roadmapById.get("P117")?.status === "complete"
    && statusById.get("P117.7")?.status === "complete"
    && roadmapById.get("P117.7")?.status === "complete"
    && statusById.get("P118")?.status === "planned"
    && roadmapById.get("P118")?.status === "planned";
const p1181StartedState =
  status.currentPhase === "P118.1"
    && status.previousPhase === "P117.7"
    && status.nextPhase === "P118.2"
    && roadmap.currentPhase === "P118.1"
    && roadmap.previousPhase === "P117.7"
    && roadmap.nextPhase === "P118.2"
    && statusById.get("P117")?.status === "complete"
    && roadmapById.get("P117")?.status === "complete"
    && statusById.get("P117.7")?.status === "complete"
    && roadmapById.get("P117.7")?.status === "complete"
    && statusById.get("P118")?.status === "in_progress"
    && roadmapById.get("P118")?.status === "in_progress"
    && statusById.get("P118.1")?.status === "complete"
    && roadmapById.get("P118.1")?.status === "complete"
    && statusById.get("P118.2")?.status === "planned"
    && roadmapById.get("P118.2")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1177-founder-runtime-execution-approval-gate"]));
addCheck("all P117 scripts registered", p117Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P117 reports exist and pass", p117Reports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P117 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("contract handoff points to P118", contract.currentSubphase === "P117.7" && contract.previousSubphase === "P117.6" && contract.nextSubphase === "P118");
addCheck("P117.7 records final validation commands", validationCommands.every((command) => p1177.validationCommands?.includes(command)));
addCheck("P117.7 avoids forbidden file scope", !(p1177.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck(
  "changed files stay in P117.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck("changed files avoid forbidden scope", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("P117.6 checker accepts final handoff", p1176Checker.includes("p1177HandoffState") && p1176Checker.includes("P118"));
addCheck("OS status checker can resolve P118 handoff", osStatusChecker.includes('"P118"') && statusById.has("P118") && roadmapById.has("P118"));
addCheck("phase status closed or handed off", p117ClosedState || p1181StartedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("phase commits recorded", [statusById.get("P117")?.commit, statusById.get("P117.7")?.commit, roadmapById.get("P117")?.commit, roadmapById.get("P117.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P117")?.commandCenterVisible === true && statusById.get("P117.7")?.commandCenterVisible === true);
addCheck(
  "P118 handoff is controlled",
  (statusById.get("P118")?.status === "planned"
      && roadmapById.get("P118")?.status === "planned"
      && statusById.get("P118")?.checksRun?.length === 0
      && roadmapById.get("P118")?.checksRun?.length === 0)
    || (statusById.get("P118")?.status === "in_progress"
      && roadmapById.get("P118")?.status === "in_progress"
      && statusById.get("P118.1")?.status === "complete"
      && roadmapById.get("P118.1")?.status === "complete"
      && statusById.get("P118.2")?.status === "planned"
      && roadmapById.get("P118.2")?.status === "planned"),
);
addCheck("P117 plan records final validation", /P117\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P117 is complete/.test(plan) && /P118/.test(plan));
addCheck("platform roadmap records P117 complete", /P117\.7 is complete/.test(platformRoadmap) && /P117 is complete/.test(platformRoadmap) && /P118/.test(platformRoadmap));
addCheck("README records P117 complete", /P117\.7 final validation/.test(readme) && /P117 is complete/.test(readme) && /P118/.test(readme));
addCheck("dashboard uses browser-safe approval gate display model", businessBuildSource.includes("buildFounderRuntimeExecutionApprovalGateDisplayModel") && businessBuildSource.includes("Runtime execution approval gate preview report"));
addCheck("Command Center approval gate card retained", approvalGateCardSource.includes("aria-label=\"Runtime execution approval gate\"") && approvalGateCardSource.includes("Approval candidates") && approvalGateCardSource.includes("Blocked candidates"));
addCheck("Command Center approval gate surfaces remain scoped", pageSource.includes("Business Build Runtime Execution Approval Gate") && pageSource.includes("Agent Flow Runtime Execution Approval Gate") && !pageSource.includes("Lite Runtime Execution Approval Gate") && !pageSource.includes("Chat Runtime Execution Approval Gate") && !pageSource.includes("Live Readiness Runtime Execution Approval Gate"));
addCheck("route coverage retained", routeTests.includes("Runtime execution approval gate appears only on Business Build and Agent Flow") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness"));
addCheck("display model remains useful", displayModel.currentState && displayModel.previewMode && displayModel.candidateCount === 3 && displayModel.approvalGateRows?.every((row) => row.proposedApprovalLane && row.nextAction && row.blocker));
addCheck("display model keeps unsafe authority blocked", displayModel.writableCandidateCount === 0 && displayModel.persistedCandidateCount === 0 && displayModel.approvalCaptureCandidateCount === 0 && displayModel.approvalPersistenceCandidateCount === 0 && displayModel.executableCandidateCount === 0 && displayModel.executionUnlockCandidateCount === 0 && displayModel.projectMutationCandidateCount === 0 && displayModel.hostedDbMutationCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0);
addCheck("DemoApp not exposed in Command Center source", !pageSource.includes("DemoApp"));
addCheck("primary UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(uxText));
addCheck("primary UX avoids raw approval/runtime keys and table names", !/(approvalEvidenceId|runtimeExecutionId|runtimeAdmissionId|dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_runtime_execution_approval_|founder_runtime_execution_readiness_)/.test(uxText));
addCheck("primary UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|admit now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now|unlock execution now/i.test(uxText));
addCheck("public docs avoid raw approval/runtime keys and table names", !/(approvalEvidenceId|runtimeExecutionId|runtimeAdmissionId|dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_runtime_execution_approval_|founder_runtime_execution_readiness_)/.test(publicDocsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|admit now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now|unlock execution now/i.test(docsBundle));
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
        "- Validates final P117 founder runtime execution approval gate closure.",
        "- Confirms parent P117 and all subphases are complete, reports and scripts exist, Command Center approval gate route safety is retained, and P118 is a planned placeholder.",
        "- Does not enable approval capture, approval persistence, approval decision recording, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P117.7 closes P117 validation only. It does not add Command Center source changes, write approval evidence records, capture approvals, persist decisions, record approve/reject decisions, run runtime work, unlock execution, call providers/models, dispatch agents, execute workers/tools, create or mutate projects, use hosted DBs, run raw SQL, deploy, release, export, package, use network calls, or spend. P118 is planned-only until its own implementation-grade contract is written.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P117.7 Founder Runtime Execution Approval Gate Final Report", phase: "P117.7" },
);

printCheckReport("P117.7 Founder Runtime Execution Approval Gate Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
