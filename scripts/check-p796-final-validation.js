import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildLiveCommandAdmission, validateLiveCommandAdmission } from "../command-interface/liveCommandAdmission.js";
import { buildLiveReadinessViewModel } from "../dashboard/src/data/liveReadiness.js";
import { admitLiveActionBridgeRequest } from "../live-execution/actionBridgeAdmissionController.js";
import { buildLiveExecutionGate, LIVE_EXECUTION_CAPABILITIES } from "../live-execution/liveExecutionGate.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p796-final-validation-report.md";
const P79_SUBPHASES = ["P79.1", "P79.2", "P79.3", "P79.4", "P79.5", "P79.6"];

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

function hasNoPrimaryLeakage(value) {
  const text = JSON.stringify(value);
  return !text.includes("DemoApp") && !text.includes("private-project-01") && !text.includes("private-project-governed-build-mission");
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

export function checkP79FinalValidation() {
  const packageJson = readJson("package.json");
  const status = readJson("os-roadmap/phase-status.json");
  const phases = readJson("os-roadmap/nexus-phases.json");
  const docs = readText("docs/architecture/P79_LIVE_EXECUTION_MODE_PLAN.md");
  const contract = readText("contracts/os-roadmap/p79-execution-contracts.json");
  const tests = readText("dashboard/tests/routes.spec.js");
  const liveGate = buildLiveExecutionGate({ mode: "live" });
  const blockedGate = buildLiveExecutionGate({ mode: "preview" });
  const admission = buildLiveCommandAdmission({
    mode: "live",
    capability: "agentDispatch",
    intent: { projectId: "private-project-01", apiKey: "secret-token" },
    approval: {
      operatorApproval: true,
      capabilityScope: true,
      budgetLimit: true,
      rollbackPlan: true,
      activityLedger: true,
      costLedger: true,
      redactionCheck: true,
    },
  });
  const bridge = admitLiveActionBridgeRequest({
    mode: "live",
    actionType: "implementation.apply",
    body: { runtimeTaskId: "private-project-governed-build-mission" },
  });
  const liveReadiness = buildLiveReadinessViewModel();
  const phaseById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
  const roadmapById = new Map((phases.phases || []).map((entry) => [entry.phaseId, entry]));
  const validation = validateLiveCommandAdmission(admission);
  const dangerousFlags = [
    "providerCallsAllowed",
    "toolExecutionAllowed",
    "workerExecutionAllowed",
    "projectMutationAllowed",
    "dbWritesAllowed",
    "deployExecutionAllowed",
    "providerSpendAllowed",
  ];
  const requiredScripts = [
    "check:p79-execution-plan",
    "check:p791-live-mode-gate",
    "check:p792-live-command-intent",
    "check:p793-action-bridge-admission",
    "check:p794-command-center-live-readiness-ux",
    "check:p795-tests-checkers-docs",
    "check:p796-final-validation",
  ];
  const requiredReports = [
    "reports/p791-live-mode-gate-report.md",
    "reports/p792-live-command-intent-report.md",
    "reports/p793-action-bridge-admission-report.md",
    "reports/p794-command-center-live-readiness-ux-report.md",
    "reports/p795-tests-checkers-docs-report.md",
  ];

  addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])), requiredScripts.join(", "));
  addCheck("prior reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
  addCheck("P79 subphases complete in phase status", P79_SUBPHASES.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
  addCheck("P79 subphases complete in roadmap", P79_SUBPHASES.every((phaseId) => roadmapById.get(phaseId)?.status === "complete"));
  addCheck("P79 next phase is handoff", phaseById.get("P79")?.nextPhase === "P79.7" && roadmapById.get("P79")?.nextPhase === "P79.7");
  addCheck("root phase status advanced", status.currentPhase === "P79.6" && status.previousPhase === "P79.5" && status.nextPhase === "P79.7");
  addCheck("contracts document final validation", contract.includes("check:p796-final-validation") && contract.includes("scripts/check-p796-final-validation.js"));
  addCheck("docs document final validation", docs.includes("P79.6 Final Validation") && docs.includes("npm run check:p796-final-validation"));
  addCheck("Playwright live route test remains present", tests.includes("Live Readiness route renders gated live posture without runnable actions"));
  addCheck("live capability list remains complete", LIVE_EXECUTION_CAPABILITIES.includes("providerSpend") && LIVE_EXECUTION_CAPABILITIES.includes("founderIntakeRuntime"));
  addCheck("live gate recognizes live but keeps dangerous flags blocked", liveGate.ok === true && dangerousFlags.every((field) => liveGate.data?.[field] === false));
  addCheck("non-live mode remains blocked by live gate", blockedGate.ok === false);
  addCheck("live command admission is valid dry-run only", admission.ok === true && validation.valid && admission.data?.executionEnabled === false && admission.data?.dryRunOnly === true);
  addCheck("live command admission redacts secret inputs", !JSON.stringify(admission.data?.intent).includes("secret-token"));
  addCheck("live action bridge remains blocked", bridge.ok === false && bridge.data?.bridgeExecutionAllowed === false && bridge.data?.projectMutationAllowed === false);
  addCheck("Command Center live readiness is display-only", liveReadiness.safety?.executionEnabled === false && liveReadiness.safety?.projectMutationAllowed === false && liveReadiness.safety?.providerSpendAllowed === false);
  addCheck("Command Center live readiness has operator fields", JSON.stringify(liveReadiness).includes("disabledReason") && JSON.stringify(liveReadiness).includes("costImpact"));
  addCheck("Command Center primary UX has no DemoApp/private IDs", hasNoPrimaryLeakage(liveReadiness));
  addCheck("P79.6 commit field is populated", Boolean(phaseById.get("P79.6")?.commit));
  addCheck("report path is distinct", REPORT_PATH.endsWith("p796-final-validation-report.md"));

  const failed = checks.filter((check) => check.status === "FAIL");

  writeMarkdownReport(
    join(ROOT, REPORT_PATH),
    [
      {
        title: "Scope",
        body: [
          "- Final validation for P79 live readiness gates.",
          "- Confirms Command Center live readiness remains display-only.",
          "- Confirms provider/tool/worker/project/DB/deploy/spend capabilities remain blocked.",
        ].join("\n"),
      },
      { title: "Checks", body: buildCheckTable(checks) },
      {
        title: "Validation Commands",
        body: [
          "- npm run check:p796-final-validation",
          "- npm run check:p795-tests-checkers-docs",
          "- npm run check:p794-command-center-live-readiness-ux",
          "- npm run check:p793-action-bridge-admission",
          "- npm run check:p792-live-command-intent",
          "- npm run check:p791-live-mode-gate",
          "- npm run check:p79-execution-plan",
          "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live Readiness route\"",
          "- cd dashboard && npm run test:unit",
          "- cd dashboard && npm run build",
          "- npm run check:phase-validation-coverage",
          "- npm run check:os-phase-status",
          "- npm run check:format-readability",
          "- git diff --check",
        ].join("\n"),
      },
      {
        title: "Known Limitations",
        body: [
          "- P79.6 validates live readiness only.",
          "- Runtime execution, provider calls, tool execution, worker execution, project mutation, DB writes, network calls, deploy/release/export/package behavior, auth/session/user/workspace mutation, and provider spend remain disabled.",
        ].join("\n"),
      },
      { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
    ],
    { title: "P79.6 Final Validation Report", phase: "P79.6" },
  );

  return { checks, failed, result: failed.length === 0 ? "PASS" : "FAIL" };
}

const result = checkP79FinalValidation();
printCheckReport("P79.6 Final Validation Check", result.checks, result.result);
if (result.failed.length > 0) process.exit(1);
