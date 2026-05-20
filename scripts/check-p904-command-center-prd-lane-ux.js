import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p904-command-center-prd-lane-ux-report.md";

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
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readText("contracts/os-roadmap/p90-execution-contracts.json");
const docs = readText("docs/architecture/P90_GOVERNED_FOUNDER_PRD_LIVE_AUTHORING_LANE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const statusChecker = readText("scripts/check-os-phase-status.js");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");

const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const localPrd = viewModel.founderPrdAuthoring || {};
const serialized = JSON.stringify(localPrd);
const localPrdPanel = pageSource.slice(pageSource.indexOf('tabId="localPrd"'), pageSource.indexOf('tabId="workstreams"'));

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p904-command-center-prd-lane-ux"]));
addCheck("Business Build data reuses safe authoring", dataSource.includes("buildFounderPrdSafeAuthoring") && dataSource.includes("founderPrdAuthoring"));
addCheck("Business Build tabs include Local PRD", tabsSource.includes('id: "localPrd"') && tabsSource.includes('label: "Local PRD"'));
addCheck("Command Center renders Local PRD panel", pageSource.includes('tabId="localPrd"') && pageSource.includes("Local PRD Artifact") && pageSource.includes("Operator Review Checklist"));
addCheck("Local PRD artifact is useful", localPrd.title?.includes("Snake") && localPrd.sections?.some((section) => /casual iPhone players/i.test(section.content)));
addCheck("Local PRD review state visible", localPrd.reviewState === "Ready For Operator Review" && localPrd.currentState === "Local PRD Authored Ready For Operator Review");
addCheck("Local PRD acceptance criteria visible", Array.isArray(localPrd.acceptanceCriteria) && localPrd.acceptanceCriteria.length >= 3);
addCheck("Local PRD safety rows visible", ["Project writes", "Project mutation", "Agent dispatch", "Provider calls", "Network", "Spend"].every((label) => localPrd.safetyRows?.some((row) => row.label === label && row.value === "Blocked")));
addCheck("Local PRD UX avoids raw markdown dumps", !localPrdPanel.includes("markdown") && !localPrdPanel.includes("raw JSON") && !localPrdPanel.includes("raw logs"));
addCheck("Local PRD UX avoids internal phase labels", !/P90\./.test(localPrdPanel + serialized));
addCheck("Local PRD UX avoids runnable unsafe actions", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now/i.test(localPrdPanel + serialized));
addCheck("Local PRD UX avoids DemoApp/private IDs", !/DemoApp|private-project-01|private-project-governed-build-mission|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(localPrdPanel + serialized));
addCheck("route tests cover Local PRD", routeTests.includes('commandTab(page, "Local PRD")') && routeTests.includes("Business Build Local PRD tab shows safe in-memory artifact"));
addCheck("contract tracks P90.4 files", contract.includes("P90.4") && contract.includes("dashboard/src/pages/CommandCenterV2.jsx") && contract.includes("check:p904-command-center-prd-lane-ux"));
addCheck("docs record P90.4", docs.includes("P90.4 is complete") && docs.includes("npm run check:p904-command-center-prd-lane-ux"));
addCheck(
  "platform roadmap records P90.4",
  platformRoadmap.includes("P90.4 is complete")
    && (platformRoadmap.includes("P90.5 is next") || platformRoadmap.includes("P90.5 is complete")),
);
addCheck(
  "phase status advanced",
  ["in_progress", "complete"].includes(statusById.get("P90")?.status)
    && statusById.get("P90.4")?.status === "complete"
    && ["P90.4", "P90.5", "P90.6", "P90.7"].includes(status.currentPhase)
    && ["P90.3", "P90.4", "P90.5", "P90.6"].includes(status.previousPhase)
    && ["P90.5", "P90.6", "P90.7", "P91"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P90.4", roadmapById.get("P90.4")?.track === "NEXUS_OS" && roadmapById.get("P90.4")?.status === "complete");
addCheck("status checker accepts P90.5", statusChecker.includes("\"P90.5\""));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P90.4 Command Center Local PRD lane UX.",
        "- Confirms the Business Build route shows the in-memory PRD artifact, review state, next action, owner, evidence, activity, cost, and blocked unsafe operations.",
        "- Confirms the UX avoids raw JSON, raw logs, internal phase labels, DemoApp leakage, raw private IDs, and fake runnable actions.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p904-command-center-prd-lane-ux",
        "- npm run check:p903-founder-prd-safe-authoring",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Business Build\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P90.4 is a Command Center UX lane only. It does not write project files, dispatch agents, execute tools/workers, call providers/models, write DB state, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P90.4 Command Center PRD Lane UX Report", phase: "P90.4" },
);

printCheckReport("P90.4 Command Center PRD Lane UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
