import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderLiveAgentDispatchReadinessDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1147-founder-live-agent-dispatch-readiness-report.md";

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

function hasPositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 1] || ""} ${line}`;
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p114-founder-live-agent-dispatch-readiness-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1146Checker = readText("scripts/check-p1146-founder-live-agent-dispatch-readiness.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const dispatchCardSource = extractFunction(pageSource, "FounderLiveAgentDispatchReadinessCard");
const displayModel = buildFounderLiveAgentDispatchReadinessDisplayModel("Build a simple iOS Snake game for the App Store");
const serializedDisplayModel = JSON.stringify(displayModel);
const p1147 = subphaseById.get("P114.7") || {};
const changed = changedFiles();
const allowedFiles = new Set(p1147.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P114.7";
const p114Scripts = [
  "check:p1141-founder-live-agent-dispatch-contract",
  "check:p1142-founder-live-agent-dispatch-readiness",
  "check:p1143-founder-live-agent-dispatch-readiness",
  "check:p1144-founder-live-agent-dispatch-readiness",
  "check:p1145-founder-live-agent-dispatch-readiness",
  "check:p1146-founder-live-agent-dispatch-readiness",
  "check:p1147-founder-live-agent-dispatch-readiness",
];
const p114Reports = [
  "reports/p1141-founder-live-agent-dispatch-contract-report.md",
  "reports/p1142-founder-live-agent-dispatch-readiness-report.md",
  "reports/p1143-founder-live-agent-dispatch-readiness-report.md",
  "reports/p1144-founder-live-agent-dispatch-readiness-report.md",
  "reports/p1145-founder-live-agent-dispatch-readiness-report.md",
  "reports/p1146-founder-live-agent-dispatch-readiness-report.md",
];
const validationCommands = [
  "npm run check:p1147-founder-live-agent-dispatch-readiness",
  "npm run check:p1146-founder-live-agent-dispatch-readiness",
  "npm run check:p1145-founder-live-agent-dispatch-readiness",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Agent dispatch readiness appears only on Business Build and Agent Flow\"",
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
const uxSourceText = `${businessBuildSource}\n${pageSource}`;
const p114ClosedState =
  status.currentPhase === "P114.7"
    && status.previousPhase === "P114.6"
    && status.nextPhase === "P115"
    && roadmap.currentPhase === "P114.7"
    && roadmap.previousPhase === "P114.6"
    && roadmap.nextPhase === "P115"
    && statusById.get("P114")?.status === "complete"
    && roadmapById.get("P114")?.status === "complete"
    && statusById.get("P114.7")?.status === "complete"
    && roadmapById.get("P114.7")?.status === "complete";
const p115StartedState =
  status.currentPhase === "P115.1"
    && status.previousPhase === "P114.7"
    && status.nextPhase === "P115.2"
    && roadmap.currentPhase === "P115.1"
    && roadmap.previousPhase === "P114.7"
    && roadmap.nextPhase === "P115.2"
    && statusById.get("P114")?.status === "complete"
    && roadmapById.get("P114")?.status === "complete"
    && statusById.get("P114.7")?.status === "complete"
    && roadmapById.get("P114.7")?.status === "complete"
    && statusById.get("P115")?.status === "in_progress"
    && roadmapById.get("P115")?.status === "in_progress"
    && statusById.get("P115.1")?.status === "complete"
    && roadmapById.get("P115.1")?.status === "complete";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1147-founder-live-agent-dispatch-readiness"]));
addCheck("all P114 scripts registered", p114Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P114 reports exist and pass", p114Reports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P114 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("contract handoff points to P115", contract.currentSubphase === "P114.7" && contract.previousSubphase === "P114.6" && contract.nextSubphase === "P115");
addCheck("P114.7 records final validation commands", validationCommands.every((command) => p1147.validationCommands?.includes(command)));
addCheck("P114.7 avoids forbidden file scope", !(p1147.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck(
  "changed files stay in P114.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck("changed files avoid forbidden scope", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("P114.6 checker accepts final handoff", p1146Checker.includes("P115") && p1146Checker.includes("P114.7") && p1146Checker.includes("scope check relaxed"));
addCheck("OS status checker accepts P115 handoff", osStatusChecker.includes('"P115"') && osStatusChecker.includes('phaseStatus.nextPhase === "P115"'));
addCheck("phase status closed or P115 started", p114ClosedState || p115StartedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("phase commits recorded", [statusById.get("P114")?.commit, statusById.get("P114.7")?.commit, roadmapById.get("P114")?.commit, roadmapById.get("P114.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P114")?.commandCenterVisible === true && statusById.get("P114.7")?.commandCenterVisible === true);
addCheck("P114 plan records final validation", /P114\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P114 is complete/.test(plan) && /P115/.test(plan));
addCheck("platform roadmap records P114 complete", /P114\.7 is complete/.test(platformRoadmap) && /P114 is complete/.test(platformRoadmap) && /P115/.test(platformRoadmap));
addCheck("README records P114 complete", /P114\.7 final validation/.test(readme) && /P114 is complete/.test(readme) && /P115/.test(readme));
addCheck("dashboard uses browser-safe dispatch display model", businessBuildSource.includes("buildFounderLiveAgentDispatchReadinessDisplayModel") && businessBuildSource.includes("reports/p1144-founder-live-agent-dispatch-readiness-report.md"));
addCheck("Command Center dispatch card retained", dispatchCardSource.includes("aria-label=\"Founder agent dispatch readiness\"") && dispatchCardSource.includes("Dispatch candidates") && dispatchCardSource.includes("Blocked candidates"));
addCheck("Command Center dispatch surfaces remain scoped", pageSource.includes("Business Build Agent Dispatch Readiness") && pageSource.includes("Agent Flow Agent Dispatch Readiness") && !pageSource.includes("Lite Agent Dispatch Readiness") && !pageSource.includes("Chat Agent Dispatch Readiness") && !pageSource.includes("Live Readiness Agent Dispatch Readiness"));
addCheck("route coverage retained", routeTests.includes("Agent dispatch readiness appears only on Business Build and Agent Flow") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness"));
addCheck("display model remains useful", displayModel.currentState && displayModel.previewMode && displayModel.candidateCount === 3 && displayModel.dispatchRows?.every((row) => row.proposedDispatchLane && row.nextAction && row.blocker));
addCheck("display model keeps unsafe authority blocked", displayModel.writableCandidateCount === 0 && displayModel.dispatchableCandidateCount === 0 && displayModel.executableCandidateCount === 0 && displayModel.projectMutationCandidateCount === 0 && displayModel.hostedDbMutationCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0);
addCheck("DemoApp not exposed in Command Center source", !pageSource.includes("DemoApp"));
addCheck("primary UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[a-z0-9][a-z0-9_-]*\d[a-z0-9_-]*/.test(`${dispatchCardSource}\n${serializedDisplayModel}`));
addCheck("primary UX avoids raw dispatch keys and table names", !/(dispatchId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_agent_dispatch_readiness_|founder_agent_work_assignments|founder_agent_work_queue)/.test(`${dispatchCardSource}\n${serializedDisplayModel}`));
addCheck("primary UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write dispatch now/i.test(`${dispatchCardSource}\n${serializedDisplayModel}`));
addCheck("public docs avoid raw dispatch keys and table names", !/(dispatchId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_agent_dispatch_readiness_|founder_agent_work_assignments|founder_agent_work_queue)/.test(publicDocsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write dispatch now/i.test(docsBundle));
addCheck(
  "docs and UX do not claim unsafe authority live",
  !hasPositiveClaim(
    `${docsBundle}\n${uxSourceText}`,
    /hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|dispatch writes are enabled/i,
  ),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P114 founder live agent dispatch readiness closure.",
        "- Confirms parent P114 and all subphases are complete, reports and scripts exist, Command Center dispatch readiness route safety is retained, and the P115 handoff placeholder is valid.",
        "- Does not enable dispatch writes, hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P114.7 closes P114 validation only. It does not add Command Center source changes, dispatch writes, hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend. P115 remains a handoff placeholder until its own implementation-grade contract is written.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P114.7 Founder Live Agent Dispatch Readiness Final Report", phase: "P114.7" },
);

printCheckReport("P114.7 Founder Live Agent Dispatch Readiness Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
