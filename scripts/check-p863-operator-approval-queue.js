import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildGovernedLiveOperatorApprovalQueue,
  validateGovernedLiveOperatorApprovalQueue,
} from "../live-ready/governedLiveOperatorApprovalQueue.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p863-operator-approval-queue-report.md";

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

const queue = buildGovernedLiveOperatorApprovalQueue();
const validation = validateGovernedLiveOperatorApprovalQueue(queue);
const data = queue.data || {};
const serialized = JSON.stringify(queue);
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readText("contracts/os-roadmap/p86-execution-contracts.json");
const docs = readText("docs/architecture/P86_GOVERNED_LIVE_CAPABILITY_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const moduleSource = readText("live-ready/governedLiveOperatorApprovalQueue.js");

const blockedFlags = [
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
  "approvalCanExecute",
  "activationRequestAllowed",
  "executionAllowed",
];

addCheck("queue envelope passes", queue.ok === true && queue.status === "PASS");
addCheck("validation passes", validation.valid, validation.errors.join("; "));
addCheck("queue covers resolved capabilities", Array.isArray(data.queueItems) && data.queueItems.length >= 8);
addCheck("approvals cannot execute", data.queueItems?.every((item) => item.approvalCanExecute === false && item.activationRequestAllowed === false && item.executionAllowed === false));
addCheck("all runtime flags blocked", blockedFlags.every((flag) => data[flag] === false && data.queueItems?.every((item) => item[flag] === false)));
addCheck("approval evidence explicit", data.queueItems?.every((item) => Array.isArray(item.requiredEvidence) && item.requiredEvidence.includes("operatorApproval") && item.rollbackRequired === true && item.validationRequired === true));
addCheck("reuses P86.2 resolver", moduleSource.includes("buildGovernedLiveCapabilityStateResolver") && !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/"));
addCheck("no raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p863-operator-approval-queue"]));
addCheck("contract references P86.3 files", contract.includes("live-ready/governedLiveOperatorApprovalQueue.js") && contract.includes("check:p863-operator-approval-queue"));
addCheck("docs mention P86.3 validation", docs.includes("P86.3 Operator Approval Queue") && docs.includes("npm run check:p863-operator-approval-queue"));
addCheck("platform roadmap records P86.3", platformRoadmap.includes("P86.3 is complete") && platformRoadmap.includes("P86.4 is next"));
addCheck("phase status advanced", statusById.get("P86.3")?.status === "complete" && status.currentPhase === "P86.3" && status.nextPhase === "P86.4");
addCheck("roadmap tracks P86.3", roadmapById.get("P86.3")?.track === "NEXUS_OS" && roadmapById.get("P86.3")?.status === "complete");
addCheck("report prerequisites exist", fileExists("reports/p862-capability-state-resolver-report.md") && fileExists("reports/os-phase-status-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P86.3 local operator approval queue records.",
        "- Confirms approval records cannot execute runtime actions.",
        "- Reuses P86.2 capability state resolver instead of duplicating state logic.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Queue Summary",
      body: Object.entries(data.queueSummary || {}).map(([state, count]) => `- ${state}: ${count}`).join("\n") || "- None",
    },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p863-operator-approval-queue",
        "- npm run check:p862-capability-state-resolver",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P86.3 creates local approval queue records only. Runtime execution, provider/model calls, agent dispatch, project mutation, DB writes, deploy, package, and spend remain disabled.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P86.3 Operator Approval Queue Report", phase: "P86.3" },
);

printCheckReport("P86.3 Operator Approval Queue Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
