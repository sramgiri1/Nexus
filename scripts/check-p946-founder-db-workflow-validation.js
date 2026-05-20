import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p946-founder-db-workflow-validation-report.md";

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
const p946 = contract.subphases?.find((entry) => entry.phaseId === "P94.6");
const p94Subphases = ["P94.1", "P94.2", "P94.3", "P94.4", "P94.5", "P94.6"];
const requiredScripts = [
  "check:p941-founder-runtime-db-crud-contract",
  "check:p942-founder-runtime-db-schema",
  "check:p943-founder-runtime-crud-model",
  "check:p944-founder-db-view-model",
  "check:p945-command-center-founder-db-ux",
  "check:p946-founder-db-workflow-validation",
];
const requiredReports = [
  "reports/p941-founder-runtime-db-crud-contract-report.md",
  "reports/p942-founder-runtime-db-schema-report.md",
  "reports/p943-founder-runtime-crud-model-report.md",
  "reports/p944-founder-db-view-model-report.md",
  "reports/p945-command-center-founder-db-ux-report.md",
];
const combinedDocs = `${docs}\n${platformRoadmap}\n${readme}\n${prd}`;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p946-founder-db-workflow-validation"]));
addCheck("P94 scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("contract tracks P94.6 complete", p946?.status === "complete" && p946.allowedFiles?.includes("README.md") && p946.allowedFiles?.includes("docs/prd/NEXUS_AGENTIC_OS_PRD.md"));
addCheck("all previous P94 subphases complete in status", p94Subphases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("all previous P94 subphases complete in roadmap", p94Subphases.every((phaseId) => roadmapById.get(phaseId)?.status === "complete"));
addCheck(
  "phase status advanced",
  ["in_progress", "complete"].includes(statusById.get("P94")?.status)
    && ["P94.6", "P94.7"].includes(status.currentPhase)
    && ["P94.5", "P94.6"].includes(status.previousPhase)
    && ["P94.7", "P95"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P94.7 handoff exists", ["planned", "complete"].includes(statusById.get("P94.7")?.status) && ["planned", "complete"].includes(roadmapById.get("P94.7")?.status));
addCheck("README records P94.6 current state", readme.includes("Current Status Through P94") && (readme.includes("P94.7 is next") || readme.includes("P95 is next")));
addCheck("PRD records P94.6 current state", prd.includes("updated through P94") && prd.includes("Current Implementation Status Through P94"));
addCheck("P94 plan records P94.6 complete", docs.includes("P94.6 is complete") && docs.includes("npm run check:p946-founder-db-workflow-validation") && (docs.includes("P94.7 is next") || docs.includes("P94.7 is complete")));
addCheck("platform roadmap records P94.6 complete", platformRoadmap.includes("P94.6 is complete") && (platformRoadmap.includes("P94.7 is next") || platformRoadmap.includes("P94.7 is complete")));
addCheck("P94 reports exist", requiredReports.every((reportPath) => existsSync(join(ROOT, reportPath))));
addCheck("P94.5 Playwright coverage retained", routeTests.includes("Founder DB workflow appears in Lite, Business Build, and DB Runtime") && routeTests.includes("Command Center Lite route renders Founder DB workflow without raw IDs"));
addCheck("docs preserve safety boundary", /Provider\/model calls.*remain blocked|provider\/model calls.*remain blocked/i.test(combinedDocs) && /agent dispatch.*remain blocked/i.test(combinedDocs) && /project.*mutation.*remain blocked/i.test(combinedDocs));
addCheck("docs do not imply broad live execution", !/provider calls are live|agent dispatch is live|project mutation is live|hosted DB writes are live|deploy is live|package creation is live|provider spend is live/i.test(combinedDocs));
addCheck("no forbidden project paths in P94.6 contract", !p946?.allowedFiles?.some((file) => /^projects\/|^careloop\//.test(file)));
addCheck("no stale P94 next-step docs", !readme.includes("P94.6 is next") && !platformRoadmap.includes("P94.6 is next. It will aggregate") && !docs.includes("P94.6 is next. It will aggregate"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P94.6 docs, roadmap, PRD, README, status, and aggregate evidence.",
        "- Confirms P94.1-P94.5 validation evidence remains present and P94.7 is the next handoff.",
        "- Confirms documentation preserves the safety boundary and does not imply broad live execution.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p946-founder-db-workflow-validation",
        "- npm run check:p945-command-center-founder-db-ux",
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
      body: "- P94.6 is validation/docs-only. It does not add provider/model calls, agent dispatch, worker/tool execution, project creation, project mutation, hosted DB mutation, network calls, deploy, release, export, package creation, or provider spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P94.6 Founder DB Workflow Validation Report", phase: "P94.6" },
);

printCheckReport("P94.6 Founder DB Workflow Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
