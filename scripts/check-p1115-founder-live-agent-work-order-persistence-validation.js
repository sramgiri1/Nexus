import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildBusinessBuildViewModel,
  buildFounderLiveAgentWorkOrderPersistenceDisplayModel,
} from "../dashboard/src/data/businessBuild.js";
import {
  P111_AGENT_WORK_ORDER_DB_ENTITIES,
  P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PHASE,
  buildFounderLiveAgentWorkOrderPersistenceContract,
  validateFounderLiveAgentWorkOrderPersistenceContract,
} from "../live-ready/founderLiveAgentWorkOrderPersistence.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1115-founder-live-agent-work-order-persistence-validation-report.md";

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
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1115 = subphaseById.get("P111.5") || {};
const p1116 = subphaseById.get("P111.6") || {};
const plan = readText("docs/architecture/P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1114Checker = readText("scripts/check-p1114-command-center-work-order-persistence-ux.js");
const changed = changedFiles();
const allowedFiles = new Set(p1115.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "db/",
  "live-ready/",
  "dashboard/src/",
  "dashboard/tests/",
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
const reportPaths = [
  "reports/p1111-founder-live-agent-work-order-persistence-contract-report.md",
  "reports/p1112-founder-live-agent-work-order-schema-report.md",
  "reports/p1113-founder-live-agent-work-order-crud-model-report.md",
  "reports/p1114-command-center-work-order-persistence-ux-report.md",
];
const requiredScripts = [
  "check:p1111-founder-live-agent-work-order-persistence-contract",
  "check:p1112-founder-live-agent-work-order-schema",
  "check:p1113-founder-live-agent-work-order-crud-model",
  "check:p1114-command-center-work-order-persistence-ux",
  "check:p1115-founder-live-agent-work-order-persistence",
];
const validationCommands = [
  "npm run check:p1115-founder-live-agent-work-order-persistence",
  "npm run check:p1114-command-center-work-order-persistence-ux",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const blockedContract = buildFounderLiveAgentWorkOrderPersistenceContract();
const readyContract = buildFounderLiveAgentWorkOrderPersistenceContract({
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
});
const blockedValidation = validateFounderLiveAgentWorkOrderPersistenceContract(blockedContract);
const readyValidation = validateFounderLiveAgentWorkOrderPersistenceContract(readyContract);
const founderIdea = "Build a simple iOS Snake game for the App Store";
const businessBuild = buildBusinessBuildViewModel(founderIdea);
const persistenceDisplay = buildFounderLiveAgentWorkOrderPersistenceDisplayModel(founderIdea);
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const uxBundle = [
  JSON.stringify(businessBuild.founderLiveAgentWorkOrderPersistence),
  JSON.stringify(persistenceDisplay),
  "Business Build Agent Work Order Persistence",
  "DB Runtime Agent Work Order Persistence",
].join("\n");

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P111.1-P111.4 are complete", ["P111.1", "P111.2", "P111.3", "P111.4"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P111.5 contract is complete", p1115.status === "complete" && ["planned", "complete"].includes(p1116.status));
addCheck("P111.5 records validation commands", validationCommands.every((command) => p1115.validationCommands?.includes(command)));
addCheck("prior reports exist and pass", reportPaths.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("work order runtime contract validates", P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PHASE === "P111.3" && blockedValidation.valid && readyValidation.valid);
addCheck("work order DB entity allowlist is narrow", P111_AGENT_WORK_ORDER_DB_ENTITIES.length === 3 && P111_AGENT_WORK_ORDER_DB_ENTITIES.every((entity) => entity.startsWith("founder_agent_work_order")));
addCheck("blocked contract keeps unsafe authority false", blockedContract.data?.providerCallsAllowed === false && blockedContract.data?.agentDispatchAllowed === false && blockedContract.data?.projectMutationAllowed === false && blockedContract.data?.hostedDbWritesAllowed === false && blockedContract.data?.providerSpendAllowed === false);
addCheck("ready contract still does not dispatch or mutate projects", readyContract.data?.agentDispatchAllowed === false && readyContract.data?.projectMutationAllowed === false && readyContract.data?.hostedDbWritesAllowed === false && readyContract.data?.providerSpendAllowed === false);
addCheck("Command Center work order UX remains available", businessBuild.founderLiveAgentWorkOrderPersistence?.readyRecordCount === 3 && persistenceDisplay.lanes?.length === 3 && commandCenterSource.includes("FounderLiveAgentWorkOrderPersistenceCard"));
addCheck("Command Center chat routes remain clean", !commandCenterSource.includes("Chat Agent Work Order Persistence") && !commandCenterSource.includes("Lite Agent Work Order Persistence") && routeTests.includes("Founder agent work order persistence") && routeTests.includes("toHaveCount(0)"));
addCheck("focused Playwright route test is present", routeTests.includes("Work order persistence surfaces on founder DB pages and stays out of chat") && routeTests.includes("dark") && routeTests.includes("light"));
addCheck("dashboard model stays browser safe", !businessBuildSource.includes("founderLiveAgentWorkOrderPersistence.js") && !businessBuildSource.includes("sqliteRuntime") && !businessBuildSource.includes("sqliteCrudRepository") && !businessBuildSource.includes("node:fs"));
addCheck("P111.4 checker accepts P111.5 handoff", p1114Checker.includes('status.currentPhase === "P111.5"') && p1114Checker.includes('status.nextPhase === "P111.6"'));
addCheck(
  "phase status advanced",
  status.currentPhase === "P111.5"
    && status.previousPhase === "P111.4"
    && status.nextPhase === "P111.6"
    && roadmap.currentPhase === "P111.5"
    && roadmap.previousPhase === "P111.4"
    && roadmap.nextPhase === "P111.6"
    && statusById.get("P111")?.status === "in_progress"
    && statusById.get("P111.5")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P111.6")?.status)
    && roadmapById.get("P111")?.status === "in_progress"
    && roadmapById.get("P111.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("docs record P111.5", /P111\.5 Work Order Persistence Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P111.5", /P111\.5 aggregate validation/.test(readme) && /P111\.6\s+is\s+next/.test(readme));
addCheck("platform roadmap records P111.5", /P111\.5 is\s+complete/.test(platformRoadmap) && /P111\.6\s+is\s+next/.test(platformRoadmap));
addCheck("primary UX avoids raw private IDs", !/(?:private|token|tenant|workspace|project|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(uxBundle));
addCheck("primary UX avoids raw DB entity names", !/founder_agent_work_orders|founder_agent_work_order_events|founder_agent_work_order_evidence_refs/i.test(uxBundle));
addCheck("primary UX avoids raw packet keys", !/(workOrderId|workOrderEventId|workOrderEvidenceRefId|requestKey|sqliteEntity|recordRef|sourceHandoffLabel|sourceAdmissionLabel)/.test(uxBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write work order now/i.test(docsBundle));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|work order execution is enabled/i.test(docsBundle));
addCheck("DemoApp not exposed", !commandCenterSource.includes("DemoApp"));
addCheck("changed files stay in P111.5 allowed scope", changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH), changed.join(", "));
addCheck("forbidden paths unchanged", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates aggregate P111.1-P111.4 founder live agent work order persistence evidence.",
        "- Confirms contract, schema, governed local CRUD model, Command Center UX, route safety, docs/status, and reports are present.",
        "- Does not change DB schema, live-ready runtime models, dashboard source, project files, runtime data, providers, tools, workers, deploy, release, exports, packages, network, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P111.5 is aggregate validation only. It does not change Command Center UX, write DB records, use hosted DBs, run raw SQL, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P111.5 Founder Live Agent Work Order Persistence Validation Report", phase: "P111.5" },
);

printCheckReport("P111.5 Founder Live Agent Work Order Persistence Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
