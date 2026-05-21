import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1006-founder-command-center-validation-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function exists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p100-command-center-founder-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const routeSource = readText("dashboard/src/data/commandCenterRoutes.js");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const completedSubphases = ["P100.1", "P100.2", "P100.3", "P100.4", "P100.5", "P100.6"];
const requiredScripts = [
  "check:p1001-full-command-center-founder-shell",
  "check:p1002-founder-operations-pages",
  "check:p1003-founder-governance-pages",
  "check:p1004-founder-delivery-pages",
  "check:p1005-founder-runtime-os-pages",
  "check:p1006-founder-command-center-validation",
];
const requiredCheckerFiles = [
  "scripts/check-p1001-full-command-center-founder-shell.js",
  "scripts/check-p1002-founder-operations-pages.js",
  "scripts/check-p1003-founder-governance-pages.js",
  "scripts/check-p1004-founder-delivery-pages.js",
  "scripts/check-p1005-founder-runtime-os-pages.js",
  "scripts/check-p1006-founder-command-center-validation.js",
];
const requiredReports = [
  "reports/p1001-full-command-center-founder-shell-report.md",
  "reports/p1002-founder-operations-pages-report.md",
  "reports/p1003-founder-governance-pages-report.md",
  "reports/p1004-founder-delivery-pages-report.md",
  "reports/p1005-founder-runtime-os-pages-report.md",
];
const requiredRouteTests = [
  "Full Command Center founder navigation exposes governed areas",
  "Founder operations pages show useful action boards",
  "Founder governance pages show useful action boards",
  "Founder delivery pages show useful action boards",
  "Founder runtime and OS pages show useful action boards",
];
const forbiddenAllowedPatterns = [
  /^projects\//,
  /^careloop\//,
  /^providers\//,
  /^tools\//,
  /^worker-runtime\//,
  /^deploy\//,
  /^release\//,
  /^exports\//,
  /^packages\//,
  /^\.env/,
];

addCheck("P100.1-P100.6 contract complete", completedSubphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P100.7 contract planned", subphaseById.get("P100.7")?.status === "planned");
addCheck("P100.6 package script registered", Boolean(packageJson.scripts?.["check:p1006-founder-command-center-validation"]));
addCheck("P100 checker scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P100 checker files exist", requiredCheckerFiles.every(exists));
addCheck("P100 reports exist", requiredReports.every(exists));
addCheck("P100 focused Playwright coverage exists", requiredRouteTests.every((testName) => routeTests.includes(testName)));
addCheck("platform roadmap records P100.6", /P100\.6 is\s+complete/.test(platformRoadmap) && (/P100\.7 is\s+next/.test(platformRoadmap) || /P100\.7 is\s+planned/.test(platformRoadmap)));
addCheck(
  "phase status advanced",
  statusById.get("P100")?.status === "in_progress"
    && statusById.get("P100.6")?.status === "complete"
    && status.currentPhase === "P100.6"
    && status.previousPhase === "P100.5"
    && status.nextPhase === "P100.7",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P100.6", roadmapById.get("P100.6")?.track === "NEXUS_OS" && roadmapById.get("P100.6")?.status === "complete");
addCheck("P100.7 handoff exists", statusById.get("P100.7")?.status === "planned" && roadmapById.get("P100.7")?.status === "planned");
addCheck("allowed files avoid forbidden roots", (subphaseById.get("P100.6")?.allowedFiles || []).every((file) => !forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("full Command Center remains founder labeled", pageSource.includes("Founder Command") && pageSource.includes("Founder Operations"));
addCheck("founder board coverage exists", pageSource.includes("function FounderOperationsBoard") && pageSource.includes("FOUNDER_DELIVERY_BOARDS") && pageSource.includes("FOUNDER_RUNTIME_OS_BOARDS"));
addCheck("Demo Mode remains outside full primary navigation", routeSource.includes("route.scope !== \"demo\"") && routeSource.includes("getCommandCenterFounderSidebarGroups"));
addCheck("no unsafe imports or provider wiring", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(pageSource));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P100.6 aggregate Command Center founder utility coverage.",
        "- Confirms P100.1 through P100.5 are complete and covered by scripts, reports, route tests, docs, and phase status.",
        "- Confirms this subphase is validation-only and does not enable execution, mutation, provider calls, deploys, packages, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1006-founder-command-center-validation",
        "- npm run check:p1001-full-command-center-founder-shell",
        "- npm run check:p1002-founder-operations-pages",
        "- npm run check:p1003-founder-governance-pages",
        "- npm run check:p1004-founder-delivery-pages",
        "- npm run check:p1005-founder-runtime-os-pages",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P100.6 is aggregate validation only. It does not change Command Center UX, dispatch agents, execute workers/tools, mutate project source, write hosted DB records, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P100.6 Founder Command Center Validation Report", phase: "P100.6" },
);

printCheckReport("P100.6 Founder Command Center Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
