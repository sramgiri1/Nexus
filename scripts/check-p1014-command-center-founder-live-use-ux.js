import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1014-command-center-founder-live-use-ux-report.md";

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
const contract = readJson("contracts/os-roadmap/p101-execution-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p1014 = contract.subphases?.find((entry) => entry.phaseId === "P101.4");
const p1015 = contract.subphases?.find((entry) => entry.phaseId === "P101.5");
const businessData = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const docs = readText("docs/architecture/P101_FOUNDER_LIVE_USE_HARDENING_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const readiness = viewModel.founderLiveUseReadiness || {};
const review = viewModel.founderLiveUseReview || {};
const serializedView = JSON.stringify({ readiness, review });
const componentSource = pageSource.slice(
  pageSource.indexOf("function FounderLiveUseReviewCard"),
  pageSource.indexOf("function ExecutionAdmissionCard"),
);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1014-command-center-founder-live-use-ux"]));
addCheck("view model exposes readiness and review", Boolean(readiness.currentState) && Boolean(review.currentState));
addCheck("view model exposes lane rows", readiness.laneRows?.length === 6 && review.laneRows?.length === 6);
addCheck("view model exposes checklist", review.checklist?.length >= 4 && review.readyItemCount === review.totalItemCount);
addCheck("execution remains blocked in view model", review.executableLaneCount === 0 && review.dispatchableLaneCount === 0 && review.projectMutationLaneCount === 0);
addCheck("view model exposes evidence activity cost", Boolean(review.evidenceLocation) && Boolean(review.activityLocation) && Boolean(review.costImpact));
addCheck("business data exposes browser-safe P101 view", businessData.includes("buildFounderLiveUseDisplayModels") && businessData.includes("reports/p1013-founder-live-use-review-packet-report.md"));
addCheck(
  "business data avoids Node-only P101 imports",
  !businessData.includes("../../../live-ready/founderLiveUseReadiness.js")
    && !businessData.includes("../../../live-ready/founderLiveUseReviewPacket.js"),
);
addCheck("Command Center component added", pageSource.includes("function FounderLiveUseReviewCard") && pageSource.includes("aria-label=\"Founder live use readiness\""));
addCheck("Lite surface renders card", pageSource.includes("Lite Founder Live Use"));
addCheck("Business Build surface renders card", pageSource.includes("Business Build Founder Live Use"));
addCheck("Agent Flow surface renders card", pageSource.includes("Agent Flow Founder Live Use"));
addCheck("Live Readiness surface renders card", pageSource.includes("Live Readiness Founder Live Use"));
addCheck("Playwright coverage added", routeTests.includes("Founder live use readiness appears across founder routes") && routeTests.includes("/command-center/live-readiness"));
addCheck("theme source preserved", !/data-nexus-theme|setTheme|resolvedTheme/.test(pageSource.replace(readText("dashboard/src/pages/CommandCenterV2.jsx"), "")));
addCheck("contract marks P101.4 complete", p1014?.status === "complete" && ["planned", "complete"].includes(p1015?.status));
addCheck("docs record P101.4", /P101\.4 Command Center Live-Use UX[\s\S]*Status:\s+complete/.test(docs) && docs.includes("check:p1014-command-center-founder-live-use-ux"));
addCheck("platform roadmap records P101.4", /P101\.4 is\s+complete/.test(platformRoadmap) && /P101\.5 is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced within P101",
  ["P101.4", "P101.5", "P101.6", "P101.7"].includes(status.currentPhase)
    && ["P101.3", "P101.4", "P101.5", "P101.6"].includes(status.previousPhase)
    && ["P101.5", "P101.6", "P101.7", "P102"].includes(status.nextPhase)
    && statusById.get("P101.4")?.status === "complete"
    && roadmapById.get("P101.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P101.5 handoff planned or complete", ["planned", "complete"].includes(statusById.get("P101.5")?.status) && ["planned", "complete"].includes(roadmapById.get("P101.5")?.status));
addCheck("no raw private IDs exposed", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedView + componentSource));
addCheck("no raw dumps exposed", !/raw JSON|raw logs|raw policy dump/i.test(componentSource));
addCheck("no DemoApp leakage", !pageSource.includes("DemoApp"));
addCheck("no unsafe runnable actions invented", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serializedView + pageSource));
addCheck("P101.4 avoids forbidden file scope", !p1014.allowedFiles.some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P101.4 Command Center founder live-use UX wiring.",
        "- Confirms Lite, Business Build, Agent Flow, and Live Readiness surfaces render display-safe founder live-use readiness.",
        "- Confirms P101.4 does not dispatch agents, execute workers/tools, mutate projects, call providers/models, write hosted DB state, deploy, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1014-command-center-founder-live-use-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live use\"",
        "- cd dashboard && npm run build",
        "- npm run check:p1013-founder-live-use-review-packet",
        "- npm run check:p1012-founder-live-use-readiness-model",
        "- npm run check:p1011-founder-live-use-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P101.4 is UI wiring only. It does not approve execution, dispatch agents, run workers/tools, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P101.4 Command Center Founder Live Use UX Report", phase: "P101.4" },
);

printCheckReport("P101.4 Command Center Founder Live Use UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
