import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildAgentWorkOrderDispatchDryRun,
  validateAgentWorkOrderDispatchDryRun,
} from "../shared/agentWorkOrderRuntimeModel.js";
import {
  buildAgentWorkOrderRuntimeDisplayModel,
  buildBusinessBuildViewModel,
} from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1374-agent-work-order-runtime-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p137-agent-work-order-runtime-contracts.json";
const PLAN_PATH = "docs/architecture/P137_AGENT_WORK_ORDER_RUNTIME_PLAN.md";
const REQUIRED_SCRIPT = "check:p1374-agent-work-order-runtime";
const EXPECTED_BASE_COMMIT = "c2cd498a";
const VALIDATION_COMMANDS = [
  "npm run check:p1374-agent-work-order-runtime",
  "npm run check:p1373-agent-work-order-runtime",
  "npm run check:p1372-agent-work-order-runtime",
  "npm run check:p1371-agent-work-order-runtime",
  "npm run check:p1367-secrets-providers-tool-governance-final-validation",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Agent Flow agent work order runtime\"",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "Browser verification at /command-center/agent-flow",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|display-safe|dry-run|dry run|read-only|checker|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|zero-spend|local planning)\b/i.test(context);
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
const p1374 = subphaseById.get("P137.4") || {};
const p1375 = subphaseById.get("P137.5") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1373Checker = readText("scripts/check-p1373-agent-work-order-runtime.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1374-agent-work-order-runtime.js");
const dashboardDataSource = readText("dashboard/src/data/businessBuild.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P137.4";
const allowedFiles = new Set(p1374.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
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
const dryRun = buildAgentWorkOrderDispatchDryRun({ founderIdeaSummary: founderIdea });
const dryRunValidation = validateAgentWorkOrderDispatchDryRun(dryRun);
const businessBuild = buildBusinessBuildViewModel(founderIdea);
const displayModel = businessBuild.agentWorkOrderRuntime || buildAgentWorkOrderRuntimeDisplayModel(founderIdea);
const dryRunLaneLabels = new Set((dryRun.dispatchRows || []).map((row) => row.proposedDispatchLane));
const serializedDisplay = JSON.stringify(displayModel);
const p1374CurrentState =
  status.currentPhase === "P137.4"
  && status.previousPhase === "P137.3"
  && status.nextPhase === "P137.5"
  && roadmap.currentPhase === "P137.4"
  && roadmap.previousPhase === "P137.3"
  && roadmap.nextPhase === "P137.5"
  && status.current?.phaseId === "P137.4"
  && status.previous?.phaseId === "P137.3"
  && status.next?.phaseId === "P137.5"
  && roadmap.current?.phaseId === "P137.4"
  && roadmap.previous?.phaseId === "P137.3"
  && roadmap.next?.phaseId === "P137.5"
  && statusById.get("P137")?.status === "in_progress"
  && roadmapById.get("P137")?.status === "in_progress"
  && ["P137.1", "P137.2", "P137.3", "P137.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P137.5")?.status === "planned"
  && roadmapById.get("P137.5")?.status === "planned";

const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("source dry run validates", dryRunValidation.valid && dryRun.dispatchRows.length >= 5, dryRunValidation.errors.join("; "));
addCheck("dashboard display model export exists", dashboardDataSource.includes("export function buildAgentWorkOrderRuntimeDisplayModel"));
addCheck("display model stays browser-safe", !dashboardDataSource.includes("agentWorkOrderRuntimeModel.js") && dashboardDataSource.includes("buildFounderLiveHandoffDisplayModels"));
addCheck("business build view model exposes runtime UX", businessBuild.agentWorkOrderRuntime?.currentState === "Ready For Local Review Dispatch Blocked" && businessBuild.agentWorkOrderRuntime?.lanes?.length >= 5);
addCheck("display model aligns with P137.3 dry-run lanes", displayModel.lanes.length === dryRun.dispatchRows.length && displayModel.lanes.every((lane) => dryRunLaneLabels.has(lane.label)));
addCheck("display model has useful lanes", displayModel.lanes.length >= 5 && displayModel.lanes.some((lane) => lane.label === "Product Strategist") && displayModel.lanes.every((lane) => lane.workOrder && lane.taskSummary && lane.ownerCapability && lane.nextAction && lane.blocker));
addCheck("display model has gates and safety rows", displayModel.gateRows.length >= 5 && displayModel.safetyRows.some((row) => row.label === "Agent dispatch" && row.value === "Blocked") && displayModel.safetyRows.some((row) => row.label === "Provider/model calls" && row.value === "Blocked"));
addCheck("display model keeps authority blocked", displayModel.dispatchableCandidateCount === 0 && displayModel.executableCandidateCount === 0 && displayModel.lanes.every((lane) => lane.dispatchAllowed === "Blocked" && lane.executionAllowed === "Blocked"));
addCheck("display model hides raw runtime internals", !/agent-work-order-dispatch-dry-run|dryRunHandle|selectedContextRefs|providerPayload|toolPayload|executableCommand|runtimeDispatchRequest|raw JSON|raw logs|raw policy dump/i.test(serializedDisplay));
addCheck("display model hides raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplay));
addCheck("display model avoids fake runnable actions", !/dispatch agent now|run agent now|execute work order now|execute tool now|call provider now|call model now|write db now|mutate project now|deploy now|export now|package now|spend now/i.test(serializedDisplay));
addCheck("Agent Flow card is wired only in Agent Flow page", commandCenterSource.includes("function AgentWorkOrderRuntimeCard") && commandCenterSource.includes('aria-label="Agent work order runtime"') && commandCenterSource.includes("<AgentWorkOrderRuntimeCard runtime={businessBuild.agentWorkOrderRuntime} />"));
addCheck("Agent Flow card shows required UX fields", ["Current state", "Next action", "Disabled reason", "Owner", "Evidence", "Activity", "Cost impact"].every((label) => commandCenterSource.includes(label)));
addCheck("Agent Flow card avoids raw runtime internals", !/providerPayload|toolPayload|executableCommand|runtimeDispatchRequest|selectedContextRefs|dryRunHandle/.test(commandCenterSource));
addCheck("Playwright coverage added", routeTests.includes("Agent Flow agent work order runtime shows display-safe dry run") && routeTests.includes('page.getByLabel("Agent work order runtime")') && routeTests.includes("Provider/model calls") && routeTests.includes("Zero-spend local planning"));
addCheck("Playwright safety assertions added", routeTests.includes("agent-work-order-dispatch-dry-run") && routeTests.includes("dispatch agent now") && routeTests.includes("private-project-"));
addCheck("contract advances P137.4", contract.phaseId === "P137" && contract.status === "in_progress" && contract.currentSubphase === "P137.4" && contract.previousSubphase === "P137.3" && contract.nextSubphase === "P137.5" && p1374.status === "complete" && p1375.status === "planned");
addCheck("contract records expected base commit", p1374.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract allows scoped dashboard UX files", p1374.allowedFiles?.includes("dashboard/src/data/businessBuild.js") && p1374.allowedFiles?.includes("dashboard/src/pages/CommandCenterV2.jsx") && p1374.allowedFiles?.includes("dashboard/tests/routes.spec.js"));
addCheck("P137.3 report passes", reportPassed("reports/p1373-agent-work-order-runtime-report.md"));
addCheck("P137.2 report passes", reportPassed("reports/p1372-agent-work-order-runtime-report.md"));
addCheck("P137.1 report passes", reportPassed("reports/p1371-agent-work-order-runtime-report.md"));
addCheck("P136.7 report passes", reportPassed("reports/p1367-secrets-providers-tool-governance-final-validation-report.md"));
addCheck("P137.3 checker accepts P137.4", p1373Checker.includes("p1374CurrentState") && p1373Checker.includes('status.currentPhase === "P137.4"'));
addCheck("enterprise checker accepts P137.4", enterpriseChecker.includes("p1374CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P137.5 handoff", ["P137.1", "P137.2", "P137.3", "P137.4", "P137.5"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P137 plan records P137.4", /### P137\.4 Agent Flow Command Center UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P137.4", /P137\.4 agent work order Agent Flow UX/i.test(readme));
addCheck("platform roadmap records P137.4", /P137\.4 agent work order Agent Flow UX is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P137.4", /P137\.4 is now complete/i.test(enterpriseRoadmap) && /P137\.5 is the next executable subphase/i.test(enterpriseRoadmap));
addCheck("phase status starts P137.4", p1374CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P137.4 entries have required fields", [statusById.get("P137"), statusById.get("P137.4"), roadmapById.get("P137.4")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P137.5 remains planned-only", statusById.get("P137.5")?.status === "planned" && roadmapById.get("P137.5")?.status === "planned" && !(statusById.get("P137.5")?.checksRun || []).length);
addCheck(
  "changed files stay in P137.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P137.4 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable work order actions", !/dispatch agent now|run agent now|execute work order now|execute tool now|call provider now|call model now|write db now|mutate project now|deploy now|export now|package now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /agent dispatch is enabled|work order execution is enabled|tool execution is enabled|provider calls are enabled|model calls are enabled|MCP servers are enabled|network calls are enabled|provider spend is enabled|DB writes are enabled|runtime writes are enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|full registry is loaded/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump|raw registry dump|raw memory dump|raw tool dump/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Implements the P137.4 Agent Flow Command Center UX for scoped agent work-order runtime planning.",
        "- Confirms Agent Flow shows display-safe work-order lanes, gates, blockers, owner, evidence/activity, next action, disabled reason, and zero-cost impact.",
        "- Confirms this subphase does not call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, write DB/runtime state, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Display Summary",
      body: [
        `- Work-order lanes shown: ${displayModel.lanes.length}`,
        `- Dispatchable candidates: ${displayModel.dispatchableCandidateCount}`,
        `- Executable candidates: ${displayModel.executableCandidateCount}`,
        `- Gates shown: ${displayModel.gateRows.length}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P137.4 is display-only Agent Flow UX. It does not enable provider/model calls, tool execution, MCP startup, agent dispatch, DB/runtime writes, project mutation, deploy, release, export, package, network calls, or spend. P137.5 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P137.4 Agent Work Order Command Center UX Report", phase: "P137.4" },
);

printCheckReport("P137.4 Agent Work Order Command Center UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
