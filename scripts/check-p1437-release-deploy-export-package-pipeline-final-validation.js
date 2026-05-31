import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1437-release-deploy-export-package-pipeline-final-validation-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p143-release-deploy-export-package-pipeline-contracts.json";
const PLAN_PATH = "docs/architecture/P143_RELEASE_DEPLOY_EXPORT_PACKAGE_PIPELINE_PLAN.md";
const REQUIRED_SCRIPT = "check:p1437-release-deploy-export-package-pipeline-final-validation";
const EXPECTED_BASE_COMMIT = "a9d13072";
const PRIOR_REPORTS = [
  "reports/p1431-release-deploy-export-package-pipeline-report.md",
  "reports/p1432-release-deploy-export-package-pipeline-report.md",
  "reports/p1433-release-deploy-export-package-pipeline-report.md",
  "reports/p1434-release-deploy-export-package-pipeline-report.md",
  "reports/p1435-release-deploy-export-package-pipeline-report.md",
  "reports/p1436-release-deploy-export-package-pipeline-docs-roadmap-report.md",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1437-release-deploy-export-package-pipeline-final-validation",
  "npm run check:p1436-release-deploy-export-package-pipeline-docs-roadmap",
  "npm run check:p1435-release-deploy-export-package-pipeline",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P143.7|Command Center route-wide UX\"",
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
const p143 = statusById.get("P143") || {};
const p143Roadmap = roadmapById.get("P143") || {};
const p1437 = subphaseById.get("P143.7") || {};
const checkerSource = readText("scripts/check-p1437-release-deploy-export-package-pipeline-final-validation.js");
const p1436Checker = readText("scripts/check-p1436-release-deploy-export-package-pipeline-docs-roadmap.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P143.7";
const allowedFiles = new Set(p1437.allowedFiles || []);
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

const p1437FinalState =
  status.currentPhase === "P143.7"
  && status.previousPhase === "P143.6"
  && status.nextPhase === "P144"
  && roadmap.currentPhase === "P143.7"
  && roadmap.previousPhase === "P143.6"
  && roadmap.nextPhase === "P144"
  && status.current?.phaseId === "P143.7"
  && status.previous?.phaseId === "P143.6"
  && status.next?.phaseId === "P144"
  && roadmap.current?.phaseId === "P143.7"
  && roadmap.previous?.phaseId === "P143.6"
  && roadmap.next?.phaseId === "P144"
  && p143.status === "complete"
  && p143Roadmap.status === "complete"
  && ["P143.1", "P143.2", "P143.3", "P143.4", "P143.5", "P143.6", "P143.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P144")?.status === "planned"
  && roadmapById.get("P144")?.status === "planned";
const p1441StartedState =
  status.currentPhase === "P144.1"
  && status.previousPhase === "P143.7"
  && status.nextPhase === "P144.2"
  && roadmap.currentPhase === "P144.1"
  && roadmap.previousPhase === "P143.7"
  && roadmap.nextPhase === "P144.2"
  && status.current?.phaseId === "P144.1"
  && status.previous?.phaseId === "P143.7"
  && status.next?.phaseId === "P144.2"
  && roadmap.current?.phaseId === "P144.1"
  && roadmap.previous?.phaseId === "P143.7"
  && roadmap.next?.phaseId === "P144.2"
  && p143.status === "complete"
  && p143Roadmap.status === "complete"
  && ["P143.1", "P143.2", "P143.3", "P143.4", "P143.5", "P143.6", "P143.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P144")?.status === "in_progress"
  && roadmapById.get("P144")?.status === "in_progress"
  && statusById.get("P144.1")?.status === "complete"
  && roadmapById.get("P144.1")?.status === "complete"
  && statusById.get("P144.2")?.status === "planned"
  && roadmapById.get("P144.2")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1437-release-deploy-export-package-pipeline-final-validation.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("prior P143 reports pass", PRIOR_REPORTS.every(reportPassed), `${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`);
addCheck("P143.6 checker accepts P143.7 final state", p1436Checker.includes("p1437FinalState") && p1436Checker.includes('status.currentPhase === "P143.7"') && p1436Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P143.7 final state", enterpriseChecker.includes("p1437FinalState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P144 handoff", osStatusChecker.includes('"P144"'));
addCheck("contract closes P143.7", contract.phaseId === "P143" && contract.status === "complete" && contract.currentSubphase === "P143.7" && contract.previousSubphase === "P143.6" && contract.nextSubphase === "P144" && p1437.status === "complete");
addCheck("contract records expected base commit", p1437.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1437.validationCommands?.includes(command)));
addCheck("contract scope stays final-validation-only", /final validation|validation-only|status|report/i.test(p1437.dataShape || "") && p1437.expectedExports?.length === 0 && p1437.forbiddenFiles?.includes("dashboard/src/**") && p1437.forbiddenFiles?.includes("projects/**"));
addCheck("docs record P143.7 and P144 handoff", /## P143\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P143\.7 Final Validation is complete/i.test(readme) && /P143\.7 final validation is complete/i.test(platformRoadmap) && /P143\.7 is now complete/i.test(enterpriseRoadmap) && (/P144 is planned-only next/i.test(enterpriseRoadmap) || (p1441StartedState && /P144\.1 is now complete as contract\/policy\/safety-boundary only/i.test(enterpriseRoadmap) && /P144\.2 is planned-only next/i.test(enterpriseRoadmap))));
addCheck("phase status closes P143.7", p1437FinalState || p1441StartedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P143/P143.7 entries have required fields", [p143, statusById.get("P143.7"), p143Roadmap, roadmapById.get("P143.7")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("P143.7 remains on OS Roadmap track", [status.current, roadmap.current, statusById.get("P143.7"), roadmapById.get("P143.7")].every((entry) => entry?.track === "NEXUS_OS"));
addCheck("P144 handoff remains valid", p1437FinalState
  ? [statusById.get("P144"), roadmapById.get("P144")].every((entry) => entry?.status === "planned" && entry.commit === "" && Array.isArray(entry.checksRun) && entry.checksRun.length === 0)
  : p1441StartedState);
addCheck("P143.7 Playwright coverage exists", routeTests.includes("P143.7 release pipeline final validation closes P143 and keeps shipping pages display-only") && routeTests.includes("P143.7") && routeTests.includes("Final Validation") && routeTests.includes("P144") && routeTests.includes("Billing, Metering, and Customer Operations"));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("changed files stay in P143.7 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) || file === "dashboard/tests/routes.spec.js"), enforceCurrentDiffScope ? changed.join(", ") : `P143.7 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|setting|feature|runtime|admin)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid raw storage or export URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(audit|evidence|export|package|compliance|storage|secret|runtime|admin|deploy|release)/i.test(docsBundle));
addCheck("docs avoid fake runnable shipping actions", !/create release now|create release package now|create package now|start deploy now|deploy now|run rollback now|rollback now|run export now|export now|package now|apply patch now|run build now|run tests now|write db now|call provider now|run tool now|dispatch agent now|mutate project now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /release package creation is enabled|deploy is enabled|rollback execution is enabled|export execution is enabled|package creation is enabled|package build is enabled|patch application is enabled|build execution is enabled|test execution is enabled|DB writes are enabled|runtime writes are enabled|CRUD is live|provider calls are enabled|model calls are enabled|tool execution is enabled|agent dispatch is enabled|project mutation is enabled|network calls are enabled|spend is enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump|raw release payload|raw deploy payload|raw export payload|raw package payload|raw provenance payload/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P143.7 final validation for release, deploy, export, and package pipeline.",
        `- Confirms P143.1-P143.6 reports still pass and ${p1441StartedState ? "P144.1 is complete with P144.2 planned-only next" : "P144 remains planned-only"}.`,
        "- Does not create release packages, start deploys, execute rollbacks, run exports, build packages, apply patches, run build/test commands, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Final Validation Coverage",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next phase/subphase: ${status.nextPhase}`,
        `- Prior P143 reports passing: ${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: `- P143.7 is final validation only. It closes P143 but does not enable release package creation, deploy start, rollback execution, export execution, package build, patch application, build/test execution, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, network calls, or spend. ${p1441StartedState ? "P144.1 is complete as contract/policy/safety-boundary work and P144.2-P144.7 remain planned-only." : "P144 remains planned-only."}`,
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P143.7 Release Deploy Export Package Pipeline Final Validation Report", phase: "P143.7" },
);

printCheckReport("P143.7 Release Deploy Export Package Pipeline Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
