import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1045-founder-live-execution-boundary-aggregate-report.md";

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
const p1045 = subphaseById.get("P104.5") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const p104Reports = [
  "reports/p1041-chat-surface-consolidation-report.md",
  "reports/p1042-founder-live-execution-boundary-schema-report.md",
  "reports/p1043-founder-live-execution-boundary-model-report.md",
  "reports/p1044-founder-live-execution-boundary-ux-report.md",
];
const serializedBoundary = JSON.stringify(boundary);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1045-founder-live-execution-boundary-aggregate"]));
addCheck("all prior P104 check scripts registered", ["check:p1041-chat-surface-consolidation", "check:p1042-founder-live-execution-boundary-schema", "check:p1043-founder-live-execution-boundary-model", "check:p1044-founder-live-execution-boundary-ux"].every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("prior P104 reports exist in coverage", p104Reports.every((report) => readText(report).includes("Result")));
addCheck("chat-only and boundary tests retained", routeTests.includes("Command Center Lite route stays chat-only") && routeTests.includes("Founder live execution boundary appears on non-chat founder routes") && routeTests.includes("P104 execution boundary route safety stays coherent"));
addCheck("Command Center renders boundary only outside chat", pageSource.includes("Business Build Execution Boundary") && pageSource.includes("Agent Flow Execution Boundary") && pageSource.includes("Live Readiness Execution Boundary") && !pageSource.includes("Chat Execution Boundary") && !pageSource.includes("Lite Execution Boundary"));
addCheck("dashboard boundary display is browser safe", dataSource.includes("buildFounderLiveExecutionBoundaryDisplayModel") && !dataSource.includes("founderLiveExecutionBoundaryModel.js"));
addCheck("boundary model display remains useful", boundary.boundaryRows?.length === 6 && boundary.blockedBoundaryCount === 6 && boundary.boundaryRows.some((row) => row.proposedAgentLane === "Safety Governor"));
addCheck("execution counts remain zero", boundary.approvedBoundaryCount === 0 && boundary.executableBoundaryCount === 0 && boundary.dispatchableBoundaryCount === 0 && boundary.projectMutationBoundaryCount === 0 && boundary.hostedDbMutationBoundaryCount === 0);
addCheck("boundary rows are display-safe", boundary.boundaryRows?.every((row) => row.executionAllowed === "Blocked" && row.dispatchAllowed === "Blocked" && !("boundaryId" in row) && !("sourceAdmissionId" in row)));
addCheck("contract marks P104.5 complete", p1045.status === "complete");
addCheck("P104.6 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P104.6")?.status));
addCheck("docs record P104.5", /P104\.5 Execution Boundary Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P104.5", /P104\.5 is\s+complete/.test(platformRoadmap) && /P104\.6\s+is\s+next/.test(platformRoadmap));
addCheck("README records P104.5", /P104\.5 execution-boundary aggregate validation/.test(readme) && /P104\.6\s+is next/.test(readme));
addCheck(
  "phase status advanced",
  ["P104.5", "P104.6", "P104.7"].includes(status.currentPhase)
    && ["P104.4", "P104.5", "P104.6"].includes(status.previousPhase)
    && ["P104.6", "P104.7", "P105"].includes(status.nextPhase)
    && statusById.get("P104")?.status === "in_progress"
    && statusById.get("P104.5")?.status === "complete"
    && roadmapById.get("P104.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P104.5 avoids forbidden file scope", !(p1045.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("aggregate UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedBoundary));
addCheck("aggregate UX avoids unsafe runnable action text", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(pageSource + serializedBoundary));
addCheck("aggregate UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedBoundary));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates aggregate P104 founder live execution-boundary behavior across P104.1-P104.5.",
        "- Confirms chat-only routes stay clean, non-chat founder routes keep execution-boundary UX, and the display model remains browser-safe.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1045-founder-live-execution-boundary-aggregate",
        "- npm run check:p1044-founder-live-execution-boundary-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"P104 execution boundary route safety stays coherent|Founder live execution boundary appears on non-chat founder routes|Command Center Lite route stays chat-only\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P104.5 is validation-only. It does not approve execution, dispatch agents, run workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P104.5 Founder Live Execution Boundary Aggregate Report", phase: "P104.5" },
);

printCheckReport("P104.5 Founder Live Execution Boundary Aggregate Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
