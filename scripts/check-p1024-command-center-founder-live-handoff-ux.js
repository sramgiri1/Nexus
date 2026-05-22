import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1024-command-center-founder-live-handoff-ux-report.md";

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
const contract = readJson("contracts/os-roadmap/p102-founder-live-handoff-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const businessData = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const plan = readText("docs/architecture/P102_FOUNDER_LIVE_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const manifest = viewModel.founderLiveHandoffManifest || {};
const workOrders = viewModel.founderLiveHandoffWorkOrders || {};
const componentSource = pageSource.slice(
  pageSource.indexOf("function FounderLiveHandoffCard"),
  pageSource.indexOf("function FounderLiveUseReviewCard") > pageSource.indexOf("function FounderLiveHandoffCard")
    ? pageSource.indexOf("function FounderLiveUseReviewCard")
    : pageSource.indexOf("function ExecutionAdmissionCard"),
);
const p1024 = subphaseById.get("P102.4") || {};

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1024-command-center-founder-live-handoff-ux"]));
addCheck("business data exposes P102 handoff model", businessData.includes("buildFounderLiveHandoffDisplayModels") && businessData.includes("founderLiveHandoffManifest") && businessData.includes("founderLiveHandoffWorkOrders"));
addCheck("view model exposes manifest and work orders", Boolean(manifest.currentState) && Boolean(workOrders.currentState));
addCheck("view model rows useful", manifest.handoffLanes?.length === 6 && workOrders.workOrderRows?.length === 6);
addCheck("execution remains blocked in view model", workOrders.executableWorkOrderCount === 0 && workOrders.dispatchableWorkOrderCount === 0 && workOrders.projectMutationWorkOrderCount === 0);
addCheck("Command Center component added", pageSource.includes("function FounderLiveHandoffCard") && pageSource.includes("aria-label=\"Founder live handoff\""));
addCheck("Lite surface renders card", pageSource.includes("Lite Founder Live Handoff"));
addCheck("Business Build surface renders card", pageSource.includes("Business Build Founder Live Handoff"));
addCheck("Agent Flow surface renders card", pageSource.includes("Agent Flow Founder Live Handoff"));
addCheck("Live Readiness surface renders card", pageSource.includes("Live Readiness Founder Live Handoff"));
addCheck("Playwright coverage added", routeTests.includes("Founder live handoff appears across founder routes") && routeTests.includes("/command-center/live-readiness"));
addCheck("contract marks P102.4 complete", p1024.status === "complete");
addCheck("P102.5 remains planned", subphaseById.get("P102.5")?.status === "planned");
addCheck("docs record P102.4", /P102\.4 Command Center Handoff UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P102.4", /P102\.4 is\s+complete/.test(platformRoadmap) && /P102\.5 is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  status.currentPhase === "P102.4"
    && status.previousPhase === "P102.3"
    && status.nextPhase === "P102.5"
    && statusById.get("P102")?.status === "in_progress"
    && statusById.get("P102.4")?.status === "complete"
    && roadmapById.get("P102.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("no raw private IDs exposed", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify({ manifest, workOrders }) + componentSource));
addCheck("no raw dumps exposed", !/raw JSON|raw logs|raw policy dump/i.test(componentSource));
addCheck("no unsafe runnable actions invented", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(JSON.stringify({ manifest, workOrders }) + componentSource));
addCheck("P102.4 avoids forbidden file scope", !(p1024.allowedFiles || []).some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P102.4 Command Center founder live handoff UX wiring.",
        "- Confirms Lite, Business Build, Agent Flow, and Live Readiness surfaces render display-safe manifest and dry-run work-order rows.",
        "- Confirms P102.4 does not dispatch agents, execute workers/tools, mutate projects, call providers/models, write hosted DB state, deploy, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1024-command-center-founder-live-handoff-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live handoff\"",
        "- cd dashboard && npm run build",
        "- npm run check:p1023-founder-live-handoff-work-orders",
        "- npm run check:p1022-founder-live-handoff-manifest",
        "- npm run check:p1021-founder-live-handoff-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P102.4 is UI wiring only. It does not create live work orders, dispatch agents, run workers/tools, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P102.4 Command Center Founder Live Handoff UX Report", phase: "P102.4" },
);

printCheckReport("P102.4 Command Center Founder Live Handoff UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
