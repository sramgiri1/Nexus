import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1335-founder-idea-to-prd-tests-checkers-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p133-founder-idea-to-prd-productization-contracts.json";
const PLAN_PATH = "docs/architecture/P133_FOUNDER_IDEA_TO_PRD_PRODUCTIZATION_PLAN.md";
const P1335_ROUTE_TEST = "P133.5 founder idea-to-PRD regression coverage keeps surfaces separated";

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

function sourceSlice(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) return "";
  return source.slice(start, end);
}

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|local|preview|read-only|in memory|tests?|checkers?|coverage|future|until|before|must not|cannot|preserve|safety boundary)\b/i.test(context);
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
const p1335 = subphaseById.get("P133.5") || {};
const p1336 = subphaseById.get("P133.6") || {};
const routeTests = readText("dashboard/tests/routes.spec.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const businessSource = readText("dashboard/src/data/businessBuild.js");
const checkerSource = readText("scripts/check-p1335-founder-idea-to-prd-tests-checkers.js");
const p1334Checker = readText("scripts/check-p1334-command-center-idea-to-prd-ux.js");
const p1333Checker = readText("scripts/check-p1333-founder-idea-to-prd-preview.js");
const p1332Checker = readText("scripts/check-p1332-founder-idea-to-prd-model.js");
const p1331Checker = readText("scripts/check-p1331-founder-idea-to-prd-productization.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1327Checker = readText("scripts/check-p1327-founder-runtime-store-live-admission-execution.js");
const legacyP904Checker = readText("scripts/check-p904-command-center-prd-lane-ux.js");
const legacyP905Checker = readText("scripts/check-p905-founder-prd-lane-validation.js");
const legacyP907Checker = readText("scripts/check-p907-founder-prd-final.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const liteSource = sourceSlice(pageSource, "function CommandCenterLitePage", "function AgentFlowPanel");
const localPrdSource = sourceSlice(pageSource, '<CommandTabPanel tabId="localPrd"', '<CommandTabPanel tabId="workstreams"');
const agentFlowSource = sourceSlice(pageSource, "function AgentFlowPanel", "function AgentFlowPage");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P133.5";
const validationCommands = [
  "npm run check:p1335-founder-idea-to-prd-tests-checkers",
  "npm run check:p1334-command-center-idea-to-prd-ux",
  "npm run check:p1333-founder-idea-to-prd-preview",
  "npm run check:p1332-founder-idea-to-prd-model",
  "npm run check:p1331-founder-idea-to-prd-productization",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:p1327-founder-runtime-store-live-admission-execution",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];
const allowedFiles = new Set([
  CONTRACT_PATH,
  PLAN_PATH,
  "dashboard/tests/routes.spec.js",
  "scripts/check-p1335-founder-idea-to-prd-tests-checkers.js",
  "scripts/check-p1334-command-center-idea-to-prd-ux.js",
  "scripts/check-p1333-founder-idea-to-prd-preview.js",
  "scripts/check-p1332-founder-idea-to-prd-model.js",
  "scripts/check-p1331-founder-idea-to-prd-productization.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  "scripts/check-p1327-founder-runtime-store-live-admission-execution.js",
  "scripts/check-p904-command-center-prd-lane-ux.js",
  "scripts/check-p905-founder-prd-lane-validation.js",
  "scripts/check-p907-founder-prd-final.js",
  "package.json",
  "README.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  REPORT_PATH,
  "reports/p1334-command-center-idea-to-prd-ux-report.md",
  "reports/p1333-founder-idea-to-prd-preview-report.md",
  "reports/p1332-founder-idea-to-prd-model-report.md",
  "reports/p1331-founder-idea-to-prd-productization-report.md",
  "reports/enterprise-readiness-roadmap-report.md",
  "reports/p1327-founder-runtime-store-live-admission-execution-report.md",
  "reports/os-phase-status-report.md",
  "reports/phase-validation-coverage-report.md",
]);
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
const p1335CompleteState =
  status.currentPhase === "P133.5"
  && status.previousPhase === "P133.4"
  && status.nextPhase === "P133.6"
  && roadmap.currentPhase === "P133.5"
  && roadmap.previousPhase === "P133.4"
  && roadmap.nextPhase === "P133.6"
  && status.current?.phaseId === "P133.5"
  && status.previous?.phaseId === "P133.4"
  && status.next?.phaseId === "P133.6"
  && roadmap.current?.phaseId === "P133.5"
  && roadmap.previous?.phaseId === "P133.4"
  && roadmap.next?.phaseId === "P133.6"
  && statusById.get("P133")?.status === "in_progress"
  && roadmapById.get("P133")?.status === "in_progress"
  && ["P133.1", "P133.2", "P133.3", "P133.4", "P133.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P133.6")?.status === "planned"
  && roadmapById.get("P133.6")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1335-founder-idea-to-prd-tests-checkers"]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("Business Build source still reuses P133 model/preview", businessSource.includes("buildFounderIdeaToPrdModel") && businessSource.includes("buildFounderIdeaToPrdPreview"));
addCheck("view model exposes ready PRD preview", viewModel.founderIdeaToPrdPreview?.ready === true && viewModel.founderIdeaToPrdPreview?.sectionCount === 8 && viewModel.founderIdeaToPrdPreview?.acceptanceCriteria?.length >= 3);
addCheck("Chat with NEXUS source stays chat-only", liteSource.includes("Send") && liteSource.includes("Reset") && liteSource.includes("Founder prompt starters") && !/Founder Idea-to-PRD Preview|Review Checklist|Acceptance Criteria|reports\/|founderIdeaToPrdPreview/i.test(liteSource));
addCheck("Business Build owns PRD preview detail", localPrdSource.includes("Founder Idea-to-PRD Preview") && localPrdSource.includes("Review Checklist") && localPrdSource.includes("Acceptance Criteria") && routeTests.includes("Local in-memory preview only"));
addCheck("Agent Flow owns PRD lane context", agentFlowSource.includes("Agent flow PRD context") && agentFlowSource.includes("PRD preview ready") && agentFlowSource.includes("Dispatch") && agentFlowSource.includes("Blocked"));
addCheck("P133.5 Playwright regression test exists", routeTests.includes(P1335_ROUTE_TEST));
addCheck("P133.5 route coverage separates surfaces", ["/command-center/lite", "/command-center/business-build", "/command-center/agent-flow", "Founder Idea-to-PRD Preview", "Agent Flow"].every((text) => routeTests.includes(text)));
addCheck("P133.5 route coverage checks all themes", routeTests.includes('["dark", "light", "system"]') && routeTests.includes("getThemeState(page)") && routeTests.includes("rootTheme"));
addCheck("route-wide safety assertions retained", routeTests.includes("DemoApp") && routeTests.includes("raw JSON") && routeTests.includes("private-project-") && routeTests.includes("dispatch agent now") && routeTests.includes("Bearer") && routeTests.includes("postgres"));
addCheck("legacy PRD checkers accept renamed Local PRD coverage", [legacyP904Checker, legacyP905Checker, legacyP907Checker].every((source) => source.includes("Business Build Local PRD tab shows safe idea-to-PRD preview")));
addCheck("P133.4 checker accepts P133.5 handoff", p1334Checker.includes("p1335CompleteState") && p1334Checker.includes('status.currentPhase === "P133.5"') && p1334Checker.includes("check:p1335-founder-idea-to-prd-tests-checkers"));
addCheck("prior P133 checkers accept P133.5", [p1333Checker, p1332Checker, p1331Checker].every((source) => source.includes("p1335CompleteState") && source.includes('status.currentPhase === "P133.5"')));
addCheck("enterprise and P132.7 checkers accept P133.5", enterpriseChecker.includes("p1335CompleteState") && enterpriseChecker.includes("check:p1335-founder-idea-to-prd-tests-checkers") && p1327Checker.includes("p1335CompleteState") && p1327Checker.includes('status.currentPhase === "P133.5"'));
addCheck("prior P133 reports pass", [
  "reports/p1334-command-center-idea-to-prd-ux-report.md",
  "reports/p1333-founder-idea-to-prd-preview-report.md",
  "reports/p1332-founder-idea-to-prd-model-report.md",
  "reports/p1331-founder-idea-to-prd-productization-report.md",
].every(reportPassed));
addCheck("contract marks P133.5 complete", contract.status === "in_progress" && contract.currentSubphase === "P133.5" && contract.previousSubphase === "P133.4" && contract.nextSubphase === "P133.6" && p1335.status === "complete");
addCheck("contract records P133.5 implementation scope", p1335.expectedBaseCommit === "d286e640" && p1335.allowedFiles?.includes("dashboard/tests/routes.spec.js") && p1335.allowedFiles?.includes("scripts/check-p1335-founder-idea-to-prd-tests-checkers.js"));
addCheck("P133.6 handoff remains planned-only", p1336.status === "planned" && statusById.get("P133.6")?.status === "planned" && roadmapById.get("P133.6")?.status === "planned");
addCheck("P133.5 records validation commands", validationCommands.every((command) => p1335.validationCommands?.includes(command)));
addCheck("P133 plan records P133.5", /## P133\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P133.5", /P133\.5 founder idea-to-PRD tests/i.test(readme));
addCheck("platform roadmap records P133.5", /P133\.5 is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P133.5", (/P133\.5 is now complete/i.test(enterpriseRoadmap) || /P133\.1-P133\.5 are now complete/i.test(enterpriseRoadmap)) && /P133\.6 is the next executable subphase/i.test(enterpriseRoadmap));
addCheck("phase status advanced", p1335CompleteState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P133.5 entries have required fields", [statusById.get("P133"), statusById.get("P133.5"), roadmapById.get("P133.5")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("changed files stay in P133.5 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P133.5 forbidden path check relaxed for ${status.currentPhase}`);
const primaryUxBundle = `${liteSource}\n${localPrdSource}\n${agentFlowSource}\n${JSON.stringify(viewModel.founderIdeaToPrdPreview)}\n${JSON.stringify(viewModel.founderIdeaToPrdModel)}`;
addCheck("primary UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(primaryUxBundle));
addCheck("primary UX avoids fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|write hosted db now|execute now/i.test(primaryUxBundle));
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /autonomous Q&A is enabled|PRD generation is enabled|provider PRD generation is enabled|agent dispatch is enabled|project mutation is enabled|DB writes are enabled|runtime writes are enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|provider spend is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P133.5 aggregate tests/checkers for founder idea-to-PRD productization.",
        "- Confirms Chat with NEXUS remains chat-only, Business Build owns PRD detail, and Agent Flow owns lane context.",
        "- Confirms this subphase does not call providers/models, dispatch agents, mutate projects, write DB/runtime state, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P133.5 adds regression coverage only. P133.6-P133.7 remain planned-only, and live Q&A execution, provider/model PRD generation, agent dispatch, project mutation, DB/runtime writes, deploy, export, package creation, network calls, and provider spend remain blocked.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P133.5 Founder Idea-to-PRD Tests and Checkers Report", phase: "P133.5" },
);

printCheckReport("P133.5 Founder Idea-to-PRD Tests and Checkers Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
