import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p836-tests-checkers-docs-report.md";
const P83_PHASES = ["P83.1", "P83.2", "P83.3", "P83.4", "P83.5"];
const REQUIRED_SCRIPTS = [
  "check:p831-local-project-creation-admission",
  "check:p832-snake-ios-scaffold-plan",
  "check:p833-approved-local-file-creation",
  "check:p834-local-validation-harness",
  "check:p835-command-center-build-ux",
];
const REQUIRED_REPORTS = [
  "reports/p831-local-project-creation-admission-report.md",
  "reports/p832-snake-ios-scaffold-plan-report.md",
  "reports/p833-approved-local-file-creation-report.md",
  "reports/p834-local-validation-harness-report.md",
  "reports/p835-command-center-build-ux-report.md",
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
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const validCurrentPhases = ["P83.6", "P83.7"];
const expectedNextByCurrent = new Map([
  ["P83.6", "P83.7"],
  ["P83.7", "P84"],
]);
const docs = readText("docs/architecture/P83_RUNTIME_ADMISSION_ACTIVATION_PLAN.md");
const roadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const contract = readText("contracts/os-roadmap/p83-execution-contracts.json");
const routeTests = readText("dashboard/tests/routes.spec.js");
const activationData = readText("dashboard/src/data/liveReadyActivation.js");

addCheck("required P83 scripts registered", REQUIRED_SCRIPTS.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("required P83 reports exist", REQUIRED_REPORTS.every(fileExists));
addCheck("P83 subphases complete through P83.5", P83_PHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck(
  "P83.6 status remains valid",
  statusById.get("P83.6")?.status === "complete"
    && validCurrentPhases.includes(status.currentPhase)
    && status.nextPhase === expectedNextByCurrent.get(status.currentPhase),
);
addCheck("docs mark P83.1-P83.6 complete", ["P83.1", "P83.2", "P83.3", "P83.4", "P83.5", "P83.6"].every((phaseId) => docs.includes(`${phaseId}`)) && docs.includes("Status: complete. P83.6"));
addCheck("roadmap marks P83.6 complete", roadmap.includes("P83.6 is complete"));
addCheck("contract references P83.6 checker", contract.includes("check:p836-tests-checkers-docs"));
addCheck("Command Center local build coverage remains present", routeTests.includes("Generated Snake iOS Build") && activationData.includes("Generated Snake iOS Build"));
addCheck("no fake runnable actions in P83 UX data", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(activationData));
addCheck("forbidden roots remain declared", contract.includes("\"careloop/**\"") && contract.includes("\"projects/**\""));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P83.1-P83.5 tests, checkers, docs, roadmap, reports, and Command Center coverage.",
        "- Does not create app files, mutate existing projects, call providers/tools, start workers, write DB state, deploy, release, package, call networks, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Required Reports",
      body: REQUIRED_REPORTS.map((report) => `- ${report}`).join("\n"),
    },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p836-tests-checkers-docs",
        "- npm run check:p835-command-center-build-ux",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    { title: "Known Limitations", body: "- P83.6 is aggregation-only. Final closure is deferred to P83.7." },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P83.6 Tests / Checkers / Docs Report", phase: "P83.6" },
);

printCheckReport("P83.6 Tests / Checkers / Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
