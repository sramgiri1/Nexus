import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1426-admin-operations-runtime-settings-docs-roadmap-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p142-admin-operations-runtime-settings-contracts.json";
const PLAN_PATH = "docs/architecture/P142_ADMIN_OPERATIONS_RUNTIME_SETTINGS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1426-admin-operations-runtime-settings-docs-roadmap";
const EXPECTED_BASE_COMMIT = "cc8ce0cc";
const PRIOR_REPORTS = [
  "reports/p1421-admin-operations-runtime-settings-report.md",
  "reports/p1422-admin-operations-runtime-settings-report.md",
  "reports/p1423-admin-operations-runtime-settings-report.md",
  "reports/p1424-admin-operations-runtime-settings-report.md",
  "reports/p1425-admin-operations-runtime-settings-report.md",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1426-admin-operations-runtime-settings-docs-roadmap",
  "npm run check:p1425-admin-operations-runtime-settings",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P142.6|Command Center route-wide UX\"",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|handoff|aggregate|coverage|closure)\b/i.test(context);
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
const p1426 = subphaseById.get("P142.6") || {};
const p1427 = subphaseById.get("P142.7") || {};
const checkerSource = readText("scripts/check-p1426-admin-operations-runtime-settings-docs-roadmap.js");
const p1425Checker = readText("scripts/check-p1425-admin-operations-runtime-settings.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P142.6";
const allowedFiles = new Set(p1426.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
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

const p1426CurrentState =
  status.currentPhase === "P142.6"
  && status.previousPhase === "P142.5"
  && status.nextPhase === "P142.7"
  && roadmap.currentPhase === "P142.6"
  && roadmap.previousPhase === "P142.5"
  && roadmap.nextPhase === "P142.7"
  && status.current?.phaseId === "P142.6"
  && status.previous?.phaseId === "P142.5"
  && status.next?.phaseId === "P142.7"
  && roadmap.current?.phaseId === "P142.6"
  && roadmap.previous?.phaseId === "P142.5"
  && roadmap.next?.phaseId === "P142.7"
  && statusById.get("P142")?.status === "in_progress"
  && roadmapById.get("P142")?.status === "in_progress"
  && ["P142.1", "P142.2", "P142.3", "P142.4", "P142.5", "P142.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P142.7")?.status === "planned"
  && roadmapById.get("P142.7")?.status === "planned";
const p1427FinalState =
  status.currentPhase === "P142.7"
  && status.previousPhase === "P142.6"
  && status.nextPhase === "P143"
  && roadmap.currentPhase === "P142.7"
  && roadmap.previousPhase === "P142.6"
  && roadmap.nextPhase === "P143"
  && statusById.get("P142")?.status === "complete"
  && roadmapById.get("P142")?.status === "complete"
  && ["P142.1", "P142.2", "P142.3", "P142.4", "P142.5", "P142.6", "P142.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P143")?.status === "planned"
  && roadmapById.get("P143")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1426-admin-operations-runtime-settings-docs-roadmap.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("P142.1-P142.5 reports pass", PRIOR_REPORTS.every(reportPassed));
addCheck("P142.5 checker accepts P142.6", p1425Checker.includes("p1426CurrentState") && p1425Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P142.6", enterpriseChecker.includes("p1426CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P142.7 handoff", osStatusChecker.includes('"P142.7"'));
addCheck("contract marks P142.6 complete", contract.phaseId === "P142" && p1426.status === "complete" && ((contract.status === "in_progress" && contract.currentSubphase === "P142.6" && contract.previousSubphase === "P142.5" && contract.nextSubphase === "P142.7" && p1427.status === "planned") || p1427FinalState));
addCheck("contract records expected base commit", p1426.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1426.validationCommands?.includes(command)));
addCheck("contract scope stays docs/status-only", /docs|roadmap|status/i.test(p1426.dataShape || "") && p1426.expectedExports?.length === 0 && p1426.forbiddenFiles?.includes("dashboard/src/**") && p1426.forbiddenFiles?.includes("projects/**"));
addCheck("docs record P142.6", /## P142\.6 Docs \/ Roadmap \/ Status[\s\S]*Status:\s+complete/.test(plan) && /P142\.6 Docs \/ Roadmap \/ Status is complete/i.test(readme) && /P142\.6 docs\/status closure is complete/i.test(platformRoadmap) && /P142\.6 is now complete/i.test(enterpriseRoadmap));
addCheck("phase status starts or safely hands off P142.6", p1426CurrentState || p1427FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P142.6 entries have required fields", [statusById.get("P142"), statusById.get("P142.6"), roadmapById.get("P142"), roadmapById.get("P142.6")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("P142.7 handoff remains valid", (p1426CurrentState && statusById.get("P142.7")?.status === "planned" && roadmapById.get("P142.7")?.status === "planned" && !(statusById.get("P142.7")?.checksRun || []).length && !(roadmapById.get("P142.7")?.checksRun || []).length) || p1427FinalState);
addCheck("P142.6 Playwright coverage exists", routeTests.includes("P142.6 admin settings docs status keeps roadmap and Settings display-only") && routeTests.includes("P142.7") && routeTests.includes("Final Validation") && routeTests.includes("Admin Dry Run Summary"));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("changed files stay in P142.6 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) || file === "dashboard/tests/routes.spec.js"), enforceCurrentDiffScope ? changed.join(", ") : `P142.6 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|setting|feature|runtime|admin)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid raw storage or export URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(audit|evidence|export|package|compliance|storage|secret|runtime|admin)/i.test(docsBundle));
addCheck("docs avoid fake runnable admin actions", !/apply setting now|save setting now|toggle feature now|roll out now|run maintenance now|schedule maintenance now|export audit now|view raw logs now|write db now|call provider now|run tool now|dispatch agent now|mutate project now|deploy now|release now|export now|package now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /admin settings mutation is enabled|feature toggles are enabled|feature rollout is enabled|maintenance execution is enabled|maintenance scheduling is enabled|runtime state mutation is enabled|DB writes are enabled|runtime writes are enabled|CRUD is live|audit export is enabled|raw log exposure is enabled|raw state exposure is enabled|credentials are handled|secret values are readable|provider calls are enabled|model calls are enabled|tool execution is enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|spend is enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump|raw admin payload|raw runtime payload|raw setting payload|raw feature payload/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P142.6 docs, roadmap, OS phase status, reports, and checker handoffs for admin operations runtime settings.",
        "- Confirms P142.1-P142.5 reports still pass and the P142.7 final validation handoff remains valid.",
        "- Does not mutate settings, toggle or roll out features, execute or schedule maintenance, write DB/runtime state, expose raw logs or raw state, handle credentials, read secrets, export audits, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Docs Status Coverage",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        `- Prior P142 reports passing: ${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P142.6 is docs/status/checker closure only. It does not enable admin setting mutation, feature toggles, feature rollouts, maintenance execution, maintenance scheduling, runtime state mutation, DB/runtime writes, audit export, raw log exposure, raw state exposure, credential handling, secret value reads, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. P142.7 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P142.6 Admin Operations Runtime Settings Docs Roadmap Report", phase: "P142.6" },
);

printCheckReport("P142.6 Admin Operations Runtime Settings Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
