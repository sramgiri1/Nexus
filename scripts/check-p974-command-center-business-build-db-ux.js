import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p974-command-center-business-build-db-ux-report.md";

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
const contract = readJson("contracts/os-roadmap/p97-execution-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const docs = readText("docs/architecture/P97_FOUNDER_BUSINESS_BUILD_GOVERNED_EXECUTION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const dbUxComponentStart = commandCenterSource.indexOf("function BusinessBuildDbCrudCard");
const dbUxComponentEnd = commandCenterSource.indexOf("/* ─── OS Roadmap Page ─── */");
const dbUxComponentSource = dbUxComponentStart >= 0 && dbUxComponentEnd > dbUxComponentStart
  ? commandCenterSource.slice(dbUxComponentStart, dbUxComponentEnd)
  : "";

const p974 = contract.subphases?.find((entry) => entry.phaseId === "P97.4");
const p975 = contract.subphases?.find((entry) => entry.phaseId === "P97.5");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const model = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const dbUx = model.businessBuildDbCrud || {};

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

const expectedLabels = ["Business Build session", "Execution requests", "Agent lanes", "PRD snapshots"];
const expectedSurfaces = [
  "Lite Business Build DB workflow",
  "Business Build DB Workflow",
  "Agent Flow Business Build DB",
  "DB Runtime Business Build",
];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p974-command-center-business-build-db-ux"]));
addCheck("P97.4 contract complete with P97.5 handoff", p974?.status === "complete" && ["planned", "complete"].includes(p975?.status));
addCheck("P97.4 allowed files scoped", p974?.allowedFiles?.includes("dashboard/src/data/businessBuild.js") && p974.allowedFiles.includes("dashboard/tests/routes.spec.js"));
addCheck("P97.4 forbids project and mutation paths", p974?.forbiddenFiles?.includes("projects/**") && p974.forbiddenFiles.includes("providers/**") && p974.forbiddenFiles.includes("worker-runtime/**"));
addCheck("P97.4 allowed files avoid forbidden roots", !p974?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("view model stays browser-safe", !businessBuildSource.includes("founderBusinessBuildGovernedExecution") && !businessBuildSource.includes("node:fs"));
addCheck("view model aligns to P97.3 evidence", businessBuildSource.includes("reports/p973-business-build-crud-model-report.md") && businessBuildSource.includes("Business Build DB CRUD"));
addCheck("DB UX model is command-center visible", dbUx.commandCenterVisible === true);
addCheck("DB UX model covers display-safe records", expectedLabels.every((label) => dbUx.allowedRecords?.includes(label)) && dbUx.totalRecordCount === 4);
addCheck("DB UX model exposes local CRUD operations", dbUx.allowedLocalCrudOperations?.join(",") === "Create,Read,Update,Upsert,List");
addCheck("DB UX model keeps unsafe paths blocked", (dbUx.safetyRows || []).some((row) => row.label === "Agent dispatch" && row.value === "Blocked") && (dbUx.safetyRows || []).some((row) => row.label === "Provider spend" && row.value === "Blocked"));
addCheck("Command Center surfaces all DB UX placements", expectedSurfaces.every((label) => commandCenterSource.includes(label)));
addCheck("Command Center does not depend on DB Runtime data mutation", !commandCenterSource.includes("dbRuntime.businessBuildRuntime"));
addCheck("Command Center primary source hides raw Business Build table names", !/business_build_(sessions|execution_requests|agent_lanes|prd_snapshots)/.test(commandCenterSource));
addCheck("Playwright covers Business Build DB surfaces", routeTests.includes("Business Build DB CRUD state appears in Lite, Business Build, Agent Flow, and DB Runtime"));
addCheck("Playwright validates no raw table names", routeTests.includes("business_build_sessions") && routeTests.includes("business_build_prd_snapshots"));
addCheck("docs record P97.4", docs.includes("P97.4 is complete") && docs.includes("npm run check:p974-command-center-business-build-db-ux"));
addCheck("platform roadmap records P97.4", platformRoadmap.includes("P97.4 is complete") && (platformRoadmap.includes("P97.5 is next") || platformRoadmap.includes("P97.5 is planned")));
addCheck(
  "phase status advanced",
  statusById.get("P97.4")?.status === "complete"
    && status.currentPhase === "P97.4"
    && status.previousPhase === "P97.3"
    && status.nextPhase === "P97.5",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P97.4", roadmapById.get("P97.4")?.status === "complete" && ["planned", "complete"].includes(roadmapById.get("P97.5")?.status));

const serializedUx = JSON.stringify([dbUx, dbUxComponentSource]);
addCheck("no DemoApp leakage in DB UX", !serializedUx.includes("DemoApp"));
addCheck("no raw private IDs or secret URLs", !/(private-project|project_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\/|mysql:\/\/|mongodb:\/\/)/i.test(serializedUx));
addCheck("no fake working actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(serializedUx));
addCheck("forbidden files not referenced by checker", !/(projects\/careloop|careloop-ios|providers\/|worker-runtime\/|deploy\/|release\/|exports\/|packages\/)/.test(JSON.stringify(p974?.allowedFiles || [])));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P97.4 Command Center Business Build DB UX.",
        "- Confirms Lite, Business Build, Agent Flow, and DB Runtime expose display-safe DB-backed Business Build state.",
        "- Confirms provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, package, network calls, and provider spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p974-command-center-business-build-db-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Business Build DB CRUD\"",
        "- cd dashboard && npm run build",
        "- npm run check:p973-business-build-crud-model",
        "- npm run check:p972-business-build-db-schema",
        "- npm run check:p971-founder-business-build-governed-execution-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P97.4 is display-safe Command Center UX only. It does not execute agents, run workers/tools, write project files, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P97.4 Command Center Business Build DB UX Report", phase: "P97.4" },
);

printCheckReport("P97.4 Command Center Business Build DB UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
