import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p984-command-center-live-workstream-handoff-ux-report.md";

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
const contract = readJson("contracts/os-roadmap/p98-execution-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const p98Plan = readText("docs/architecture/P98_FOUNDER_BUSINESS_BUILD_LIVE_WORKSTREAM_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const model = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p984 = subphaseById.get("P98.4");

const expectedSurfaces = [
  "Lite Live Workstream Handoff",
  "Agent Flow Live Workstream Handoff",
  "Business Build Live Workstream Handoff",
  "DB Runtime Live Workstream Handoff",
];

const forbiddenAllowedPatterns = [
  /^projects\//,
  /^careloop\//,
  /^providers\//,
  /^tools\//,
  /^worker-runtime\//,
  /^db\//,
  /^deploy\//,
  /^release\//,
  /^exports\//,
  /^packages\//,
  /^\.env/,
];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p984-command-center-live-workstream-handoff-ux"]));
addCheck("P98.4 contract complete with P98.5 handoff", p984?.status === "complete" && ["planned", "complete"].includes(subphaseById.get("P98.5")?.status));
addCheck("P98.4 allowed files scoped", p984?.allowedFiles?.includes("dashboard/src/pages/CommandCenterV2.jsx") && p984.allowedFiles.includes("dashboard/tests/routes.spec.js"));
addCheck("P98.4 allowed files avoid forbidden roots", !p984?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("UX card component exists", pageSource.includes("function LiveWorkstreamHandoffCard") && pageSource.includes('aria-label="Live workstream handoff"'));
addCheck("UX surfaces all placements", expectedSurfaces.every((label) => pageSource.includes(label)));
addCheck("UX uses handoff and dry-run model", pageSource.includes("liveWorkstreamHandoff") && pageSource.includes("liveWorkstreamHandoffDryRun"));
addCheck("UX exposes operator context", ["Next action", "Evidence", "Activity", "Cost impact", "Disabled reason", "Owner"].every((label) => pageSource.includes(label)));
addCheck("UX exposes blocked safety rows", ["Agent dispatch", "Worker/tool execution", "Project mutation", "Hosted DB", "Deploy/package", "Provider spend"].every((label) => model.liveWorkstreamHandoffDryRun?.safetyRows?.some((row) => row.label === label && row.value === "Blocked")));
addCheck("view model has display data", model.liveWorkstreamHandoff?.commandCenterVisible === true && model.liveWorkstreamHandoffDryRun?.commandCenterVisible === true && model.liveWorkstreamHandoffDryRun?.lanes?.some((lane) => lane.lane === "iOS"));
addCheck("Playwright coverage added", routeTests.includes("Live workstream handoff appears in Lite, Business Build, Agent Flow, and DB Runtime") && routeTests.includes("DB Runtime Live Workstream Handoff"));
addCheck("docs record P98.4", p98Plan.includes("P98.4 is complete") && p98Plan.includes("npm run check:p984-command-center-live-workstream-handoff-ux"));
addCheck("platform roadmap records P98.4", /P98\.4 is\s+complete/.test(platformRoadmap) && (/P98\.5 is\s+next/.test(platformRoadmap) || /P98\.5 is\s+complete/.test(platformRoadmap)));
addCheck(
  "phase status advanced",
  statusById.get("P98.4")?.status === "complete"
    && ["P98.4", "P98.5", "P98.6", "P98.7"].includes(status.currentPhase)
    && ["P98.3", "P98.4", "P98.5", "P98.6"].includes(status.previousPhase)
    && ["P98.5", "P98.6", "P98.7", "P99"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P98.4", roadmapById.get("P98.4")?.status === "complete" && ["planned", "complete"].includes(roadmapById.get("P98.5")?.status));

const uxSlice = pageSource.slice(pageSource.indexOf("function LiveWorkstreamHandoffCard"), pageSource.indexOf("/* ─── OS Roadmap Page ─── */"));
const serialized = JSON.stringify([model.liveWorkstreamHandoff, model.liveWorkstreamHandoffDryRun, uxSlice]);
addCheck("no DemoApp leakage", !serialized.includes("DemoApp"));
addCheck("no raw DB table names in UX", !/business_build_(sessions|execution_requests|agent_lanes|prd_snapshots)/.test(serialized));
addCheck("no raw private IDs or credentials", !/(private-project|project_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\/|mysql:\/\/|mongodb:\/\/)/i.test(serialized));
addCheck("no fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(serialized));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects|db)\//.test(pageSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(uxSlice));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P98.4 Command Center live workstream handoff UX.",
        "- Confirms Lite, Agent Flow, Business Build, and DB Runtime show display-safe handoff and dry-run state with owner, next action, blockers, disabled reason, evidence, activity, and cost context.",
        "- Confirms the UX remains display-only and does not expose runnable execution, provider/model, project mutation, hosted DB, deploy, package, network, or spend actions.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p984-command-center-live-workstream-handoff-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live workstream handoff\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P98.4 is display-safe UX only. It does not dispatch agents, execute workers/tools, mutate project source, use hosted DBs, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P98.4 Command Center Live Workstream Handoff UX Report", phase: "P98.4" },
);

printCheckReport("P98.4 Command Center Live Workstream Handoff UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
