import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p866-tests-docs-roadmap-report.md";
const P86_SUBPHASES = ["P86.1", "P86.2", "P86.3", "P86.4", "P86.5"];
const REQUIRED_SCRIPTS = [
  "check:p861-live-capability-admission",
  "check:p862-capability-state-resolver",
  "check:p863-operator-approval-queue",
  "check:p864-command-center-live-admission-ux",
  "check:p865-activation-dry-run",
];
const REQUIRED_REPORTS = [
  "reports/p861-live-capability-admission-report.md",
  "reports/p862-capability-state-resolver-report.md",
  "reports/p863-operator-approval-queue-report.md",
  "reports/p864-command-center-live-admission-ux-report.md",
  "reports/p865-activation-dry-run-report.md",
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
const docs = readText("docs/architecture/P86_GOVERNED_LIVE_CAPABILITY_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const contract = readText("contracts/os-roadmap/p86-execution-contracts.json");
const dashboardSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const tests = readText("dashboard/tests/routes.spec.js");

addCheck("package scripts registered", REQUIRED_SCRIPTS.every((script) => Boolean(packageJson.scripts?.[script])) && Boolean(packageJson.scripts?.["check:p866-tests-docs-roadmap"]));
addCheck("reports exist", REQUIRED_REPORTS.every(fileExists));
addCheck("subphase statuses complete", P86_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("subphase commits stamped", P86_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.commit && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("roadmap tracks P86 subphases", P86_SUBPHASES.every((phaseId) => roadmapById.get(phaseId)?.track === "NEXUS_OS"));
addCheck("docs list validations", REQUIRED_SCRIPTS.every((script) => docs.includes(`npm run ${script}`)));
addCheck("platform roadmap records P86.6", platformRoadmap.includes("P86.5 is complete") && platformRoadmap.includes("P86.6 is complete") && platformRoadmap.includes("P86.7 is next"));
addCheck("contract references aggregate checker", contract.includes("check:p866-tests-docs-roadmap"));
addCheck("Command Center queue UX covered", dashboardSource.includes("Governed live approval queue") && tests.includes("Approval Queue"));
addCheck("phase status advanced", statusById.get("P86.6")?.status === "complete" && status.currentPhase === "P86.6" && status.nextPhase === "P86.7");
addCheck("no DemoApp/private IDs", !dashboardSource.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(dashboardSource));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(dashboardSource));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P86.1-P86.5 validation evidence.",
        "- Checks scripts, reports, status, roadmap, docs, Command Center UX coverage, and safety posture.",
        "- Does not enable providers, agents, tools, workers, project mutation, DB writes, deploy, package, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p866-tests-docs-roadmap",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    { title: "Known Limitations", body: "- P86.6 is validation aggregation only. Execution-capable runtime actions remain disabled." },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P86.6 Tests Docs Roadmap Report", phase: "P86.6" },
);

printCheckReport("P86.6 Tests Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
