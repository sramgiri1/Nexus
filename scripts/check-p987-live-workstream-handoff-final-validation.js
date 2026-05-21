import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p987-live-workstream-handoff-final-validation-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p98-execution-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const p98Plan = readText("docs/architecture/P98_FOUNDER_BUSINESS_BUILD_LIVE_WORKSTREAM_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p987 = subphaseById.get("P98.7");
const p98Subphases = ["P98.1", "P98.2", "P98.3", "P98.4", "P98.5", "P98.6", "P98.7"];
const requiredScripts = [
  "check:p981-founder-live-workstream-handoff-contract",
  "check:p982-founder-live-workstream-handoff-model",
  "check:p983-founder-live-workstream-handoff-dry-run",
  "check:p984-command-center-live-workstream-handoff-ux",
  "check:p985-live-workstream-handoff-validation",
  "check:p986-live-workstream-handoff-docs-roadmap",
  "check:p987-live-workstream-handoff-final-validation",
];
const requiredReports = [
  "reports/p981-founder-live-workstream-handoff-contract-report.md",
  "reports/p982-founder-live-workstream-handoff-model-report.md",
  "reports/p983-founder-live-workstream-handoff-dry-run-report.md",
  "reports/p984-command-center-live-workstream-handoff-ux-report.md",
  "reports/p985-live-workstream-handoff-validation-report.md",
  "reports/p986-live-workstream-handoff-docs-roadmap-report.md",
];
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

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P98 evidence reports exist", requiredReports.every(fileExists));
addCheck("P98 prior evidence reports passed", requiredReports.every((path) => /Result[\s\S]*PASS|Result: PASS/.test(readText(path))));
addCheck("contract tracks P98.1-P98.7 complete", p98Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P98.7 allowed files scoped", p987?.allowedFiles?.includes("scripts/check-p987-live-workstream-handoff-final-validation.js") && p987.allowedFiles.includes("reports/p987-live-workstream-handoff-final-validation-report.md"));
addCheck("P98.7 allowed files avoid forbidden roots", !p987?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("docs mark P98.7 complete", p98Plan.includes("## P98.7 Final Validation") && p98Plan.includes("P98.7 is complete"));
addCheck("docs close P98", p98Plan.includes("P98 is complete") && p98Plan.includes("P99 is next"));
addCheck("platform roadmap closes P98", platformRoadmap.includes("P98.7 is complete") && platformRoadmap.includes("P98 is complete") && platformRoadmap.includes("P99 is next"));
addCheck("roadmap statuses complete through P98.7", p98Subphases.every((phaseId) => roadmapById.get(phaseId)?.track === "NEXUS_OS" && roadmapById.get(phaseId)?.status === "complete"));
addCheck("status records complete through P98.7", p98Subphases.every((phaseId) => statusById.get(phaseId)?.track === "NEXUS_OS" && statusById.get(phaseId)?.status === "complete"));
addCheck("parent phase closed", statusById.get("P98")?.status === "complete" && roadmapById.get("P98")?.status === "complete" && statusById.get("P98")?.nextPhase === "P99");
addCheck("P99 planned handoff exists", statusById.get("P99")?.status === "planned" && roadmapById.get("P99")?.status === "planned");
addCheck(
  "phase status advanced",
  status.currentPhase === "P98.7"
    && status.previousPhase === "P98.6"
    && status.nextPhase === "P99"
    && status.currentPhaseStatus === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("Command Center handoff UX retained", commandCenterSource.includes("LiveWorkstreamHandoffCard") && commandCenterSource.includes("DB Runtime Live Workstream Handoff"));
addCheck("Playwright handoff coverage retained", routeTests.includes("Live workstream handoff appears in Lite, Business Build, Agent Flow, and DB Runtime"));

const serialized = JSON.stringify([contract, statusById.get("P98"), statusById.get("P98.7"), roadmapById.get("P98"), roadmapById.get("P98.7")]);
const statusSerialized = JSON.stringify([statusById.get("P98"), statusById.get("P98.7"), roadmapById.get("P98"), roadmapById.get("P98.7")]);
addCheck("unsafe operations remain blocked", ["No provider/model calls", "No agent dispatch", "No worker/tool execution", "No project creation or mutation", "No hosted DB mutation", "No deploy"].every((term) => serialized.includes(term)));
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d|Bearer\s+/i.test(statusSerialized));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now|generate app now/i.test(serialized));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Finalizes P98 founder Business Build live workstream handoff validation.",
        "- Closes P98 and P98.7 status records with P99 as the next planned scoped handoff.",
        "- Confirms the Command Center handoff UX remains display-safe while unsafe runtime operations stay blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p987-live-workstream-handoff-final-validation",
        "- npm run check:p986-live-workstream-handoff-docs-roadmap",
        "- npm run check:p985-live-workstream-handoff-validation",
        "- npm run check:p984-command-center-live-workstream-handoff-ux",
        "- npm run check:p983-founder-live-workstream-handoff-dry-run",
        "- npm run check:p982-founder-live-workstream-handoff-model",
        "- npm run check:p981-founder-live-workstream-handoff-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P98.7 is final validation only. It does not change Command Center UX, dispatch agents, execute workers/tools, mutate project source, use hosted DBs, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P98.7 Live Workstream Handoff Final Validation Report", phase: "P98.7" },
);

printCheckReport("P98.7 Live Workstream Handoff Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
