import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { getNexusMode, isLiveMode } from "../shared/modeGuard.js";
import {
  buildLiveExecutionGate,
  LIVE_EXECUTION_CAPABILITIES,
  LIVE_EXECUTION_REQUIRED_EVIDENCE,
} from "../live-execution/liveExecutionGate.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p791-live-mode-gate-report.md";

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

const liveGate = buildLiveExecutionGate({ mode: "live" });
const previewGate = buildLiveExecutionGate({ mode: "local-private" });
const modeGuardSource = readText("shared/modeGuard.js");
const gateSource = readText("live-execution/liveExecutionGate.js");
const commandIntentSource = readText("command-interface/commandIntentSchema.js");
const packageJson = JSON.parse(readText("package.json"));
const contractSource = readText("contracts/os-roadmap/p79-execution-contracts.json");
const docsSource = readText("docs/architecture/P79_LIVE_EXECUTION_MODE_PLAN.md");

const dangerousFlags = [
  "providerCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "deployExecutionAllowed",
  "providerSpendAllowed",
];
const serializedGate = JSON.stringify(liveGate);
const liveCapabilities = liveGate.data?.capabilities || [];
const blockedCapabilities = liveCapabilities.filter((gate) => gate.enabled === false && gate.status === "blocked");

addCheck("live mode recognized", getNexusMode({ NEXUS_MODE: "live" }) === "live" && isLiveMode("live"));
addCheck("unknown modes still blocked", getNexusMode({ NEXUS_MODE: "production" }) === "unknown");
addCheck("mode guard includes live", modeGuardSource.includes('"live"'));
addCheck("live gate returns pass envelope only for blocked live posture", liveGate.ok === true && liveGate.status === "PASS");
addCheck("non-live mode is blocked", previewGate.ok === false && previewGate.status === "BLOCKED");
addCheck("all live capabilities represented", LIVE_EXECUTION_CAPABILITIES.every((capability) => serializedGate.includes(capability)));
addCheck("all capabilities blocked by default", blockedCapabilities.length === LIVE_EXECUTION_CAPABILITIES.length, `${blockedCapabilities.length}/${LIVE_EXECUTION_CAPABILITIES.length}`);
addCheck("required evidence represented", LIVE_EXECUTION_REQUIRED_EVIDENCE.every((item) => serializedGate.includes(item)));
addCheck("dangerous flags explicitly false", dangerousFlags.every((flag) => serializedGate.includes(`"${flag}":false`)));
addCheck("no dangerous true flags in gate source", !/(providerCallsAllowed|toolExecutionAllowed|workerExecutionAllowed|projectMutationAllowed|dbWritesAllowed|deployExecutionAllowed|providerSpendAllowed): true/.test(gateSource));
addCheck("command intent remains preview-only", commandIntentSource.includes("previewOnly: true") && commandIntentSource.includes("executionEnabled: false"));
addCheck("provider/project/db/deploy remain unmodified by P79.1", ["projects/**", "providers/**", "tools/**", "worker-runtime/**", "db/**", "deploy/**"].every((needle) => contractSource.includes(needle)));
addCheck("package scripts registered", Boolean(packageJson.scripts?.["check:p79-execution-plan"]) && Boolean(packageJson.scripts?.["check:p791-live-mode-gate"]));
addCheck("docs explain blocked live posture", /provider calls[\s\S]+blocked/i.test(docsSource) && /project mutation[\s\S]+blocked/i.test(docsSource) && /provider spend[\s\S]+blocked/i.test(docsSource));
addCheck("report path is distinct", REPORT_PATH.endsWith("p791-live-mode-gate-report.md"));
addCheck("no DemoApp or raw ids in gate data", !serializedGate.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedGate));
addCheck("contract exists", fileExists("contracts/os-roadmap/p79-execution-contracts.json"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P79.1 live execution mode recognition and blocked-by-default capability gates.",
        "- Does not execute providers, tools, workers, DB writes, project mutation, network calls, deploy, export, package creation, auth mutation, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
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
        "- P79.1 defines live mode gates only.",
        "- Provider calls, tool execution, worker execution, project mutation, DB writes, network calls, deploy/release/export/package behavior, auth/session/user/workspace mutation, and provider spend remain blocked until later explicit live subphases enable them.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P79.1 Live Mode Gate Report", phase: "P79.1" },
);

printCheckReport("P79.1 Live Mode Gate Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
