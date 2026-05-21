import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p965-founder-business-build-readiness-validation-report.md";

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
const contract = readJson("contracts/os-roadmap/p96-execution-contracts.json");
const contractText = readText("contracts/os-roadmap/p96-execution-contracts.json");
const docs = readText("docs/architecture/P96_FOUNDER_BUSINESS_BUILD_LOCAL_EXECUTION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const checkerSources = [
  readText("scripts/check-p961-founder-business-build-readiness-contract.js"),
  readText("scripts/check-p962-founder-business-build-readiness-model.js"),
  readText("scripts/check-p963-founder-business-build-dry-run-admission.js"),
  readText("scripts/check-p964-command-center-business-build-readiness-ux.js"),
];
const p965 = contract.subphases?.find((entry) => entry.phaseId === "P96.5");
const p966 = contract.subphases?.find((entry) => entry.phaseId === "P96.6");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const readiness = viewModel.localExecutionReadiness || {};
const requiredReports = [
  "reports/p961-founder-business-build-readiness-contract-report.md",
  "reports/p962-founder-business-build-readiness-model-report.md",
  "reports/p963-founder-business-build-dry-run-admission-report.md",
  "reports/p964-command-center-business-build-readiness-ux-report.md",
];
const unsafeWords = /(call provider now|dispatch agent now|run worker now|write project now|deploy now|spend now|execute now|migrate now|generate app now|create project now|write hosted db now)/i;
const rawPrivateIdPattern = /(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i;
const rawTablePattern = /founder_sessions|founder_qna_turns|founder_prd_artifacts|founder_workstream_plans/;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p965-founder-business-build-readiness-validation"]));
addCheck("contract marks P96.5 complete", p965?.status === "complete" && ["planned", "complete"].includes(p966?.status));
addCheck("contract allows aggregate checker and prior P96 reports", [
  "scripts/check-p965-founder-business-build-readiness-validation.js",
  "scripts/check-p964-command-center-business-build-readiness-ux.js",
  "scripts/check-p963-founder-business-build-dry-run-admission.js",
  "scripts/check-p962-founder-business-build-readiness-model.js",
  "scripts/check-p961-founder-business-build-readiness-contract.js",
  "reports/p965-founder-business-build-readiness-validation-report.md",
  "reports/p964-command-center-business-build-readiness-ux-report.md",
  "reports/p963-founder-business-build-dry-run-admission-report.md",
  "reports/p962-founder-business-build-readiness-model-report.md",
  "reports/p961-founder-business-build-readiness-contract-report.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
].every((file) => p965?.allowedFiles?.includes(file)));
addCheck("contract forbids project and UI source changes in P96.5", ["projects/**", "careloop/**", "dashboard/src/**", "dashboard/tests/**", "providers/**", "tools/**", "worker-runtime/**"].every((file) => p965?.forbiddenFiles?.includes(file)));
addCheck("P96.1-P96.4 statuses are complete", ["P96.1", "P96.2", "P96.3", "P96.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete"));
addCheck("P96.6 handoff exists", ["planned", "complete"].includes(statusById.get("P96.6")?.status) && ["planned", "complete"].includes(roadmapById.get("P96.6")?.status));
addCheck("prior P96 reports exist and pass", requiredReports.every((report) => existsSync(join(ROOT, report)) && readText(report).includes("PASS")));
addCheck("P96.4 UX is preserved", commandCenterSource.includes("Business Build Local Execution Readiness")
  && routeTests.includes("Business Build local execution readiness renders without runnable actions")
  && readiness.readyLaneCount === 4
  && readiness.safetyRows?.every((row) => row.value === "Blocked"));
addCheck("Business Build readiness remains browser-safe", !businessBuildSource.includes("founderBusinessBuildExecutionReadiness.js") && !businessBuildSource.includes("node:fs") && !businessBuildSource.includes("node:child_process"));
addCheck("P96.1-P96.4 checkers tolerate P96.5 status", checkerSources.every((source) => source.includes('"P96.5"') && source.includes('"P96.6"')));
addCheck("docs record P96.5", docs.includes("P96.5 is complete") && docs.includes("npm run check:p965-founder-business-build-readiness-validation"));
addCheck("platform roadmap records P96.5", platformRoadmap.includes("P96.5 is complete") && (platformRoadmap.includes("P96.6 is next") || platformRoadmap.includes("P96.6 is planned") || platformRoadmap.includes("P96.6 is complete")));
addCheck(
  "phase status advanced",
  statusById.get("P96")?.status === "in_progress"
    && statusById.get("P96.5")?.status === "complete"
    && ["P96.5", "P96.6"].includes(status.currentPhase)
    && ["P96.4", "P96.5"].includes(status.previousPhase)
    && ["P96.6", "P96.7"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P96.5", roadmapById.get("P96.5")?.track === "NEXUS_OS" && roadmapById.get("P96.5")?.status === "complete");
addCheck("aggregate validation avoids raw private data", !rawPrivateIdPattern.test(JSON.stringify([readiness, contractText])) && !rawTablePattern.test(JSON.stringify(readiness)));
addCheck("aggregate validation does not invent unsafe runnable actions", !unsafeWords.test(JSON.stringify([readiness, commandCenterSource, contractText])));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P96.5 aggregate founder Business Build readiness coverage.",
        "- Confirms P96.1-P96.4 checkers, reports, docs, route tests, UX safety, and OS phase status remain coherent as P96 advances.",
        "- Confirms P96.5 does not modify Command Center source, project source, provider/tool/runtime paths, deploy/release/export/package paths, or unsafe execution surfaces.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p965-founder-business-build-readiness-validation",
        "- npm run check:p964-command-center-business-build-readiness-ux",
        "- npm run check:p963-founder-business-build-dry-run-admission",
        "- npm run check:p962-founder-business-build-readiness-model",
        "- npm run check:p961-founder-business-build-readiness-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P96.5 is aggregate validation only. It does not dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P96.5 Founder Business Build Readiness Validation Report", phase: "P96.5" },
);

printCheckReport("P96.5 Founder Business Build Readiness Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
