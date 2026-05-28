import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P107_APPROVAL_CAPTURE_BLOCKED_FLAGS,
  P107_APPROVAL_CAPTURE_BOUNDARY_STATES,
  P107_APPROVAL_CAPTURE_FORBIDDEN_ACTIONS,
  P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE,
  P107_FOUNDER_LIVE_APPROVAL_CAPTURE_BOUNDARY_PHASE,
  buildFounderLiveApprovalCaptureBoundarySchema,
  validateFounderLiveApprovalCaptureBoundarySchema,
} from "../live-ready/founderLiveApprovalCaptureBoundary.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1071-founder-live-approval-capture-boundary-contract-report.md";

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
const contract = readJson("contracts/os-roadmap/p107-founder-live-approval-capture-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P107_FOUNDER_LIVE_APPROVAL_CAPTURE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const phaseStatusChecker = readText("scripts/check-os-phase-status.js");
const p1067Checker = readText("scripts/check-p1067-founder-live-approval-request-final.js");
const source = readText("live-ready/founderLiveApprovalCaptureBoundary.js");
const envelope = buildFounderLiveApprovalCaptureBoundarySchema({ founderIdea: "Build a simple iOS Snake game for the App Store" });
const validation = validateFounderLiveApprovalCaptureBoundarySchema(envelope);
const data = envelope.data || {};
const p1071 = subphaseById.get("P107.1") || {};
const p107Subphases = ["P107.1", "P107.2", "P107.3", "P107.4", "P107.5", "P107.6", "P107.7"];
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serialized = JSON.stringify({ data, contract, plan, platformRoadmap, readme });
const serializedData = JSON.stringify(data);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1071-founder-live-approval-capture-boundary-contract"]));
addCheck("contract phase identity", contract.phaseId === "P107" && contract.title === "Founder Live Approval Capture Boundary");
addCheck("contract is NEXUS OS scoped", contract.scopeClassification === "NEXUS_OS_CHANGE");
addCheck("subphase split exists", p107Subphases.every((phaseId) => subphaseById.has(phaseId)));
addCheck("P107.1 complete and later subphases valid", subphaseById.get("P107.1")?.status === "complete" && p107Subphases.slice(1).every((phaseId) => ["planned", "complete"].includes(subphaseById.get(phaseId)?.status)));
addCheck("subphases include implementation-grade fields", p107Subphases.every((phaseId) => {
  const subphase = subphaseById.get(phaseId) || {};
  return subphase.narrowGoal && subphase.allowedFiles && subphase.forbiddenFiles && subphase.validationCommands && subphase.finalSafetyChecks && subphase.finalResponseChecklist;
}));
addCheck("safety rules block capture and unsafe execution", [
  "No approval capture.",
  "No approval capture persistence.",
  "No approval capture writes that unlock execution.",
  "No runtime admission or live mode transition.",
  "No provider/model calls.",
  "No agent dispatch.",
  "No worker/tool execution.",
  "No project source mutation.",
].every((rule) => contract.safetyRules?.includes(rule)));
addCheck("reuse rules reference shared helpers and P106 queue preview", ["shared/reportWriter.js", "shared/resultEnvelope.js", "shared/checkResultFormatter.js", "live-ready/founderLiveApprovalRequestQueuePreview.js"].every((item) => contract.reuseRequired?.includes(item)));
addCheck("module reuses P106 queue preview", source.includes("buildFounderLiveApprovalRequestQueuePreview"));
addCheck("expected exports present", ["P107_FOUNDER_LIVE_APPROVAL_CAPTURE_BOUNDARY_PHASE", "P107_APPROVAL_CAPTURE_BOUNDARY_STATES", "P107_APPROVAL_CAPTURE_BLOCKED_FLAGS", "P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE", "P107_APPROVAL_CAPTURE_FORBIDDEN_ACTIONS", "buildFounderLiveApprovalCaptureBoundarySchema", "validateFounderLiveApprovalCaptureBoundarySchema"].every((name) => p1071.expectedExportsSchemasDataShapes?.exports?.includes(name)));
addCheck("phase constant", P107_FOUNDER_LIVE_APPROVAL_CAPTURE_BOUNDARY_PHASE === "P107.1");
addCheck("state constant", P107_APPROVAL_CAPTURE_BOUNDARY_STATES.CAPTURE_BOUNDARY_READY_EXECUTION_BLOCKED.includes("execution_blocked"));
addCheck("required evidence useful", P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE.length >= 24 && P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE.includes("approvalRequestQueueSelected") && P107_APPROVAL_CAPTURE_REQUIRED_EVIDENCE.includes("executionUnlockSeparationReviewed"));
addCheck("forbidden actions cover capture and runtime", P107_APPROVAL_CAPTURE_FORBIDDEN_ACTIONS.includes("approval decision capture") && P107_APPROVAL_CAPTURE_FORBIDDEN_ACTIONS.includes("approval capture write that unlocks execution"));
addCheck("blocked flags cover capture and runtime", ["approvalDecisionCaptureAllowed", "approvalDecisionPersistenceAllowed", "approvalCaptureWriteAllowed", "approvalCaptureCanUnlockExecution", "approvalCaptureRuntimeAdmissionAllowed"].every((flag) => P107_APPROVAL_CAPTURE_BLOCKED_FLAGS.includes(flag)));
addCheck("schema validates", validation.valid, validation.errors.join("; "));
addCheck("schema shape", data.schemaVersion === "1.0" && data.approvalCaptureBoundaryShape && data.approvalCaptureDecisionShape && data.approvalCaptureReadiness);
addCheck("approval capture cannot unlock execution", data.approvalCaptureCanUnlockExecution === false && data.approvalCaptureBoundaryShape?.approvalCaptureCanUnlockExecution === false && data.approvalCaptureDecisionShape?.approvalCaptureCanUnlockExecution === false);
addCheck("capture readiness blocks unsafe counts", data.approvalCaptureReadiness?.capturedDecisionCount === 0 && data.approvalCaptureReadiness?.persistedDecisionCount === 0 && data.approvalCaptureReadiness?.executableDecisionCount === 0 && data.approvalCaptureReadiness?.runtimeAdmissionDecisionCount === 0 && data.approvalCaptureReadiness?.providerSpendDecisionCount === 0);
addCheck("all blocked flags false", P107_APPROVAL_CAPTURE_BLOCKED_FLAGS.every((flag) => data[flag] === false && data.approvalCaptureBoundaryShape?.[flag] === false && data.approvalCaptureDecisionShape?.[flag] === false));
addCheck("contract records validation commands", ["npm run check:p1071-founder-live-approval-capture-boundary-contract", "npm run check:p1067-founder-live-approval-request-final", "npm run check:os-phase-status", "npm run check:phase-validation-coverage", "git diff --check"].every((command) => p1071.validationCommands?.includes(command)));
addCheck("P107.1 avoids forbidden file scope", !(p1071.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("plan records P107.1 complete", /P107\.1 Approval Capture Contract \/ Schema Baseline[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P107.1", /P107 - Founder Live Approval Capture Boundary/.test(platformRoadmap) && /P107\.1 is\s+complete/.test(platformRoadmap) && (/P107\.2 is\s+next/.test(platformRoadmap) || /P107\.2 is\s+complete/.test(platformRoadmap)));
addCheck("README records P107.1", /P107\.1 approval capture boundary/.test(readme) && /P107\.2 is next/.test(readme));
addCheck(
  "phase status advanced to P107.1",
  ((
    status.currentPhase === "P107.1"
      && status.previousPhase === "P106.7"
      && status.nextPhase === "P107.2"
  ) || (
    status.currentPhase === "P107.2"
      && status.previousPhase === "P107.1"
      && status.nextPhase === "P107.3"
  ))
    && statusById.get("P107")?.status === "in_progress"
    && statusById.get("P107.1")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P107.2")?.status)
    && roadmapById.get("P107")?.status === "in_progress"
    && roadmapById.get("P107.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("phase status checker accepts P107 subphases", ["P107", ...p107Subphases].every((phaseId) => phaseStatusChecker.includes(`"${phaseId}"`)));
addCheck("P106.7 checker accepts P107.1 handoff", p1067Checker.includes("P107.1") && p1067Checker.includes("P107.2"));
addCheck("capture boundary stays Command Center hidden", data.commandCenterVisible === false);
addCheck("schema avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized));
addCheck("schema avoids raw packet IDs", !/(reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestId|approvalCaptureId)/.test(serializedData));
addCheck("schema avoids unsafe runnable action text", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serialized));
addCheck("schema avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedData));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P107.1 founder live approval capture boundary contract and local schema.",
        "- Confirms approval decisions cannot be captured, persisted, written to unlock execution, or used for runtime admission.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, approval capture writes, runtime admission, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1071-founder-live-approval-capture-boundary-contract",
        "- npm run check:p1067-founder-live-approval-request-final",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P107.1 is contract/schema only. It does not capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P107.1 Founder Live Approval Capture Boundary Contract Report", phase: "P107.1" },
);

printCheckReport("P107.1 Founder Live Approval Capture Boundary Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
