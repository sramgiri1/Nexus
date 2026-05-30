import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1371-agent-work-order-runtime-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p137-agent-work-order-runtime-contracts.json";
const PLAN_PATH = "docs/architecture/P137_AGENT_WORK_ORDER_RUNTIME_PLAN.md";
const REQUIRED_SCRIPT = "check:p1371-agent-work-order-runtime";
const VALIDATION_COMMANDS = [
  "npm run check:p1371-agent-work-order-runtime",
  "npm run check:p1367-secrets-providers-tool-governance-final-validation",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];
const EXPECTED_SUBPHASES = ["P137.1", "P137.2", "P137.3", "P137.4", "P137.5", "P137.6", "P137.7"];
const REQUIRED_SUBPHASE_FIELDS = [
  "narrowGoal",
  "startingBranch",
  "expectedBaseCommit",
  "allowedFiles",
  "forbiddenFiles",
  "exactFilesToCreateOrUpdate",
  "expectedExports",
  "dataShape",
  "commandCenterUx",
  "themeRequirements",
  "testsAndCheckers",
  "docsRoadmap",
  "phaseStatusUpdate",
  "validationCommands",
  "finalSafetyChecks",
  "gitCommands",
  "finalResponseChecklist",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|read-only|checker|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|runtime owns|receive only|scoped|handoff)\b/i.test(context);
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
const p1371 = subphaseById.get("P137.1") || {};
const p1372 = subphaseById.get("P137.2") || {};
const p1373 = subphaseById.get("P137.3") || {};
const p1374 = subphaseById.get("P137.4") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1367Checker = readText("scripts/check-p1367-secrets-providers-tool-governance-final-validation.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1371-agent-work-order-runtime.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P137.1";
const allowedFiles = new Set(p1371.allowedFiles || []);
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
const p1371StartedState =
  status.currentPhase === "P137.1"
  && status.previousPhase === "P136.7"
  && status.nextPhase === "P137.2"
  && roadmap.currentPhase === "P137.1"
  && roadmap.previousPhase === "P136.7"
  && roadmap.nextPhase === "P137.2"
  && status.current?.phaseId === "P137.1"
  && status.previous?.phaseId === "P136.7"
  && status.next?.phaseId === "P137.2"
  && roadmap.current?.phaseId === "P137.1"
  && roadmap.previous?.phaseId === "P136.7"
  && roadmap.next?.phaseId === "P137.2"
  && statusById.get("P136")?.status === "complete"
  && roadmapById.get("P136")?.status === "complete"
  && statusById.get("P136.7")?.status === "complete"
  && roadmapById.get("P136.7")?.status === "complete"
  && statusById.get("P137")?.status === "in_progress"
  && roadmapById.get("P137")?.status === "in_progress"
  && statusById.get("P137.1")?.status === "complete"
  && roadmapById.get("P137.1")?.status === "complete"
  && statusById.get("P137.2")?.status === "planned"
  && roadmapById.get("P137.2")?.status === "planned";
const p1372CurrentState =
  status.currentPhase === "P137.2"
  && status.previousPhase === "P137.1"
  && status.nextPhase === "P137.3"
  && roadmap.currentPhase === "P137.2"
  && roadmap.previousPhase === "P137.1"
  && roadmap.nextPhase === "P137.3"
  && status.current?.phaseId === "P137.2"
  && status.previous?.phaseId === "P137.1"
  && status.next?.phaseId === "P137.3"
  && roadmap.current?.phaseId === "P137.2"
  && roadmap.previous?.phaseId === "P137.1"
  && roadmap.next?.phaseId === "P137.3"
  && statusById.get("P136")?.status === "complete"
  && roadmapById.get("P136")?.status === "complete"
  && statusById.get("P136.7")?.status === "complete"
  && roadmapById.get("P136.7")?.status === "complete"
  && statusById.get("P137")?.status === "in_progress"
  && roadmapById.get("P137")?.status === "in_progress"
  && statusById.get("P137.1")?.status === "complete"
  && roadmapById.get("P137.1")?.status === "complete"
  && statusById.get("P137.2")?.status === "complete"
  && roadmapById.get("P137.2")?.status === "complete"
  && statusById.get("P137.3")?.status === "planned"
  && roadmapById.get("P137.3")?.status === "planned";
const p1373CurrentState =
  status.currentPhase === "P137.3"
  && status.previousPhase === "P137.2"
  && status.nextPhase === "P137.4"
  && roadmap.currentPhase === "P137.3"
  && roadmap.previousPhase === "P137.2"
  && roadmap.nextPhase === "P137.4"
  && status.current?.phaseId === "P137.3"
  && status.previous?.phaseId === "P137.2"
  && status.next?.phaseId === "P137.4"
  && roadmap.current?.phaseId === "P137.3"
  && roadmap.previous?.phaseId === "P137.2"
  && roadmap.next?.phaseId === "P137.4"
  && statusById.get("P136")?.status === "complete"
  && roadmapById.get("P136")?.status === "complete"
  && statusById.get("P137")?.status === "in_progress"
  && roadmapById.get("P137")?.status === "in_progress"
  && statusById.get("P137.1")?.status === "complete"
  && roadmapById.get("P137.1")?.status === "complete"
  && statusById.get("P137.2")?.status === "complete"
  && roadmapById.get("P137.2")?.status === "complete"
  && statusById.get("P137.3")?.status === "complete"
  && roadmapById.get("P137.3")?.status === "complete"
  && statusById.get("P137.4")?.status === "planned"
  && roadmapById.get("P137.4")?.status === "planned";

const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract starts P137 safely", contract.phaseId === "P137" && contract.status === "in_progress" && ((contract.currentSubphase === "P137.1" && contract.previousSubphase === "P136.7" && contract.nextSubphase === "P137.2") || (contract.currentSubphase === "P137.2" && contract.previousSubphase === "P137.1" && contract.nextSubphase === "P137.3") || (contract.currentSubphase === "P137.3" && contract.previousSubphase === "P137.2" && contract.nextSubphase === "P137.4")));
addCheck("contract has seven implementation-grade subphases", EXPECTED_SUBPHASES.every((phaseId) => subphaseById.has(phaseId)) && EXPECTED_SUBPHASES.every((phaseId) => subphaseById.get(phaseId)?.scopeClassification === "NEXUS_OS_CHANGE") && EXPECTED_SUBPHASES.every((phaseId) => REQUIRED_SUBPHASE_FIELDS.every((field) => Object.hasOwn(subphaseById.get(phaseId) || {}, field))));
addCheck("P137.1 complete and P137.2 planned or complete", p1371.status === "complete" && (p1372.status === "planned" || (p1372.status === "complete" && p1373.status === "planned") || (p1372.status === "complete" && p1373.status === "complete" && p1374.status === "planned")));
addCheck("P137.1 records expected base commit", p1371.expectedBaseCommit === "033f2712");
addCheck("P137.1 records validation commands", VALIDATION_COMMANDS.every((command) => p1371.validationCommands?.includes(command)));
addCheck("runtime context rule limits model context", contract.runtimeContextRule?.runtimeOwns?.includes("full tool registry") && contract.runtimeContextRule?.agentReceivesOnly?.includes("task contract") && contract.runtimeContextRule?.forbiddenContext?.includes("all tools"));
addCheck("P137.1 safety boundary blocks execution", p1371.safetyRules?.join(" ").includes("Do not load all tools") && p1371.safetyRules?.join(" ").includes("Do not call providers or models") && p1371.forbiddenFiles?.includes("providers/**") && p1371.forbiddenFiles?.includes("tools/**") && p1371.forbiddenFiles?.includes("db/**"));
addCheck("future model shape is scoped", p1371.futureDataShape?.includes("taskContract") && p1371.futureDataShape?.includes("selectedProjectProfile") && p1371.futureDataShape?.includes("scopedMemoryPacket") && p1371.futureDataShape?.includes("selectedSkillToolContracts"));
addCheck("P136.7 report passes", reportPassed("reports/p1367-secrets-providers-tool-governance-final-validation-report.md"));
addCheck("P136.7 checker accepts P137.1 handoff", p1367Checker.includes("p1371StartedState") && p1367Checker.includes('status.currentPhase === "P137.1"'));
addCheck("enterprise checker accepts P137.1", enterpriseChecker.includes("p1371StartedState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P137 subphases", ["P137", "P137.1", "P137.2", "P137.3", "P137.4"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P137 plan records P137.1", /## P137\.1 Contract \/ Policy \/ Safety Boundary[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P137.1", /P137\.1 agent work order runtime contract/i.test(readme));
addCheck("platform roadmap records P137.1", /P137\.1 agent work order runtime contract is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P137.1", /P137\.1 is now complete/i.test(enterpriseRoadmap) && (/P137\.2 is the next executable subphase/i.test(enterpriseRoadmap) || /P137\.2 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status starts P137.1 or safely hands off through P137.3", p1371StartedState || p1372CurrentState || p1373CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P137.1 entries have required fields", [statusById.get("P137"), statusById.get("P137.1"), roadmapById.get("P137.1")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P137.2 remains planned or safely complete", (statusById.get("P137.2")?.status === "planned" && roadmapById.get("P137.2")?.status === "planned" && !(statusById.get("P137.2")?.checksRun || []).length) || p1372CurrentState || p1373CurrentState);
addCheck(
  "changed files stay in P137.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P137.1 forbidden path check relaxed for ${status.currentPhase}`,
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
        "- Starts P137 Agent Work Order Runtime with contract, policy, safety boundary, checker, docs, status, and report evidence.",
        "- Defines scoped agent work order packets while runtime owns full tool, MCP schema, skill, agent, policy, and memory registries.",
        "- Confirms this subphase does not call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, write DB/runtime state, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P137.1 is contract/policy/safety-boundary work only. Later P137 subphases may add scoped models and local dry runs, but Agent Flow UX, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, and spend remain blocked until explicitly scoped.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P137.1 Agent Work Order Runtime Report", phase: "P137.1" },
);

printCheckReport("P137.1 Agent Work Order Runtime Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
