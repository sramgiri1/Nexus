import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1025-founder-live-handoff-validation-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function exists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p102-founder-live-handoff-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P102_FOUNDER_LIVE_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const businessData = readText("dashboard/src/data/businessBuild.js");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const p102Subphases = ["P102.1", "P102.2", "P102.3", "P102.4", "P102.5"];
const p102Scripts = [
  "check:p1021-founder-live-handoff-contract",
  "check:p1022-founder-live-handoff-manifest",
  "check:p1023-founder-live-handoff-work-orders",
  "check:p1024-command-center-founder-live-handoff-ux",
  "check:p1025-founder-live-handoff-validation",
];
const p102Reports = [
  "reports/p1021-founder-live-handoff-contract-report.md",
  "reports/p1022-founder-live-handoff-manifest-report.md",
  "reports/p1023-founder-live-handoff-work-orders-report.md",
  "reports/p1024-command-center-founder-live-handoff-ux-report.md",
];
const manifest = viewModel.founderLiveHandoffManifest || {};
const workOrders = viewModel.founderLiveHandoffWorkOrders || {};

addCheck("package scripts registered", p102Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P102.1-P102.5 contract status", p102Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P102.6 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P102.6")?.status));
addCheck("P102 reports exist", p102Reports.every(exists));
addCheck("P102.4 Playwright coverage exists", routeTests.includes("Founder live handoff appears across founder routes"));
addCheck("route-wide safety tests retained", routeTests.includes("full Command Center routes do not show DemoApp") && routeTests.includes("theme switcher"));
addCheck("Command Center card present", pageSource.includes("FounderLiveHandoffCard") && pageSource.includes("Founder Live Handoff"));
addCheck("Business Build view model present", businessData.includes("founderLiveHandoffManifest") && businessData.includes("founderLiveHandoffWorkOrders"));
addCheck("view model is useful", manifest.handoffLanes?.length === 6 && workOrders.workOrderRows?.length === 6);
addCheck("execution remains blocked", workOrders.executableWorkOrderCount === 0 && workOrders.dispatchableWorkOrderCount === 0 && workOrders.projectMutationWorkOrderCount === 0);
addCheck("docs record P102.5", /P102\.5 Aggregate Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P102.5", /P102\.5 is\s+complete/.test(platformRoadmap) && /P102\.6 is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ["P102.5", "P102.6"].includes(status.currentPhase)
    && ["P102.4", "P102.5"].includes(status.previousPhase)
    && ["P102.6", "P102.7"].includes(status.nextPhase)
    && statusById.get("P102.5")?.status === "complete"
    && roadmapById.get("P102.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P102.6 handoff remains planned or complete", ["planned", "complete"].includes(statusById.get("P102.6")?.status) && ["planned", "complete"].includes(roadmapById.get("P102.6")?.status));
addCheck("no unsafe runnable actions in P102 view", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(JSON.stringify({ manifest, workOrders }) + pageSource));
addCheck("P102.5 avoids forbidden file scope", !(subphaseById.get("P102.5")?.allowedFiles || []).some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P102.1 through P102.4 validation evidence.",
        "- Confirms founder live handoff contract, manifest, dry-run work rows, Command Center UX, route tests, docs, status, reports, and safety checks are aligned.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1025-founder-live-handoff-validation",
        "- npm run check:p1024-command-center-founder-live-handoff-ux",
        "- npm run check:p1023-founder-live-handoff-work-orders",
        "- npm run check:p1022-founder-live-handoff-manifest",
        "- npm run check:p1021-founder-live-handoff-contract",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live handoff\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P102.5 is aggregate validation only. It does not create live work orders, dispatch agents, run workers/tools, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P102.5 Founder Live Handoff Validation Report", phase: "P102.5" },
);

printCheckReport("P102.5 Founder Live Handoff Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
