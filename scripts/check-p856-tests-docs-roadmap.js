import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p856-tests-docs-roadmap-report.md";
const P85_SUBPHASES = ["P85.1", "P85.2", "P85.3", "P85.4", "P85.5"];
const REQUIRED_SCRIPTS = [
  "check:p851-enterprise-founder-session",
  "check:p852-founder-turn-state",
  "check:p853-prd-review-gate",
  "check:p854-task-board-admission",
  "check:p855-command-center-business-runtime-ux",
];
const REQUIRED_REPORTS = [
  "reports/p851-enterprise-founder-session-report.md",
  "reports/p852-founder-turn-state-report.md",
  "reports/p853-prd-review-gate-report.md",
  "reports/p854-task-board-admission-report.md",
  "reports/p855-command-center-business-runtime-ux-report.md",
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
const tests = readText("dashboard/tests/routes.spec.js");
const dashboardSource = readText("dashboard/src/pages/CommandCenterV2.jsx");

addCheck("package scripts registered", REQUIRED_SCRIPTS.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("reports exist", REQUIRED_REPORTS.every(fileExists));
addCheck("subphase statuses complete", P85_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("subphase commits stamped", P85_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.commit && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("roadmap tracks P85 subphases", P85_SUBPHASES.every((phaseId) => roadmapById.get(phaseId)?.track === "NEXUS_OS"));
addCheck("docs list validations", REQUIRED_SCRIPTS.every((script) => docs.includes(`npm run ${script}`)));
addCheck("platform roadmap records P85.6 complete", platformRoadmap.includes("P85.5 is complete") && platformRoadmap.includes("P85.6 is complete") && platformRoadmap.includes("P85.7 is next"));
addCheck("contract references aggregate checker", contract.includes("check:p856-tests-docs-roadmap"));
addCheck("Playwright coverage covers workflow", ["interactive founder chat", "PRD review gate", "local task board", "founder workflow summary"].every((label) => tests.includes(label)));
addCheck("Command Center workflow remains visible", dashboardSource.includes("Founder workflow summary") && dashboardSource.includes("Local agent task board") && dashboardSource.includes("Local PRD review gate"));
addCheck("phase status advanced", statusById.get("P85.6")?.status === "complete" && status.currentPhase === "P85.6" && status.nextPhase === "P85.7");
addCheck("no DemoApp/private IDs in founder workflow source", !dashboardSource.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(dashboardSource));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|create project now/i.test(dashboardSource));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P85.1-P85.5 validation evidence.",
        "- Checks scripts, reports, status, roadmap, docs, Command Center UX coverage, and safety posture.",
        "- Does not enable providers, agents, tools, workers, project mutation, DB writes, deploy, package, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p856-tests-docs-roadmap",
        "- npm run check:p85-execution-plan",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    { title: "Known Limitations", body: "- P85.6 is validation aggregation only. Execution-capable runtime actions remain disabled." },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P85.6 Tests Docs Roadmap Report", phase: "P85.6" },
);

printCheckReport("P85.6 Tests Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
