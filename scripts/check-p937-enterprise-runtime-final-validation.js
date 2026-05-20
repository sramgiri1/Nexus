import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p937-enterprise-runtime-final-validation-report.md";

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
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const contract = readJson("contracts/os-roadmap/p93-execution-contracts.json");
const docs = readText("docs/architecture/P93_ENTERPRISE_LIVE_RUNTIME_EXPANSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const platformP93Start = platformRoadmap.indexOf("## P93 - Enterprise Live Runtime Expansion");
const platformP93Section = platformP93Start >= 0 ? platformRoadmap.slice(platformP93Start) : platformRoadmap;
const readme = readText("README.md");
const prd = readText("docs/prd/NEXUS_AGENTIC_OS_PRD.md");
const dbRuntimeViewModel = readText("dashboard/src/data/dbRuntimeReadiness.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contractByPhase = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));

const requiredScripts = [
  "check:p931-enterprise-live-runtime-contract",
  "check:p932-enterprise-runtime-crud-plan",
  "check:p933-governed-runtime-mutation-request",
  "check:p934-local-crud-execution-admission",
  "check:p935-command-center-live-runtime-ux",
  "check:p936-enterprise-runtime-validation-aggregation",
  "check:p937-enterprise-runtime-final-validation",
];
const requiredReports = [
  "reports/p931-enterprise-live-runtime-contract-report.md",
  "reports/p932-enterprise-runtime-crud-plan-report.md",
  "reports/p933-governed-runtime-mutation-request-report.md",
  "reports/p934-local-crud-execution-admission-report.md",
  "reports/p935-command-center-live-runtime-ux-report.md",
  "reports/p936-enterprise-runtime-validation-aggregation-report.md",
];
const requiredSourceFiles = [
  "live-ready/enterpriseLiveRuntimeCrudPlan.js",
  "live-ready/governedRuntimeMutationRequest.js",
  "live-ready/localCrudExecutionAdmission.js",
  "dashboard/src/data/dbRuntimeReadiness.js",
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/tests/routes.spec.js",
];

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P93 contract complete", contract.phase === "P93" && contract.subphases?.length === 7 && ["P93.1", "P93.2", "P93.3", "P93.4", "P93.5", "P93.6", "P93.7"].every((phaseId) => contractByPhase.get(phaseId)?.status === "complete"));
addCheck("required reports exist", requiredReports.every(exists));
addCheck("required source files exist", requiredSourceFiles.every(exists));
addCheck("P93 parent closed or closing", ["complete", "in_progress"].includes(statusById.get("P93")?.status) && ["complete", "in_progress"].includes(roadmapById.get("P93")?.status));
addCheck("P93.1-P93.7 complete in status", ["P93.1", "P93.2", "P93.3", "P93.4", "P93.5", "P93.6", "P93.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("P93.1-P93.7 complete in roadmap", ["P93.1", "P93.2", "P93.3", "P93.4", "P93.5", "P93.6", "P93.7"].every((phaseId) => roadmapById.get(phaseId)?.status === "complete"));
addCheck("next handoff is P94", status.currentPhase === "P93.7" && status.previousPhase === "P93.6" && status.nextPhase === "P94" && statusById.get("P93.7")?.nextPhase === "P94");
addCheck("P94 planned entry exists", statusById.get("P94")?.status === "planned" && roadmapById.get("P94")?.status === "planned");
addCheck("docs record P93 final closure", docs.includes("P93.7 is complete") && docs.includes("P93 is complete") && docs.includes("P94 is next"));
addCheck("platform roadmap records P93 final closure", platformP93Section.includes("P93.7 is complete") && platformP93Section.includes("P93 is complete") && platformP93Section.includes("P94 is next"));
addCheck("README records latest P93 state", readme.includes("Current Status Through P93") && readme.includes("Enterprise Runtime CRUD") && readme.includes("P94 is next"));
addCheck("PRD records latest P93 state", prd.includes("Version:** 1.1") && prd.includes("Current Implementation Status Through P93") && prd.includes("P93.4 is the narrow exception"));
addCheck("Playwright DB live state coverage retained", routeTests.includes("DB live state route renders readiness without runnable DB actions") && routeTests.includes("Enterprise Runtime CRUD"));
addCheck("Command Center DB runtime UX retained", dbRuntimeViewModel.includes("Local CRUD admission ready") && dbRuntimeViewModel.includes("P93.4 local CRUD admission") && dbRuntimeViewModel.includes("Delete and raw SQL remain blocked"));
addCheck("completed P93.1-P93.6 commits are real", ["P93.1", "P93.2", "P93.3", "P93.4", "P93.5", "P93.6"].every((phaseId) => !["", "pending-final-commit"].includes(statusById.get(phaseId)?.commit)));
addCheck("P93/P93.7 have commit placeholders or real commits", ["P93", "P93.7"].every((phaseId) => Boolean(statusById.get(phaseId)?.commit)));
addCheck("no DemoApp/private IDs in P93 runtime UX data", !/DemoApp|private-project-01|private-project-governed-build-mission|private_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(dbRuntimeViewModel));
addCheck("no fake runnable DB actions in P93 runtime UX data", !/migrate now|write now|schema now|run db|execute now|enable now/i.test(dbRuntimeViewModel));
addCheck("no unsafe runtime enablement in final docs", !/provider calls are enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|deploy is enabled|provider spend is enabled/i.test(`${docs}\n${platformP93Section}\n${readme}\n${prd}`));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Finalizes P93 Enterprise Live Runtime Expansion validation.",
        "- Confirms all P93 subphases are complete, reports exist, README/PRD are current, Command Center DB Runtime UX is retained, and the roadmap hands off to P94.",
        "- Confirms P93.7 adds no runtime behavior and does not broaden P93.4 local SQLite admission.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p937-enterprise-runtime-final-validation",
        "- npm run check:p936-enterprise-runtime-validation-aggregation",
        "- npm run check:p935-command-center-live-runtime-ux",
        "- npm run check:p934-local-crud-execution-admission",
        "- npm run check:p933-governed-runtime-mutation-request",
        "- npm run check:p932-enterprise-runtime-crud-plan",
        "- npm run check:p931-enterprise-live-runtime-contract",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"DB live state\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P93.7 is final validation only. P94 is the next scoped phase and is not implemented by this checker.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P93.7 Enterprise Runtime Final Validation Report", phase: "P93.7" },
);

printCheckReport("P93.7 Enterprise Runtime Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
