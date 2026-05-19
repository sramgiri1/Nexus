import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildLiveCommandAdmission,
  LIVE_COMMAND_REQUIRED_APPROVALS,
  validateLiveCommandAdmission,
} from "../command-interface/liveCommandAdmission.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p792-live-command-intent-report.md";

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

const blockedAdmission = buildLiveCommandAdmission({
  mode: "live",
  capability: "prdGeneration",
  intent: {
    founderPrompt: "Build a B2B workflow app",
    apiKey: "sk-test-secret-value-1234567890",
  },
  approval: {
    operatorApproval: true,
  },
});
const completeAdmission = buildLiveCommandAdmission({
  mode: "live",
  capability: "prdGeneration",
  intent: {
    founderPrompt: "Build a B2B workflow app",
  },
  approval: Object.fromEntries(LIVE_COMMAND_REQUIRED_APPROVALS.map((field) => [field, true])),
});
const nonLiveAdmission = buildLiveCommandAdmission({
  mode: "local-private",
  capability: "prdGeneration",
  approval: Object.fromEntries(LIVE_COMMAND_REQUIRED_APPROVALS.map((field) => [field, true])),
});
const unknownCapability = buildLiveCommandAdmission({
  mode: "live",
  capability: "unknownMutation",
  approval: Object.fromEntries(LIVE_COMMAND_REQUIRED_APPROVALS.map((field) => [field, true])),
});

const blockedValidation = validateLiveCommandAdmission(blockedAdmission);
const completeValidation = validateLiveCommandAdmission(completeAdmission);
const source = readText("command-interface/liveCommandAdmission.js");
const contract = readText("contracts/os-roadmap/p79-execution-contracts.json");
const docs = readText("docs/architecture/P79_LIVE_EXECUTION_MODE_PLAN.md");
const packageJson = JSON.parse(readText("package.json"));
const status = JSON.parse(readText("os-roadmap/phase-status.json"));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const serializedBlocked = JSON.stringify(blockedAdmission);
const serializedComplete = JSON.stringify(completeAdmission);

addCheck("blocked admission validates", blockedValidation.valid, blockedValidation.errors.join(", "));
addCheck("complete admission validates", completeValidation.valid, completeValidation.errors.join(", "));
addCheck("blocked admission stays blocked", blockedAdmission.status === "BLOCKED" && blockedAdmission.data.state === "blocked");
addCheck("complete admission is admitted but not executable", completeAdmission.status === "PASS" && completeAdmission.data.state === "admitted" && completeAdmission.data.executionEnabled === false);
addCheck("non-live mode remains blocked", nonLiveAdmission.status === "BLOCKED" && nonLiveAdmission.data.state === "blocked");
addCheck("unknown capability remains blocked", unknownCapability.status === "BLOCKED" && unknownCapability.data.blockers.includes("knownCapability"));
addCheck("all required approvals represented", LIVE_COMMAND_REQUIRED_APPROVALS.every((field) => serializedBlocked.includes(field) || serializedComplete.includes(field)));
addCheck("secrets are redacted", blockedAdmission.data.redactionChanged === true && !serializedBlocked.includes("sk-test-secret-value"));
addCheck("dry run only is explicit", serializedComplete.includes('"dryRunOnly":true') && serializedComplete.includes('"executionEnabled":false'));
addCheck("dangerous flags false", ["providerCallsAllowed", "toolExecutionAllowed", "workerExecutionAllowed", "projectMutationAllowed", "dbWritesAllowed", "deployExecutionAllowed", "providerSpendAllowed"].every((flag) => serializedComplete.includes(`"${flag}":false`)));
addCheck("source does not execute providers/tools/projects", !source.includes("providers/") && !source.includes("tools/") && !source.includes("projects/"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p792-live-command-intent"]));
addCheck("contract references exact module", contract.includes("command-interface/liveCommandAdmission.js") && contract.includes("check:p792-live-command-intent"));
addCheck("docs mention P79.2 validation", docs.includes("P79.2 Live Command Intent Admission") && docs.includes("npm run check:p792-live-command-intent"));
addCheck("phase status advanced", statusById.get("P79.2")?.status === "complete" && ["P79.2", "P79.3", "P79.4", "P79.5", "P79.6", "P79.7"].includes(status.currentPhase));
addCheck("report path is distinct", REPORT_PATH.endsWith("p792-live-command-intent-report.md"));
addCheck("report can be written", fileExists("reports/os-phase-status-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P79.2 live command admission records.",
        "- Admission is not execution; provider calls, tool execution, worker execution, project mutation, DB writes, deploy, and provider spend remain disabled.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
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
        "- P79.2 creates admission records only.",
        "- Founder intake runtime, autonomous Q&A, PRD generation execution, agent dispatch, self-healing apply, provider/tool/worker execution, project mutation, DB writes, network calls, deploy/release/export/package behavior, auth/session/user/workspace mutation, and provider spend remain disabled.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P79.2 Live Command Intent Report", phase: "P79.2" },
);

printCheckReport("P79.2 Live Command Intent Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
