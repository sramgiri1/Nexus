import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p967-founder-business-build-readiness-final-validation-report.md";

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
const docs = readText("docs/architecture/P96_FOUNDER_BUSINESS_BUILD_LOCAL_EXECUTION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const checkers = [
  "scripts/check-p961-founder-business-build-readiness-contract.js",
  "scripts/check-p962-founder-business-build-readiness-model.js",
  "scripts/check-p963-founder-business-build-dry-run-admission.js",
  "scripts/check-p964-command-center-business-build-readiness-ux.js",
  "scripts/check-p965-founder-business-build-readiness-validation.js",
  "scripts/check-p966-founder-business-build-readiness-docs-roadmap.js",
].map((file) => readText(file));
const p967 = contract.subphases?.find((entry) => entry.phaseId === "P96.7");
const readiness = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store").localExecutionReadiness || {};
const requiredReports = [
  "reports/p961-founder-business-build-readiness-contract-report.md",
  "reports/p962-founder-business-build-readiness-model-report.md",
  "reports/p963-founder-business-build-dry-run-admission-report.md",
  "reports/p964-command-center-business-build-readiness-ux-report.md",
  "reports/p965-founder-business-build-readiness-validation-report.md",
  "reports/p966-founder-business-build-readiness-docs-roadmap-report.md",
];
const unsafeWords = /(call provider now|dispatch agent now|run worker now|write project now|deploy now|spend now|execute now|migrate now|generate app now|create project now|write hosted db now)/i;
const rawPrivateIdPattern = /(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i;
const rawTablePattern = /founder_sessions|founder_qna_turns|founder_prd_artifacts|founder_workstream_plans/;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p967-founder-business-build-readiness-final-validation"]));
addCheck("contract marks P96.7 complete", p967?.status === "complete");
addCheck("contract final validation commands are complete", [
  "npm run check:p967-founder-business-build-readiness-final-validation",
  "npm run check:p966-founder-business-build-readiness-docs-roadmap",
  "npm run check:p965-founder-business-build-readiness-validation",
  "npm run check:p964-command-center-business-build-readiness-ux",
  "npm run check:p963-founder-business-build-dry-run-admission",
  "npm run check:p962-founder-business-build-readiness-model",
  "npm run check:p961-founder-business-build-readiness-contract",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Business Build local execution readiness\"",
  "cd dashboard && npm run build",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
].every((command) => p967?.validationCommands?.includes(command)));
addCheck("all P96 subphases are complete", ["P96.1", "P96.2", "P96.3", "P96.4", "P96.5", "P96.6", "P96.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete"));
addCheck("P96 parent is complete", statusById.get("P96")?.status === "complete" && roadmapById.get("P96")?.status === "complete");
addCheck("P97 handoff exists", ["planned", "in_progress"].includes(statusById.get("P97")?.status) && ["planned", "in_progress"].includes(roadmapById.get("P97")?.status));
addCheck("prior P96 reports exist and pass", requiredReports.every((report) => existsSync(join(ROOT, report)) && readText(report).includes("PASS")));
addCheck("checkers tolerate P96.7/P97 status", checkers.every((source) => source.includes('"P96.7"') && source.includes('"P97"') && source.includes('"complete"')));
addCheck("Command Center Business Build UX remains covered", commandCenterSource.includes("Business Build Local Execution Readiness")
  && routeTests.includes("Business Build local execution readiness renders without runnable actions")
  && readiness.readyLaneCount === 4
  && readiness.safetyRows?.every((row) => row.value === "Blocked"));
addCheck("docs record P96 closeout", docs.includes("P96.7 is complete") && docs.includes("P97") && platformRoadmap.includes("P96 is complete"));
addCheck("phase status closes P96 and points to P97", status.currentPhase === "P96.7" && status.previousPhase === "P96.6" && status.nextPhase === "P97" && status.currentPhaseStatus === "complete");
addCheck("final validation avoids raw private IDs", !rawPrivateIdPattern.test(JSON.stringify([readiness, docs, platformRoadmap])));
addCheck("final validation avoids raw table dumps", !rawTablePattern.test(JSON.stringify(readiness)));
addCheck("final validation does not invent unsafe runnable actions", !unsafeWords.test(JSON.stringify([readiness, commandCenterSource, docs, platformRoadmap])));
addCheck("P96.7 avoids forbidden file scope", !p967.allowedFiles.some((file) => file.startsWith("projects/") || file.startsWith("careloop/") || file.startsWith("providers/") || file.startsWith("tools/") || file.startsWith("worker-runtime/") || file.startsWith("deploy/")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P96.7 final closeout for founder Business Build local execution readiness.",
        "- Confirms P96.1-P96.7 status, reports, docs, Command Center UX coverage, route test coverage, and P97 handoff.",
        "- Confirms final P96 still blocks provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, network calls, deploy, release, export, package, and spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p967-founder-business-build-readiness-final-validation",
        "- npm run check:p966-founder-business-build-readiness-docs-roadmap",
        "- npm run check:p965-founder-business-build-readiness-validation",
        "- npm run check:p964-command-center-business-build-readiness-ux",
        "- npm run check:p963-founder-business-build-dry-run-admission",
        "- npm run check:p962-founder-business-build-readiness-model",
        "- npm run check:p961-founder-business-build-readiness-contract",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Business Build local execution readiness\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P96 closes local readiness only. It does not dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P96.7 Founder Business Build Readiness Final Validation Report", phase: "P96.7" },
);

printCheckReport("P96.7 Founder Business Build Readiness Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
