import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildAgentWorkOrderDispatchDryRun,
  buildAgentWorkOrderRuntimeModel,
  validateAgentWorkOrderDispatchDryRun,
  validateAgentWorkOrderRuntimeModel,
} from "../shared/agentWorkOrderRuntimeModel.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1375-agent-work-order-runtime-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p137-agent-work-order-runtime-contracts.json";
const PLAN_PATH = "docs/architecture/P137_AGENT_WORK_ORDER_RUNTIME_PLAN.md";
const TEST_PATH = "dashboard/tests/routes.spec.js";
const REQUIRED_SCRIPT = "check:p1375-agent-work-order-runtime";
const P1376_SCRIPT = "check:p1376-agent-work-order-runtime";
const P1377_SCRIPT = "check:p1377-agent-work-order-runtime";
const EXPECTED_BASE_COMMIT = "93d208f2";
const ROUTE_TEST = "Agent Flow agent work order runtime shows display-safe dry run";
const VALIDATION_COMMANDS = [
  "npm run check:p1375-agent-work-order-runtime",
  "npm run check:p1374-agent-work-order-runtime",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function reportPassed(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) return false;
  return /## Result[\s\S]*PASS/i.test(readText(relativePath));
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|display-safe|dry-run|dry run|read-only|checker|checkers|coverage|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|zero-spend|local planning)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson(CONTRACT_PATH);
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1375 = subphaseById.get("P137.5") || {};
const p1376 = subphaseById.get("P137.6") || {};
const checkerSource = readText("scripts/check-p1375-agent-work-order-runtime.js");
const p1374Checker = readText("scripts/check-p1374-agent-work-order-runtime.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const testSource = readText(TEST_PATH);
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const allowedFiles = new Set(p1375.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
  "db/",
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

const founderIdea = "Build a simple iOS Snake game for the App Store";
const runtimeModel = buildAgentWorkOrderRuntimeModel({ founderIdeaSummary: founderIdea });
const runtimeValidation = validateAgentWorkOrderRuntimeModel(runtimeModel);
const dispatchDryRun = buildAgentWorkOrderDispatchDryRun({ founderIdeaSummary: founderIdea });
const dryRunValidation = validateAgentWorkOrderDispatchDryRun(dispatchDryRun);
const businessBuild = buildBusinessBuildViewModel(founderIdea);
const runtimeDisplay = businessBuild.agentWorkOrderRuntime || {};
const serializedDisplay = JSON.stringify(runtimeDisplay);
const p1375CurrentState =
  status.currentPhase === "P137.5"
  && status.previousPhase === "P137.4"
  && status.nextPhase === "P137.6"
  && roadmap.currentPhase === "P137.5"
  && roadmap.previousPhase === "P137.4"
  && roadmap.nextPhase === "P137.6"
  && status.current?.phaseId === "P137.5"
  && status.previous?.phaseId === "P137.4"
  && status.next?.phaseId === "P137.6"
  && roadmap.current?.phaseId === "P137.5"
  && roadmap.previous?.phaseId === "P137.4"
  && roadmap.next?.phaseId === "P137.6"
  && statusById.get("P137")?.status === "in_progress"
  && roadmapById.get("P137")?.status === "in_progress"
  && ["P137.1", "P137.2", "P137.3", "P137.4", "P137.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P137.6")?.status === "planned"
  && roadmapById.get("P137.6")?.status === "planned";
const p1376CurrentState =
  status.currentPhase === "P137.6"
  && status.previousPhase === "P137.5"
  && status.nextPhase === "P137.7"
  && roadmap.currentPhase === "P137.6"
  && roadmap.previousPhase === "P137.5"
  && roadmap.nextPhase === "P137.7"
  && statusById.get("P137")?.status === "in_progress"
  && roadmapById.get("P137")?.status === "in_progress"
  && ["P137.1", "P137.2", "P137.3", "P137.4", "P137.5", "P137.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P137.7")?.status === "planned"
  && roadmapById.get("P137.7")?.status === "planned";
const p1377FinalState =
  status.currentPhase === "P137.7"
  && status.previousPhase === "P137.6"
  && status.nextPhase === "P138"
  && roadmap.currentPhase === "P137.7"
  && roadmap.previousPhase === "P137.6"
  && roadmap.nextPhase === "P138"
  && statusById.get("P137")?.status === "complete"
  && roadmapById.get("P137")?.status === "complete"
  && ["P137.1", "P137.2", "P137.3", "P137.4", "P137.5", "P137.6", "P137.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P138")?.status === "planned"
  && roadmapById.get("P138")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("P137.2 runtime model validates", runtimeValidation.valid, runtimeValidation.errors.join("; "));
addCheck("P137.2 packets stay scoped", runtimeModel.workOrderPackets?.length >= 5 && runtimeModel.runtimeOwnsFullRegistries === true && runtimeModel.fullToolRegistryLoaded === false && runtimeModel.fullMcpSchemaRegistryLoaded === false && runtimeModel.fullMemoryLoaded === false);
addCheck("P137.3 dispatch dry run validates", dryRunValidation.valid, dryRunValidation.errors.join("; "));
addCheck("P137.3 dry run remains non-runnable", dispatchDryRun.nonRunnable === true && dispatchDryRun.localOnly === true && Object.values(dispatchDryRun.candidateCounts || {}).every((value) => value === 0));
addCheck("P137.4 Agent Flow display remains useful", runtimeDisplay.lanes?.length >= 5 && runtimeDisplay.gateRows?.length >= 5 && runtimeDisplay.safetyRows?.some((row) => row.label === "Agent dispatch" && row.value === "Blocked"));
addCheck("P137.4 display remains zero-spend and blocked", runtimeDisplay.dispatchableCandidateCount === 0 && runtimeDisplay.executableCandidateCount === 0 && runtimeDisplay.costImpact?.includes("Zero-spend local planning"));
addCheck("prior P137 reports pass", [
  "reports/p1371-agent-work-order-runtime-report.md",
  "reports/p1372-agent-work-order-runtime-report.md",
  "reports/p1373-agent-work-order-runtime-report.md",
  "reports/p1374-agent-work-order-runtime-report.md",
].every((reportPath) => reportPassed(reportPath)));
addCheck("P137.4 Agent Flow Playwright regression exists", testSource.includes(ROUTE_TEST) && testSource.includes('page.getByLabel("Agent work order runtime")'));
addCheck("route-wide safety assertions retained", testSource.includes("Command Center route-wide UX") && testSource.includes("DemoApp") && testSource.includes("raw JSON") && testSource.includes("private-project") && testSource.includes("dispatch agent now"));
addCheck("route-wide theme assertions retained", ["Use system theme", "Use dark theme", "Use light theme", "dark", "light", "system"].every((text) => testSource.includes(text)));
addCheck("P137.4 checker accepts P137.5 handoff", p1374Checker.includes("p1375CurrentState") && p1374Checker.includes('status.currentPhase === "P137.5"') && p1374Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P137.5", enterpriseChecker.includes("p1375CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P137.6 handoff", ["P137.4", "P137.5", "P137.6"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("contract marks P137.5 complete", p1375.status === "complete" && ((contract.currentSubphase === "P137.5" && contract.previousSubphase === "P137.4" && contract.nextSubphase === "P137.6" && p1376.status === "planned") || (p1376CurrentState && contract.currentSubphase === "P137.6" && p1376.status === "complete") || (p1377FinalState && contract.status === "complete")));
addCheck("P137.6 checker registered when handed off", !p1376CurrentState || Boolean(packageJson.scripts?.[P1376_SCRIPT]));
addCheck("P137.7 checker registered when handed off", !p1377FinalState || Boolean(packageJson.scripts?.[P1377_SCRIPT]));
addCheck("P137.5 records expected base commit", p1375.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("P137.5 allowed files include checker handoff and report", ["scripts/check-p1375-agent-work-order-runtime.js", "scripts/check-p1374-agent-work-order-runtime.js", REPORT_PATH].every((file) => p1375.allowedFiles?.includes(file)));
addCheck("P137.5 forbids project dashboard db runtime provider tool paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1375.forbiddenFiles?.includes(path)));
addCheck("P137.5 records validation commands", VALIDATION_COMMANDS.every((command) => p1375.validationCommands?.includes(command)));
addCheck("docs record P137.5", /### P137\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan) && /P137\.5 agent work order runtime tests\/checkers/i.test(readme) && /P137\.5 agent work order runtime tests\/checkers is complete/i.test(platformRoadmap) && /P137\.5 is now complete/i.test(enterpriseRoadmap));
addCheck("phase status starts or safely hands off P137.5", p1375CurrentState || p1376CurrentState || p1377FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P137.5 entries have required fields", [statusById.get("P137"), statusById.get("P137.5"), roadmapById.get("P137.5")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P137.6 remains planned or safely handed off", (statusById.get("P137.6")?.status === "planned" && roadmapById.get("P137.6")?.status === "planned" && !(statusById.get("P137.6")?.checksRun || []).length) || p1376CurrentState || p1377FinalState);
addCheck("changed files stay in P137.5 allowed scope", status.currentPhase !== "P137.5" || changed.every((file) => allowedFiles.has(file)), status.currentPhase === "P137.5" ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", status.currentPhase !== "P137.5" || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), status.currentPhase === "P137.5" ? changed.join(", ") : `P137.5 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("primary UX data avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplay));
addCheck("primary UX data avoids raw dumps", !/raw JSON|raw logs|raw policy dump|raw registry dump|providerPayload|toolPayload|runtimeDispatchRequest/i.test(serializedDisplay));
addCheck("primary UX data avoids fake runnable actions", !/dispatch agent now|run agent now|execute work order now|execute tool now|call provider now|call model now|write db now|mutate project now|deploy now|export now|package now|spend now/i.test(serializedDisplay));
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable work order actions", !/dispatch agent now|run agent now|execute work order now|execute tool now|call provider now|call model now|write db now|mutate project now|deploy now|export now|package now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /agent dispatch is enabled|work order execution is enabled|tool execution is enabled|provider calls are enabled|model calls are enabled|MCP servers are enabled|network calls are enabled|provider spend is enabled|DB writes are enabled|runtime writes are enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|full registry is loaded/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P137.1-P137.4 validation into P137.5 tests/checkers evidence.",
        "- Verifies the scoped work-order contract, runtime model, dispatch dry run, Agent Flow UX coverage, route-wide safety assertions, docs, roadmap, and OS phase status.",
        "- Does not enable provider/model calls, tool execution, MCP startup, agent dispatch, DB/runtime writes, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Aggregated Coverage Summary",
      body: [
        `- Runtime work-order packets: ${runtimeModel.workOrderPackets.length}`,
        `- Dispatch dry-run rows: ${dispatchDryRun.dispatchRows.length}`,
        `- Agent Flow lanes: ${runtimeDisplay.lanes?.length || 0}`,
        `- Dispatchable candidates: ${runtimeDisplay.dispatchableCandidateCount}`,
        `- Executable candidates: ${runtimeDisplay.executableCandidateCount}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P137.5 is tests/checkers hardening only. It does not enable full registry loading into model context, provider/model calls, tool execution, MCP startup, agent dispatch, DB/runtime writes, project mutation, deploy, release, export, package, network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P137.5 Agent Work Order Runtime Tests Checkers Report", phase: "P137.5" },
);

printCheckReport("P137.5 Agent Work Order Runtime Tests Checkers Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
