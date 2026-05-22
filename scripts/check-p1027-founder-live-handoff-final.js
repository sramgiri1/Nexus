import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1027-founder-live-handoff-final-report.md";

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
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const manifest = viewModel.founderLiveHandoffManifest || {};
const workOrders = viewModel.founderLiveHandoffWorkOrders || {};
const p102Subphases = ["P102.1", "P102.2", "P102.3", "P102.4", "P102.5", "P102.6", "P102.7"];
const p102Scripts = [
  "check:p1021-founder-live-handoff-contract",
  "check:p1022-founder-live-handoff-manifest",
  "check:p1023-founder-live-handoff-work-orders",
  "check:p1024-command-center-founder-live-handoff-ux",
  "check:p1025-founder-live-handoff-validation",
  "check:p1026-founder-live-handoff-docs-roadmap",
  "check:p1027-founder-live-handoff-final",
];
const p102Reports = [
  "reports/p1021-founder-live-handoff-contract-report.md",
  "reports/p1022-founder-live-handoff-manifest-report.md",
  "reports/p1023-founder-live-handoff-work-orders-report.md",
  "reports/p1024-command-center-founder-live-handoff-ux-report.md",
  "reports/p1025-founder-live-handoff-validation-report.md",
  "reports/p1026-founder-live-handoff-docs-roadmap-report.md",
];
const validationCommands = [
  "npm run check:p1027-founder-live-handoff-final",
  "npm run check:p1026-founder-live-handoff-docs-roadmap",
  "npm run check:p1025-founder-live-handoff-validation",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live handoff|full Command Center demo leakage safety\"",
  "cd dashboard && npm run build",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];

addCheck("package scripts registered", p102Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P102 contract subphases complete", p102Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P102 reports exist", p102Reports.every(exists));
addCheck("Command Center founder live handoff card remains wired", pageSource.includes("FounderLiveHandoffCard") && pageSource.includes("Founder Live Handoff"));
addCheck("focused route tests retained", routeTests.includes("Founder live handoff appears across founder routes"));
addCheck("route-wide safety retained", routeTests.includes("full Command Center routes do not show DemoApp") && routeTests.includes("theme switcher"));
addCheck("view model remains useful", manifest.handoffLanes?.length === 6 && workOrders.workOrderRows?.length === 6 && Boolean(workOrders.nextAction));
addCheck("execution remains blocked", workOrders.executableWorkOrderCount === 0 && workOrders.dispatchableWorkOrderCount === 0 && workOrders.projectMutationWorkOrderCount === 0);
addCheck("P102 plan records final validation", /P102\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && validationCommands.every((command) => plan.includes(command)));
addCheck("platform roadmap closes P102", /P102\.7 is\s+complete/.test(platformRoadmap) && /P102 is\s+complete/.test(platformRoadmap) && /P103 is\s+next/.test(platformRoadmap));
addCheck(
  "phase status closes P102",
  status.currentPhase === "P102.7"
    && status.previousPhase === "P102.6"
    && status.nextPhase === "P103"
    && statusById.get("P102")?.status === "complete"
    && statusById.get("P102.7")?.status === "complete"
    && statusById.get("P103")?.status === "planned"
    && roadmapById.get("P102")?.status === "complete"
    && roadmapById.get("P102.7")?.status === "complete"
    && roadmapById.get("P103")?.status === "planned",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("phase status records final checks", validationCommands.every((command) => statusById.get("P102.7")?.checksRun?.includes(command)));
addCheck("P103 remains planned only", statusById.get("P103")?.commit === "planned" && roadmapById.get("P103")?.commit === "planned");
addCheck("no unsafe runnable actions in final view", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(JSON.stringify({ manifest, workOrders }) + pageSource));
addCheck("no raw private ids in final view", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify({ manifest, workOrders })));
addCheck("P102.7 avoids forbidden file scope", !(subphaseById.get("P102.7")?.allowedFiles || []).some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Final validation for P102 Founder Live Handoff.",
        "- Confirms P102 contract, manifest, work-order dry run, Command Center UX, docs, reports, phase status, and P103 handoff are aligned.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P102 closes the founder live handoff layer only. P103 remains planned and must define any later work admission under its own execution contract before coding.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P102.7 Founder Live Handoff Final Report", phase: "P102.7" },
);

printCheckReport("P102.7 Founder Live Handoff Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
