import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p977-business-build-final-validation-report.md";

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
const p97Plan = readText("docs/architecture/P97_FOUNDER_BUSINESS_BUILD_GOVERNED_EXECUTION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const reports = [
  "reports/p971-founder-business-build-governed-execution-contract-report.md",
  "reports/p972-business-build-db-schema-report.md",
  "reports/p973-business-build-crud-model-report.md",
  "reports/p974-command-center-business-build-db-ux-report.md",
  "reports/p975-business-build-crud-validation-report.md",
  "reports/p976-business-build-docs-roadmap-report.md",
].map((path) => [path, readText(path)]);

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const dbCrud = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store").businessBuildDbCrud || {};
const allP97Subphases = ["P97.1", "P97.2", "P97.3", "P97.4", "P97.5", "P97.6", "P97.7"];
const expectedScripts = [
  "check:p971-founder-business-build-governed-execution-contract",
  "check:p972-business-build-db-schema",
  "check:p973-business-build-crud-model",
  "check:p974-command-center-business-build-db-ux",
  "check:p975-business-build-crud-validation",
  "check:p976-business-build-docs-roadmap",
  "check:p977-business-build-final-validation",
];
const expectedChecks = [
  "npm run check:p977-business-build-final-validation",
  "npm run check:p976-business-build-docs-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];

addCheck("package registers P97.1-P97.7 scripts", expectedScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("contract marks all P97 subphases complete", allP97Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract P97.7 validation commands complete", expectedChecks.every((command) => subphaseById.get("P97.7")?.validationCommands?.includes(command)));
addCheck("parent P97 status complete", statusById.get("P97")?.status === "complete" && roadmapById.get("P97")?.status === "complete");
addCheck("P97.7 status complete", statusById.get("P97.7")?.status === "complete" && roadmapById.get("P97.7")?.status === "complete");
addCheck(
  "phase status hands off to P98",
  status.currentPhase === "P97.7"
    && status.previousPhase === "P97.6"
    && status.nextPhase === "P98"
    && status.currentPhaseStatus === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P97 plan records final validation", p97Plan.includes("P97.7 is complete") && p97Plan.includes("P98 is next"));
addCheck("platform roadmap records P97 closeout", platformRoadmap.includes("P97.7 is complete") && platformRoadmap.includes("P97 is complete") && platformRoadmap.includes("P98 is next"));
addCheck("prior P97 reports exist and passed", reports.every(([, body]) => /Result[\s\S]*PASS|Result: PASS/.test(body)));
addCheck("Command Center DB UX retained", commandCenterSource.includes("BusinessBuildDbCrudCard") && commandCenterSource.includes("Business Build DB Workflow"));
addCheck("focused Playwright coverage retained", routeTests.includes("Business Build DB CRUD state appears in Lite, Business Build, Agent Flow, and DB Runtime"));
addCheck("Business Build DB CRUD remains display-safe", dbCrud.commandCenterVisible === true && dbCrud.allowedRecords?.includes("Business Build session") && dbCrud.safetyRows?.some((row) => row.label === "Agent dispatch" && row.value === "Blocked"));

const serialized = JSON.stringify([dbCrud, statusById.get("P97"), statusById.get("P97.7")]);
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
        "- Final validation for P97 Founder Business Build Governed Execution.",
        "- Confirms P97.1-P97.7 are complete, parent P97 is closed, and P98 is next.",
        "- Confirms Business Build DB CRUD stays display-safe and execution remains blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: expectedChecks.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P97.7 is final validation only. It does not execute agents, run workers/tools, write project files, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P97.7 Business Build Final Validation Report", phase: "P97.7" },
);

printCheckReport("P97.7 Business Build Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
