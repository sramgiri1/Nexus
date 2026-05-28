import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P105_EXECUTION_APPROVAL_BLOCKED_FLAGS,
  P105_EXECUTION_APPROVAL_FORBIDDEN_ACTIONS,
  P105_EXECUTION_APPROVAL_REQUIRED_GATES,
  P105_EXECUTION_APPROVAL_STATES,
  P105_FOUNDER_LIVE_EXECUTION_APPROVAL_PHASE,
  buildFounderLiveExecutionApprovalPlanningSchema,
  validateFounderLiveExecutionApprovalPlanningSchema,
} from "../live-ready/founderLiveExecutionApprovalPlanning.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1051-founder-live-execution-approval-planning-contract-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p105-founder-live-execution-approval-planning-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P105_FOUNDER_LIVE_EXECUTION_APPROVAL_PLANNING_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const phaseStatusChecker = readText("scripts/check-os-phase-status.js");
const moduleSource = readText("live-ready/founderLiveExecutionApprovalPlanning.js");
const envelope = buildFounderLiveExecutionApprovalPlanningSchema();
const validation = validateFounderLiveExecutionApprovalPlanningSchema(envelope);
const data = envelope.data || {};
const p105Subphases = ["P105.1", "P105.2", "P105.3", "P105.4", "P105.5", "P105.6", "P105.7"];
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const p1051 = subphaseById.get("P105.1") || {};
const p105Docs = [contract, plan].map((item) => JSON.stringify(item)).join("\n");
const serialized = JSON.stringify({ data, contract, plan, platformRoadmap, readme });

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1051-founder-live-execution-approval-planning-contract"]));
addCheck("contract phase identity", contract.phaseId === "P105" && contract.title === "Founder Live Execution Approval Planning");
addCheck("contract is NEXUS OS scoped", contract.scopeClassification === "NEXUS_OS_CHANGE");
addCheck("subphase split exists", p105Subphases.every((phaseId) => subphaseById.has(phaseId)));
addCheck("P105.1 complete and later subphases planned or complete", subphaseById.get("P105.1")?.status === "complete" && p105Subphases.slice(1).every((phaseId) => ["planned", "complete"].includes(subphaseById.get(phaseId)?.status)));
addCheck("safety rules block unsafe execution", ["No provider/model calls.", "No agent dispatch.", "No worker/tool execution.", "No project source mutation.", "No approval writes that unlock execution."].every((rule) => contract.safetyRules?.includes(rule)));
addCheck("reuse rules reference shared helpers", ["shared/reportWriter.js", "shared/reportMetadata.js", "shared/resultEnvelope.js", "shared/redaction.js", "shared/checkResultFormatter.js", "os-roadmap/updatePhaseStatus.js"].every((item) => contract.reuseRequired?.includes(item)));
addCheck("reuse rules reference P104 schema", contract.reuseRequired?.includes("live-ready/founderLiveExecutionBoundarySchema.js") && moduleSource.includes("from \"./founderLiveExecutionBoundarySchema.js\""));
addCheck("expected exports present", ["P105_FOUNDER_LIVE_EXECUTION_APPROVAL_PHASE", "P105_EXECUTION_APPROVAL_STATES", "P105_EXECUTION_APPROVAL_BLOCKED_FLAGS", "P105_EXECUTION_APPROVAL_REQUIRED_GATES", "P105_EXECUTION_APPROVAL_FORBIDDEN_ACTIONS", "buildFounderLiveExecutionApprovalPlanningSchema", "validateFounderLiveExecutionApprovalPlanningSchema"].every((name) => p1051.expectedExportsSchemasDataShapes?.exports?.includes(name)));
addCheck("phase constant", P105_FOUNDER_LIVE_EXECUTION_APPROVAL_PHASE === "P105.1");
addCheck("state constant", P105_EXECUTION_APPROVAL_STATES.APPROVAL_PLANNING_READY_EXECUTION_BLOCKED.includes("execution_blocked"));
addCheck("required gates useful", P105_EXECUTION_APPROVAL_REQUIRED_GATES.length >= 12 && P105_EXECUTION_APPROVAL_REQUIRED_GATES.includes("executionBoundaryReviewed") && P105_EXECUTION_APPROVAL_REQUIRED_GATES.includes("costCeilingReviewed"));
addCheck("forbidden actions cover approval and runtime", P105_EXECUTION_APPROVAL_FORBIDDEN_ACTIONS.includes("approval writes that unlock execution") && P105_EXECUTION_APPROVAL_FORBIDDEN_ACTIONS.includes("runtime admission escalation"));
addCheck("blocked flags cover approval and runtime", ["approvalCanUnlockExecution", "approvalWriteAllowed", "runtimeAdmissionAllowed", "runtimeTransitionAllowed", "approvalSpendAllowed"].every((flag) => P105_EXECUTION_APPROVAL_BLOCKED_FLAGS.includes(flag)));
addCheck("schema validates", validation.valid, validation.errors.join("; "));
addCheck("schema shape", data.approvalPlanShape && data.approvalGateShape && data.runtimeTransitionShape && data.approvalGateCount >= 12);
addCheck("approval cannot unlock execution", data.approvalCanUnlockExecution === false && data.approvalGateShape?.executionUnlockAllowed === false && data.runtimeTransitionShape?.transitionAllowed === false);
addCheck("all blocked flags false", P105_EXECUTION_APPROVAL_BLOCKED_FLAGS.every((flag) => data[flag] === false && data.approvalPlanShape?.[flag] === false && data.approvalGateShape?.[flag] === false && data.runtimeTransitionShape?.[flag] === false));
addCheck("contract records validation commands", ["npm run check:p1051-founder-live-execution-approval-planning-contract", "npm run check:os-phase-status", "npm run check:phase-validation-coverage", "git diff --check"].every((command) => p1051.validationCommands?.includes(command)));
addCheck("P105.1 avoids forbidden file scope", !(p1051.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("plan records P105.1 complete", /P105\.1 Approval Planning Contract \/ Schema Baseline[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P105.1", /P105 - Founder Live Execution Approval Planning/.test(platformRoadmap) && /P105\.1 is\s+complete/.test(platformRoadmap) && /P105\.2 is\s+next/.test(platformRoadmap));
addCheck("README records P105.1", /P105\.1 approval planning/.test(readme) && /P105\.2 is next/.test(readme));
addCheck(
  "phase status advanced to P105.1",
  ["P105.1", "P105.2", "P105.3", "P105.4", "P105.5", "P105.6"].includes(status.currentPhase)
    && ["P104.7", "P105.1", "P105.2", "P105.3", "P105.4", "P105.5"].includes(status.previousPhase)
    && ["P105.2", "P105.3", "P105.4", "P105.5", "P105.6", "P105.7"].includes(status.nextPhase)
    && statusById.get("P105")?.status === "in_progress"
    && statusById.get("P105.1")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P105.2")?.status)
    && roadmapById.get("P105.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("phase status checker accepts P105 subphases", p105Subphases.every((phaseId) => phaseStatusChecker.includes(`"${phaseId}"`)));
addCheck("primary data stays Command Center hidden", data.commandCenterVisible === false);
addCheck("docs and schema avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized));
addCheck("docs and schema avoid unsafe runnable action text", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serialized));
addCheck("P105 docs and schema avoid raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(JSON.stringify(data) + p105Docs));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P105.1 founder live execution approval-planning contract and local schema.",
        "- Confirms approval planning cannot unlock execution and all unsafe runtime flags remain false.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, approval writes, runtime admission, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1051-founder-live-execution-approval-planning-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P105.1 is contract/schema only. It does not capture approvals, persist approval writes, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P105.1 Founder Live Execution Approval Planning Contract Report", phase: "P105.1" },
);

printCheckReport("P105.1 Founder Live Execution Approval Planning Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
