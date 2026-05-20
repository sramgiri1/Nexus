import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p894-command-center-founder-workstream-ux-report.md";

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
const data = readText("dashboard/src/data/businessBuild.js");
const tabs = readText("dashboard/src/data/commandCenterTabs.js");
const page = readText("dashboard/src/pages/CommandCenterV2.jsx");
const tests = readText("dashboard/tests/routes.spec.js");
const contract = readText("contracts/os-roadmap/p89-execution-contracts.json");
const docs = readText("docs/architecture/P89_GOVERNED_LOCAL_ENTERPRISE_RUNTIME_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");

const dryRunPanelMatch = page.match(/<CommandTabPanel tabId="dryRun"[\s\S]*?<CommandTabPanel tabId="milestones"/);
const dryRunPanel = dryRunPanelMatch ? dryRunPanelMatch[0] : "";
const uxText = [data, dryRunPanel].join("\n");

addCheck("business build dry-run data registered", data.includes("FOUNDER_WORKSTREAM_DRY_RUN_ROWS") && data.includes("founderWorkstreamDryRun"));
addCheck("Founder Dry Run tab registered", tabs.includes("Founder Dry Run") && tabs.includes("agent lane transition preview"));
addCheck("page renders dry-run panel", dryRunPanel.includes('tabId="dryRun"') && dryRunPanel.includes("Founder Workstream Dry Run") && dryRunPanel.includes("Agent Lane Planning"));
addCheck("primary UX fields present", ["Next action", "Owner", "Evidence", "Activity", "Cost", "Inputs", "Blockers"].every((field) => dryRunPanel.includes(field)));
addCheck("Playwright coverage updated", tests.includes("Business Build route renders founder workstream dry-run state") && tests.includes("Founder Dry Run") && tests.includes("PRD readiness packet outline"));
addCheck("no runnable dry-run actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(uxText));
addCheck("no DemoApp or raw private IDs", !/DemoApp|private-project-01|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(uxText));
addCheck("no raw dumps or logs", !/JSON\.stringify\(|raw JSON|raw logs|policy dump/i.test(uxText));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p894-command-center-founder-workstream-ux"]));
addCheck("contract references P89.4 files", contract.includes("dashboard/src/data/businessBuild.js") && contract.includes("check:p894-command-center-founder-workstream-ux"));
addCheck("docs mention P89.4 validation", docs.includes("P89.4 Command Center UX") && docs.includes("npm run check:p894-command-center-founder-workstream-ux"));
addCheck(
  "platform roadmap records P89.4",
  platformRoadmap.includes("P89.4 is complete")
    && (platformRoadmap.includes("P89.5 is next") || platformRoadmap.includes("P89.5 is complete")),
);
addCheck(
  "phase status advanced",
  statusById.get("P89")?.status === "in_progress"
    && statusById.get("P89.4")?.status === "complete"
    && ["P89.4", "P89.5", "P89.6", "P89.7"].includes(status.currentPhase)
    && ["P89.3", "P89.4", "P89.5", "P89.6"].includes(status.previousPhase)
    && ["P89.5", "P89.6", "P89.7", "P90"].includes(status.nextPhase),
);
addCheck("roadmap tracks P89.4", roadmapById.get("P89.4")?.track === "NEXUS_OS" && roadmapById.get("P89.4")?.status === "complete");

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P89.4 Business Build founder dry-run UX.",
        "- Confirms founder Q&A, PRD readiness, and agent lane planning preview is visible.",
        "- Confirms no runnable live action is exposed.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p894-command-center-founder-workstream-ux",
        "- npm run check:p893-local-founder-workstream-dry-run",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Business Build route renders founder workstream dry-run state\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P89.4 is UX only. It does not run an executor, dispatch agents, execute tools/workers, mutate projects, call providers/models, write DB state, use network calls, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P89.4 Command Center Founder Workstream UX Report", phase: "P89.4" },
);

printCheckReport("P89.4 Command Center Founder Workstream UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
