import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p884-command-center-scoped-activation-ux-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}
function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}
function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
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
const contract = readText("contracts/os-roadmap/p88-execution-contracts.json");
const docs = readText("docs/architecture/P88_SCOPED_EXECUTION_CAPABLE_ACTIVATION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const liveData = readText("dashboard/src/data/liveReadiness.js");
const tabs = readText("dashboard/src/data/commandCenterTabs.js");
const page = readText("dashboard/src/pages/CommandCenterV2.jsx");
const tests = readText("dashboard/tests/routes.spec.js");

const scopedPanelMatch = page.match(/<CommandTabPanel tabId="scoped"[\s\S]*?<CommandTabPanel tabId="bridge"/);
const scopedPanel = scopedPanelMatch ? scopedPanelMatch[0] : "";
const scopedUx = [liveData, scopedPanel].join("\n");

addCheck("scoped activation data registered", liveData.includes("SCOPED_ACTIVATION_ROWS") && liveData.includes("scopedActivation"));
addCheck("scoped activation tab registered", tabs.includes("Scoped Activation") && tabs.includes("P88 local activation request and executor admission state"));
addCheck("page renders scoped activation panel", scopedPanel.includes('tabId="scoped"') && scopedPanel.includes("Scoped activation admission") && scopedPanel.includes("readiness.scopedActivation"));
addCheck("Playwright coverage updated", tests.includes('commandTab(page, "Scoped Activation").click()') && tests.includes("P88 local activation admission visible"));
addCheck("primary UX fields present", ["Current state", "Next action", "Blockers", "Owner", "Evidence", "Activity", "Cost"].every((field) => scopedUx.includes(field)));
addCheck("no runnable scoped activation actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(scopedUx));
addCheck("no DemoApp or raw private IDs", !/DemoApp|private-project-01|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(scopedUx));
addCheck("no raw dumps or logs", !/JSON\.stringify\(|raw JSON|raw logs|policy dump/i.test(scopedUx));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p884-command-center-scoped-activation-ux"]));
addCheck("contract references P88.4 files", contract.includes("dashboard/src/data/liveReadiness.js") && contract.includes("check:p884-command-center-scoped-activation-ux"));
addCheck("docs mention P88.4 validation", docs.includes("P88.4 Command Center Scoped Activation UX") && docs.includes("npm run check:p884-command-center-scoped-activation-ux"));
addCheck(
  "platform roadmap records P88.4",
  platformRoadmap.includes("P88.4 is complete")
    && (platformRoadmap.includes("P88.5 is next") || platformRoadmap.includes("P88.5 is complete")),
);
addCheck(
  "phase status advanced",
  ["in_progress", "complete"].includes(statusById.get("P88")?.status)
    && statusById.get("P88.4")?.status === "complete"
    && ["P88.4", "P88.5", "P88.6", "P88.7"].includes(status.currentPhase)
    && ["P88.3", "P88.4", "P88.5", "P88.6"].includes(status.previousPhase)
    && ["P88.5", "P88.6", "P88.7", "P89"].includes(status.nextPhase),
);
addCheck("roadmap tracks P88.4", roadmapById.get("P88.4")?.track === "NEXUS_OS" && roadmapById.get("P88.4")?.status === "complete");
addCheck("report prerequisites exist", fileExists("reports/p883-local-executor-admission-report.md") && fileExists("reports/os-phase-status-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P88.4 Command Center scoped activation UX.",
        "- Confirms Live Readiness shows P88 activation/request/executor admission state.",
        "- Confirms no runnable live action is exposed.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p884-command-center-scoped-activation-ux",
        "- npm run check:p883-local-executor-admission",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live Ready route renders evidence-backed activation labels without runnable actions\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P88.4 is UX only. It does not run an executor, dispatch agents, execute tools/workers, mutate projects, call providers/models, write DB state, use network calls, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P88.4 Command Center Scoped Activation UX Report", phase: "P88.4" },
);

printCheckReport("P88.4 Command Center Scoped Activation UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
