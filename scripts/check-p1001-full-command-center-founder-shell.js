import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  COMMAND_CENTER_ROUTES,
  getCommandCenterFounderSidebarGroups,
  getFounderRouteContext,
} from "../dashboard/src/data/commandCenterRoutes.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1001-full-command-center-founder-shell-report.md";

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
const p1001 = subphaseById.get("P100.1");
const founderGroups = getCommandCenterFounderSidebarGroups();
const sidebarLabels = founderGroups.flatMap((group) => group.items.map((item) => item.name));
const sidebarGroupLabels = founderGroups.map((group) => group.group);
const nonDemoRoutes = COMMAND_CENTER_ROUTES.filter((route) => route.scope !== "demo");
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1001-full-command-center-founder-shell"]));
addCheck("P100.1 contract complete with P100.2 handoff", p1001?.status === "complete" && ["planned", "complete"].includes(subphaseById.get("P100.2")?.status));
addCheck("P100.1 allowed files scoped", p1001?.allowedFiles?.includes("dashboard/src/data/commandCenterRoutes.js") && p1001.allowedFiles.includes("dashboard/src/pages/CommandCenterV2.jsx"));
addCheck("P100.1 allowed files avoid forbidden roots", !p1001?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("full founder groups include all non-demo routes", nonDemoRoutes.every((route) => sidebarLabels.includes(route.name)), `${sidebarLabels.length}/${nonDemoRoutes.length}`);
addCheck("demo route excluded from primary full navigation", !sidebarLabels.includes("Demo Mode"));
addCheck("founder group labels are visible", ["FOUNDER", "BUILD COMMAND", "GOVERN", "AGENTS & DELIVERY", "RUNTIME", "NEXUS OS"].every((label) => sidebarGroupLabels.includes(label)));
addCheck("brand no longer says Founder Lite", pageSource.includes("Founder Command") && !pageSource.includes("Founder Lite"));
addCheck("topbar founder context exists", pageSource.includes("ccv2-topbar__founder-context") && pageSource.includes("Founder use"));
addCheck("route context helper exists", routeSource.includes("getFounderRouteContext") && routeSource.includes("FOUNDER_ROUTE_CONTEXT_BY_KEY"));
addCheck("every non-demo route has founder context", nonDemoRoutes.every((route) => {
  const context = getFounderRouteContext(route);
  return context?.purpose && context?.nextAction;
}));
addCheck("Playwright full Command Center coverage added", routeTests.includes("Full Command Center founder navigation exposes governed areas") && routeTests.includes("Founder Command"));
addCheck("platform roadmap records P100.1", /P100\.1 is\s+complete/.test(platformRoadmap) && (/P100\.2 is\s+next/.test(platformRoadmap) || /P100\.2 is\s+planned/.test(platformRoadmap)));
addCheck(
  "phase status advanced",
  statusById.get("P100")?.status === "in_progress"
    && statusById.get("P100.1")?.status === "complete"
    && status.phases.some((phase) => phase.phaseId === status.currentPhase)
    && status.phases.some((phase) => phase.phaseId === status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P100.1", roadmapById.get("P100.1")?.track === "NEXUS_OS" && roadmapById.get("P100.1")?.status === "complete");
addCheck("P100.2 handoff exists", ["planned", "complete"].includes(statusById.get("P100.2")?.status) && ["planned", "complete"].includes(roadmapById.get("P100.2")?.status));

const shellSlice = [
  pageSource.slice(pageSource.indexOf("/* ─── Sidebar ─── */"), pageSource.indexOf("function TopBar")),
  pageSource.slice(pageSource.indexOf("function TopBar"), pageSource.indexOf("function MissionComposerCard")),
  routeSource.slice(routeSource.indexOf("const FOUNDER_ROUTE_CONTEXT_BY_KEY"), routeSource.indexOf("export function resolveCommandCenterRoute")),
].join("\n");
const serialized = JSON.stringify([founderGroups, shellSlice]);
addCheck("no raw private IDs or credentials", !/(private-project|project_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\/|mysql:\/\/|mongodb:\/\/)/i.test(serialized));
addCheck("no fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now|approve now/i.test(serialized));
addCheck("no unsafe imports or provider wiring", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(routeSource + pageSource));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P100.1 full founder Command Center shell enablement.",
        "- Confirms all non-demo routes are reachable from founder-safe navigation and every route has founder purpose plus next-action context.",
        "- Confirms this is navigation and UX context only; runtime execution remains blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1001-full-command-center-founder-shell",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Full Command Center\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P100.1 enables the full founder-safe shell and route context only. It does not approve execution, dispatch agents, execute workers/tools, mutate project source, use hosted DBs, deploy, release, export, package, call providers/models, use network calls, or spend. Deeper per-page content audits are P100.2 through P100.5.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P100.1 Full Command Center Founder Shell Report", phase: "P100.1" },
);

printCheckReport("P100.1 Full Command Center Founder Shell Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
