import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p867-final-validation-report.md";
const P86_SUBPHASES = ["P86.1", "P86.2", "P86.3", "P86.4", "P86.5", "P86.6"];
const REQUIRED_SCRIPTS = [
  "check:p861-live-capability-admission",
  "check:p862-capability-state-resolver",
  "check:p863-operator-approval-queue",
  "check:p864-command-center-live-admission-ux",
  "check:p865-activation-dry-run",
  "check:p866-tests-docs-roadmap",
];
const REQUIRED_REPORTS = [
  "reports/p861-live-capability-admission-report.md",
  "reports/p862-capability-state-resolver-report.md",
  "reports/p863-operator-approval-queue-report.md",
  "reports/p864-command-center-live-admission-ux-report.md",
  "reports/p865-activation-dry-run-report.md",
  "reports/p866-tests-docs-roadmap-report.md",
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

addCheck("P86 status complete", statusById.get("P86")?.status === "complete" && roadmapById.get("P86")?.status === "complete");
addCheck("P86.7 status complete", statusById.get("P86.7")?.status === "complete" && status.currentPhase === "P86.7" && status.nextPhase === "P87");
addCheck("all prior subphases complete", P86_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("all prior commits stamped", P86_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.commit && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("package scripts registered", REQUIRED_SCRIPTS.every((script) => Boolean(packageJson.scripts?.[script])) && Boolean(packageJson.scripts?.["check:p867-final-validation"]));
addCheck("reports exist", REQUIRED_REPORTS.every(fileExists));
addCheck("docs describe P86.7", docs.includes("P86.7 Final Validation") && docs.includes("npm run check:p867-final-validation"));
addCheck("platform roadmap closes P86", platformRoadmap.includes("P86.7 is complete") && platformRoadmap.includes("P87 is next"));
addCheck("contract references final checker", contract.includes("check:p867-final-validation"));
addCheck("Command Center approval queue present", dashboardSource.includes("Governed live approval queue") && tests.includes("Approval Queue"));
addCheck("no DemoApp/private IDs in Command Center source", !dashboardSource.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(dashboardSource));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(dashboardSource));
addCheck("unsafe capabilities remain blocked in docs", /provider\/model calls|agent dispatch|project mutation|DB writes|provider spend/i.test(docs));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Final validation for P86 governed live capability admission.",
        "- Confirms P86.1-P86.6 evidence, Command Center Live Readiness queue UX, docs, roadmap, and status closure.",
        "- Does not enable providers, agents, tools, workers, project mutation, DB writes, deploy, package, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p867-final-validation",
        "- npm run check:p866-tests-docs-roadmap",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live Ready route renders evidence-backed activation labels without runnable actions\"",
        "- git diff --check",
      ].join("\n"),
    },
    { title: "Known Limitations", body: "- P86 closes governed live admission and dry-run UX. Actual live execution remains blocked for a later explicit activation phase." },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P86.7 Final Validation Report", phase: "P86.7" },
);

printCheckReport("P86.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
