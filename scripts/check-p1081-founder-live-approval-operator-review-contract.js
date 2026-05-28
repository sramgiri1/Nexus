import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_BOUNDARY_PHASE,
  P108_OPERATOR_REVIEW_BLOCKED_FLAGS,
  P108_OPERATOR_REVIEW_BOUNDARY_STATES,
  P108_OPERATOR_REVIEW_FORBIDDEN_ACTIONS,
  P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE,
  buildFounderLiveApprovalOperatorReviewBoundary,
  validateFounderLiveApprovalOperatorReviewBoundary,
} from "../live-ready/founderLiveApprovalOperatorReviewBoundary.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1081-founder-live-approval-operator-review-contract-report.md";

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
const contract = readJson("contracts/os-roadmap/p108-founder-live-approval-capture-operator-review-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P108_FOUNDER_LIVE_APPROVAL_CAPTURE_OPERATOR_REVIEW_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const phaseStatusChecker = readText("scripts/check-os-phase-status.js");
const p1077Checker = readText("scripts/check-p1077-founder-live-approval-capture-final.js");
const source = readText("live-ready/founderLiveApprovalOperatorReviewBoundary.js");
const envelope = buildFounderLiveApprovalOperatorReviewBoundary({ founderIdea: "Build a simple iOS Snake game for the App Store" });
const validation = validateFounderLiveApprovalOperatorReviewBoundary(envelope);
const data = envelope.data || {};
const p1081 = subphaseById.get("P108.1") || {};
const p108Subphases = ["P108.1", "P108.2", "P108.3", "P108.4", "P108.5", "P108.6", "P108.7"];
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serialized = JSON.stringify({ data, contract, plan, platformRoadmap, readme });
const serializedData = JSON.stringify(data);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1081-founder-live-approval-operator-review-contract"]));
addCheck("contract phase identity", contract.phaseId === "P108" && contract.title === "Founder Live Approval Capture Operator Review");
addCheck("contract is NEXUS OS scoped", contract.scopeClassification === "NEXUS_OS_CHANGE");
addCheck("subphase split exists", p108Subphases.every((phaseId) => subphaseById.has(phaseId)));
addCheck("P108.1 complete and later subphases valid", subphaseById.get("P108.1")?.status === "complete" && p108Subphases.slice(1).every((phaseId) => ["planned", "complete"].includes(subphaseById.get(phaseId)?.status)));
addCheck("subphases include implementation-grade fields", p108Subphases.every((phaseId) => {
  const subphase = subphaseById.get(phaseId) || {};
  return subphase.narrowGoal && subphase.allowedFiles && subphase.forbiddenFiles && subphase.validationCommands && subphase.finalSafetyChecks && subphase.finalResponseChecklist;
}));
addCheck("safety rules block operator capture and unsafe execution", [
  "No approval capture.",
  "No approval capture persistence.",
  "No approval capture writes that unlock execution.",
  "No operator review decision capture.",
  "No operator review decision persistence.",
  "No runtime admission or live mode transition.",
  "No provider/model calls.",
  "No agent dispatch.",
  "No worker/tool execution.",
  "No project source mutation.",
].every((rule) => contract.safetyRules?.includes(rule)));
addCheck("reuse rules reference shared helpers and P107 audit preview", ["shared/reportWriter.js", "shared/resultEnvelope.js", "shared/checkResultFormatter.js", "live-ready/founderLiveApprovalCaptureAuditPreview.js"].every((item) => contract.reuseRequired?.includes(item)));
addCheck("module reuses P107 capture audit preview", source.includes("buildFounderLiveApprovalCaptureAuditPreview"));
addCheck("expected exports present", ["P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_BOUNDARY_PHASE", "P108_OPERATOR_REVIEW_BOUNDARY_STATES", "P108_OPERATOR_REVIEW_BLOCKED_FLAGS", "P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE", "P108_OPERATOR_REVIEW_FORBIDDEN_ACTIONS", "buildFounderLiveApprovalOperatorReviewBoundary", "validateFounderLiveApprovalOperatorReviewBoundary"].every((name) => p1081.expectedExportsSchemasDataShapes?.exports?.includes(name)));
addCheck("phase constant", P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_BOUNDARY_PHASE === "P108.1");
addCheck("state constant", P108_OPERATOR_REVIEW_BOUNDARY_STATES.OPERATOR_REVIEW_BOUNDARY_READY_CAPTURE_BLOCKED.includes("capture_blocked"));
addCheck("required evidence useful", P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE.length >= 32 && P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE.includes("operatorReviewScopeConfirmed") && P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE.includes("runtimeAdmissionStillBlocked"));
addCheck("forbidden actions cover operator capture and runtime", P108_OPERATOR_REVIEW_FORBIDDEN_ACTIONS.includes("operator review decision capture") && P108_OPERATOR_REVIEW_FORBIDDEN_ACTIONS.includes("operator review write that unlocks execution"));
addCheck("blocked flags cover operator review and runtime", ["operatorReviewDecisionCaptureAllowed", "operatorReviewDecisionPersistenceAllowed", "operatorReviewWriteAllowed", "operatorReviewCanUnlockExecution", "operatorReviewRuntimeAdmissionAllowed"].every((flag) => P108_OPERATOR_REVIEW_BLOCKED_FLAGS.includes(flag)));
addCheck("schema validates", validation.valid, validation.errors.join("; "));
addCheck("schema shape", data.schemaVersion === "1.0" && data.operatorReviewBoundaryShape && data.operatorReviewReadiness && data.sourceCaptureAuditPreviewPhase === "P107.3");
addCheck("operator review readiness blocks unsafe counts", data.operatorReviewReadiness?.operatorReviewRecordCount === 6 && data.operatorReviewReadiness?.capturedOperatorDecisionCount === 0 && data.operatorReviewReadiness?.persistedOperatorDecisionCount === 0 && data.operatorReviewReadiness?.executableOperatorReviewCount === 0 && data.operatorReviewReadiness?.runtimeAdmissionOperatorReviewCount === 0);
addCheck("operator review cannot unlock execution", data.operatorReviewCanUnlockExecution === false && data.operatorReviewBoundaryShape?.operatorReviewCanUnlockExecution === false && data.operatorReviewReadiness?.operatorReviewUnlockCount === 0);
addCheck("all blocked flags false", P108_OPERATOR_REVIEW_BLOCKED_FLAGS.every((flag) => data[flag] === false && data.operatorReviewBoundaryShape?.[flag] === false));
addCheck("contract records validation commands", ["npm run check:p1081-founder-live-approval-operator-review-contract", "npm run check:p1077-founder-live-approval-capture-final", "npm run check:os-phase-status", "npm run check:phase-validation-coverage", "git diff --check"].every((command) => p1081.validationCommands?.includes(command)));
addCheck("P108.1 avoids forbidden file scope", !(p1081.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("plan records P108.1 complete", /P108\.1 Operator Review Contract \/ Schema Baseline[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P108.1", /P108 - Founder Live Approval Capture Operator Review/.test(platformRoadmap) && /P108\.1 is\s+complete/.test(platformRoadmap) && (/P108\.2 is\s+next/.test(platformRoadmap) || /P108\.2 is\s+complete/.test(platformRoadmap)));
addCheck("README records P108.1", /P108\.1 operator review boundary/.test(readme) && (/P108\.2 is next/.test(readme) || /P108\.2 local operator-review model/.test(readme)));
addCheck(
  "phase status advanced to P108.1",
  ((status.currentPhase === "P108.1"
    && status.previousPhase === "P107.7"
    && status.nextPhase === "P108.2")
    || (status.currentPhase === "P108.2"
      && status.previousPhase === "P108.1"
      && status.nextPhase === "P108.3")
    || (status.currentPhase === "P108.3"
      && status.previousPhase === "P108.2"
      && status.nextPhase === "P108.4")
    || (status.currentPhase === "P108.4"
      && status.previousPhase === "P108.3"
      && status.nextPhase === "P108.5"))
    && statusById.get("P108")?.status === "in_progress"
    && statusById.get("P108.1")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P108.2")?.status)
    && roadmapById.get("P108")?.status === "in_progress"
    && roadmapById.get("P108.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}/${statusById.get("P108")?.status}`,
);
addCheck("phase status checker accepts P108 subphases", ["P108", ...p108Subphases].every((phaseId) => phaseStatusChecker.includes(`"${phaseId}"`)));
addCheck("P107.7 checker accepts P108.1 handoff", p1077Checker.includes("P108.1") && p1077Checker.includes("P108.2"));
addCheck("operator review boundary stays Command Center hidden", data.commandCenterVisible === false);
addCheck("schema avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized));
addCheck("schema avoids unsafe runnable action text", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serialized));
addCheck("schema avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedData));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P108.1 founder live approval operator-review boundary contract and local schema.",
        "- Confirms operator decisions cannot be captured, persisted, written to unlock execution, or used for runtime admission.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, approval capture writes, runtime admission, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1081-founder-live-approval-operator-review-contract",
        "- npm run check:p1077-founder-live-approval-capture-final",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P108.1 is contract/schema only. It does not capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P108.1 Founder Live Approval Operator Review Contract Report", phase: "P108.1" },
);

printCheckReport("P108.1 Founder Live Approval Operator Review Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
