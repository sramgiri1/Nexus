import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1047-founder-live-execution-boundary-final-report.md";

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
const routeTests = readText("dashboard/tests/routes.spec.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const boundary = viewModel.founderLiveExecutionBoundary || {};
const p104 = statusById.get("P104") || {};
const p1047 = subphaseById.get("P104.7") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const p104Scripts = [
  "check:p1041-chat-surface-consolidation",
  "check:p1042-founder-live-execution-boundary-schema",
  "check:p1043-founder-live-execution-boundary-model",
  "check:p1044-founder-live-execution-boundary-ux",
  "check:p1045-founder-live-execution-boundary-aggregate",
  "check:p1046-founder-live-execution-boundary-docs",
  "check:p1047-founder-live-execution-boundary-final",
];
const p104Reports = [
  "reports/p1041-chat-surface-consolidation-report.md",
  "reports/p1042-founder-live-execution-boundary-schema-report.md",
  "reports/p1043-founder-live-execution-boundary-model-report.md",
  "reports/p1044-founder-live-execution-boundary-ux-report.md",
  "reports/p1045-founder-live-execution-boundary-aggregate-report.md",
  "reports/p1046-founder-live-execution-boundary-docs-report.md",
];
const serializedBoundary = JSON.stringify(boundary);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1047-founder-live-execution-boundary-final"]));
addCheck("all P104 scripts registered", p104Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P104 reports exist", p104Reports.every((report) => readText(report).includes("Result")));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P104 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("contract records final validation commands", (p1047.validationCommands || []).includes("npm run check:p1047-founder-live-execution-boundary-final") && (p1047.validationCommands || []).includes("npm run check:phase-validation-coverage"));
addCheck("contract avoids forbidden file scope", !(p1047.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("plan records final validation complete", /P104\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P104 complete", /P104\.7 is\s+complete/.test(platformRoadmap) && /P104 is\s+complete/.test(platformRoadmap) && /P105\s+is\s+next/.test(platformRoadmap));
addCheck("README records P104 complete", /P104\.7 final validation/.test(readme) && /P104 is complete/.test(readme) && /P105\s+is next/.test(readme));
addCheck("Command Center UX remains scoped", pageSource.includes("Business Build Execution Boundary") && pageSource.includes("Agent Flow Execution Boundary") && pageSource.includes("Live Readiness Execution Boundary") && !pageSource.includes("Chat Execution Boundary") && !pageSource.includes("Lite Execution Boundary"));
addCheck("route safety coverage retained", routeTests.includes("P104 execution boundary route safety stays coherent") && routeTests.includes("Command Center Lite route stays chat-only"));
addCheck("boundary remains useful and blocked", boundary.boundaryRows?.length === 6 && boundary.blockedBoundaryCount === 6 && boundary.executableBoundaryCount === 0 && boundary.dispatchableBoundaryCount === 0);
addCheck("boundary rows remain display-safe", boundary.boundaryRows?.every((row) => row.executionAllowed === "Blocked" && !("boundaryId" in row) && !("sourceAdmissionId" in row)));
addCheck(
  "phase status closed",
  status.currentPhase === "P104.7"
    && status.previousPhase === "P104.6"
    && status.nextPhase === "P105"
    && p104.status === "complete"
    && statusById.get("P104.7")?.status === "complete"
    && roadmapById.get("P104")?.status === "complete"
    && roadmapById.get("P104.7")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}/${p104.status}`,
);
addCheck("phase commits recorded", [statusById.get("P104")?.commit, statusById.get("P104.7")?.commit, roadmapById.get("P104")?.commit, roadmapById.get("P104.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P104")?.commandCenterVisible === true && statusById.get("P104.7")?.commandCenterVisible === true);
addCheck("final UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedBoundary));
addCheck("final UX avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(pageSource + serializedBoundary));
addCheck("final UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedBoundary));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P104 founder live execution-boundary closure.",
        "- Confirms parent P104 and all subphases are complete, reports and scripts exist, Command Center route safety is retained, and P105 is the next handoff.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1047-founder-live-execution-boundary-final",
        "- npm run check:p1046-founder-live-execution-boundary-docs",
        "- npm run check:p1045-founder-live-execution-boundary-aggregate",
        "- npm run check:p1044-founder-live-execution-boundary-ux",
        "- npm run check:p1043-founder-live-execution-boundary-model",
        "- npm run check:p1042-founder-live-execution-boundary-schema",
        "- npm run check:p1041-chat-surface-consolidation",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"P104 execution boundary route safety stays coherent|Founder live execution boundary appears on non-chat founder routes|Command Center Lite route stays chat-only\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P104.7 closes P104 validation only. It does not approve execution, dispatch agents, run workers/tools, mutate projects, call providers/models, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P104.7 Founder Live Execution Boundary Final Report", phase: "P104.7" },
);

printCheckReport("P104.7 Founder Live Execution Boundary Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
