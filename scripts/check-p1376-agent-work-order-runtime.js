import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1376-agent-work-order-runtime-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p137-agent-work-order-runtime-contracts.json";
const PLAN_PATH = "docs/architecture/P137_AGENT_WORK_ORDER_RUNTIME_PLAN.md";
const REQUIRED_SCRIPT = "check:p1376-agent-work-order-runtime";
const P1377_SCRIPT = "check:p1377-agent-work-order-runtime";
const EXPECTED_BASE_COMMIT = "3e637a7f";
const VALIDATION_COMMANDS = [
  "npm run check:p1376-agent-work-order-runtime",
  "npm run check:p1375-agent-work-order-runtime",
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
    if (/^\s*-\s+`[^`]+`\s*$/.test(line)) return false;
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|dry-run|dry run|read-only|checker|checkers|coverage|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|zero-spend|local planning|closure)\b/i.test(context);
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
const p1376 = subphaseById.get("P137.6") || {};
const p1377 = subphaseById.get("P137.7") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1375Checker = readText("scripts/check-p1375-agent-work-order-runtime.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const checkerSource = readText("scripts/check-p1376-agent-work-order-runtime.js");
const changed = changedFiles();
const allowedFiles = new Set(p1376.allowedFiles || []);
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

const p1376CurrentState =
  status.currentPhase === "P137.6"
  && status.previousPhase === "P137.5"
  && status.nextPhase === "P137.7"
  && roadmap.currentPhase === "P137.6"
  && roadmap.previousPhase === "P137.5"
  && roadmap.nextPhase === "P137.7"
  && status.current?.phaseId === "P137.6"
  && status.previous?.phaseId === "P137.5"
  && status.next?.phaseId === "P137.7"
  && roadmap.current?.phaseId === "P137.6"
  && roadmap.previous?.phaseId === "P137.5"
  && roadmap.next?.phaseId === "P137.7"
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
  && status.current?.phaseId === "P137.7"
  && roadmap.current?.phaseId === "P137.7"
  && statusById.get("P137")?.status === "complete"
  && roadmapById.get("P137")?.status === "complete"
  && ["P137.1", "P137.2", "P137.3", "P137.4", "P137.5", "P137.6", "P137.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P138")?.status === "planned"
  && roadmapById.get("P138")?.status === "planned";
const planP1376Slice = plan.match(/### P137\.6 Docs \/ Roadmap \/ Status[\s\S]*?### P137\.7 Final Validation/)?.[0] || plan;
const readmeP137Slice = readme.match(/- P137\.5 agent work order runtime tests\/checkers:[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const platformP137Slice = platformRoadmap.match(/P137\.5 agent work order runtime tests\/checkers is complete[\s\S]*?spend remain blocked\./)?.[0] || platformRoadmap;
const enterpriseP137Slice = enterpriseRoadmap.match(/P137\.1 is now complete[\s\S]*?must not be treated as complete or live\./)?.[0] || enterpriseRoadmap;
const combinedDocs = [planP1376Slice, readmeP137Slice, platformP137Slice, enterpriseP137Slice].join("\n");

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1376-agent-work-order-runtime.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("shared/reportWriter.js") && checkerSource.includes("shared/checkResultFormatter.js"));
addCheck("P137.5 report passes", reportPassed("reports/p1375-agent-work-order-runtime-report.md"));
addCheck("route-wide Command Center Playwright coverage retained", routeTests.includes("Command Center route-wide UX") && routeTests.includes("theme switcher") && routeTests.includes("DemoApp"));
addCheck("P137.5 checker accepts P137.6 handoff", p1375Checker.includes("p1376CurrentState") && p1375Checker.includes('status.currentPhase === "P137.6"') && p1375Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P137.6", enterpriseChecker.includes("p1376CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P137.7 handoff", ["P137.5", "P137.6", "P137.7", "P138"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("contract marks P137.6 complete", p1376.status === "complete" && ((contract.currentSubphase === "P137.6" && contract.previousSubphase === "P137.5" && contract.nextSubphase === "P137.7" && p1377.status === "planned") || (p1377FinalState && contract.status === "complete")));
addCheck("P137.6 records expected base commit", p1376.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("P137.6 allowed files include checker and report", ["scripts/check-p1376-agent-work-order-runtime.js", "scripts/check-enterprise-readiness-roadmap.js", REPORT_PATH].every((file) => p1376.allowedFiles?.includes(file)));
addCheck("P137.6 forbids project dashboard db runtime provider tool paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1376.forbiddenFiles?.includes(path)));
addCheck("P137.6 records validation commands", VALIDATION_COMMANDS.every((command) => p1376.validationCommands?.includes(command)));
addCheck("docs record P137.6", /### P137\.6 Docs \/ Roadmap \/ Status[\s\S]*Status:\s+complete/.test(plan) && /P137\.6 agent work order runtime docs\/status/i.test(readme) && /P137\.6 agent work order runtime docs\/status is complete/i.test(platformRoadmap) && /P137\.6 is now complete/i.test(enterpriseRoadmap));
addCheck("phase status starts or safely hands off P137.6", p1376CurrentState || p1377FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P137.6 entries have required fields", [statusById.get("P137"), statusById.get("P137.6"), roadmapById.get("P137.6")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P137.7 remains planned or safely handed off", (statusById.get("P137.7")?.status === "planned" && roadmapById.get("P137.7")?.status === "planned" && !(statusById.get("P137.7")?.checksRun || []).length) || p1377FinalState);
addCheck("P137.7 checker registered when handed off", !p1377FinalState || Boolean(packageJson.scripts?.[P1377_SCRIPT]));
addCheck("changed files stay in P137.6 allowed scope", status.currentPhase !== "P137.6" || changed.every((file) => allowedFiles.has(file)), status.currentPhase === "P137.6" ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", status.currentPhase !== "P137.6" || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), status.currentPhase === "P137.6" ? changed.join(", ") : `P137.6 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(combinedDocs));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(combinedDocs, /\b(raw JSON|raw logs?|raw policy dumps?|raw registry dumps?)\b/i));
addCheck("docs avoid fake runnable work order actions", !/dispatch agent now|run agent now|execute work order now|execute tool now|call provider now|call model now|write db now|mutate project now|deploy now|export now|package now|spend now/i.test(combinedDocs));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(combinedDocs, /\b(provider\/model calls?|tool execution|MCP startup|agent dispatch|DB\/runtime writes?|project mutation|deploy|release|export|package|network calls?|spend|live execution|full registry loading)\b/i));

const failed = checks.filter((check) => check.status !== "PASS");
writeMarkdownReport(
  REPORT_PATH,
  [
    {
      title: "Scope",
      body: [
        "- P137.6 is docs, roadmap, status, report, and checker handoff closure for P137 Agent Work Order Runtime.",
        "- It preserves the P137 scoped work-order model, non-runnable dry run, and Agent Flow UX without enabling execution.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P137.6 is docs/status/checker hardening only. It does not enable full registry loading into model context, provider/model calls, tool execution, MCP startup, agent dispatch, DB/runtime writes, project mutation, deploy, release, export, package, network calls, or spend. P137.7 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P137.6 Agent Work Order Runtime Docs Roadmap Status Report", phase: "P137.6" },
);

printCheckReport("P137.6 Agent Work Order Runtime Docs Roadmap Status Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
