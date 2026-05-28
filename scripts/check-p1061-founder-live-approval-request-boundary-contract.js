import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS,
  P106_APPROVAL_REQUEST_BOUNDARY_STATES,
  P106_APPROVAL_REQUEST_FORBIDDEN_ACTIONS,
  P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE,
  P106_FOUNDER_LIVE_APPROVAL_REQUEST_BOUNDARY_PHASE,
  buildFounderLiveApprovalRequestBoundarySchema,
  validateFounderLiveApprovalRequestBoundarySchema,
} from "../live-ready/founderLiveApprovalRequestBoundary.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1061-founder-live-approval-request-boundary-contract-report.md";

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
const contract = readJson("contracts/os-roadmap/p106-founder-live-approval-request-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P106_FOUNDER_LIVE_APPROVAL_REQUEST_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const phaseStatusChecker = readText("scripts/check-os-phase-status.js");
const moduleSource = readText("live-ready/founderLiveApprovalRequestBoundary.js");
const envelope = buildFounderLiveApprovalRequestBoundarySchema();
const validation = validateFounderLiveApprovalRequestBoundarySchema(envelope);
const data = envelope.data || {};
const p106Subphases = ["P106.1", "P106.2", "P106.3", "P106.4", "P106.5", "P106.6", "P106.7"];
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const p1061 = subphaseById.get("P106.1") || {};
const acceptedPhasePointers = [
  { currentPhase: "P106.1", previousPhase: "P105.7", nextPhase: "P106.2" },
  { currentPhase: "P106.2", previousPhase: "P106.1", nextPhase: "P106.3" },
  { currentPhase: "P106.3", previousPhase: "P106.2", nextPhase: "P106.4" },
  { currentPhase: "P106.4", previousPhase: "P106.3", nextPhase: "P106.5" },
];
const serialized = JSON.stringify({ data, contract, plan, platformRoadmap, readme });
const p1061Serialized = JSON.stringify({ data, p1061 });

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1061-founder-live-approval-request-boundary-contract"]));
addCheck("contract phase identity", contract.phaseId === "P106" && contract.title === "Founder Live Approval Request Boundary");
addCheck("contract is NEXUS OS scoped", contract.scopeClassification === "NEXUS_OS_CHANGE");
addCheck("subphase split exists", p106Subphases.every((phaseId) => subphaseById.has(phaseId)));
addCheck("P106.1 complete and later subphases valid", subphaseById.get("P106.1")?.status === "complete" && ["planned", "complete"].includes(subphaseById.get("P106.2")?.status) && ["planned", "complete"].includes(subphaseById.get("P106.3")?.status) && ["planned", "complete"].includes(subphaseById.get("P106.4")?.status) && p106Subphases.slice(4).every((phaseId) => subphaseById.get(phaseId)?.status === "planned"));
addCheck("safety rules block unsafe execution", ["No approval request submission.", "No approval capture.", "No approval persistence.", "No provider/model calls.", "No agent dispatch.", "No worker/tool execution.", "No project source mutation."].every((rule) => contract.safetyRules?.includes(rule)));
addCheck("reuse rules reference shared helpers and P105", ["shared/reportWriter.js", "shared/resultEnvelope.js", "shared/checkResultFormatter.js", "os-roadmap/updatePhaseStatus.js", "live-ready/founderLiveExecutionApprovalPlanning.js"].every((item) => contract.reuseRequired?.includes(item)));
addCheck("module reuses P105 approval planning", moduleSource.includes("from \"./founderLiveExecutionApprovalPlanning.js\""));
addCheck("expected exports present", ["P106_FOUNDER_LIVE_APPROVAL_REQUEST_BOUNDARY_PHASE", "P106_APPROVAL_REQUEST_BOUNDARY_STATES", "P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS", "P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE", "P106_APPROVAL_REQUEST_FORBIDDEN_ACTIONS", "buildFounderLiveApprovalRequestBoundarySchema", "validateFounderLiveApprovalRequestBoundarySchema"].every((name) => p1061.expectedExportsSchemasDataShapes?.exports?.includes(name)));
addCheck("phase constant", P106_FOUNDER_LIVE_APPROVAL_REQUEST_BOUNDARY_PHASE === "P106.1");
addCheck("state constant", P106_APPROVAL_REQUEST_BOUNDARY_STATES.REQUEST_BOUNDARY_READY_EXECUTION_BLOCKED.includes("execution_blocked"));
addCheck("required evidence useful", P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE.length >= 18 && P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE.includes("approvalReviewPacketSelected") && P106_APPROVAL_REQUEST_REQUIRED_EVIDENCE.includes("requestRevocationPathReviewed"));
addCheck("forbidden actions cover request and runtime", P106_APPROVAL_REQUEST_FORBIDDEN_ACTIONS.includes("approval request submission") && P106_APPROVAL_REQUEST_FORBIDDEN_ACTIONS.includes("approval request write that unlocks execution"));
addCheck("blocked flags cover request and runtime", ["approvalRequestSubmissionAllowed", "approvalRequestCaptureAllowed", "approvalRequestPersistenceAllowed", "approvalRequestCanUnlockExecution", "approvalRequestRuntimeAdmissionAllowed"].every((flag) => P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS.includes(flag)));
addCheck("schema validates", validation.valid, validation.errors.join("; "));
addCheck("schema shape", data.approvalRequestEnvelopeShape && data.approvalRequestDecisionShape && data.requiredEvidenceCount >= 18);
addCheck("approval request cannot unlock execution", data.approvalRequestCanUnlockExecution === false && data.approvalRequestEnvelopeShape?.executionUnlockAllowed === false && data.approvalRequestDecisionShape?.decisionCanUnlockExecution === false);
addCheck("all blocked flags false", P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS.every((flag) => data[flag] === false && data.approvalRequestEnvelopeShape?.[flag] === false && data.approvalRequestDecisionShape?.[flag] === false));
addCheck("contract records validation commands", ["npm run check:p1061-founder-live-approval-request-boundary-contract", "npm run check:p1057-founder-live-execution-approval-final", "npm run check:os-phase-status", "npm run check:phase-validation-coverage", "git diff --check"].every((command) => p1061.validationCommands?.includes(command)));
addCheck("P106.1 avoids forbidden file scope", !(p1061.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("plan records P106.1 complete", /P106\.1 Approval Request Contract \/ Schema Baseline[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P106.1", /P106 - Founder Live Approval Request Boundary/.test(platformRoadmap) && /P106\.1 is\s+complete/.test(platformRoadmap) && (/P106\.2 is\s+next/.test(platformRoadmap) || /P106\.2 is\s+complete/.test(platformRoadmap)));
addCheck("README records P106.1", /P106\.1 approval request boundary/.test(readme) && (/P106\.2 is next/.test(readme) || /P106\.2 approval request model/.test(readme)));
addCheck(
  "phase status advanced from P106.1",
  acceptedPhasePointers.some((pointer) =>
    status.currentPhase === pointer.currentPhase
      && status.previousPhase === pointer.previousPhase
      && status.nextPhase === pointer.nextPhase
  )
    && statusById.get("P106")?.status === "in_progress"
    && statusById.get("P106.1")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P106.2")?.status)
    && roadmapById.get("P106.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("phase status checker accepts P106 subphases", ["P106", ...p106Subphases].every((phaseId) => phaseStatusChecker.includes(`"${phaseId}"`)));
addCheck("primary data stays Command Center hidden", data.commandCenterVisible === false);
addCheck("docs and schema avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized));
addCheck("docs and schema avoid unsafe runnable action text", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serialized));
addCheck("P106.1 data avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(p1061Serialized));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P106.1 founder live approval request boundary contract and local schema.",
        "- Confirms approval requests cannot be submitted, captured, persisted, or used to unlock runtime execution.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, approval writes, runtime admission, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1061-founder-live-approval-request-boundary-contract",
        "- npm run check:p1057-founder-live-execution-approval-final",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P106.1 is contract/schema only. It does not submit approval requests, capture approvals, persist approval state, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P106.1 Founder Live Approval Request Boundary Contract Report", phase: "P106.1" },
);

printCheckReport("P106.1 Founder Live Approval Request Boundary Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
