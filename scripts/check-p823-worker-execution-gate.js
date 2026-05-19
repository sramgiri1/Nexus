import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildWorkerExecutionGate, validateWorkerExecutionGate } from "../live-ready/workerExecutionGate.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p823-worker-execution-gate-report.md";

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

const envelope = buildWorkerExecutionGate({ mode: "live" });
const validation = validateWorkerExecutionGate(envelope);
const serialized = JSON.stringify(envelope);
const rows = envelope.data?.workstreamRows || [];
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const moduleSource = readText("live-ready/workerExecutionGate.js");
const docs = readText("docs/architecture/P82_LIVE_READY_ACTIVATION_PLAN.md");
const contract = readText("contracts/os-roadmap/p82-execution-contracts.json");

const dangerousFlags = [
  "agentDispatchAllowed",
  "providerCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "deployExecutionAllowed",
  "providerSpendAllowed",
];

addCheck("gate envelope passes", envelope.ok === true && envelope.status === "PASS");
addCheck("worker gate validation passes", validation.valid, validation.errors.join("; "));
addCheck("all business workstreams represented", rows.length === 8);
addCheck("primary UX fields are present", ["currentState", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"].every((field) => serialized.includes(field)));
addCheck("runtime summary reused", serialized.includes('"runtimeMode":"preview_only"') && serialized.includes('"executionEnabled":false'));
addCheck("dangerous flags explicitly false", dangerousFlags.every((flag) => serialized.includes(`"${flag}":false`)));
addCheck("no provider/tool/project imports", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/"));
addCheck("no fake runnable worker actions", !/run worker now|dispatch now|execute now|start worker now|lease now/i.test(serialized));
addCheck("no DemoApp or raw private IDs", !serialized.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p823-worker-execution-gate"]));
addCheck("contract references P82.3 files", contract.includes("live-ready/workerExecutionGate.js") && contract.includes("check:p823-worker-execution-gate"));
addCheck("docs mention P82.3 validation", docs.includes("P82.3 Worker Execution Gate") && docs.includes("npm run check:p823-worker-execution-gate"));
addCheck("phase status advanced", statusById.get("P82.3")?.status === "complete" && status.currentPhase === "P82.3" && status.nextPhase === "P82.4");
addCheck("report path is distinct", REPORT_PATH.endsWith("p823-worker-execution-gate-report.md"));
addCheck("report prerequisites exist", fileExists("reports/p822-provider-tool-gates-report.md") && fileExists("reports/os-phase-status-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P82.3 worker execution readiness gate.",
        "- Reuses existing worker runtime summary and P81 business build workstream records.",
        "- Does not start workers, lease work, dispatch agents, call providers/tools, mutate project files, write DB state, deploy, release, export, package, mutate auth/session/user/workspace state, or spend provider budget.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p823-worker-execution-gate",
        "- npm run check:p822-provider-tool-gates",
        "- npm run check:p82-execution-plan",
        "- npm run check:p817-final-validation",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P82.3 creates a local worker readiness gate only.",
        "- Worker execution, agent dispatch, provider calls, tool execution, project mutation, DB writes, deploy, and provider spend remain disabled.",
        "- Command Center label cleanup is planned for P82.6 after project/DB and deploy/release admission gates exist.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P82.3 Worker Execution Gate Report", phase: "P82.3" },
);

printCheckReport("P82.3 Worker Execution Gate Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
