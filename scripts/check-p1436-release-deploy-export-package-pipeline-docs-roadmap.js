import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1436-release-deploy-export-package-pipeline-docs-roadmap-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p143-release-deploy-export-package-pipeline-contracts.json";
const PLAN_PATH = "docs/architecture/P143_RELEASE_DEPLOY_EXPORT_PACKAGE_PIPELINE_PLAN.md";
const REQUIRED_SCRIPT = "check:p1436-release-deploy-export-package-pipeline-docs-roadmap";
const NEXT_SCRIPT = "check:p1437-release-deploy-export-package-pipeline-final-validation";
const EXPECTED_BASE_COMMIT = "56dc6cbd";
const PRIOR_REPORTS = [
  "reports/p1431-release-deploy-export-package-pipeline-report.md",
  "reports/p1432-release-deploy-export-package-pipeline-report.md",
  "reports/p1433-release-deploy-export-package-pipeline-report.md",
  "reports/p1434-release-deploy-export-package-pipeline-report.md",
  "reports/p1435-release-deploy-export-package-pipeline-report.md",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1436-release-deploy-export-package-pipeline-docs-roadmap",
  "npm run check:p1435-release-deploy-export-package-pipeline",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P143.6|Command Center route-wide UX\"",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|handoff|aggregate|coverage|closure|tests?)\b/i.test(context);
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
const p1436 = subphaseById.get("P143.6") || {};
const p1437 = subphaseById.get("P143.7") || {};
const checkerSource = readText("scripts/check-p1436-release-deploy-export-package-pipeline-docs-roadmap.js");
const p1435Checker = readText("scripts/check-p1435-release-deploy-export-package-pipeline.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P143.6";
const allowedFiles = new Set(p1436.allowedFiles || []);
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

const p1436CurrentState =
  status.currentPhase === "P143.6"
  && status.previousPhase === "P143.5"
  && status.nextPhase === "P143.7"
  && roadmap.currentPhase === "P143.6"
  && roadmap.previousPhase === "P143.5"
  && roadmap.nextPhase === "P143.7"
  && status.current?.phaseId === "P143.6"
  && status.previous?.phaseId === "P143.5"
  && status.next?.phaseId === "P143.7"
  && roadmap.current?.phaseId === "P143.6"
  && roadmap.previous?.phaseId === "P143.5"
  && roadmap.next?.phaseId === "P143.7"
  && statusById.get("P143")?.status === "in_progress"
  && roadmapById.get("P143")?.status === "in_progress"
  && ["P143.1", "P143.2", "P143.3", "P143.4", "P143.5", "P143.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P143.7")?.status === "planned"
  && roadmapById.get("P143.7")?.status === "planned";
const p1437FinalState =
  status.currentPhase === "P143.7"
  && status.previousPhase === "P143.6"
  && status.nextPhase === "P144"
  && roadmap.currentPhase === "P143.7"
  && roadmap.previousPhase === "P143.6"
  && roadmap.nextPhase === "P144"
  && statusById.get("P143")?.status === "complete"
  && roadmapById.get("P143")?.status === "complete"
  && ["P143.1", "P143.2", "P143.3", "P143.4", "P143.5", "P143.6", "P143.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P144")?.status === "planned"
  && roadmapById.get("P144")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1436-release-deploy-export-package-pipeline-docs-roadmap.js");
addCheck("P143.7 final checker registered when complete", !p1437FinalState || packageJson.scripts?.[NEXT_SCRIPT] === "node scripts/check-p1437-release-deploy-export-package-pipeline-final-validation.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("P143.1-P143.5 reports pass", PRIOR_REPORTS.every(reportPassed), `${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`);
addCheck("P143.5 checker accepts P143.6", p1435Checker.includes("p1436CurrentState") && p1435Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P143.6", enterpriseChecker.includes("p1436CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P143.7 handoff", osStatusChecker.includes('"P143.7"'));
addCheck("contract marks P143.6 complete", contract.phaseId === "P143" && p1436.status === "complete" && ((contract.status === "in_progress" && contract.currentSubphase === "P143.6" && contract.previousSubphase === "P143.5" && contract.nextSubphase === "P143.7" && p1437.status === "planned") || p1437FinalState));
addCheck("contract records expected base commit", p1436.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1436.validationCommands?.includes(command)));
addCheck("contract scope stays docs/status-only", /docs|roadmap|status/i.test(p1436.dataShape || "") && p1436.expectedExports?.length === 0 && p1436.forbiddenFiles?.includes("dashboard/src/**") && p1436.forbiddenFiles?.includes("projects/**"));
addCheck("docs record P143.6", /## P143\.6 Docs \/ Roadmap \/ Status[\s\S]*Status:\s+complete/.test(plan) && /P143\.6 Docs \/ Roadmap \/ Status is complete/i.test(readme) && /P143\.6 docs\/status closure is complete/i.test(platformRoadmap) && /P143\.6 is now complete/i.test(enterpriseRoadmap));
addCheck("phase status starts or safely hands off P143.6", p1436CurrentState || p1437FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P143.6 entries have required fields", [statusById.get("P143"), statusById.get("P143.6"), roadmapById.get("P143"), roadmapById.get("P143.6")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations) && entry.commandCenterVisible === true));
addCheck("P143.7 handoff remains valid", (p1436CurrentState && statusById.get("P143.7")?.status === "planned" && roadmapById.get("P143.7")?.status === "planned" && !(statusById.get("P143.7")?.checksRun || []).length && !(roadmapById.get("P143.7")?.checksRun || []).length) || p1437FinalState);
addCheck("P143.6 Playwright coverage exists", routeTests.includes("P143.6 shipping docs status keeps roadmap and shipping pages display-only") && routeTests.includes("P143.7") && routeTests.includes("Final Validation") && routeTests.includes("Release and package preview"));
addCheck("route-wide safety coverage retained", ["full Command Center routes do not show DemoApp", "every primary route has a heading, state block, and no raw JSON dump", "theme switcher exists globally", "OS Roadmap shows NEXUS OS platform progress without project-roadmap leakage"].every((text) => routeTests.includes(text)));
addCheck("changed files stay in P143.6 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) || file === "dashboard/tests/routes.spec.js"), enforceCurrentDiffScope ? changed.join(", ") : `P143.6 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|release|deploy|export|package|rollback|artifact|provenance)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid raw storage or export URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(audit|evidence|export|package|release|deploy|storage|secret|artifact|provenance)/i.test(docsBundle));
addCheck("docs avoid fake runnable shipping actions", !/create release now|create package now|start deploy now|deploy now|run rollback now|rollback now|run export now|export now|package now|apply patch now|run build now|run tests now|write db now|call provider now|run tool now|dispatch agent now|mutate project now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /release package creation is enabled|deploy start is enabled|rollback execution is enabled|export execution is enabled|package build is enabled|patch application is enabled|build execution is enabled|test execution is enabled|DB writes are enabled|runtime writes are enabled|provider calls are enabled|model calls are enabled|tool execution is enabled|agent dispatch is enabled|project mutation is enabled|network calls are enabled|spend is enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump|raw release payload|raw deploy payload|raw export payload|raw package payload|raw provenance payload/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P143.6 docs, roadmap, OS phase status, reports, and checker handoffs for release, deploy, export, and package pipeline.",
        "- Confirms P143.1-P143.5 reports still pass and the P143.7 final validation handoff remains valid.",
        "- Does not create release packages, start deploys, execute rollbacks, run exports, build packages, apply patches, run build/test commands, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Docs Status Coverage",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        `- Prior P143 reports passing: ${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P143.6 is docs/status/checker closure only. It does not enable release package creation, deploy start, rollback execution, export execution, package build, patch application, build/test execution, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, network calls, or spend. P143.7 may now be complete as final validation while P144 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P143.6 Release Deploy Export Package Pipeline Docs Roadmap Report", phase: "P143.6" },
);

printCheckReport("P143.6 Release Deploy Export Package Pipeline Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
