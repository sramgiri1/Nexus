import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p857-final-validation-report.md";
const P85_SUBPHASES = ["P85.1", "P85.2", "P85.3", "P85.4", "P85.5", "P85.6"];
const REQUIRED_SCRIPTS = [
  "check:p851-enterprise-founder-session",
  "check:p852-founder-turn-state",
  "check:p853-prd-review-gate",
  "check:p854-task-board-admission",
  "check:p855-command-center-business-runtime-ux",
  "check:p856-tests-docs-roadmap",
];
const REQUIRED_REPORTS = [
  "reports/p851-enterprise-founder-session-report.md",
  "reports/p852-founder-turn-state-report.md",
  "reports/p853-prd-review-gate-report.md",
  "reports/p854-task-board-admission-report.md",
  "reports/p855-command-center-business-runtime-ux-report.md",
  "reports/p856-tests-docs-roadmap-report.md",
];

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
const docs = readText("docs/architecture/P85_ENTERPRISE_FOUNDER_BUSINESS_RUNTIME_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const contract = readText("contracts/os-roadmap/p85-execution-contracts.json");
const dashboardSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const tests = readText("dashboard/tests/routes.spec.js");

addCheck("P85 status complete", statusById.get("P85")?.status === "complete" && roadmapById.get("P85")?.status === "complete");
addCheck("P85.7 status complete", statusById.get("P85.7")?.status === "complete" && status.currentPhase === "P85.7" && status.nextPhase === "P86");
addCheck("all prior subphases complete", P85_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("all prior commits stamped", P85_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.commit && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("package scripts registered", REQUIRED_SCRIPTS.every((script) => Boolean(packageJson.scripts?.[script])) && Boolean(packageJson.scripts?.["check:p857-final-validation"]));
addCheck("reports exist", REQUIRED_REPORTS.every(fileExists));
addCheck("docs describe P85.7", docs.includes("P85.7 Final Validation") && docs.includes("npm run check:p857-final-validation"));
addCheck("platform roadmap closes P85", platformRoadmap.includes("P85.7 is complete") && platformRoadmap.includes("P86 is next"));
addCheck("contract references final checker", contract.includes("check:p857-final-validation"));
addCheck("Command Center Lite founder workflow present", dashboardSource.includes("Founder workflow summary") && dashboardSource.includes("Local PRD review gate") && dashboardSource.includes("Local agent task board"));
addCheck("Playwright coverage present", ["interactive founder chat", "PRD review gate", "local task board", "founder workflow summary"].every((label) => tests.includes(label)));
addCheck("no DemoApp/private IDs in founder workflow source", !dashboardSource.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(dashboardSource));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|create project now|call provider now/i.test(dashboardSource));
addCheck("unsafe capabilities remain blocked in docs", /provider\/model calls|agent dispatch|project mutation|DB writes|provider spend/i.test(docs));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Final validation for P85 enterprise founder business runtime.",
        "- Confirms P85.1-P85.6 evidence, Command Center Lite workflow, docs, roadmap, and status closure.",
        "- Does not enable providers, agents, tools, workers, project mutation, DB writes, deploy, package, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p857-final-validation",
        "- npm run check:p856-tests-docs-roadmap",
        "- npm run check:p85-execution-plan",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Command Center Lite route renders (interactive founder chat|PRD review gate|local task board|founder workflow summary)\"",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P85 closes local founder business runtime planning. Provider/model calls, real agent dispatch, project mutation, DB writes, deploy, package, and spend remain blocked for later explicit phases.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P85.7 Final Validation Report", phase: "P85.7" },
);

printCheckReport("P85.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
