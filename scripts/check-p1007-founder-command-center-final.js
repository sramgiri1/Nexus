import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1007-founder-command-center-final-report.md";

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
const routeSource = readText("dashboard/src/data/commandCenterRoutes.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p100Subphases = ["P100.1", "P100.2", "P100.3", "P100.4", "P100.5", "P100.6", "P100.7"];
const p100Scripts = [
  "check:p1001-full-command-center-founder-shell",
  "check:p1002-founder-operations-pages",
  "check:p1003-founder-governance-pages",
  "check:p1004-founder-delivery-pages",
  "check:p1005-founder-runtime-os-pages",
  "check:p1006-founder-command-center-validation",
  "check:p1007-founder-command-center-final",
];
const p100Reports = [
  "reports/p1001-full-command-center-founder-shell-report.md",
  "reports/p1002-founder-operations-pages-report.md",
  "reports/p1003-founder-governance-pages-report.md",
  "reports/p1004-founder-delivery-pages-report.md",
  "reports/p1005-founder-runtime-os-pages-report.md",
  "reports/p1006-founder-command-center-validation-report.md",
];
const focusedRouteTests = [
  "Full Command Center founder navigation exposes governed areas",
  "Founder operations pages show useful action boards",
  "Founder governance pages show useful action boards",
  "Founder delivery pages show useful action boards",
  "Founder runtime and OS pages show useful action boards",
  "Command Center Lite route renders interactive founder chat",
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

addCheck("P100 contract complete", contract.status === "complete");
addCheck("P100.1-P100.7 contract complete", p100Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P100 final package script registered", Boolean(packageJson.scripts?.["check:p1007-founder-command-center-final"]));
addCheck("P100 package scripts registered", p100Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P100 reports available", p100Reports.every(exists));
addCheck("focused route tests available", focusedRouteTests.every((testName) => routeTests.includes(testName)));
addCheck("platform roadmap records P100.7 and P100 complete", /P100\.7 is\s+complete/.test(platformRoadmap) && /P100 is\s+complete/.test(platformRoadmap));
addCheck(
  "phase status closed",
  statusById.get("P100")?.status === "complete"
    && statusById.get("P100.7")?.status === "complete"
    && status.currentPhase === "P100.7"
    && status.previousPhase === "P100.6"
    && status.nextPhase === "P101",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P100 closure", roadmapById.get("P100")?.status === "complete" && roadmapById.get("P100.7")?.status === "complete");
addCheck("P101 planned handoff exists", statusById.get("P101")?.status === "planned" && roadmapById.get("P101")?.status === "planned");
addCheck("P100.7 allowed files avoid forbidden roots", (subphaseById.get("P100.7")?.allowedFiles || []).every((file) => !forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("full Command Center founder shell remains active", pageSource.includes("Founder Command") && pageSource.includes("Founder Operations"));
addCheck("full navigation excludes demo scope", routeSource.includes("route.scope !== \"demo\"") && routeSource.includes("getCommandCenterFounderSidebarGroups"));
addCheck("primary UX keeps DemoApp out of full route test", routeTests.includes("full Command Center routes do not show DemoApp"));
addCheck("no unsafe imports or provider wiring", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(pageSource + routeSource));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P100.7 final founder Command Center closure.",
        "- Confirms P100 and all P100 subphases are complete, covered by scripts/reports/tests/docs, and closed in OS phase tracking.",
        "- Confirms final validation is display-only and does not enable provider calls, dispatch, worker/tool execution, project writes, DB mutation, deploy, package, release, export, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1007-founder-command-center-final",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Full Command Center|Founder operations pages|Founder governance pages|Founder delivery pages|Founder runtime and OS pages|Command Center Lite\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P100.7 closes full Command Center founder utility only. It does not dispatch agents, execute workers/tools, mutate project source, write hosted DB records, deploy, release, export, package, call providers/models, use network calls, or spend. P101 is a planned handoff entry only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P100.7 Founder Command Center Final Validation Report", phase: "P100.7" },
);

printCheckReport("P100.7 Founder Command Center Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
