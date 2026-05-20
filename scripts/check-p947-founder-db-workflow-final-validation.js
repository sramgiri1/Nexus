import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p947-founder-db-workflow-final-validation-report.md";
const P94_SUBPHASES = ["P94.1", "P94.2", "P94.3", "P94.4", "P94.5", "P94.6", "P94.7"];

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
const contract = readJson("contracts/os-roadmap/p94-execution-contracts.json");
const docs = readText("docs/architecture/P94_FOUNDER_RUNTIME_DB_CRUD_WORKFLOW_WIRING_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const prd = readText("docs/prd/NEXUS_AGENTIC_OS_PRD.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contractById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const combinedDocs = `${docs}\n${platformRoadmap}\n${readme}\n${prd}`;

const requiredScripts = [
  "check:p941-founder-runtime-db-crud-contract",
  "check:p942-founder-runtime-db-schema",
  "check:p943-founder-runtime-crud-model",
  "check:p944-founder-db-view-model",
  "check:p945-command-center-founder-db-ux",
  "check:p946-founder-db-workflow-validation",
  "check:p947-founder-db-workflow-final-validation",
];
const requiredReports = [
  "reports/p941-founder-runtime-db-crud-contract-report.md",
  "reports/p942-founder-runtime-db-schema-report.md",
  "reports/p943-founder-runtime-crud-model-report.md",
  "reports/p944-founder-db-view-model-report.md",
  "reports/p945-command-center-founder-db-ux-report.md",
  "reports/p946-founder-db-workflow-validation-report.md",
];

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("contract closes P94.1-P94.7", P94_SUBPHASES.every((phaseId) => contractById.get(phaseId)?.status === "complete"));
addCheck("status closes P94.1-P94.7", P94_SUBPHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("roadmap closes P94.1-P94.7", P94_SUBPHASES.every((phaseId) => roadmapById.get(phaseId)?.status === "complete"));
addCheck("P94 parent complete", statusById.get("P94")?.status === "complete" && roadmapById.get("P94")?.status === "complete");
addCheck("P94 completed status commits are real or current placeholders", P94_SUBPHASES.every((phaseId) => {
  const commit = statusById.get(phaseId)?.commit || "";
  if (["P94", "P94.7"].includes(phaseId)) return commit && commit !== "planned";
  return commit && commit !== "planned" && !commit.includes("pending");
}));
addCheck("P94.7 current handoff", status.currentPhase === "P94.7" && status.previousPhase === "P94.6" && status.nextPhase === "P95" && status.currentPhaseStatus === "complete", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P95 planned handoff exists", statusById.get("P95")?.status === "planned" && roadmapById.get("P95")?.status === "planned");
addCheck("required reports exist", requiredReports.every((reportPath) => existsSync(join(ROOT, reportPath))));
addCheck("docs record P94 final closure", docs.includes("P94.7 is complete") && docs.includes("P94 is complete") && docs.includes("npm run check:p947-founder-db-workflow-final-validation"));
addCheck("platform roadmap records P94 final closure", platformRoadmap.includes("P94.7 is complete") && platformRoadmap.includes("P94 is complete") && platformRoadmap.includes("P95 is next"));
addCheck("README records P94 final state", readme.includes("Current Status Through P94") && readme.includes("P95 is next") && readme.includes("P94 founder runtime state"));
addCheck("PRD records P94 final state", prd.includes("updated through P94 Founder") && prd.includes("Current Implementation Status Through P94") && prd.includes("P93.4/P94.3 are the narrow exceptions"));
addCheck("P94.5 Playwright coverage retained", routeTests.includes("Founder DB workflow appears in Lite, Business Build, and DB Runtime") && routeTests.includes("Command Center Lite route renders Founder DB workflow without raw IDs"));
addCheck("docs preserve blocked unsafe runtime", /provider\/model calls.*remain blocked/i.test(combinedDocs) && /agent dispatch.*remain blocked/i.test(combinedDocs) && /project.*mutation.*remain blocked/i.test(combinedDocs));
addCheck("docs do not imply broad enablement", !/provider calls are enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|deploy is enabled|package creation is enabled|provider spend is enabled/i.test(combinedDocs));
addCheck("no private IDs or DemoApp enablement in final docs", !/private-project-|private_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d|Bearer\s+|DemoApp active|DemoApp outside full Command Center/i.test(combinedDocs));
addCheck("no forbidden project paths in P94 contract", (contract.subphases || []).every((phase) => phase.forbiddenFiles?.includes("projects/**") && phase.forbiddenFiles?.includes("careloop/**")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Final validation for P94 Founder Runtime DB CRUD Workflow Wiring.",
        "- Confirms P94.1-P94.7 are complete in contract, roadmap, phase status, docs, and validation evidence.",
        "- Confirms P95 handoff exists and unsafe runtime operations remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p947-founder-db-workflow-final-validation",
        "- npm run check:p946-founder-db-workflow-validation",
        "- npm run check:p945-command-center-founder-db-ux",
        "- npm run check:p944-founder-db-view-model",
        "- npm run check:p943-founder-runtime-crud-model",
        "- npm run check:p942-founder-runtime-db-schema",
        "- npm run check:p941-founder-runtime-db-crud-contract",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder DB workflow\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P94 closes founder runtime DB workflow wiring but still does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package creation, or provider spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P94.7 Founder DB Workflow Final Validation Report", phase: "P94.7" },
);

printCheckReport("P94.7 Founder DB Workflow Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
