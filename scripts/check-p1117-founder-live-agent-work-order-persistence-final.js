import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildBusinessBuildViewModel,
  buildFounderLiveAgentWorkOrderPersistenceDisplayModel,
} from "../dashboard/src/data/businessBuild.js";
import { buildDbRuntimeReadinessViewModel } from "../dashboard/src/data/dbRuntimeReadiness.js";
import {
  buildFounderLiveAgentWorkOrderPersistenceContract,
  validateFounderLiveAgentWorkOrderPersistenceContract,
} from "../live-ready/founderLiveAgentWorkOrderPersistence.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1117-founder-live-agent-work-order-persistence-final-report.md";

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
const plan = readText("docs/architecture/P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1115Checker = readText("scripts/check-p1115-founder-live-agent-work-order-persistence-validation.js");
const p1116Checker = readText("scripts/check-p1116-founder-live-agent-work-order-persistence-docs.js");
const businessBuild = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const persistenceDisplay = buildFounderLiveAgentWorkOrderPersistenceDisplayModel("Build a simple iOS Snake game for the App Store");
const dbRuntime = buildDbRuntimeReadinessViewModel();
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
const p1117 = subphaseById.get("P111.7") || {};
const changed = changedFiles();
const allowedFiles = new Set(p1117.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P111.7";
const p111Scripts = [
  "check:p1111-founder-live-agent-work-order-persistence-contract",
  "check:p1112-founder-live-agent-work-order-schema",
  "check:p1113-founder-live-agent-work-order-crud-model",
  "check:p1114-command-center-work-order-persistence-ux",
  "check:p1115-founder-live-agent-work-order-persistence",
  "check:p1116-founder-live-agent-work-order-persistence",
  "check:p1117-founder-live-agent-work-order-persistence",
];
const p111Reports = [
  "reports/p1111-founder-live-agent-work-order-persistence-contract-report.md",
  "reports/p1112-founder-live-agent-work-order-schema-report.md",
  "reports/p1113-founder-live-agent-work-order-crud-model-report.md",
  "reports/p1114-command-center-work-order-persistence-ux-report.md",
  "reports/p1115-founder-live-agent-work-order-persistence-validation-report.md",
  "reports/p1116-founder-live-agent-work-order-persistence-docs-report.md",
];
const validationCommands = [
  "npm run check:p1117-founder-live-agent-work-order-persistence",
  "npm run check:p1116-founder-live-agent-work-order-persistence",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
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
const persistenceUx = JSON.stringify([
  businessBuild.founderLiveAgentWorkOrderPersistence,
  persistenceDisplay,
  dbRuntime.agentWorkOrderPersistence,
]);
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const p112PlaceholderState =
  status.currentPhase === "P111.7"
    && status.previousPhase === "P111.6"
    && status.nextPhase === "P112"
    && roadmap.currentPhase === "P111.7"
    && roadmap.previousPhase === "P111.6"
    && roadmap.nextPhase === "P112"
    && statusById.get("P111")?.status === "complete"
    && roadmapById.get("P111")?.status === "complete";
const p112StartedState =
  status.currentPhase === "P112.1"
    && status.previousPhase === "P111.7"
    && status.nextPhase === "P112.2"
    && roadmap.currentPhase === "P112.1"
    && roadmap.previousPhase === "P111.7"
    && roadmap.nextPhase === "P112.2"
    && statusById.get("P111")?.status === "complete"
    && roadmapById.get("P111")?.status === "complete"
    && statusById.get("P112")?.status === "in_progress"
    && roadmapById.get("P112")?.status === "in_progress"
    && statusById.get("P112.1")?.status === "complete"
    && roadmapById.get("P112.1")?.status === "complete";
const p112HandoffState =
  (p112PlaceholderState || p112StartedState)
    && osStatusChecker.includes('"P112"')
    && osStatusChecker.includes('"P112.1"')
    && osStatusChecker.includes('"P112.2"')
    && osStatusChecker.includes('phaseStatus.nextPhase === "P112"');

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1117-founder-live-agent-work-order-persistence"]));
addCheck("all P111 scripts registered", p111Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P111 reports exist and pass", p111Reports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P111 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("P111.7 records final validation commands", validationCommands.every((command) => p1117.validationCommands?.includes(command)));
addCheck("P111.7 avoids forbidden file scope", !(p1117.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck(
  "changed files stay in P111.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck("changed files avoid forbidden scope", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("compatibility checkers accept final handoff", p1115Checker.includes("P111.7") && p1116Checker.includes("P112") && p1116Checker.includes("scope check relaxed"));
addCheck("P112 handoff is supported", p112HandoffState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("docs record P111.7 complete", /P111\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P111 complete", /P111\.7 is\s+complete/.test(platformRoadmap) && /P111 is\s+complete/.test(platformRoadmap) && /P112 is\s+next/.test(platformRoadmap));
addCheck("README records P111 complete", /P111\.7 final validation/.test(readme) && /P111 is complete/.test(readme) && /P112 is next/.test(readme));
addCheck("Command Center work order UX retained", businessBuild.founderLiveAgentWorkOrderPersistence?.readyRecordCount === 3 && persistenceDisplay.lanes?.length === 3 && dbRuntime.agentWorkOrderPersistence?.readyRecordCount === 3 && pageSource.includes("FounderLiveAgentWorkOrderPersistenceCard"));
addCheck("route safety coverage retained", routeTests.includes("Work order persistence surfaces on founder DB pages and stays out of chat") && routeTests.includes("/command-center/lite") && routeTests.includes("toHaveCount(0)"));
addCheck(
  "phase status closed",
  p112HandoffState
    && statusById.get("P111")?.status === "complete"
    && statusById.get("P111.7")?.status === "complete"
    && roadmapById.get("P111")?.status === "complete"
    && roadmapById.get("P111.7")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}/${statusById.get("P111")?.status}`,
);
addCheck("phase commits recorded", [statusById.get("P111")?.commit, statusById.get("P111.7")?.commit, roadmapById.get("P111")?.commit, roadmapById.get("P111.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P111")?.commandCenterVisible === true && statusById.get("P111.7")?.commandCenterVisible === true);
addCheck("persistence contract validates blocked and approved states", blockedValidation.valid && readyValidation.valid);
addCheck("unsafe authority remains blocked by default", blockedContract.data?.providerCallsAllowed === false && blockedContract.data?.agentDispatchAllowed === false && blockedContract.data?.projectMutationAllowed === false && blockedContract.data?.hostedDbWritesAllowed === false && blockedContract.data?.providerSpendAllowed === false);
addCheck("approved local writes do not dispatch or mutate projects", readyContract.data?.agentDispatchAllowed === false && readyContract.data?.projectMutationAllowed === false && readyContract.data?.hostedDbWritesAllowed === false && readyContract.data?.providerSpendAllowed === false);
addCheck("primary UX avoids raw private IDs", !/(?:private|token|tenant|workspace|project|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(persistenceUx));
addCheck("primary UX avoids raw DB entity names", !/founder_agent_work_orders|founder_agent_work_order_events|founder_agent_work_order_evidence_refs/i.test(persistenceUx));
addCheck("primary UX avoids raw packet keys", !/(workOrderId|workOrderEventId|workOrderEvidenceRefId|requestKey|sqliteEntity|recordRef|sourceHandoffLabel|sourceAdmissionLabel)/.test(persistenceUx));
addCheck("primary UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write work order now/i.test(persistenceUx));
addCheck("primary UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(persistenceUx));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write work order now/i.test(docsBundle));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|work order execution is enabled/i.test(docsBundle));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P111 founder live agent work order persistence closure.",
        "- Confirms parent P111 and all subphases are complete, reports and scripts exist, Command Center persistence route safety is retained, and the P112 handoff state is valid.",
        "- Does not enable hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P111.7 closes P111 validation only. It does not add Command Center source changes, hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend. P112 is a handoff placeholder only until its own implementation-grade contract is written.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P111.7 Founder Live Agent Work Order Persistence Final Report", phase: "P111.7" },
);

printCheckReport("P111.7 Founder Live Agent Work Order Persistence Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
