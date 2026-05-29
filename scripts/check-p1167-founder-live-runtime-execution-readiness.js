import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderLiveRuntimeExecutionReadinessDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1167-founder-live-runtime-execution-readiness-report.md";

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
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|validation-only|final-validation|planned-only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p116-founder-live-runtime-execution-readiness-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P116_FOUNDER_LIVE_RUNTIME_EXECUTION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1166Checker = readText("scripts/check-p1166-founder-live-runtime-execution-readiness.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const runtimeExecutionCardSource = extractFunction(pageSource, "FounderLiveRuntimeExecutionReadinessCard");
const displayModel = buildFounderLiveRuntimeExecutionReadinessDisplayModel("Build a simple iOS Snake game for the App Store");
const serializedDisplayModel = JSON.stringify(displayModel);
const p1167 = subphaseById.get("P116.7") || {};
const changed = changedFiles();
const allowedFiles = new Set(p1167.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P116.7";

const p116Scripts = [
  "check:p1161-founder-live-runtime-execution-contract",
  "check:p1162-founder-live-runtime-execution-readiness",
  "check:p1163-founder-live-runtime-execution-readiness",
  "check:p1164-founder-live-runtime-execution-readiness",
  "check:p1165-founder-live-runtime-execution-readiness",
  "check:p1166-founder-live-runtime-execution-readiness",
  "check:p1167-founder-live-runtime-execution-readiness",
];
const p116Reports = [
  "reports/p1161-founder-live-runtime-execution-contract-report.md",
  "reports/p1162-founder-live-runtime-execution-readiness-report.md",
  "reports/p1163-founder-live-runtime-execution-readiness-report.md",
  "reports/p1164-founder-live-runtime-execution-readiness-report.md",
  "reports/p1165-founder-live-runtime-execution-readiness-report.md",
  "reports/p1166-founder-live-runtime-execution-readiness-report.md",
];
const validationCommands = [
  "npm run check:p1167-founder-live-runtime-execution-readiness",
  "npm run check:p1166-founder-live-runtime-execution-readiness",
  "npm run check:p1165-founder-live-runtime-execution-readiness",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Runtime execution readiness appears only on Business Build and Agent Flow\"",
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
const uxText = `${runtimeExecutionCardSource}\n${serializedDisplayModel}`;

const p116ClosedState =
  status.currentPhase === "P116.7"
    && status.previousPhase === "P116.6"
    && status.nextPhase === "P117"
    && roadmap.currentPhase === "P116.7"
    && roadmap.previousPhase === "P116.6"
    && roadmap.nextPhase === "P117"
    && statusById.get("P116")?.status === "complete"
    && roadmapById.get("P116")?.status === "complete"
    && statusById.get("P116.7")?.status === "complete"
    && roadmapById.get("P116.7")?.status === "complete"
    && statusById.get("P117")?.status === "planned"
    && roadmapById.get("P117")?.status === "planned";
const p117StartedState =
  status.currentPhase === "P117.1"
    && status.previousPhase === "P116.7"
    && status.nextPhase === "P117.2"
    && roadmap.currentPhase === "P117.1"
    && roadmap.previousPhase === "P116.7"
    && roadmap.nextPhase === "P117.2"
    && statusById.get("P116")?.status === "complete"
    && roadmapById.get("P116")?.status === "complete"
    && statusById.get("P116.7")?.status === "complete"
    && roadmapById.get("P116.7")?.status === "complete"
    && statusById.get("P117")?.status === "in_progress"
    && roadmapById.get("P117")?.status === "in_progress"
    && statusById.get("P117.1")?.status === "complete"
    && roadmapById.get("P117.1")?.status === "complete";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1167-founder-live-runtime-execution-readiness"]));
addCheck("all P116 scripts registered", p116Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P116 reports exist and pass", p116Reports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P116 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("contract handoff points to P117", contract.currentSubphase === "P116.7" && contract.previousSubphase === "P116.6" && contract.nextSubphase === "P117");
addCheck("P116.7 records final validation commands", validationCommands.every((command) => p1167.validationCommands?.includes(command)));
addCheck("P116.7 avoids forbidden file scope", !(p1167.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck(
  "changed files stay in P116.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck("changed files avoid forbidden scope", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("P116.6 checker accepts final handoff", p1166Checker.includes("P116.7") && p1166Checker.includes("P117") && p1166Checker.includes("p1167HandoffState"));
addCheck("OS status checker can resolve P117 handoff", osStatusChecker.includes('"P117"') && statusById.has("P117") && roadmapById.has("P117"));
addCheck("phase status closed or P117 started", p116ClosedState || p117StartedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("phase commits recorded", [statusById.get("P116")?.commit, statusById.get("P116.7")?.commit, roadmapById.get("P116")?.commit, roadmapById.get("P116.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P116")?.commandCenterVisible === true && statusById.get("P116.7")?.commandCenterVisible === true);
addCheck(
  "P117 placeholder or P117.1 start is controlled",
  (statusById.get("P117")?.status === "planned" && roadmapById.get("P117")?.status === "planned" && statusById.get("P117")?.checksRun?.length === 0 && roadmapById.get("P117")?.checksRun?.length === 0)
    || p117StartedState,
);
addCheck("P116 plan records final validation", /P116\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P116 is complete/.test(plan) && /P117/.test(plan));
addCheck("platform roadmap records P116 complete", /P116\.7 is complete/.test(platformRoadmap) && /P116 is complete/.test(platformRoadmap) && /P117/.test(platformRoadmap));
addCheck("README records P116 complete", /P116\.7 final validation/.test(readme) && /P116 is complete/.test(readme) && /P117/.test(readme));
addCheck("dashboard uses browser-safe runtime execution display model", businessBuildSource.includes("buildFounderLiveRuntimeExecutionReadinessDisplayModel") && businessBuildSource.includes("reports/p1164-founder-live-runtime-execution-readiness-report.md"));
addCheck("Command Center runtime execution card retained", runtimeExecutionCardSource.includes("aria-label=\"Founder runtime execution readiness\"") && runtimeExecutionCardSource.includes("Execution candidates") && runtimeExecutionCardSource.includes("Blocked candidates"));
addCheck("Command Center runtime execution surfaces remain scoped", pageSource.includes("Business Build Runtime Execution Readiness") && pageSource.includes("Agent Flow Runtime Execution Readiness") && !pageSource.includes("Lite Runtime Execution Readiness") && !pageSource.includes("Chat Runtime Execution Readiness") && !pageSource.includes("Live Readiness Runtime Execution Readiness"));
addCheck("route coverage retained", routeTests.includes("Runtime execution readiness appears only on Business Build and Agent Flow") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness"));
addCheck("display model remains useful", displayModel.currentState && displayModel.previewMode && displayModel.candidateCount === 3 && displayModel.runtimeExecutionRows?.every((row) => row.proposedExecutionLane && row.nextAction && row.blocker));
addCheck("display model keeps unsafe authority blocked", displayModel.writableCandidateCount === 0 && displayModel.persistedCandidateCount === 0 && displayModel.executableCandidateCount === 0 && displayModel.dispatchableCandidateCount === 0 && displayModel.projectMutationCandidateCount === 0 && displayModel.hostedDbMutationCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0);
addCheck("DemoApp not exposed in Command Center source", !pageSource.includes("DemoApp"));
addCheck("primary UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(uxText));
addCheck("primary UX avoids raw runtime execution keys and table names", !/(runtimeExecutionId|runtimeAdmissionId|dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_runtime_execution_readiness_items|founder_runtime_execution_events|founder_runtime_execution_evidence_refs)/.test(uxText));
addCheck("primary UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|admit now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now|unlock execution now/i.test(uxText));
addCheck("public docs avoid raw runtime execution keys and table names", !/(runtimeExecutionId|runtimeAdmissionId|dispatchReadinessId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_runtime_execution_readiness_items|founder_runtime_execution_events|founder_runtime_execution_evidence_refs)/.test(publicDocsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|admit now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now|unlock execution now/i.test(docsBundle));
addCheck(
  "docs and UX do not claim unsafe authority live",
  !hasUnsafePositiveClaim(
    `${docsBundle}\n${uxText}`,
    /hosted DB mutation is enabled|raw SQL is allowed|runtime execution is enabled|runtime execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|runtime writes are enabled/i,
  ),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P116 founder live runtime execution readiness closure.",
        "- Confirms parent P116 and all subphases are complete, reports and scripts exist, Command Center runtime execution readiness route safety is retained, and P117 is a planned placeholder.",
        "- Does not enable runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P116.7 closes P116 validation only. It does not add Command Center source changes, write runtime execution records, run runtime work, unlock execution, call providers/models, dispatch agents, execute workers/tools, create or mutate projects, use hosted DBs, run raw SQL, deploy, release, export, package, use network calls, or spend. P117 is a planned placeholder until its own implementation-grade contract is written.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P116.7 Founder Live Runtime Execution Readiness Final Report", phase: "P116.7" },
);

printCheckReport("P116.7 Founder Live Runtime Execution Readiness Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
