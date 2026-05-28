import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildBusinessBuildViewModel,
  buildFounderLiveAgentWorkOrderPersistenceDisplayModel,
} from "../dashboard/src/data/businessBuild.js";
import { buildDbRuntimeReadinessViewModel } from "../dashboard/src/data/dbRuntimeReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1114-command-center-work-order-persistence-ux-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function changedFiles() {
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]{1,2}\s+/, ""))
    .map((line) => (line.includes(" -> ") ? line.split(" -> ").pop() : line));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p111-founder-live-agent-work-order-persistence-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p1114 = contract.subphases?.find((entry) => entry.phaseId === "P111.4") || {};
const p1115 = contract.subphases?.find((entry) => entry.phaseId === "P111.5") || {};
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const dbRuntimeSource = readText("dashboard/src/data/dbRuntimeReadiness.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routesSpec = readText("dashboard/tests/routes.spec.js");
const p1113Checker = readText("scripts/check-p1113-founder-live-agent-work-order-crud-model.js");
const plan = readText("docs/architecture/P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PLAN.md");
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const changed = changedFiles();
const allowedFiles = new Set(p1114.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P111.4";
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "db/",
  "live-ready/",
  "local-state/runtime/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
  ".env",
];
const founderIdea = "Build a simple iOS Snake game for the App Store";
const displayModel = buildFounderLiveAgentWorkOrderPersistenceDisplayModel(founderIdea);
const businessBuild = buildBusinessBuildViewModel(founderIdea);
const dbRuntime = buildDbRuntimeReadinessViewModel();
const serializedDisplay = JSON.stringify({
  displayModel,
  businessBuild: businessBuild.founderLiveAgentWorkOrderPersistence,
  dbRuntime: dbRuntime.agentWorkOrderPersistence,
});
const validationCommands = [
  "npm run check:p1114-command-center-work-order-persistence-ux",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Work order persistence\"",
  "cd dashboard && npm run build",
  "npm run check:p1113-founder-live-agent-work-order-crud-model",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1114-command-center-work-order-persistence-ux"]));
addCheck("P111.4 contract complete and P111.5 next", p1114.status === "complete" && ["planned", "complete"].includes(p1115.status));
addCheck("display model export exists", typeof buildFounderLiveAgentWorkOrderPersistenceDisplayModel === "function");
addCheck("display model has required shape", [
  "currentState",
  "runtimeMode",
  "dbMode",
  "savedWorkOrderState",
  "savedEventState",
  "savedEvidenceState",
  "allowedLocalCrudOperations",
  "allowedRecords",
  "readyRecordCount",
  "totalRecordCount",
  "nextAction",
  "blockers",
  "disabledReason",
  "ownerCapability",
  "evidenceLocation",
  "activityLocation",
  "costImpact",
  "commandCenterVisible",
  "lanes",
  "safetyRows",
].every((field) => field in displayModel));
addCheck("display model is useful for founders", displayModel.currentState.includes("Work Order Persistence") && displayModel.nextAction.includes("approval") && displayModel.ownerCapability.includes("Work Order") && displayModel.costImpact.includes("No provider"));
addCheck("display model remains display-safe", displayModel.commandCenterVisible === true && displayModel.lanes.length === 3 && displayModel.allowedLocalCrudOperations.includes("Create") && displayModel.safetyRows.some((row) => row.label === "Agent dispatch" && row.value === "Blocked"));
addCheck("Business Build exposes work order persistence", businessBuild.founderLiveAgentWorkOrderPersistence?.currentState === displayModel.currentState && commandCenterSource.includes("Business Build Agent Work Order Persistence"));
addCheck("Durable State exposes work order persistence", dbRuntime.agentWorkOrderPersistence?.currentState === displayModel.currentState && dbRuntimeSource.includes("agentWorkOrderPersistence") && commandCenterSource.includes("DB Runtime Agent Work Order Persistence"));
addCheck("Chat/Lite stays clean in route coverage", routesSpec.includes("Founder agent work order persistence") && routesSpec.includes("toHaveCount(0)") && routesSpec.includes("Command Center Lite route stays chat-only"));
addCheck("Playwright work order persistence test added", routesSpec.includes('test("Work order persistence surfaces on founder DB pages and stays out of chat"') && routesSpec.includes('await pickTheme(page, "dark")') && routesSpec.includes('await pickTheme(page, "light")'));
addCheck("P111.3 checker accepts P111.4 handoff", p1113Checker.includes('status.currentPhase === "P111.4"') && p1113Checker.includes('status.nextPhase === "P111.5"'));
addCheck("UI does not import Node-side CRUD executor", !businessBuildSource.includes("founderLiveAgentWorkOrderPersistence.js") && !businessBuildSource.includes("executeApprovedAgentWorkOrderDbCrudRequest") && !commandCenterSource.includes("executeApprovedAgentWorkOrderDbCrudRequest"));
addCheck("display model avoids raw private IDs and table names", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplay) && !/founder_agent_work_orders|founder_agent_work_order_events|founder_agent_work_order_evidence_refs/.test(serializedDisplay));
addCheck("display model avoids fake runnable actions", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write work order now/i.test(serializedDisplay));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P111.4"
      && status.previousPhase === "P111.3"
      && status.nextPhase === "P111.5"
      && roadmap.currentPhase === "P111.4"
      && roadmap.previousPhase === "P111.3"
      && roadmap.nextPhase === "P111.5")
    || (status.currentPhase === "P111.5"
      && status.previousPhase === "P111.4"
      && status.nextPhase === "P111.6"
      && roadmap.currentPhase === "P111.5"
      && roadmap.previousPhase === "P111.4"
      && roadmap.nextPhase === "P111.6"))
    && statusById.get("P111")?.status === "in_progress"
    && statusById.get("P111.4")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P111.5")?.status)
    && roadmapById.get("P111")?.status === "in_progress"
    && roadmapById.get("P111.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("docs record P111.4", /P111\.4 Command Center Work Order Persistence UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P111.4", /P111\.4 Command Center work order persistence UX/.test(readme) && /P111\.5 is next/.test(readme));
addCheck("platform roadmap records P111.4", /P111\.4 is complete/.test(platformRoadmap) && /P111\.5\s+is\s+next/.test(platformRoadmap));
addCheck(
  "changed files stay in P111.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck("forbidden paths unchanged", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P111.4 Command Center founder agent work order persistence UX.",
        "- Confirms Business Build and Durable State expose display-safe work order persistence state.",
        "- Confirms Chat/Lite stays conversation-only and does not show persistence cards.",
        "- Confirms no Node-side DB CRUD executor is imported into dashboard data or UI.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P111.4 is display-only. It does not expose mutation controls, write DB records from the browser, call providers/models, dispatch agents, run tools/workers, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P111.4 Command Center Work Order Persistence UX Report", phase: "P111.4" },
);

printCheckReport("P111.4 Command Center Work Order Persistence UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
