import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p935-command-center-live-runtime-ux-report.md";

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
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readText("contracts/os-roadmap/p93-execution-contracts.json");
const docs = readText("docs/architecture/P93_ENTERPRISE_LIVE_RUNTIME_EXPANSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const dbRuntimeViewModel = readText("dashboard/src/data/dbRuntimeReadiness.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const dbRuntimeSectionStart = commandCenterSource.indexOf("DB Runtime Readiness");
const dbRuntimeSectionEnd = commandCenterSource.indexOf('tabId="developer-details"', dbRuntimeSectionStart);
const dbRuntimeSection = dbRuntimeSectionStart >= 0 && dbRuntimeSectionEnd > dbRuntimeSectionStart
  ? commandCenterSource.slice(dbRuntimeSectionStart, dbRuntimeSectionEnd)
  : "";
const uxSource = `${dbRuntimeViewModel}\n${commandCenterSource}`;
const unsafeImportPattern = new RegExp("from\\\\s+[\"'][^\"']*(projects|careloop|generated-projects|providers|tools|worker-runtime|deploy|release|exports|packages|prisma|migrations)/");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p935-command-center-live-runtime-ux"]));
addCheck("DB runtime view exposes enterprise CRUD", dbRuntimeViewModel.includes("Enterprise runtime CRUD") && dbRuntimeViewModel.includes("Local CRUD admission ready"));
addCheck("DB runtime view shows current state and next action", dbRuntimeViewModel.includes("currentState") && dbRuntimeViewModel.includes("nextAction") && dbRuntimeViewModel.includes("disabledReason"));
addCheck("DB runtime view shows owner evidence activity cost", dbRuntimeViewModel.includes("ownerCapability") && dbRuntimeViewModel.includes("evidenceLocation") && dbRuntimeViewModel.includes("activityLocation") && dbRuntimeViewModel.includes("costImpact"));
addCheck("DB runtime view lists display-safe allowed records", dbRuntimeViewModel.includes("Founder conversation events") && dbRuntimeViewModel.includes("PRD artifact contracts") && dbRuntimeViewModel.includes("Runtime task queue"));
addCheck("DB runtime view blocks unsafe operations", dbRuntimeViewModel.includes("Delete and raw SQL remain blocked") && dbRuntimeViewModel.includes("Hosted DB mutation remains blocked") && dbRuntimeViewModel.includes("Project source mutation remains blocked"));
addCheck("Command Center renders enterprise CRUD section", commandCenterSource.includes("Enterprise Runtime CRUD") && commandCenterSource.includes("Allowed local CRUD") && commandCenterSource.includes("Allowed local record"));
addCheck("Playwright route test covers P93.5 UX", routeTests.includes("Local CRUD admission ready") && routeTests.includes("reports/p934-local-crud-execution-admission-report.md") && routeTests.includes("raw json|raw logs|raw policy"));
addCheck("contract tracks P93.5 files", contract.includes("P93.5") && contract.includes("dashboard/src/data/dbRuntimeReadiness.js") && contract.includes("check:p935-command-center-live-runtime-ux"));
addCheck("docs record P93.5", docs.includes("P93.5 is complete") && docs.includes("npm run check:p935-command-center-live-runtime-ux"));
addCheck("platform roadmap records P93.5", platformRoadmap.includes("P93.5 is complete") && (platformRoadmap.includes("P93.6 is next") || platformRoadmap.includes("P93.6 is complete")));
addCheck(
  "phase status advanced",
  ["in_progress", "complete"].includes(statusById.get("P93")?.status)
    && statusById.get("P93.5")?.status === "complete"
    && ["P93.5", "P93.6", "P93.7"].includes(status.currentPhase)
    && ["P93.4", "P93.5", "P93.6"].includes(status.previousPhase)
    && ["P93.6", "P93.7", "P94"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P93.5", roadmapById.get("P93.5")?.track === "NEXUS_OS" && roadmapById.get("P93.5")?.status === "complete");
addCheck("P93.6 handoff exists", ["planned", "complete"].includes(statusById.get("P93.6")?.status) && ["planned", "complete"].includes(roadmapById.get("P93.6")?.status));
addCheck("no unsafe imports", !unsafeImportPattern.test(uxSource));
addCheck("no raw JSON/log/policy primary copy", !/raw JSON|raw logs|raw policy dumps|raw policy/i.test(`${dbRuntimeViewModel}\n${dbRuntimeSection}`));
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-01|private-project-governed-build-mission|private_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(`${dbRuntimeViewModel}\n${dbRuntimeSection}`));
addCheck("no fake runnable DB actions", !/migrate now|write now|schema now|run db|execute now|enable now/i.test(`${dbRuntimeViewModel}\n${dbRuntimeSection}`));
addCheck("no mutation controls added", !/<button[^>]*(?:DB|CRUD|write|execute|enable|migrate)/i.test(dbRuntimeSection));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P93.5 Command Center live-runtime UX.",
        "- Confirms the Durable State DB Runtime tab exposes P93.2-P93.4 enterprise runtime CRUD readiness in operator-safe language.",
        "- Confirms the UI does not add runnable DB mutation controls, raw JSON/log/policy dumps, DemoApp, private IDs, provider calls, project mutation, deploy, package, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p935-command-center-live-runtime-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"DB live state\"",
        "- cd dashboard && npm run build",
        "- npm run check:p934-local-crud-execution-admission",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P93.5 is UX-only. It does not add DB mutation buttons, provider/model calls, agent dispatch, project mutation, hosted DBs, network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P93.5 Command Center Live Runtime UX Report", phase: "P93.5" },
);

printCheckReport("P93.5 Command Center Live Runtime UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
