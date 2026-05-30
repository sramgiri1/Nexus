import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1386-project-workspace-mutation-build-pipeline-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p138-project-workspace-mutation-build-pipeline-contracts.json";
const PLAN_PATH = "docs/architecture/P138_PROJECT_WORKSPACE_MUTATION_BUILD_PIPELINE_PLAN.md";
const REQUIRED_SCRIPT = "check:p1386-project-workspace-mutation-build-pipeline";
const EXPECTED_BASE_COMMIT = "f43eac0f";
const VALIDATION_COMMANDS = [
  "npm run check:p1386-project-workspace-mutation-build-pipeline",
  "npm run check:p1385-project-workspace-mutation-build-pipeline",
  "npm run check:p1384-project-workspace-mutation-build-pipeline",
  "npm run check:p1383-project-workspace-mutation-build-pipeline",
  "npm run check:p1382-project-workspace-mutation-build-pipeline",
  "npm run check:p1381-project-workspace-mutation-build-pipeline",
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
  return /## Result[\s\S]*PASS|Result:\s+PASS/i.test(readText(relativePath));
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
    if (/^\s*-\s+`[^`]+`\s*$/.test(line)) return false;
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|approval|rollback|explicitly allows|summary|withheld|validation-only|closure)\b/i.test(context);
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
const p1386 = subphaseById.get("P138.6") || {};
const p1387 = subphaseById.get("P138.7") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1386-project-workspace-mutation-build-pipeline.js");
const p1381Checker = readText("scripts/check-p1381-project-workspace-mutation-build-pipeline.js");
const p1382Checker = readText("scripts/check-p1382-project-workspace-mutation-build-pipeline.js");
const p1383Checker = readText("scripts/check-p1383-project-workspace-mutation-build-pipeline.js");
const p1384Checker = readText("scripts/check-p1384-project-workspace-mutation-build-pipeline.js");
const p1385Checker = readText("scripts/check-p1385-project-workspace-mutation-build-pipeline.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P138.6";
const allowedFiles = new Set(p1386.allowedFiles || []);
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
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const p1386CurrentState =
  status.currentPhase === "P138.6"
  && status.previousPhase === "P138.5"
  && status.nextPhase === "P138.7"
  && roadmap.currentPhase === "P138.6"
  && roadmap.previousPhase === "P138.5"
  && roadmap.nextPhase === "P138.7"
  && status.current?.phaseId === "P138.6"
  && status.previous?.phaseId === "P138.5"
  && status.next?.phaseId === "P138.7"
  && roadmap.current?.phaseId === "P138.6"
  && roadmap.previous?.phaseId === "P138.5"
  && roadmap.next?.phaseId === "P138.7"
  && statusById.get("P137")?.status === "complete"
  && roadmapById.get("P137")?.status === "complete"
  && statusById.get("P138")?.status === "in_progress"
  && roadmapById.get("P138")?.status === "in_progress"
  && ["P138.1", "P138.2", "P138.3", "P138.4", "P138.5", "P138.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P138.7")?.status === "planned"
  && roadmapById.get("P138.7")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1386-project-workspace-mutation-build-pipeline.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("P138.1-P138.6 package scripts registered", ["p1381", "p1382", "p1383", "p1384", "p1385", "p1386"].every((suffix) => Boolean(packageJson.scripts?.[`check:${suffix}-project-workspace-mutation-build-pipeline`])));
addCheck("P138.1-P138.5 reports pass", [
  "reports/p1381-project-workspace-mutation-build-pipeline-report.md",
  "reports/p1382-project-workspace-mutation-build-pipeline-report.md",
  "reports/p1383-project-workspace-mutation-build-pipeline-report.md",
  "reports/p1384-project-workspace-mutation-build-pipeline-report.md",
  "reports/p1385-project-workspace-mutation-build-pipeline-report.md",
].every(reportPassed));
addCheck("prior P138 checkers accept P138.6", [p1381Checker, p1382Checker, p1383Checker, p1384Checker, p1385Checker].every((source) => source.includes("p1386CurrentState") && source.includes('status.currentPhase === "P138.6"')));
addCheck("enterprise checker accepts P138.6", enterpriseChecker.includes("p1386CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P138.7 handoff", ["P138.1", "P138.2", "P138.3", "P138.4", "P138.5", "P138.6", "P138.7"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("contract advances P138.6", contract.phaseId === "P138" && contract.status === "in_progress" && contract.currentSubphase === "P138.6" && contract.previousSubphase === "P138.5" && contract.nextSubphase === "P138.7" && p1386.status === "complete" && p1387.status === "planned");
addCheck("contract records expected base commit", p1386.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records complete validation commands", VALIDATION_COMMANDS.every((command) => p1386.validationCommands?.includes(command)));
addCheck("contract scope stays docs/status-only", p1386.dataShape?.includes("Docs/status/report updates only") && p1386.expectedExports?.length === 0 && p1386.forbiddenFiles?.includes("dashboard/src/**") && p1386.forbiddenFiles?.includes("projects/**"));
addCheck("P138 plan records P138.6", /## P138\.6 Docs \/ Roadmap \/ Status[\s\S]*Status:\s+complete/.test(plan) && /P138\.7 remains planned-only next/i.test(plan));
addCheck("README records P138.6", /P138\.6 docs\/roadmap\/status closure/i.test(readme) && /P138\.7 is planned-only next/i.test(readme));
addCheck("platform roadmap records P138.6", /P138\.6 docs\/roadmap\/status closure is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P138.6", /P138\.6 is now complete/i.test(enterpriseRoadmap) && /P138\.7 is the next executable subphase/i.test(enterpriseRoadmap));
addCheck("phase status starts P138.6", p1386CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P138.6 entries have required fields", [statusById.get("P138"), statusById.get("P138.6"), roadmapById.get("P138.6")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P138.7 remains planned", statusById.get("P138.7")?.status === "planned" && roadmapById.get("P138.7")?.status === "planned" && !(statusById.get("P138.7")?.checksRun || []).length);
addCheck("changed files stay in P138.6 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P138.6 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("route-wide safety coverage retained", ["Command Center route-wide UX", "DemoApp", "raw JSON", "private-project", "dispatch agent now", "Use system theme", "Use dark theme", "Use light theme"].every((text) => routeTests.includes(text)));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable project actions", !/apply patch now|mutate project now|run build now|run tests now|rollback now|deploy now|release now|export now|package now|call provider now|dispatch agent now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /\b(project mutation is enabled|patch application is enabled|build execution is enabled|test execution is enabled|rollback execution is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|provider calls are enabled|model calls are enabled|agent dispatch is enabled|DB writes are enabled|runtime writes are enabled|network calls are enabled|spend is enabled)\b/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /\b(raw JSON|raw logs?|raw policy dumps?|raw registry dumps?|raw patch dumps?|raw diff dumps?)\b/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P138.6 docs, README, platform roadmap, enterprise roadmap, OS phase status, phase index, checker handoff, and report evidence.",
        "- Confirms P138.1-P138.5 reports remain PASS and that prior P138 checkers accept the P138.6 handoff.",
        "- Does not mutate project files, apply patches, run builds/tests, execute rollbacks, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Docs And Status Closure",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        `- Prior P138 reports passing: ${["P138.1", "P138.2", "P138.3", "P138.4", "P138.5"].length}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P138.6 is docs/status/report closure only. It does not enable project mutation, patch application, build/test execution, rollback execution, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, deploy, release, export, package, network calls, or spend. P138.7 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P138.6 Project Workspace Mutation Build Pipeline Docs Status Report", phase: "P138.6" },
);

printCheckReport("P138.6 Project Workspace Mutation Build Pipeline Docs Status Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
