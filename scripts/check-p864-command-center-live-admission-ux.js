import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p864-command-center-live-admission-ux-report.md";

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
const contract = readText("contracts/os-roadmap/p86-execution-contracts.json");
const docs = readText("docs/architecture/P86_GOVERNED_LIVE_CAPABILITY_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const dataSource = readText("dashboard/src/data/liveReadiness.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const testsSource = readText("dashboard/tests/routes.spec.js");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p864-command-center-live-admission-ux"]));
addCheck("Live Readiness data exposes browser-safe approval queue", dataSource.includes("APPROVAL_QUEUE_ROWS") && dataSource.includes("approvalQueue") && !dataSource.includes("buildGovernedLiveOperatorApprovalQueue"));
addCheck("Approval Queue tab registered", tabsSource.includes("Approval Queue") && tabsSource.includes("queue"));
addCheck("Command Center renders queue panel", pageSource.includes("Governed live approval queue") && pageSource.includes("approvals cannot execute actions"));
addCheck("Playwright covers queue", testsSource.includes("Approval Queue") && testsSource.includes("Governed live approval queue") && testsSource.includes("Not Requestable"));
addCheck("contract references P86.4 files", contract.includes("dashboard/src/data/liveReadiness.js") && contract.includes("check:p864-command-center-live-admission-ux"));
addCheck("docs mention P86.4 validation", docs.includes("P86.4 Command Center UX") && docs.includes("npm run check:p864-command-center-live-admission-ux"));
addCheck("platform roadmap records P86.4", platformRoadmap.includes("P86.4 is complete") && platformRoadmap.includes("P86.5 is next"));
addCheck("phase status advanced", statusById.get("P86.4")?.status === "complete" && status.currentPhase === "P86.4" && status.nextPhase === "P86.5");
addCheck("roadmap tracks P86.4", roadmapById.get("P86.4")?.track === "NEXUS_OS" && roadmapById.get("P86.4")?.status === "complete");
addCheck("no DemoApp/private IDs in live readiness source", !pageSource.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(pageSource));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(`${pageSource}\n${dataSource}`));
addCheck("report prerequisites exist", fileExists("reports/p863-operator-approval-queue-report.md") && fileExists("reports/os-phase-status-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P86.4 Command Center Live Readiness approval queue UX.",
        "- Confirms governed live approval queue is visible without runnable actions.",
        "- Preserves route-wide safety: no DemoApp leakage, raw private IDs, or fake unsafe action labels.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p864-command-center-live-admission-ux",
        "- npm run check:p863-operator-approval-queue",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live Ready route renders evidence-backed activation labels without runnable actions\"",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P86.4 is UX only. Runtime execution, provider/model calls, agent dispatch, project mutation, DB writes, deploy, package, and spend remain disabled.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P86.4 Command Center Live Admission UX Report", phase: "P86.4" },
);

printCheckReport("P86.4 Command Center Live Admission UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
