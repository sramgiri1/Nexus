import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildBusinessBuildViewModel,
  buildFounderLiveOperatorDecisionLedgerPersistenceDisplayModel,
} from "../dashboard/src/data/businessBuild.js";
import { buildDbRuntimeReadinessViewModel } from "../dashboard/src/data/dbRuntimeReadiness.js";
import {
  buildFounderLiveOperatorDecisionLedgerPersistenceContract,
  validateFounderLiveOperatorDecisionLedgerPersistenceContract,
} from "../live-ready/founderLiveOperatorDecisionLedgerPersistence.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1107-founder-live-operator-decision-ledger-persistence-final-report.md";

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
    .map((line) => line.includes(" -> ") ? line.split(" -> ").pop() : line);
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p110-founder-live-operator-decision-ledger-persistence-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1105Checker = readText("scripts/check-p1105-founder-live-operator-decision-ledger-persistence-validation.js");
const p1106Checker = readText("scripts/check-p1106-founder-live-operator-decision-ledger-persistence-docs.js");
const businessBuild = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const persistenceDisplay = buildFounderLiveOperatorDecisionLedgerPersistenceDisplayModel("Build a simple iOS Snake game for the App Store");
const dbRuntime = buildDbRuntimeReadinessViewModel();
const blockedContract = buildFounderLiveOperatorDecisionLedgerPersistenceContract();
const readyContract = buildFounderLiveOperatorDecisionLedgerPersistenceContract({
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
});
const blockedValidation = validateFounderLiveOperatorDecisionLedgerPersistenceContract(blockedContract);
const readyValidation = validateFounderLiveOperatorDecisionLedgerPersistenceContract(readyContract);
const p1107 = subphaseById.get("P110.7") || {};
const changed = changedFiles();
const p110Scripts = [
  "check:p1101-founder-live-operator-decision-ledger-persistence-contract",
  "check:p1102-founder-live-operator-decision-ledger-schema",
  "check:p1103-founder-live-operator-decision-ledger-crud-model",
  "check:p1104-command-center-decision-ledger-persistence-ux",
  "check:p1105-founder-live-operator-decision-ledger-persistence-validation",
  "check:p1106-founder-live-operator-decision-ledger-persistence-docs",
  "check:p1107-founder-live-operator-decision-ledger-persistence-final",
];
const p110Reports = [
  "reports/p1101-founder-live-operator-decision-ledger-persistence-contract-report.md",
  "reports/p1102-founder-live-operator-decision-ledger-schema-report.md",
  "reports/p1103-founder-live-operator-decision-ledger-crud-model-report.md",
  "reports/p1104-command-center-decision-ledger-persistence-ux-report.md",
  "reports/p1105-founder-live-operator-decision-ledger-persistence-validation-report.md",
  "reports/p1106-founder-live-operator-decision-ledger-persistence-docs-report.md",
];
const validationCommands = [
  "npm run check:p1107-founder-live-operator-decision-ledger-persistence-final",
  "npm run check:p1106-founder-live-operator-decision-ledger-persistence-docs",
  "npm run check:p1105-founder-live-operator-decision-ledger-persistence-validation",
  "cd dashboard && npm run build",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "dashboard/src/",
  "dashboard/tests/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
  ".env",
  "local-state/runtime/",
];
const persistenceUx = JSON.stringify([
  businessBuild.founderLiveOperatorDecisionLedgerPersistence,
  persistenceDisplay,
  dbRuntime.operatorDecisionLedgerPersistence,
]);
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");

