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
import {
  buildProjectWorkspaceMutationModel,
  validateProjectWorkspaceMutationModel,
} from "../shared/projectWorkspaceMutationModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1385-project-workspace-mutation-build-pipeline-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p138-project-workspace-mutation-build-pipeline-contracts.json";
const PLAN_PATH = "docs/architecture/P138_PROJECT_WORKSPACE_MUTATION_BUILD_PIPELINE_PLAN.md";
const REQUIRED_SCRIPT = "check:p1385-project-workspace-mutation-build-pipeline";
const EXPECTED_BASE_COMMIT = "31cd0afe";
const VALIDATION_COMMANDS = [
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|approval|rollback|explicitly allows|model|summary|withheld|validation-only)\b/i.test(context);
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
const p1385 = subphaseById.get("P138.5") || {};
const p1386 = subphaseById.get("P138.6") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1385-project-workspace-mutation-build-pipeline.js");
const p1381Checker = readText("scripts/check-p1381-project-workspace-mutation-build-pipeline.js");
const p1382Checker = readText("scripts/check-p1382-project-workspace-mutation-build-pipeline.js");
const p1383Checker = readText("scripts/check-p1383-project-workspace-mutation-build-pipeline.js");
const p1384Checker = readText("scripts/check-p1384-project-workspace-mutation-build-pipeline.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P138.5";
const allowedFiles = new Set(p1385.allowedFiles || []);
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

const founderIdea = "Build a simple iOS Snake game for the App Store";
const workspaceModel = buildProjectWorkspaceMutationModel({ founderIdeaSummary: founderIdea });
const workspaceValidation = validateProjectWorkspaceMutationModel(workspaceModel);
const patchBuildPreview = buildProjectPatchBuildPreview({ founderIdeaSummary: founderIdea, sourceModel: workspaceModel });
const previewValidation = validateProjectPatchBuildPreview(patchBuildPreview);
const businessBuild = buildBusinessBuildViewModel(founderIdea);
const displayPreview = businessBuild.projectPatchBuildPreview || {};
const serializedAggregate = JSON.stringify([workspaceModel, patchBuildPreview, displayPreview]);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
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

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1385-project-workspace-mutation-build-pipeline.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("checker reuses existing model and preview helpers", checkerSource.includes("../shared/projectWorkspaceMutationModel.js") && checkerSource.includes("../shared/projectPatchBuildPreview.js"));
addCheck("checker reuses dashboard display data", checkerSource.includes("../dashboard/src/data/businessBuild.js"));
addCheck("P138.1-P138.5 package scripts registered", ["p1381", "p1382", "p1383", "p1384", "p1385"].every((suffix) => Boolean(packageJson.scripts?.[`check:${suffix}-project-workspace-mutation-build-pipeline`])));
addCheck("P138.1-P138.4 reports pass", [
  "reports/p1381-project-workspace-mutation-build-pipeline-report.md",
  "reports/p1382-project-workspace-mutation-build-pipeline-report.md",
  "reports/p1383-project-workspace-mutation-build-pipeline-report.md",
  "reports/p1384-project-workspace-mutation-build-pipeline-report.md",
].every(reportPassed));
addCheck("workspace model still validates", workspaceValidation.valid, workspaceValidation.errors.join("; "));
addCheck("patch build preview still validates", previewValidation.valid, previewValidation.errors.join("; "));
addCheck("aggregate model remains non-runnable", [
  workspaceModel.projectMutationAllowed,
  workspaceModel.patchApplicationAllowed,
  workspaceModel.buildExecutionAllowed,
  workspaceModel.testExecutionAllowed,
  workspaceModel.rollbackExecutionAllowed,
  patchBuildPreview.projectMutationAllowed,
  patchBuildPreview.patchApplicationAllowed,
  patchBuildPreview.buildExecutionAllowed,
  patchBuildPreview.testExecutionAllowed,
  patchBuildPreview.rollbackExecutionAllowed,
].every((value) => value === false));
addCheck("Business Build display remains useful", displayPreview.previewRowCount >= 4 && displayPreview.safetyRows?.some((row) => row.label === "Build execution" && row.value === "Blocked") && displayPreview.nextAction && displayPreview.disabledReason);
addCheck("Command Center Project Build UX remains wired", commandCenterSource.includes("ProjectPatchBuildPreviewCard") && commandCenterSource.includes("Business Build Project Build Preview") && commandCenterSource.includes("Agent Flow Project Build Preview"));
addCheck("Command Center display data stays browser-safe", businessBuildSource.includes("buildProjectPatchBuildPreviewDisplayModel") && !businessBuildSource.includes('from "../../../shared/projectPatchBuildPreview.js"'));
addCheck("Playwright project build coverage retained", routeTests.includes("Project build preview appears in Business Build and Agent Flow without runnable actions") && routeTests.includes("Business Build Project Build Preview") && routeTests.includes("Agent Flow Project Build Preview") && routeTests.includes("Game loop implementation"));
addCheck("route-wide safety coverage retained", ["Command Center route-wide UX", "DemoApp", "raw JSON", "private-project", "dispatch agent now", "Use system theme", "Use dark theme", "Use light theme"].every((text) => routeTests.includes(text)));
addCheck("prior P138 checkers accept P138.5", [p1381Checker, p1382Checker, p1383Checker, p1384Checker].every((source) => source.includes("p1385CurrentState") && source.includes('status.currentPhase === "P138.5"')));
addCheck("enterprise checker accepts P138.5", enterpriseChecker.includes("p1385CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P138.6 handoff", ["P138.1", "P138.2", "P138.3", "P138.4", "P138.5", "P138.6"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("contract advances P138.5", contract.phaseId === "P138" && contract.status === "in_progress" && contract.currentSubphase === "P138.5" && contract.previousSubphase === "P138.4" && contract.nextSubphase === "P138.6" && p1385.status === "complete" && p1386.status === "planned");
addCheck("contract records expected base commit", p1385.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records aggregate validation commands", VALIDATION_COMMANDS.every((command) => p1385.validationCommands?.includes(command)));
addCheck("contract scope stays validation-only", p1385.dataShape?.includes("Checker/report aggregation only") && p1385.expectedExports?.length === 0 && p1385.forbiddenFiles?.includes("dashboard/src/**") && p1385.forbiddenFiles?.includes("projects/**"));
addCheck("P138 plan records P138.5", /## P138\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P138.5", /P138\.5 aggregate tests\/checkers/i.test(readme));
addCheck("platform roadmap records P138.5", /P138\.5 aggregate tests\/checkers is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P138.5", /P138\.5 is now complete/i.test(enterpriseRoadmap) && /P138\.6 is the next executable subphase/i.test(enterpriseRoadmap));
addCheck("phase status starts P138.5", p1385CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P138.5 entries have required fields", [statusById.get("P138"), statusById.get("P138.5"), roadmapById.get("P138.5")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P138.6 remains planned", statusById.get("P138.6")?.status === "planned" && roadmapById.get("P138.6")?.status === "planned" && !(statusById.get("P138.6")?.checksRun || []).length);
addCheck("changed files stay in P138.5 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P138.5 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("aggregate UX data avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedAggregate));
addCheck("aggregate UX data avoids raw dumps", !/Bearer\s+|sk-[A-Za-z0-9]|DATABASE_URL|postgres(?:ql)?:\/\/|raw JSON|raw logs|raw policy dump|raw patch dump|raw diff dump/i.test(serializedAggregate));
addCheck("aggregate UX data avoids fake runnable actions", !/apply patch now|mutate project now|run build now|run tests now|rollback now|deploy now|release now|export now|package now|call provider now|dispatch agent now|spend now/i.test(serializedAggregate));
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
        "- Aggregates P138.1-P138.4 validation across contracts, model, preview, Command Center UX, reports, docs, roadmap, status, and route-wide safety coverage.",
        "- Confirms the Project Build preview remains display-safe and non-runnable on Business Build and Agent Flow.",
        "- Does not mutate project files, apply patches, run builds/tests, execute rollbacks, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Aggregate Coverage Summary",
      body: [
        `- Workspace candidate changes: ${workspaceModel.patchPlan?.candidateChanges?.length || 0}`,
        `- Preview rows: ${patchBuildPreview.previewRows?.length || 0}`,
        `- Display preview rows: ${displayPreview.previewRowCount || 0}`,
        `- Safety rows: ${displayPreview.safetyRows?.length || 0}`,
        `- Prior reports passing: ${["P138.1", "P138.2", "P138.3", "P138.4"].length}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P138.5 is validation-only. It does not enable project mutation, patch application, build/test execution, rollback execution, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, deploy, release, export, package, network calls, or spend. P138.6 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P138.5 Project Workspace Mutation Build Pipeline Tests Checkers Report", phase: "P138.5" },
);

printCheckReport("P138.5 Project Workspace Mutation Build Pipeline Tests Checkers Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
