import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p945-command-center-founder-db-ux-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function sliceBetween(source, startText, endText) {
  const start = source.indexOf(startText);
  const end = endText ? source.indexOf(endText, start + startText.length) : -1;
  if (start < 0) return "";
  return end > start ? source.slice(start, end) : source.slice(start);
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const contract = readJson("contracts/os-roadmap/p94-execution-contracts.json");
const docs = readText("docs/architecture/P94_FOUNDER_RUNTIME_DB_CRUD_WORKFLOW_WIRING_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p945 = contract.subphases?.find((entry) => entry.phaseId === "P94.5");

const liteFounderSection = sliceBetween(commandCenterSource, 'aria-label="Founder DB workflow"', 'aria-label="Local PRD review gate"');
const dbRuntimeFounderSection = sliceBetween(commandCenterSource, "Founder Workflow DB CRUD", "Blockers");
const businessBuildSection = sliceBetween(commandCenterSource, "function BusinessBuildPage()", "function DocsGuidesPage");
const businessFounderSection = sliceBetween(businessBuildSection, 'aria-label="Founder DB workflow"', 'tabId="prd"');
const uxSections = [liteFounderSection, dbRuntimeFounderSection, businessFounderSection].join("\n");
const unsafeImportPattern = new RegExp("from\\s+[\"'][^\"']*(projects|careloop|providers|tools|worker-runtime|deploy|release|exports|packages|prisma|migrations)/");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p945-command-center-founder-db-ux"]));
addCheck("contract tracks P94.5 complete", p945?.status === "complete" && p945.allowedFiles?.includes("dashboard/src/pages/CommandCenterV2.jsx"));
addCheck("Lite renders founder DB workflow", liteFounderSection.includes("Saved local state") && liteFounderSection.includes("liteFounderDbWorkflow"));
addCheck("Business Build renders founder DB workflow", businessFounderSection.includes("Founder DB Workflow") && businessFounderSection.includes("build.founderDbWorkflow"));
addCheck("DB Runtime renders founder workflow CRUD", dbRuntimeFounderSection.includes("Founder Workflow DB CRUD") && dbRuntimeFounderSection.includes("dbRuntime.founderRuntime"));
addCheck("UX exposes operator context", uxSections.includes("Owner capability") && uxSections.includes("Evidence") && uxSections.includes("Activity") && uxSections.includes("Cost impact") && uxSections.includes("Disabled reason"));
addCheck("UX exposes founder state", uxSections.includes("Saved session") && uxSections.includes("Next founder question") && uxSections.includes("PRD readiness") && uxSections.includes("Allowed local CRUD"));
addCheck("Playwright covers Lite founder DB workflow", routeTests.includes("Command Center Lite route renders Founder DB workflow without raw IDs") && routeTests.includes("Saved local state"));
addCheck("Playwright covers Business Build founder DB workflow", routeTests.includes("Business Build route renders founder workstream dry-run state") && routeTests.includes("reports/p944-founder-db-view-model-report.md"));
addCheck("Playwright covers DB Runtime founder workflow", routeTests.includes("Founder Workflow DB CRUD") && routeTests.includes("DB-backed founder workflow ready for local review"));
addCheck("docs record P94.5", docs.includes("P94.5 is complete") && docs.includes("npm run check:p945-command-center-founder-db-ux"));
addCheck("platform roadmap records P94.5", platformRoadmap.includes("P94.5 is complete") && (platformRoadmap.includes("P94.6 is next") || platformRoadmap.includes("P94.6 is complete")));
addCheck(
    "phase status advanced",
    ["in_progress", "complete"].includes(statusById.get("P94")?.status)
    && statusById.get("P94.5")?.status === "complete"
    && ["P94.5", "P94.6", "P94.7"].includes(status.currentPhase)
    && ["P94.4", "P94.5", "P94.6"].includes(status.previousPhase)
    && ["P94.6", "P94.7", "P95"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P94.5", roadmapById.get("P94.5")?.track === "NEXUS_OS" && roadmapById.get("P94.5")?.status === "complete");
addCheck("P94.6 handoff exists", ["planned", "complete"].includes(statusById.get("P94.6")?.status) && ["planned", "complete"].includes(roadmapById.get("P94.6")?.status));
addCheck("no unsafe imports", !unsafeImportPattern.test(commandCenterSource));
addCheck("no raw founder DB table names in primary UX", !/founder_sessions|founder_qna_turns|founder_prd_artifacts|founder_workstream_plans/.test(uxSections));
addCheck("no private IDs or DemoApp in primary UX", !/DemoApp|private-project-|p94[0-9]-|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d|Bearer\s+/i.test(uxSections));
addCheck("no fake runnable actions in founder DB UX", !/dispatch agent now|run worker now|write now|migrate now|execute now|deploy now|call provider now|create project now|spend now/i.test(uxSections));
addCheck("no mutation buttons in founder DB UX", !/<button/i.test(uxSections));
addCheck("forbidden project paths untouched by contract", !p945?.allowedFiles?.some((file) => /^projects\/|^careloop\//.test(file)));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P94.5 Command Center founder DB workflow UX.",
        "- Confirms Lite, Business Build, and DB Runtime render display-safe founder workflow records, next action, blockers, owner, evidence, activity, disabled reason, and cost impact.",
        "- Confirms the UX adds no mutation buttons, raw table names, raw IDs, DemoApp, provider calls, dispatch, project mutation, hosted DB mutation, deploy, package, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p945-command-center-founder-db-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder DB workflow\"",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"DB live state\"",
        "- cd dashboard && npm run build",
        "- npm run check:p944-founder-db-view-model",
        "- npm run check:p943-founder-runtime-crud-model",
        "- npm run check:p942-founder-runtime-db-schema",
        "- npm run check:p941-founder-runtime-db-crud-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P94.5 is UX-only. It does not add provider/model calls, agent dispatch, worker/tool execution, project creation, project mutation, hosted DB mutation, network calls, deploy, release, export, package creation, or provider spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P94.5 Command Center Founder DB UX Report", phase: "P94.5" },
);

printCheckReport("P94.5 Command Center Founder DB UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
