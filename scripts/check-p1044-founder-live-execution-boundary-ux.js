import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1044-founder-live-execution-boundary-ux-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p104-founder-live-execution-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P104_FOUNDER_LIVE_EXECUTION_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const boundary = viewModel.founderLiveExecutionBoundary || {};
const p1044 = subphaseById.get("P104.4") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serializedBoundary = JSON.stringify(boundary);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1044-founder-live-execution-boundary-ux"]));
addCheck("dashboard data exposes browser-safe boundary display model", dataSource.includes("buildFounderLiveExecutionBoundaryDisplayModel") && dataSource.includes("founderLiveExecutionBoundary") && !dataSource.includes("founderLiveExecutionBoundaryModel.js"));
addCheck("Command Center card exists", pageSource.includes("FounderLiveExecutionBoundaryCard") && pageSource.includes('aria-label="Founder live execution boundary"'));
addCheck("card rendered on non-chat routes", ["Business Build Execution Boundary", "Agent Flow Execution Boundary", "Live Readiness Execution Boundary"].every((label) => pageSource.includes(label)));
addCheck("card not rendered on chat routes", !pageSource.includes("Lite Execution Boundary") && !pageSource.includes("Chat Execution Boundary"));
addCheck("view model has useful boundary rows", boundary.boundaryRows?.length === 6 && boundary.boundaryRowCount === 6 && boundary.blockedBoundaryCount === 6);
addCheck("execution remains blocked", boundary.approvedBoundaryCount === 0 && boundary.executableBoundaryCount === 0 && boundary.dispatchableBoundaryCount === 0 && boundary.projectMutationBoundaryCount === 0 && boundary.hostedDbMutationBoundaryCount === 0);
addCheck("boundary rows are display-safe", boundary.boundaryRows?.every((row) => row.executionAllowed === "Blocked" && row.dispatchAllowed === "Blocked" && row.projectMutationAllowed === "Blocked" && !("boundaryId" in row) && !("sourceAdmissionId" in row)));
addCheck("evidence and validation visible", boundary.evidenceLocation === "reports/p1043-founder-live-execution-boundary-model-report.md" && boundary.boundaryRows?.every((row) => row.validationCommand === "npm run check:p1043-founder-live-execution-boundary-model"));
addCheck("focused Playwright coverage added", routeTests.includes("Founder live execution boundary appears on non-chat founder routes") && routeTests.includes('getByLabel("Founder live execution boundary")).toHaveCount(0)'));
addCheck("route-wide safety assertions retained", routeTests.includes("full Command Center routes do not show DemoApp") && routeTests.includes("theme switcher exists globally"));
addCheck("contract marks P104.4 complete", p1044.status === "complete");
addCheck("P104.5 remains planned", subphaseById.get("P104.5")?.status === "planned");
addCheck("docs record P104.4", /P104\.4 Execution Boundary Command Center UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P104.4", /P104\.4 is\s+complete/.test(platformRoadmap) && /P104\.5 is\s+next/.test(platformRoadmap));
addCheck("README records P104.4", /P104\.4 execution-boundary UX/.test(readme) && /P104\.5\s+is next/.test(readme));
addCheck(
  "phase status advanced",
  status.currentPhase === "P104.4"
    && status.previousPhase === "P104.3"
    && status.nextPhase === "P104.5"
    && statusById.get("P104")?.status === "in_progress"
    && statusById.get("P104.4")?.status === "complete"
    && roadmapById.get("P104.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P104.4 avoids forbidden file scope", !(p1044.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("primary UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedBoundary));
addCheck("primary UX avoids raw boundary IDs", boundary.boundaryRows?.every((row) => !("boundaryId" in row) && !("sourceAdmissionId" in row)));
addCheck("primary UX avoids unsafe runnable action text", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(pageSource + serializedBoundary));
addCheck("primary UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedBoundary));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P104.4 Command Center founder live execution-boundary UX wiring.",
        "- Confirms Business Build, Agent Flow, and Live Readiness render display-safe boundary rows, evidence, validation, blockers, owner, activity, and cost without runnable controls.",
        "- Confirms Chat with NEXUS remains chat-only and does not render execution-boundary cards.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1044-founder-live-execution-boundary-ux",
        "- npm run check:p1043-founder-live-execution-boundary-model",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live execution boundary appears on non-chat founder routes|Command Center Lite route stays chat-only\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P104.4 is Command Center UX only. It does not approve execution, dispatch agents, run workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P104.4 Founder Live Execution Boundary UX Report", phase: "P104.4" },
);

printCheckReport("P104.4 Founder Live Execution Boundary UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
