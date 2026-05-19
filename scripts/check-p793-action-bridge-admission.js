import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  ACTION_BRIDGE_CAPABILITY_MAP,
  admitLiveActionBridgeRequest,
} from "../live-execution/actionBridgeAdmissionController.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p793-action-bridge-admission-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const liveBlocked = admitLiveActionBridgeRequest({
  mode: "live",
  actionType: "mission.compose",
  body: { missionText: "Create founder PRD" },
  approval: { operatorApproval: true },
});
const liveApply = admitLiveActionBridgeRequest({
  mode: "live",
  actionType: "implementation.apply",
  body: { runtimeTaskId: "raw-task-id-123", implementationType: "patch" },
  approval: {},
});
const localPrivate = admitLiveActionBridgeRequest({
  mode: "local-private",
  actionType: "mission.compose",
  body: { missionText: "Create founder PRD" },
});

const controllerSource = readText("live-execution/actionBridgeAdmissionController.js");
const serverSource = readText("scripts/mission-action-server.js");
const contract = readText("contracts/os-roadmap/p79-execution-contracts.json");
const docs = readText("docs/architecture/P79_LIVE_EXECUTION_MODE_PLAN.md");
const packageJson = JSON.parse(readText("package.json"));
const status = JSON.parse(readText("os-roadmap/phase-status.json"));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const serializedLive = JSON.stringify([liveBlocked, liveApply]);

addCheck("live mission bridge is blocked", liveBlocked.status === "BLOCKED" && liveBlocked.data.bridgeExecutionAllowed === false);
addCheck("live implementation apply is blocked", liveApply.status === "BLOCKED" && liveApply.data.capability === "projectMutation" && liveApply.data.bridgeExecutionAllowed === false);
addCheck("local-private behavior can continue", localPrivate.status === "PASS" && localPrivate.data.bridgeExecutionAllowed === true);
addCheck("all action types mapped", ["mission.compose", "task.activate", "task.review", "implementation.propose", "implementation.apply"].every((type) => ACTION_BRIDGE_CAPABILITY_MAP[type]));
addCheck("dangerous flags false", ["providerCallsAllowed", "toolExecutionAllowed", "workerExecutionAllowed", "projectMutationAllowed", "dbWritesAllowed", "deployExecutionAllowed", "providerSpendAllowed"].every((flag) => serializedLive.includes(`"${flag}":false`)));
addCheck("live body sanitized", !serializedLive.includes("raw-task-id-123") && serializedLive.includes("selected-runtime-task"));
addCheck("controller has no provider/tool/project imports", !controllerSource.includes("../providers/") && !controllerSource.includes("../tools/") && !controllerSource.includes("../projects/"));
addCheck("server imports admission controller", serverSource.includes("admitLiveActionBridgeRequest"));
const missionRouteStart = serverSource.indexOf('url === "/actions/mission/compose"');
const missionBlock = serverSource.indexOf('maybeBlockLiveBridge(res, "mission.compose"', missionRouteStart);
const missionCreate = serverSource.indexOf("const reqObj = createMissionActionRequest", missionRouteStart);
const applyRouteStart = serverSource.indexOf('url === "/actions/implementation/apply"');
const applyBlock = serverSource.indexOf('maybeBlockLiveBridge(res, "implementation.apply"', applyRouteStart);
const applyCreate = serverSource.indexOf("const reqObj = createImplementationRequest", applyRouteStart);
addCheck("server blocks live before mission execution", missionRouteStart >= 0 && missionBlock > missionRouteStart && missionBlock < missionCreate);
addCheck("server blocks live before implementation execution", applyRouteStart >= 0 && applyBlock > applyRouteStart && applyBlock < applyCreate);
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p793-action-bridge-admission"]));
addCheck("contract references controller", contract.includes("live-execution/actionBridgeAdmissionController.js") && contract.includes("check:p793-action-bridge-admission"));
addCheck("docs mention P79.3 validation", docs.includes("P79.3 Local Action Bridge Admission Controller") && docs.includes("npm run check:p793-action-bridge-admission"));
addCheck("phase status advanced", statusById.get("P79.3")?.status === "complete" && ["P79.3", "P79.4", "P79.5", "P79.6", "P79.7"].includes(status.currentPhase));
addCheck("report path is distinct", REPORT_PATH.endsWith("p793-action-bridge-admission-report.md"));
addCheck("report prerequisites exist", fileExists("reports/os-phase-status-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P79.3 live action bridge admission control.",
        "- Live bridge requests are blocked before local bridge execution.",
        "- Does not execute providers, tools, workers, DB writes, project mutation, network calls, deploy, export, package creation, auth mutation, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p793-action-bridge-admission",
        "- npm run check:p792-live-command-intent",
        "- npm run check:p791-live-mode-gate",
        "- npm run check:p79-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P79.3 adds live admission control only.",
        "- Live bridge execution remains blocked even when admission evidence is complete.",
        "- Founder intake runtime, autonomous Q&A, PRD generation execution, agent dispatch, self-healing apply, provider/tool/worker execution, project mutation, DB writes, network calls, deploy/release/export/package behavior, auth/session/user/workspace mutation, and provider spend remain disabled.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P79.3 Action Bridge Admission Report", phase: "P79.3" },
);

printCheckReport("P79.3 Action Bridge Admission Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
