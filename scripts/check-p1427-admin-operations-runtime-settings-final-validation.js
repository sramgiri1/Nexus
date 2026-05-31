import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1427-admin-operations-runtime-settings-final-validation-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p142-admin-operations-runtime-settings-contracts.json";
const PLAN_PATH = "docs/architecture/P142_ADMIN_OPERATIONS_RUNTIME_SETTINGS_PLAN.md";
const REQUIRED_SCRIPT = "check:p1427-admin-operations-runtime-settings-final-validation";
const EXPECTED_BASE_COMMIT = "abce8b53";
const PRIOR_REPORTS = [
  "reports/p1421-admin-operations-runtime-settings-report.md",
  "reports/p1422-admin-operations-runtime-settings-report.md",
  "reports/p1423-admin-operations-runtime-settings-report.md",
  "reports/p1424-admin-operations-runtime-settings-report.md",
  "reports/p1425-admin-operations-runtime-settings-report.md",
  "reports/p1426-admin-operations-runtime-settings-docs-roadmap-report.md",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1427-admin-operations-runtime-settings-final-validation",
  "npm run check:p1426-admin-operations-runtime-settings-docs-roadmap",
  "npm run check:p1425-admin-operations-runtime-settings",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P142.7|Command Center route-wide UX\"",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|handoff|aggregate|coverage|closure|final validation)\b/i.test(context);
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
const p142 = statusById.get("P142") || {};
const p142Roadmap = roadmapById.get("P142") || {};
const p1427 = subphaseById.get("P142.7") || {};
const checkerSource = readText("scripts/check-p1427-admin-operations-runtime-settings-final-validation.js");
const p1426Checker = readText("scripts/check-p1426-admin-operations-runtime-settings-docs-roadmap.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P142.7";
const allowedFiles = new Set(p1427.allowedFiles || []);
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

const p1427FinalState =
  status.currentPhase === "P142.7"
  && status.previousPhase === "P142.6"
  && status.nextPhase === "P143"
  && roadmap.currentPhase === "P142.7"
  && roadmap.previousPhase === "P142.6"
  && roadmap.nextPhase === "P143"
  && status.current?.phaseId === "P142.7"
  && status.previous?.phaseId === "P142.6"
  && status.next?.phaseId === "P143"
  && roadmap.current?.phaseId === "P142.7"
  && roadmap.previous?.phaseId === "P142.6"
  && roadmap.next?.phaseId === "P143"
  && p142.status === "complete"
  && p142Roadmap.status === "complete"
  && ["P142.1", "P142.2", "P142.3", "P142.4", "P142.5", "P142.6", "P142.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P143")?.status === "planned"
  && roadmapById.get("P143")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1427-admin-operations-runtime-settings-final-validation.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("prior P142 reports pass", PRIOR_REPORTS.every(reportPassed), `${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`);
addCheck("P142.6 checker accepts P142.7 final state", p1426Checker.includes("p1427FinalState") && p1426Checker.includes('status.currentPhase === "P142.7"') && p1426Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P142.7 final state", enterpriseChecker.includes("p1427FinalState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P143 handoff", osStatusChecker.includes('"P143"'));
addCheck("contract closes P142.7", contract.phaseId === "P142" && contract.status === "complete" && contract.currentSubphase === "P142.7" && contract.previousSubphase === "P142.6" && contract.nextSubphase === "P143" && p1427.status === "complete");
addCheck("contract records expected base commit", p1427.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1427.validationCommands?.includes(command)));
addCheck("contract scope stays final-validation-only", /final validation|validation-only|status|report/i.test(p1427.dataShape || "") && p1427.expectedExports?.length === 0 && p1427.forbiddenFiles?.includes("dashboard/src/**") && p1427.forbiddenFiles?.includes("projects/**"));
addCheck("docs record P142.7 and P143 handoff", /## P142\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P142\.7\s+final validation is complete/i.test(readme) && /P142\.7\s+final validation is complete/i.test(platformRoadmap) && /P142\.7 is now complete/i.test(enterpriseRoadmap) && /P143 is planned-only next/i.test(enterpriseRoadmap));
addCheck("phase status closes P142.7", p1427FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P142/P142.7 entries have required fields", [p142, statusById.get("P142.7"), p142Roadmap, roadmapById.get("P142.7")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("P142.7 remains on OS Roadmap track", [status.current, roadmap.current, statusById.get("P142.7"), roadmapById.get("P142.7")].every((entry) => entry?.track === "NEXUS_OS"));
addCheck("P143 handoff remains planned-only", [statusById.get("P143"), roadmapById.get("P143")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0));
addCheck("P142.7 Playwright coverage exists", routeTests.includes("P142.7 admin settings final validation closes P142 and keeps Settings display-only") && routeTests.includes("P142.7") && routeTests.includes("Final Validation") && routeTests.includes("P143") && routeTests.includes("Release, Deploy, Export, and Package Pipeline"));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("changed files stay in P142.7 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) || file === "dashboard/tests/routes.spec.js"), enforceCurrentDiffScope ? changed.join(", ") : `P142.7 forbidden path check relaxed for ${status.currentPhase}`);
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
        "- Closes P142.7 final validation for admin operations and runtime settings.",
        "- Confirms P142.1-P142.6 reports still pass and P143 remains planned-only.",
        "- Does not mutate settings, toggle or roll out features, execute or schedule maintenance, write DB/runtime state, expose raw logs or raw state, handle credentials, read secrets, export audits, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Final Validation Coverage",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next phase/subphase: ${status.nextPhase}`,
        `- Prior P142 reports passing: ${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P142.7 is final validation only. It closes P142 but does not enable admin setting mutation, feature toggles, feature rollouts, maintenance execution, maintenance scheduling, runtime state mutation, DB/runtime writes, audit export, raw log exposure, raw state exposure, credential handling, secret value reads, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. P143 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P142.7 Admin Operations Runtime Settings Final Validation Report", phase: "P142.7" },
);

printCheckReport("P142.7 Admin Operations Runtime Settings Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
