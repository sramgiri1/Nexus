import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p877-final-validation-report.md";
const P87_SUBPHASES = ["P87.1", "P87.2", "P87.3", "P87.4", "P87.5", "P87.6"];
const REQUIRED_SCRIPTS = [
  "check:p871-explicit-live-activation-contract",
  "check:p872-secret-provider-readiness",
  "check:p873-local-agent-dispatch-admission",
  "check:p874-generated-project-workspace-admission",
  "check:p875-command-center-live-unlock-ux",
  "check:p876-tests-docs-roadmap",
];
const REQUIRED_REPORTS = [
  "reports/p871-explicit-live-activation-contract-report.md",
  "reports/p872-secret-provider-readiness-report.md",
  "reports/p873-local-agent-dispatch-admission-report.md",
  "reports/p874-generated-project-workspace-admission-report.md",
  "reports/p875-command-center-live-unlock-ux-report.md",
  "reports/p876-tests-docs-roadmap-report.md",
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
const docs = readText("docs/architecture/P87_EXPLICIT_LIVE_ACTIVATION_UNLOCKS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const contract = readText("contracts/os-roadmap/p87-execution-contracts.json");
const liveReadinessData = readText("dashboard/src/data/liveReadiness.js");
const routeTests = readText("dashboard/tests/routes.spec.js");

addCheck("P87 status complete", statusById.get("P87")?.status === "complete" && roadmapById.get("P87")?.status === "complete");
addCheck("P87.7 status complete", statusById.get("P87.7")?.status === "complete" && status.currentPhase === "P87.7" && status.nextPhase === "P88");
addCheck("all prior subphases complete", P87_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("all prior commits stamped", P87_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.commit && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("package scripts registered", REQUIRED_SCRIPTS.every((script) => Boolean(packageJson.scripts?.[script])) && Boolean(packageJson.scripts?.["check:p877-final-validation"]));
addCheck("reports exist", REQUIRED_REPORTS.every(fileExists));
addCheck("docs describe P87.7", docs.includes("P87.7 Final Validation") && docs.includes("npm run check:p877-final-validation"));
addCheck("platform roadmap closes P87", platformRoadmap.includes("P87.7 is complete") && platformRoadmap.includes("P88 is next"));
addCheck("contract references final checker", contract.includes("check:p877-final-validation"));
addCheck("Command Center Live Unlocks present", liveReadinessData.includes("LIVE_UNLOCK_ROWS") && routeTests.includes("Live Unlocks"));
addCheck("no DemoApp/private IDs in Live Readiness source", !liveReadinessData.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(liveReadinessData));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|execute now|run now/i.test(liveReadinessData));
addCheck("unsafe capabilities remain blocked in docs", /provider\/model calls|agent dispatch|project mutation|DB writes|provider spend/i.test(docs));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Final validation for P87 explicit live activation unlocks.",
        "- Confirms P87.1-P87.6 evidence, Command Center Live Unlocks UX, docs, roadmap, and status closure.",
        "- Does not enable providers, agents, tools, workers, project mutation, DB writes, deploy, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p877-final-validation",
        "- npm run check:p876-tests-docs-roadmap",
        "- npm run check:p875-command-center-live-unlock-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live Ready route renders evidence-backed activation labels without runnable actions\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    { title: "Known Limitations", body: "- P87 closes explicit live activation unlock readiness and UX. Actual execution remains blocked for a later explicitly scoped activation phase." },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P87.7 Final Validation Report", phase: "P87.7" },
);

printCheckReport("P87.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
