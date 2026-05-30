import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildProjectPatchBuildPreview,
  validateProjectPatchBuildPreview,
} from "../shared/projectPatchBuildPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1384-project-workspace-mutation-build-pipeline-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p138-project-workspace-mutation-build-pipeline-contracts.json";
const PLAN_PATH = "docs/architecture/P138_PROJECT_WORKSPACE_MUTATION_BUILD_PIPELINE_PLAN.md";
const REQUIRED_SCRIPT = "check:p1384-project-workspace-mutation-build-pipeline";
const EXPECTED_BASE_COMMIT = "7f7cd7f4";
const VALIDATION_COMMANDS = [
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|checker|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|approval|rollback|explicitly allows|model|summary|withheld)\b/i.test(context);
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
const p1384 = subphaseById.get("P138.4") || {};
const p1385 = subphaseById.get("P138.5") || {};
const p1386 = subphaseById.get("P138.6") || {};
const p1387 = subphaseById.get("P138.7") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1381Checker = readText("scripts/check-p1381-project-workspace-mutation-build-pipeline.js");
const p1382Checker = readText("scripts/check-p1382-project-workspace-mutation-build-pipeline.js");
const p1383Checker = readText("scripts/check-p1383-project-workspace-mutation-build-pipeline.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1384-project-workspace-mutation-build-pipeline.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const tabSource = readText("dashboard/src/data/commandCenterTabs.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P138.4";
const allowedFiles = new Set(p1384.allowedFiles || []);
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

const preview = buildProjectPatchBuildPreview({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const previewValidation = validateProjectPatchBuildPreview(preview);
const build = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const displayPreview = build.projectPatchBuildPreview || {};
const serializedDisplayPreview = JSON.stringify(displayPreview);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const p1384CurrentState =
  status.currentPhase === "P138.4"
  && status.previousPhase === "P138.3"
  && status.nextPhase === "P138.5"
  && roadmap.currentPhase === "P138.4"
  && roadmap.previousPhase === "P138.3"
  && roadmap.nextPhase === "P138.5"
  && status.current?.phaseId === "P138.4"
  && status.previous?.phaseId === "P138.3"
  && status.next?.phaseId === "P138.5"
  && roadmap.current?.phaseId === "P138.4"
  && roadmap.previous?.phaseId === "P138.3"
  && roadmap.next?.phaseId === "P138.5"
  && statusById.get("P137")?.status === "complete"
  && roadmapById.get("P137")?.status === "complete"
  && statusById.get("P138")?.status === "in_progress"
  && roadmapById.get("P138")?.status === "in_progress"
  && ["P138.1", "P138.2", "P138.3", "P138.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P138.5")?.status === "planned"
  && roadmapById.get("P138.5")?.status === "planned";
const p1385CurrentState =
  status.currentPhase === "P138.5"
  && status.previousPhase === "P138.4"
  && status.nextPhase === "P138.6"
  && roadmap.currentPhase === "P138.5"
  && roadmap.previousPhase === "P138.4"
  && roadmap.nextPhase === "P138.6"
  && status.current?.phaseId === "P138.5"
  && status.previous?.phaseId === "P138.4"
  && status.next?.phaseId === "P138.6"
  && roadmap.current?.phaseId === "P138.5"
  && roadmap.previous?.phaseId === "P138.4"
  && roadmap.next?.phaseId === "P138.6"
  && statusById.get("P137")?.status === "complete"
  && roadmapById.get("P137")?.status === "complete"
  && statusById.get("P138")?.status === "in_progress"
  && roadmapById.get("P138")?.status === "in_progress"
  && ["P138.1", "P138.2", "P138.3", "P138.4", "P138.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P138.6")?.status === "planned"
  && roadmapById.get("P138.6")?.status === "planned";
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
const p1387FinalState =
  status.currentPhase === "P138.7"
  && status.previousPhase === "P138.6"
  && status.nextPhase === "P139"
  && roadmap.currentPhase === "P138.7"
  && roadmap.previousPhase === "P138.6"
  && roadmap.nextPhase === "P139"
  && status.current?.phaseId === "P138.7"
  && status.previous?.phaseId === "P138.6"
  && status.next?.phaseId === "P139"
  && roadmap.current?.phaseId === "P138.7"
  && roadmap.previous?.phaseId === "P138.6"
  && roadmap.next?.phaseId === "P139"
  && statusById.get("P137")?.status === "complete"
  && roadmapById.get("P137")?.status === "complete"
  && statusById.get("P138")?.status === "complete"
  && roadmapById.get("P138")?.status === "complete"
  && ["P138.1", "P138.2", "P138.3", "P138.4", "P138.5", "P138.6", "P138.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P139")?.status === "planned"
  && roadmapById.get("P139")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1384-project-workspace-mutation-build-pipeline.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("checker reuses existing preview and dashboard data", checkerSource.includes("../shared/projectPatchBuildPreview.js") && checkerSource.includes("../dashboard/src/data/businessBuild.js"));
addCheck("shared preview still validates", previewValidation.valid, previewValidation.errors.join("; "));
addCheck("business build data exposes browser-safe preview display model", businessBuildSource.includes("buildProjectPatchBuildPreviewDisplayModel") && !businessBuildSource.includes('from "../../../shared/projectPatchBuildPreview.js"'));
addCheck("display model exposes useful state", displayPreview.currentState && displayPreview.sourceModelPhase === "P138.2" && displayPreview.previewRowCount >= 4 && displayPreview.ownerCapability === "NEXUS Project Patch and Build Preview Guard");
addCheck("display model includes preview rows", Array.isArray(displayPreview.previewRows) && displayPreview.previewRows.length >= 4 && displayPreview.previewRows.some((row) => row.label === "Game loop implementation"));
addCheck("display model includes path and safety rows", Array.isArray(displayPreview.pathRows) && displayPreview.pathRows.length >= 4 && Array.isArray(displayPreview.safetyRows) && ["Project mutation", "Patch application", "Build execution", "Test execution", "Rollback execution", "Provider spend"].every((label) => displayPreview.safetyRows.some((row) => row.label === label && row.value === "Blocked")));
addCheck("display model includes command summaries", /build command after boundary approval/i.test(displayPreview.buildCommandSummary || "") && /test command after boundary approval/i.test(displayPreview.testCommandSummary || "") && /baseline evidence/i.test(displayPreview.rollbackSummary || ""));
addCheck("display model hides raw private ids and dumps", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayPreview) && !/Bearer\s+|sk-[A-Za-z0-9]|DATABASE_URL|postgres(?:ql)?:\/\/|raw JSON|raw logs|raw policy dump|raw patch dump|raw diff dump/i.test(serializedDisplayPreview));
addCheck("display model avoids fake runnable actions", !/apply patch now|mutate project now|run build now|run tests now|rollback now|deploy now|release now|export now|package now|call provider now|dispatch agent now|spend now/i.test(serializedDisplayPreview));
addCheck("Command Center registers Project Build tab", tabSource.includes('id: "projectBuild"') && tabSource.includes('label: "Project Build"') && tabSource.includes('badge: "Preview"'));
addCheck("Command Center renders focused preview card", commandCenterSource.includes("function ProjectPatchBuildPreviewCard") && commandCenterSource.includes('aria-label="Project build preview"') && commandCenterSource.includes("Business Build Project Build Preview") && commandCenterSource.includes("Agent Flow Project Build Preview"));
addCheck("Command Center surfaces required UX fields", ["Current state", "Next action", "Disabled reason", "Owner", "Evidence", "Activity", "Cost impact", "Build summary", "Test summary", "Rollback summary"].every((text) => commandCenterSource.includes(text)));
addCheck("Command Center keeps execution disabled", !/apply patch now|mutate project now|run build now|run tests now|rollback now|deploy now|release now|export now|package now|call provider now|dispatch agent now|spend now/i.test(commandCenterSource));
addCheck("Playwright covers project build preview", routeTests.includes("Project build preview appears in Business Build and Agent Flow without runnable actions") && routeTests.includes("Business Build Project Build Preview") && routeTests.includes("Agent Flow Project Build Preview") && routeTests.includes("Project Build") && routeTests.includes("Game loop implementation"));
addCheck("contract advances P138.4", contract.phaseId === "P138" && ((contract.status === "in_progress" && ((contract.currentSubphase === "P138.4" && contract.previousSubphase === "P138.3" && contract.nextSubphase === "P138.5" && p1385.status === "planned") || (contract.currentSubphase === "P138.5" && contract.previousSubphase === "P138.4" && contract.nextSubphase === "P138.6" && p1385.status === "complete" && p1386.status === "planned") || (contract.currentSubphase === "P138.6" && contract.previousSubphase === "P138.5" && contract.nextSubphase === "P138.7" && p1385.status === "complete" && p1386.status === "complete" && p1387.status === "planned"))) || (contract.status === "complete" && contract.currentSubphase === "P138.7" && contract.previousSubphase === "P138.6" && contract.nextSubphase === "P139" && p1385.status === "complete" && p1386.status === "complete" && p1387.status === "complete")) && p1384.status === "complete");
addCheck("contract records expected base commit", p1384.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records expected dashboard files", ["dashboard/src/data/businessBuild.js", "dashboard/src/data/commandCenterTabs.js", "dashboard/src/pages/CommandCenterV2.jsx", "dashboard/tests/routes.spec.js", "scripts/check-p1384-project-workspace-mutation-build-pipeline.js"].every((file) => p1384.allowedFiles?.includes(file)));
addCheck("previous P138 reports pass", ["reports/p1381-project-workspace-mutation-build-pipeline-report.md", "reports/p1382-project-workspace-mutation-build-pipeline-report.md", "reports/p1383-project-workspace-mutation-build-pipeline-report.md"].every(reportPassed));
addCheck("previous P138 checkers accept P138.4", [p1381Checker, p1382Checker, p1383Checker].every((source) => source.includes("p1384CurrentState") && source.includes('status.currentPhase === "P138.4"')));
addCheck("enterprise checker accepts P138.4", enterpriseChecker.includes("p1384CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P138.5 handoff", ["P138.1", "P138.2", "P138.3", "P138.4", "P138.5", "P138.6", "P138.7"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P138 plan records P138.4", /## P138\.4 Project Build Command Center UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P138.4", /P138\.4 project build Command Center UX/i.test(readme));
addCheck("platform roadmap records P138.4", /P138\.4 project build Command Center UX is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P138.4", /P138\.4 is now complete/i.test(enterpriseRoadmap) && (/P138\.5 is the next executable subphase/i.test(enterpriseRoadmap) || /P138\.5 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status starts P138.4 or hands off through P138.7", p1384CurrentState || p1385CurrentState || p1386CurrentState || p1387FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P138.4 entries have required fields", [statusById.get("P138"), statusById.get("P138.4"), roadmapById.get("P138.4")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P138.5 remains planned or is safely complete", (statusById.get("P138.5")?.status === "planned" && roadmapById.get("P138.5")?.status === "planned" && !(statusById.get("P138.5")?.checksRun || []).length) || p1385CurrentState || p1386CurrentState || p1387FinalState);
addCheck(
  "changed files stay in P138.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P138.4 forbidden path check relaxed for ${status.currentPhase}`,
);
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
        "- Implements P138.4 Command Center UX for the non-runnable project patch/build preview.",
        "- Shows display-safe project change summaries, build/test/rollback summaries, path-boundary summaries, blockers, owner, next action, disabled reason, evidence/activity location, and cost impact on Business Build and Agent Flow.",
        "- Confirms this subphase does not mutate project files, apply patches, run builds/tests, execute rollbacks, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Command Center Summary",
      body: [
        `- Preview source model: ${displayPreview.sourceModelPhase}`,
        `- Preview rows: ${displayPreview.previewRowCount}`,
        `- Owner: ${displayPreview.ownerCapability}`,
        `- Evidence: ${displayPreview.evidenceLocation}`,
        `- Cost impact: ${displayPreview.costImpact}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P138.4 is Command Center UX only. It does not apply patches, mutate projects, run builds/tests, execute rollbacks, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, deploy, release, export, package, use network calls, or spend. P138.5 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P138.4 Project Build Command Center UX Report", phase: "P138.4" },
);

printCheckReport("P138.4 Project Build Command Center UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
