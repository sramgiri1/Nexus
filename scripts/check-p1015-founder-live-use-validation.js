import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1015-founder-live-use-validation-report.md";

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
const contract = readJson("contracts/os-roadmap/p101-execution-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const routeTests = readText("dashboard/tests/routes.spec.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const businessData = readText("dashboard/src/data/businessBuild.js");
const docs = readText("docs/architecture/P101_FOUNDER_LIVE_USE_HARDENING_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const p101Subphases = ["P101.1", "P101.2", "P101.3", "P101.4", "P101.5"];
const p101Scripts = [
  "check:p1011-founder-live-use-contract",
  "check:p1012-founder-live-use-readiness-model",
  "check:p1013-founder-live-use-review-packet",
  "check:p1014-command-center-founder-live-use-ux",
  "check:p1015-founder-live-use-validation",
];
const p101Reports = [
  "reports/p1011-founder-live-use-contract-report.md",
  "reports/p1012-founder-live-use-readiness-model-report.md",
  "reports/p1013-founder-live-use-review-packet-report.md",
  "reports/p1014-command-center-founder-live-use-ux-report.md",
];

addCheck("package scripts registered", p101Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P101.1-P101.5 contract status", p101Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P101.6 remains next planned", subphaseById.get("P101.6")?.status === "planned");
addCheck("P101 reports exist", p101Reports.every(exists));
addCheck("P101.4 Playwright coverage exists", routeTests.includes("Founder live use readiness appears across founder routes"));
addCheck("route-wide safety tests retained", routeTests.includes("full Command Center routes do not show DemoApp") && routeTests.includes("theme switcher"));
addCheck("Command Center card present", pageSource.includes("FounderLiveUseReviewCard") && pageSource.includes("Founder live use readiness"));
addCheck("Business Build view model present", businessData.includes("founderLiveUseReadiness") && businessData.includes("founderLiveUseReview"));
addCheck("view model is useful", viewModel.founderLiveUseReview?.laneRows?.length === 6 && viewModel.founderLiveUseReview?.checklist?.length >= 4);
addCheck("execution remains blocked", viewModel.founderLiveUseReview?.executableLaneCount === 0 && viewModel.founderLiveUseReview?.dispatchableLaneCount === 0);
addCheck("docs record P101.5", /P101\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(docs) && docs.includes("check:p1015-founder-live-use-validation"));
addCheck("platform roadmap records P101.5", /P101\.5 is\s+complete/.test(platformRoadmap) && /P101\.6 is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  status.currentPhase === "P101.5"
    && status.previousPhase === "P101.4"
    && status.nextPhase === "P101.6"
    && statusById.get("P101.5")?.status === "complete"
    && roadmapById.get("P101.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P101.6 handoff remains planned", statusById.get("P101.6")?.status === "planned" && roadmapById.get("P101.6")?.status === "planned");
addCheck("no DemoApp leakage in route test", routeTests.includes("DemoApp") && routeTests.includes("not.toContain(\"DemoApp\")"));
addCheck("no unsafe runnable actions in P101 view", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(JSON.stringify(viewModel.founderLiveUseReview || {})));
addCheck("P101.5 avoids forbidden file scope", !subphaseById.get("P101.5")?.allowedFiles?.some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P101.1 through P101.4 validation evidence.",
        "- Confirms Command Center founder live-use UX, route tests, docs, status, reports, and safety checks are aligned.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1015-founder-live-use-validation",
        "- npm run check:p1014-command-center-founder-live-use-ux",
        "- npm run check:p1013-founder-live-use-review-packet",
        "- npm run check:p1012-founder-live-use-readiness-model",
        "- npm run check:p1011-founder-live-use-contract",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live use|full Command Center routes do not show DemoApp\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P101.5 is aggregate validation only. It does not approve execution, dispatch agents, run workers/tools, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P101.5 Founder Live Use Validation Report", phase: "P101.5" },
);

printCheckReport("P101.5 Founder Live Use Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
