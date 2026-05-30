import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1334-command-center-idea-to-prd-ux-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p133-founder-idea-to-prd-productization-contracts.json";
const PLAN_PATH = "docs/architecture/P133_FOUNDER_IDEA_TO_PRD_PRODUCTIZATION_PLAN.md";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|local|preview|read-only|in memory|future|until|before|must not|cannot|preserve|safety boundary)\b/i.test(context);
  });
}

function sourceSlice(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) return "";
  return source.slice(start, end);
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
const p1334 = subphaseById.get("P133.4") || {};
const p1335 = subphaseById.get("P133.5") || {};
const businessSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1333Checker = readText("scripts/check-p1333-founder-idea-to-prd-preview.js");
const p1332Checker = readText("scripts/check-p1332-founder-idea-to-prd-model.js");
const p1331Checker = readText("scripts/check-p1331-founder-idea-to-prd-productization.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1327Checker = readText("scripts/check-p1327-founder-runtime-store-live-admission-execution.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const liteSource = sourceSlice(pageSource, "function CommandCenterLitePage", "function AgentFlowPanel");
const localPrdSource = sourceSlice(pageSource, '<CommandTabPanel tabId="localPrd"', '<CommandTabPanel tabId="workstreams"');
const agentFlowSource = sourceSlice(pageSource, "function AgentFlowPanel", "function AgentFlowPage");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P133.4";
const allowedFiles = new Set([
  CONTRACT_PATH,
  PLAN_PATH,
  "dashboard/src/data/businessBuild.js",
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/tests/routes.spec.js",
  "scripts/check-p1334-command-center-idea-to-prd-ux.js",
  "scripts/check-p1333-founder-idea-to-prd-preview.js",
  "scripts/check-p1332-founder-idea-to-prd-model.js",
  "scripts/check-p1331-founder-idea-to-prd-productization.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  "scripts/check-p1327-founder-runtime-store-live-admission-execution.js",
  "package.json",
  "README.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  REPORT_PATH,
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
const validationCommands = [
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
const p1334CompleteState =
  status.currentPhase === "P133.4"
  && status.previousPhase === "P133.3"
  && status.nextPhase === "P133.5"
  && roadmap.currentPhase === "P133.4"
  && roadmap.previousPhase === "P133.3"
  && roadmap.nextPhase === "P133.5"
  && status.current?.phaseId === "P133.4"
  && status.previous?.phaseId === "P133.3"
  && status.next?.phaseId === "P133.5"
  && roadmap.current?.phaseId === "P133.4"
  && roadmap.previous?.phaseId === "P133.3"
  && roadmap.next?.phaseId === "P133.5"
  && statusById.get("P133")?.status === "in_progress"
  && roadmapById.get("P133")?.status === "in_progress"
  && statusById.get("P133.3")?.status === "complete"
  && roadmapById.get("P133.3")?.status === "complete"
  && statusById.get("P133.4")?.status === "complete"
  && roadmapById.get("P133.4")?.status === "complete"
  && statusById.get("P133.5")?.status === "planned"
  && roadmapById.get("P133.5")?.status === "planned";
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
  && statusById.get("P133.4")?.status === "complete"
  && roadmapById.get("P133.4")?.status === "complete"
  && statusById.get("P133.5")?.status === "complete"
  && roadmapById.get("P133.5")?.status === "complete"
  && statusById.get("P133.6")?.status === "planned"
  && roadmapById.get("P133.6")?.status === "planned";
const p1336CompleteState =
  status.currentPhase === "P133.6"
  && status.previousPhase === "P133.5"
  && status.nextPhase === "P133.7"
  && roadmap.currentPhase === "P133.6"
  && roadmap.previousPhase === "P133.5"
  && roadmap.nextPhase === "P133.7"
  && status.current?.phaseId === "P133.6"
  && status.previous?.phaseId === "P133.5"
  && status.next?.phaseId === "P133.7"
  && roadmap.current?.phaseId === "P133.6"
  && roadmap.previous?.phaseId === "P133.5"
  && roadmap.next?.phaseId === "P133.7"
  && statusById.get("P133")?.status === "in_progress"
  && roadmapById.get("P133")?.status === "in_progress"
  && ["P133.4", "P133.5", "P133.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P133.7")?.status === "planned"
  && roadmapById.get("P133.7")?.status === "planned";
const p1334CompatibleState = p1334CompleteState || p1335CompleteState || p1336CompleteState;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1334-command-center-idea-to-prd-ux"]));
addCheck("Business Build reuses P133 model and preview helpers", businessSource.includes("buildFounderIdeaToPrdModel") && businessSource.includes("buildFounderIdeaToPrdPreview"));
addCheck("Business Build exposes P133 display models", businessSource.includes("founderIdeaToPrdModel") && businessSource.includes("founderIdeaToPrdPreview"));
addCheck("view model contains model readiness", viewModel.founderIdeaToPrdModel?.readinessScore === 100 && viewModel.founderIdeaToPrdModel?.feasibilityRows?.length >= 7);
addCheck("view model contains safe PRD preview", viewModel.founderIdeaToPrdPreview?.ready === true && viewModel.founderIdeaToPrdPreview?.sectionCount === 8 && viewModel.founderIdeaToPrdPreview?.acceptanceCriteria?.length >= 3);
addCheck("view model keeps unsafe operations blocked", viewModel.founderIdeaToPrdPreview?.safetyRows?.every((row) => row.value === "Blocked") && viewModel.founderIdeaToPrdModel?.safetyRows?.every((row) => row.value === "Blocked"));
addCheck("chat page remains chat-only", liteSource.includes("Founder Chat") && liteSource.includes("Send") && liteSource.includes("Reset") && liteSource.includes("Founder prompt starters") && !/Local PRD|Founder DB|Business Build DB|reports\/|evidenceLocation|costImpact|founderIdeaToPrdPreview/i.test(liteSource));
addCheck("chat page preserves safety note", liteSource.includes("Planning only: NEXUS will not call providers") && liteSource.includes("from chat"));
addCheck("Business Build Local PRD renders P133 preview", localPrdSource.includes("Founder Idea-to-PRD Preview") && localPrdSource.includes("Review Checklist") && localPrdSource.includes("Acceptance Criteria") && localPrdSource.includes("founderIdeaToPrdPreview") && viewModel.founderIdeaToPrdPreview?.evidenceLocation === "P133.3 preview report");
addCheck("Agent Flow includes PRD context without dispatch", agentFlowSource.includes("Agent flow PRD context") && agentFlowSource.includes("PRD preview ready") && agentFlowSource.includes("Dispatch") && agentFlowSource.includes("Blocked"));
addCheck("Playwright covers P133.4 UX", routeTests.includes("PRD preview ready") && routeTests.includes("Founder Idea-to-PRD Preview") && routeTests.includes("Acceptance Criteria") && routeTests.includes("Local in-memory preview only"));
addCheck("route-wide safety assertions remain", routeTests.includes("DemoApp") && routeTests.includes("raw JSON") && routeTests.includes("private-project-") && routeTests.includes("dispatch agent now") && routeTests.includes("Use dark theme") && routeTests.includes("Use light theme") && routeTests.includes("Use system theme"));
addCheck("contract marks P133.4 complete", contract.status === "in_progress" && p1334.status === "complete" && ((contract.currentSubphase === "P133.4" && contract.previousSubphase === "P133.3" && contract.nextSubphase === "P133.5") || (contract.currentSubphase === "P133.5" && contract.previousSubphase === "P133.4" && contract.nextSubphase === "P133.6") || (contract.currentSubphase === "P133.6" && contract.previousSubphase === "P133.5" && contract.nextSubphase === "P133.7")));
addCheck("contract records P133.4 implementation scope", p1334.allowedFiles?.includes("dashboard/src/data/businessBuild.js") && p1334.allowedFiles?.includes("dashboard/src/pages/CommandCenterV2.jsx") && p1334.allowedFiles?.includes("dashboard/tests/routes.spec.js") && p1334.expectedExports?.includes("founderIdeaToPrdPreview"));
addCheck("P133.5 handoff remains safe", (p1335.status === "planned" && statusById.get("P133.5")?.status === "planned" && roadmapById.get("P133.5")?.status === "planned") || (p1335.status === "complete" && (p1335CompleteState || p1336CompleteState)));
addCheck("P133.4 records validation commands", validationCommands.every((command) => p1334.validationCommands?.includes(command)));
addCheck("previous P133 checkers accept P133.4 handoff", p1333Checker.includes("p1334CompleteState") && p1332Checker.includes("p1334CompleteState") && p1331Checker.includes("p1334CompleteState"));
addCheck("enterprise and P132.7 checkers accept P133.4/P133.5", enterpriseChecker.includes("p1334CompleteState") && enterpriseChecker.includes("p1335CompleteState") && enterpriseChecker.includes("check:p1334-command-center-idea-to-prd-ux") && enterpriseChecker.includes("check:p1335-founder-idea-to-prd-tests-checkers") && p1327Checker.includes("p1334CompleteState") && p1327Checker.includes("p1335CompleteState") && p1327Checker.includes('status.currentPhase === "P133.5"'));
addCheck("prior P133 reports pass", reportPassed("reports/p1333-founder-idea-to-prd-preview-report.md") && reportPassed("reports/p1332-founder-idea-to-prd-model-report.md") && reportPassed("reports/p1331-founder-idea-to-prd-productization-report.md"));
addCheck("P133 plan records P133.4", /## P133\.4 Chat and PRD Command Center UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P133.4", /P133\.4 Command Center idea-to-PRD UX/i.test(readme));
addCheck("platform roadmap records P133.4", /P133\.4 is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P133.4", (/P133\.4 is now complete/i.test(enterpriseRoadmap) || /P133\.1, P133\.2, P133\.3, and P133\.4 are now complete/i.test(enterpriseRoadmap) || /P133\.1-P133\.5 are now complete/i.test(enterpriseRoadmap) || /P133\.1-P133\.6 are now complete/i.test(enterpriseRoadmap)) && (/P133\.5 is the next executable subphase/i.test(enterpriseRoadmap) || /P133\.6 is the next executable subphase/i.test(enterpriseRoadmap) || /P133\.7 is the next executable subphase/i.test(enterpriseRoadmap)));
addCheck("phase status advanced", p1334CompatibleState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P133.4 entries have required fields", [statusById.get("P133"), statusById.get("P133.4"), roadmapById.get("P133.4")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("changed files stay in P133.4 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P133.4 forbidden path check relaxed for ${status.currentPhase}`);
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
        "- Validates P133.4 Command Center rendering for the founder idea-to-PRD model and safe PRD preview.",
        "- Confirms Chat with NEXUS remains chat-only while Business Build owns PRD detail and Agent Flow owns lane context.",
        "- Confirms this subphase does not call providers/models, dispatch agents, mutate projects, write DB/runtime state, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P133.4 renders local Command Center UX only. Live Q&A execution, provider/model PRD generation, agent dispatch, project mutation, DB/runtime writes, deploy, export, package creation, network calls, and provider spend remain blocked.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P133.4 Command Center Idea-to-PRD UX Report", phase: "P133.4" },
);

printCheckReport("P133.4 Command Center Idea-to-PRD UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
