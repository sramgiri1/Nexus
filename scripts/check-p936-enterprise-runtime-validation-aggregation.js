import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p936-enterprise-runtime-validation-aggregation-report.md";

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
const routeTests = readText("dashboard/tests/routes.spec.js");
const dbRuntimeViewModel = readText("dashboard/src/data/dbRuntimeReadiness.js");
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
];
const requiredReports = [
  "reports/p931-enterprise-live-runtime-contract-report.md",
  "reports/p932-enterprise-runtime-crud-plan-report.md",
  "reports/p933-governed-runtime-mutation-request-report.md",
  "reports/p934-local-crud-execution-admission-report.md",
  "reports/p935-command-center-live-runtime-ux-report.md",
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
addCheck("P93 contract has seven subphases", contract.phase === "P93" && contract.subphases?.length === 7);
addCheck("P93.1-P93.6 complete in contract", ["P93.1", "P93.2", "P93.3", "P93.4", "P93.5", "P93.6"].every((phaseId) => contractByPhase.get(phaseId)?.status === "complete"));
addCheck("P93.7 handoff remains planned", contractByPhase.get("P93.7")?.status === "planned");
addCheck("required reports exist", requiredReports.every(exists));
addCheck("required source files exist", requiredSourceFiles.every(exists));
addCheck("docs record P93.1-P93.6", ["P93.1 is complete", "P93.2 is complete", "P93.3 is complete", "P93.4 is complete", "P93.5 is complete", "P93.6 is complete"].every((text) => docs.includes(text)));
addCheck("platform roadmap records P93.6 and P93.7 handoff", platformRoadmap.includes("P93.6 is complete") && platformRoadmap.includes("P93.7 is next"));
addCheck("Playwright DB live state coverage present", routeTests.includes("DB live state route renders readiness without runnable DB actions") && routeTests.includes("Enterprise Runtime CRUD") && routeTests.includes("reports/p934-local-crud-execution-admission-report.md"));
addCheck("Command Center DB runtime UX preserves P93.5 content", dbRuntimeViewModel.includes("Local CRUD admission ready") && dbRuntimeViewModel.includes("Delete and raw SQL remain blocked") && dbRuntimeViewModel.includes("Project source mutation remains blocked"));
addCheck(
  "phase status advanced",
  statusById.get("P93")?.status === "in_progress"
    && statusById.get("P93.6")?.status === "complete"
    && ["P93.6", "P93.7"].includes(status.currentPhase)
    && ["P93.5", "P93.6"].includes(status.previousPhase)
    && status.nextPhase === "P93.7",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P93.6", roadmapById.get("P93.6")?.track === "NEXUS_OS" && roadmapById.get("P93.6")?.status === "complete");
addCheck("P93.7 status exists", ["planned", "complete"].includes(statusById.get("P93.7")?.status) && ["planned", "complete"].includes(roadmapById.get("P93.7")?.status));
addCheck("no stale pending commit in completed P93.1-P93.5", ["P93.1", "P93.2", "P93.3", "P93.4", "P93.5"].every((phaseId) => !["", "pending-final-commit"].includes(statusById.get(phaseId)?.commit)));
addCheck("no DemoApp/private IDs in P93 runtime UX data", !/DemoApp|private-project-01|private-project-governed-build-mission|private_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(dbRuntimeViewModel));
addCheck("no fake runnable DB actions in P93 runtime UX data", !/migrate now|write now|schema now|run db|execute now|enable now/i.test(dbRuntimeViewModel));
addCheck("no broad unsafe runtime enablement in docs", !/provider calls are enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|deploy is enabled|provider spend is enabled/i.test(`${docs}\n${platformRoadmap}`));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P93.1-P93.5 implementation evidence.",
        "- Confirms contracts, checkers, reports, Playwright DB live state coverage, docs, roadmap, and OS phase status are aligned.",
        "- Confirms P93.6 adds no runtime behavior and keeps unsafe runtime actions blocked outside P93.4 local SQLite admission.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
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
      body: "- P93.6 is aggregation only. It does not add runtime behavior, provider/model calls, agent dispatch, project mutation, hosted DB mutation, network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P93.6 Enterprise Runtime Validation Aggregation Report", phase: "P93.6" },
);

printCheckReport("P93.6 Enterprise Runtime Validation Aggregation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
