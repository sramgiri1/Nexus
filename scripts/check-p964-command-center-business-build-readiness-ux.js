import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p964-command-center-business-build-readiness-ux-report.md";

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
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const docs = readText("docs/architecture/P96_FOUNDER_BUSINESS_BUILD_LOCAL_EXECUTION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p964 = contract.subphases?.find((entry) => entry.phaseId === "P96.4");
const p965 = contract.subphases?.find((entry) => entry.phaseId === "P96.5");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const readiness = viewModel.localExecutionReadiness || {};
const serializedReadiness = JSON.stringify(readiness);

const unsafeWords = /(call provider now|dispatch agent now|run worker now|write project now|deploy now|spend now|execute now|migrate now|generate app now|create project now|write hosted db now)/i;
const rawPrivateIdPattern = /(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i;
const rawTablePattern = /founder_sessions|founder_qna_turns|founder_prd_artifacts|founder_workstream_plans/;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p964-command-center-business-build-readiness-ux"]));
addCheck("contract marks P96.4 complete", p964?.status === "complete" && ["planned", "complete"].includes(p965?.status));
addCheck("contract allows UX, test, checker, docs, and status files", [
  "dashboard/src/data/businessBuild.js",
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/tests/routes.spec.js",
  "scripts/check-p964-command-center-business-build-readiness-ux.js",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
].every((file) => p964?.allowedFiles?.includes(file)));
addCheck("contract forbids project and runtime mutation paths", ["projects/**", "careloop/**", "providers/**", "tools/**", "worker-runtime/**", "deploy/**"].every((file) => p964?.forbiddenFiles?.includes(file)));
addCheck("Business Build view model exposes local execution readiness", Boolean(viewModel.localExecutionReadiness));
addCheck("readiness has implementation-grade fields", [
  "currentState",
  "readinessMode",
  "dbSourceState",
  "readyLaneCount",
  "totalLaneCount",
  "blockers",
  "nextAction",
  "disabledReason",
  "ownerCapability",
  "evidenceLocation",
  "activityLocation",
  "costImpact",
  "lanes",
  "safetyRows",
].every((field) => field in readiness));
addCheck("readiness lanes are display-safe and non-executable", readiness.readyLaneCount === 4
  && readiness.totalLaneCount === 4
  && readiness.lanes?.length === 4
  && readiness.lanes.every((lane) => lane.executionAllowed === "Blocked" && lane.dispatchAllowed === "Blocked" && lane.projectMutationAllowed === "Blocked"));
addCheck("readiness safety rows keep execution blocked", readiness.safetyRows?.some((row) => row.label === "Execution" && row.value === "Blocked")
  && readiness.safetyRows.every((row) => row.value === "Blocked"));
addCheck("readiness uses founder-facing evidence labels", readiness.evidenceLocation === "Dry-run admission report" && readiness.activityLocation === "OS activity report" && !serializedReadiness.includes("P96.3"));
addCheck("readiness does not expose raw tables or private IDs", !rawTablePattern.test(serializedReadiness) && !rawPrivateIdPattern.test(serializedReadiness));
addCheck("readiness does not invent runnable actions", !unsafeWords.test(serializedReadiness));
addCheck("dashboard data stays browser-safe", !businessBuildSource.includes("founderBusinessBuildExecutionReadiness.js") && !businessBuildSource.includes("node:fs") && !businessBuildSource.includes("node:child_process"));
addCheck("Command Center renders local readiness UX", commandCenterSource.includes("Business Build Local Execution Readiness")
  && commandCenterSource.includes("DB-backed founder workflow is ready for local review")
  && commandCenterSource.includes("Business Build local execution readiness"));
addCheck("Command Center keeps unsafe controls absent", !unsafeWords.test(commandCenterSource));
addCheck("Playwright covers P96.4 UX and themes", routeTests.includes("Business Build local execution readiness renders without runnable actions")
  && routeTests.includes("for (const theme of [\"dark\", \"light\", \"system\"])")
  && routeTests.includes("Dry-run admission report")
  && routeTests.includes("not.toContainText(\"P96.3\")"));
addCheck("docs record P96.4", docs.includes("P96.4 is complete") && docs.includes("npm run check:p964-command-center-business-build-readiness-ux"));
addCheck("platform roadmap records P96.4", platformRoadmap.includes("P96.4 is complete") && (platformRoadmap.includes("P96.5 is next") || platformRoadmap.includes("P96.5 is planned") || platformRoadmap.includes("P96.5 is complete")));
addCheck(
  "phase status advanced",
  ["in_progress", "complete"].includes(statusById.get("P96")?.status)
    && statusById.get("P96.4")?.status === "complete"
    && ["P96.4", "P96.5", "P96.6", "P96.7"].includes(status.currentPhase)
    && ["P96.3", "P96.4", "P96.5", "P96.6"].includes(status.previousPhase)
    && ["P96.5", "P96.6", "P96.7", "P97"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P96.4", roadmapById.get("P96.4")?.track === "NEXUS_OS" && roadmapById.get("P96.4")?.status === "complete");
addCheck("P96.5 handoff exists", ["planned", "complete"].includes(statusById.get("P96.5")?.status) && ["planned", "complete"].includes(roadmapById.get("P96.5")?.status));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P96.4 Business Build local execution readiness UX.",
        "- Confirms Command Center shows DB-backed local readiness, dry-run admission lanes, next action, blockers, disabled reason, owner capability, evidence/activity labels, and cost impact.",
        "- Confirms the primary UX does not expose raw tables, raw private IDs, DemoApp, raw JSON/logs/policy dumps, or fake runnable execution controls.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p964-command-center-business-build-readiness-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Business Build local execution readiness\"",
        "- cd dashboard && npm run build",
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
      body: "- P96.4 is readiness UX only. It does not dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P96.4 Command Center Business Build Readiness UX Report", phase: "P96.4" },
);

printCheckReport("P96.4 Command Center Business Build Readiness UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
