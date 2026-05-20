import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p875-command-center-live-unlock-ux-report.md";

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
const tabs = readText("dashboard/src/data/commandCenterTabs.js");
const dataSource = readText("dashboard/src/data/liveReadiness.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const contract = readText("contracts/os-roadmap/p87-execution-contracts.json");
const docs = readText("docs/architecture/P87_EXPLICIT_LIVE_ACTIVATION_UNLOCKS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const liveTabsSource = tabs.slice(tabs.indexOf("export const LIVE_READINESS_TABS"), tabs.indexOf("export const FOUNDER_INTAKE_TABS"));
const livePageSource = pageSource.slice(pageSource.indexOf("function LiveReadinessPage"), pageSource.indexOf("function FounderIntakePage"));
const renderedSourceText = [liveTabsSource, dataSource, livePageSource].join("\n");

addCheck("live unlock tab registered", tabs.includes("Live Unlocks") && tabs.includes("Review only"));
addCheck("live unlock data has four lanes", ["Explicit Activation Contract", "Secret / Provider Readiness", "Local Agent Dispatch Admission", "Generated Project Workspace Admission"].every((label) => dataSource.includes(label)));
addCheck("live unlock page renders display fields", ["Explicit live unlock lanes", "Current state", "Next action", "Blockers", "Evidence", "Activity", "Cost"].every((label) => pageSource.includes(label)));
addCheck("playwright coverage updated", routeTests.includes("Live Unlocks") && routeTests.includes("Generated Project Workspace Admission"));
addCheck("no runnable live actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute now|run now/i.test(renderedSourceText));
addCheck("no DemoApp or raw private IDs", !renderedSourceText.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(renderedSourceText));
addCheck("no raw dumps or logs", !/raw JSON|raw logs|policy dump/i.test(renderedSourceText));
addCheck("no browser-unsafe P87 runtime imports", !dataSource.includes("../../../live-ready/"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p875-command-center-live-unlock-ux"]));
addCheck("contract references P87.5 files", contract.includes("dashboard/src/data/liveReadiness.js") && contract.includes("check:p875-command-center-live-unlock-ux"));
addCheck("docs mention P87.5 validation", docs.includes("P87.5 Command Center Live Unlock UX") && docs.includes("npm run check:p875-command-center-live-unlock-ux"));
addCheck(
  "platform roadmap records P87.5",
  platformRoadmap.includes("P87.5 is complete")
    && (platformRoadmap.includes("P87.6 is next") || platformRoadmap.includes("P87.6 is complete")),
);
addCheck(
  "phase status advanced",
  ["in_progress", "complete"].includes(statusById.get("P87")?.status)
    && statusById.get("P87.5")?.status === "complete"
    && ["P87.5", "P87.6", "P87.7"].includes(status.currentPhase)
    && ["P87.6", "P87.7", "P88"].includes(status.nextPhase),
);
addCheck("roadmap tracks P87.5", roadmapById.get("P87.5")?.track === "NEXUS_OS" && roadmapById.get("P87.5")?.status === "complete");

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P87.5 Command Center Live Readiness unlock UX.",
        "- Confirms P87.1-P87.4 unlock lanes are display-safe and review-only.",
        "- Confirms no runnable provider, agent, worker, project, DB, deploy, package, network, or spend actions are exposed.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p875-command-center-live-unlock-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live Ready route renders evidence-backed activation labels without runnable actions\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P87.5 is UX only. Live unlock rows do not execute provider calls, agent dispatch, worker tasks, project writes, DB writes, deploy, package, network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P87.5 Command Center Live Unlock UX Report", phase: "P87.5" },
);

printCheckReport("P87.5 Command Center Live Unlock UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