const p111PlaceholderState =
  status.currentPhase === "P110.7"
  && status.previousPhase === "P110.6"
  && status.nextPhase === "P111"
  && roadmap.currentPhase === "P110.7"
  && roadmap.previousPhase === "P110.6"
  && roadmap.nextPhase === "P111"
  && statusById.get("P111")?.status === "planned"
  && roadmapById.get("P111")?.status === "planned"
  && osStatusChecker.includes('"P111"');

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1107-founder-live-operator-decision-ledger-persistence-final"]));
addCheck("all P110 scripts registered", p110Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P110 reports exist and pass", p110Reports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P110 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("P110.7 records final validation commands", validationCommands.every((command) => p1107.validationCommands?.includes(command)));
addCheck("P110.7 avoids forbidden file scope", !(p1107.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("changed files avoid forbidden scope", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("compatibility checkers accept final handoff", p1105Checker.includes("P110.7") && p1105Checker.includes("P111") && p1106Checker.includes("P110.7") && p1106Checker.includes("P111"));
addCheck("P111 handoff placeholder is supported", p111PlaceholderState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("docs record P110.7 complete", /P110\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P110 complete", /P110\.7 is\s+complete/.test(platformRoadmap) && /P110 is\s+complete/.test(platformRoadmap) && /P111 is\s+next/.test(platformRoadmap));
addCheck("README records P110 complete", /P110\.7 final validation/.test(readme) && /P110 is complete/.test(readme) && /P111 is next/.test(readme));
addCheck("Command Center persistence UX retained", businessBuild.founderLiveOperatorDecisionLedgerPersistence?.readyRecordCount === 3 && persistenceDisplay.lanes?.length === 3 && dbRuntime.operatorDecisionLedgerPersistence?.readyRecordCount === 3 && pageSource.includes("FounderLiveOperatorDecisionLedgerPersistenceCard"));
addCheck("route safety coverage retained", routeTests.includes("Decision ledger persistence appears on non-chat founder routes") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("toHaveCount(0)"));
addCheck(
  "phase status closed",
  p111PlaceholderState
    && statusById.get("P110")?.status === "complete"
    && statusById.get("P110.7")?.status === "complete"
    && roadmapById.get("P110")?.status === "complete"
    && roadmapById.get("P110.7")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}/${statusById.get("P110")?.status}`,
);
addCheck("phase commits recorded", [statusById.get("P110")?.commit, statusById.get("P110.7")?.commit, roadmapById.get("P110")?.commit, roadmapById.get("P110.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P110")?.commandCenterVisible === true && statusById.get("P110.7")?.commandCenterVisible === true);
addCheck("persistence contract validates blocked and approved states", blockedValidation.valid && readyValidation.valid);
addCheck("unsafe authority remains blocked by default", blockedContract.data?.providerCallsAllowed === false && blockedContract.data?.agentDispatchAllowed === false && blockedContract.data?.projectMutationAllowed === false && blockedContract.data?.hostedDbWritesAllowed === false && blockedContract.data?.providerSpendAllowed === false);
addCheck("primary UX avoids raw private IDs", !/(?:private|token|tenant|workspace|project|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(persistenceUx));
addCheck("primary UX avoids raw DB entity names", !/operator_decision_ledger_entries|operator_decision_ledger_events|operator_decision_ledger_evidence_refs/i.test(persistenceUx));
addCheck("primary UX avoids raw packet keys", !/(ledgerEntryId|ledgerEventId|evidenceRefId|requestKey|sqliteEntity|recordRef|auditPreviewRef|reviewPacketId|approvalPlanId|sourceReviewPacketKey)/.test(persistenceUx));
addCheck("primary UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write ledger now/i.test(persistenceUx));
addCheck("primary UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(persistenceUx));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write ledger now/i.test(docsBundle));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled/i.test(docsBundle));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P110 founder live operator decision-ledger persistence closure.",
        "- Confirms parent P110 and all subphases are complete, reports and scripts exist, Command Center persistence route safety is retained, and P111 is the next planned handoff placeholder.",
        "- Does not enable hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P110.7 closes P110 validation only. It does not add Command Center source changes, hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend. P111 is a planned handoff placeholder only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P110.7 Founder Live Operator Decision Ledger Persistence Final Report", phase: "P110.7" },
);

printCheckReport("P110.7 Founder Live Operator Decision Ledger Persistence Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
