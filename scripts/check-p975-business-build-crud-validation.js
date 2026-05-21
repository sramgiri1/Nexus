import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p975-business-build-crud-validation-report.md";

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
const reports = [
  "reports/p971-founder-business-build-governed-execution-contract-report.md",
  "reports/p972-business-build-db-schema-report.md",
  "reports/p973-business-build-crud-model-report.md",
  "reports/p974-command-center-business-build-db-ux-report.md",
].map((path) => [path, readText(path)]);

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const dbCrud = viewModel.businessBuildDbCrud || {};
const expectedScripts = [
  "check:p971-founder-business-build-governed-execution-contract",
  "check:p972-business-build-db-schema",
  "check:p973-business-build-crud-model",
  "check:p974-command-center-business-build-db-ux",
  "check:p975-business-build-crud-validation",
];
const expectedChecks = [
  "npm run check:p975-business-build-crud-validation",
  "npm run check:p974-command-center-business-build-db-ux",
  "npm run check:p973-business-build-crud-model",
  "npm run check:p972-business-build-db-schema",
  "npm run check:p971-founder-business-build-governed-execution-contract",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Business Build DB CRUD\"",
  "cd dashboard && npm run build",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const forbiddenPatterns = [
  /projects\//,
  /careloop/,
  /providers\//,
  /worker-runtime\//,
  /deploy\//,
  /release\//,
  /exports\//,
  /packages\//,
  /\.env/,
];

addCheck("package registers P97.1-P97.5 scripts", expectedScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("contract marks P97.1-P97.5 complete", ["P97.1", "P97.2", "P97.3", "P97.4", "P97.5"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract keeps P97.6 handoff", ["planned", "complete"].includes(subphaseById.get("P97.6")?.status));
addCheck("P97.5 allowed files scoped", subphaseById.get("P97.5")?.allowedFiles?.includes("scripts/check-p975-business-build-crud-validation.js") && subphaseById.get("P97.5")?.allowedFiles?.includes("reports/p975-business-build-crud-validation-report.md"));
addCheck("P97.5 forbidden files block project/runtime mutation", subphaseById.get("P97.5")?.forbiddenFiles?.includes("projects/**") && subphaseById.get("P97.5")?.forbiddenFiles?.includes("worker-runtime/**") && subphaseById.get("P97.5")?.forbiddenFiles?.includes("providers/**"));
addCheck("P97.5 allowed files avoid forbidden roots", !subphaseById.get("P97.5")?.allowedFiles?.some((file) => forbiddenPatterns.some((pattern) => pattern.test(file))));
addCheck("P97.5 validation commands aggregate required checks", expectedChecks.every((command) => subphaseById.get("P97.5")?.validationCommands?.includes(command)));
addCheck("Business Build DB CRUD model remains visible", dbCrud.commandCenterVisible === true && dbCrud.allowedLocalCrudOperations?.join(",") === "Create,Read,Update,Upsert,List");
addCheck("Business Build DB records stay display-safe", ["Business Build session", "Execution requests", "Agent lanes", "PRD snapshots"].every((label) => dbCrud.allowedRecords?.includes(label)));
addCheck("Business Build source keeps P97.3 evidence link", businessBuildSource.includes("reports/p973-business-build-crud-model-report.md"));
addCheck("Command Center DB card remains present", commandCenterSource.includes("function BusinessBuildDbCrudCard") && commandCenterSource.includes("Business Build DB Workflow"));
addCheck("Playwright retains P97.4 DB coverage", routeTests.includes("Business Build DB CRUD state appears in Lite, Business Build, Agent Flow, and DB Runtime"));
addCheck("prior P97 reports exist and passed", reports.every(([, body]) => /Result[\s\S]*PASS|Result: PASS/.test(body)));
addCheck("docs mark P97.5 complete", docs.includes("P97.5 is complete") && docs.includes("npm run check:p975-business-build-crud-validation"));
addCheck("platform roadmap marks P97.5 complete", platformRoadmap.includes("P97.5 is complete") && (/P97\.6 is\s+next/.test(platformRoadmap) || platformRoadmap.includes("P97.6 is complete")));
addCheck(
  "phase status advanced to P97.5",
  statusById.get("P97.5")?.status === "complete"
    && ["P97.5", "P97.6"].includes(status.currentPhase)
    && ["P97.4", "P97.5"].includes(status.previousPhase)
    && ["P97.6", "P97.7"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P97.5", roadmapById.get("P97.5")?.status === "complete" && ["planned", "complete"].includes(roadmapById.get("P97.6")?.status));

const serialized = JSON.stringify([dbCrud, statusById.get("P97.5")]);
addCheck("no DemoApp leakage", !serialized.includes("DemoApp"));
addCheck("no raw private IDs or credentials", !/(private-project|project_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token|postgres(?:ql)?:\/\/|mysql:\/\/|mongodb:\/\/)/i.test(serialized));
addCheck("no fake runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now|generate app now|execute now/i.test(serialized));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates aggregate P97 Business Build DB CRUD evidence across contract, schema, CRUD model, Command Center UX, tests, docs, and status.",
        "- Confirms the Command Center remains display-safe and local-only.",
        "- Confirms provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, package, network calls, and provider spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: expectedChecks.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P97.5 is validation-only. It does not execute agents, run workers/tools, write project files, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P97.5 Business Build CRUD Validation Report", phase: "P97.5" },
);

printCheckReport("P97.5 Business Build CRUD Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
