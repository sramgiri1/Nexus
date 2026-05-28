import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P108_OPERATOR_REVIEW_BLOCKED_FLAGS,
  P108_OPERATOR_REVIEW_FORBIDDEN_ACTIONS,
  P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE,
} from "../live-ready/founderLiveApprovalOperatorReviewBoundary.js";
import {
  P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_MODEL_PHASE,
  P108_OPERATOR_REVIEW_MODEL_STATES,
  buildFounderLiveApprovalOperatorReviewModel,
  validateFounderLiveApprovalOperatorReviewModel,
} from "../live-ready/founderLiveApprovalOperatorReviewModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1082-founder-live-approval-operator-review-model-report.md";

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
const p1081Checker = readText("scripts/check-p1081-founder-live-approval-operator-review-contract.js");
const source = readText("live-ready/founderLiveApprovalOperatorReviewModel.js");
const envelope = buildFounderLiveApprovalOperatorReviewModel({ founderIdea: "Build a simple iOS Snake game for the App Store" });
const validation = validateFounderLiveApprovalOperatorReviewModel(envelope);
const data = envelope.data || {};
const p1082 = subphaseById.get("P108.2") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serialized = JSON.stringify({ data, contract, plan, platformRoadmap, readme });
const serializedData = JSON.stringify(data);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1082-founder-live-approval-operator-review-model"]));
addCheck("contract marks P108.2 complete", contract.status === "in_progress" && p1082.status === "complete" && subphaseById.get("P108.1")?.status === "complete" && ["planned", "complete"].includes(subphaseById.get("P108.3")?.status));
addCheck("P108.2 is NEXUS OS scoped", p1082.scopeClassification === "NEXUS_OS_CHANGE");
addCheck("P108.2 records exact implementation files", (p1082.allowedFiles || []).includes("live-ready/founderLiveApprovalOperatorReviewModel.js") && (p1082.allowedFiles || []).includes("scripts/check-p1082-founder-live-approval-operator-review-model.js"));
addCheck("P108.2 avoids forbidden file scope", !(p1082.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("P108.2 expected exports present", ["P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_MODEL_PHASE", "P108_OPERATOR_REVIEW_MODEL_STATES", "buildFounderLiveApprovalOperatorReviewModel", "validateFounderLiveApprovalOperatorReviewModel"].every((name) => p1082.expectedExportsSchemasDataShapes?.exports?.includes(name)));
addCheck("module reuses P108.1 boundary and P107 audit preview", source.includes("buildFounderLiveApprovalOperatorReviewBoundary") && source.includes("buildFounderLiveApprovalCaptureAuditPreview"));
addCheck("phase constant", P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_MODEL_PHASE === "P108.2");
addCheck("state constant", P108_OPERATOR_REVIEW_MODEL_STATES.OPERATOR_REVIEW_RECORDS_READY_CAPTURE_BLOCKED.includes("capture_blocked"));
addCheck("schema validates", validation.valid, validation.errors.join("; "));
addCheck("schema shape", data.schemaVersion === "1.0" && data.operatorReviewModelSummary && Array.isArray(data.operatorReviewRecords) && data.sourceOperatorReviewBoundaryPhase === "P108.1");
addCheck("operator review records useful", data.operatorReviewRecords?.length === 6 && data.operatorReviewRecords.every((record) => record.recordRef && record.displayLabel && record.requiredEvidence?.length >= 32 && record.disabledReason));
addCheck("model readiness blocks unsafe counts", data.operatorReviewModelSummary?.operatorReviewRecordCount === 6 && data.operatorReviewModelSummary?.capturedOperatorDecisionCount === 0 && data.operatorReviewModelSummary?.persistedOperatorDecisionCount === 0 && data.operatorReviewModelSummary?.executableOperatorReviewCount === 0 && data.operatorReviewModelSummary?.runtimeAdmissionOperatorReviewCount === 0);
addCheck("required evidence retained", P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE.length >= 32 && data.requiredEvidence?.includes("operatorReviewScopeConfirmed") && data.operatorReviewRecords?.every((record) => record.missingEvidence?.includes("runtimeAdmissionStillBlocked")));
addCheck("forbidden actions retained", P108_OPERATOR_REVIEW_FORBIDDEN_ACTIONS.includes("operator review decision capture") && data.forbiddenActions?.includes("operator review write that unlocks execution"));
addCheck("all blocked flags false", P108_OPERATOR_REVIEW_BLOCKED_FLAGS.every((flag) => data[flag] === false && data.operatorReviewRecords?.every((record) => record[flag] === false)));
addCheck("operator review cannot unlock execution", data.operatorReviewCanUnlockExecution === false && data.operatorReviewModelSummary?.operatorReviewUnlockCount === 0 && data.operatorReviewRecords?.every((record) => record.operatorReviewCanUnlockExecution === false));
addCheck("contract records validation commands", ["npm run check:p1082-founder-live-approval-operator-review-model", "npm run check:p1081-founder-live-approval-operator-review-contract", "npm run check:os-phase-status", "npm run check:phase-validation-coverage", "git diff --check"].every((command) => p1082.validationCommands?.includes(command)));
addCheck("plan records P108.2 complete", /P108\.2 Operator Review Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P108.2", /P108\.2 is\s+complete/.test(platformRoadmap) && (/P108\.3\s+is\s+next/.test(platformRoadmap) || /P108\.3 is\s+complete/.test(platformRoadmap)));
addCheck("README records P108.2", /P108\.2 local operator-review model/.test(readme) && (/P108\.3 is next/.test(readme) || /P108\.3 operator-review audit preview/.test(readme)));
addCheck(
  "phase status advanced to P108.2",
  ((status.currentPhase === "P108.2"
    && status.previousPhase === "P108.1"
    && status.nextPhase === "P108.3")
    || (status.currentPhase === "P108.3"
      && status.previousPhase === "P108.2"
      && status.nextPhase === "P108.4")
    || (status.currentPhase === "P108.4"
      && status.previousPhase === "P108.3"
      && status.nextPhase === "P108.5"))
    && statusById.get("P108")?.status === "in_progress"
    && statusById.get("P108.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P108.3")?.status)
    && roadmapById.get("P108")?.status === "in_progress"
    && roadmapById.get("P108.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}/${statusById.get("P108")?.status}`,
);
addCheck("P108.1 checker accepts P108.2 handoff", p1081Checker.includes("P108.2") && p1081Checker.includes("P108.3"));
addCheck("operator review model stays Command Center hidden", data.commandCenterVisible === false);
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
        "- Validates P108.2 deterministic local founder live approval operator-review records.",
        "- Confirms operator-review records cannot capture, persist, write, unlock execution, or admit runtime execution.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, approval capture writes, runtime admission, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1082-founder-live-approval-operator-review-model",
        "- npm run check:p1081-founder-live-approval-operator-review-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P108.2 is local model only. It does not capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P108.2 Founder Live Approval Operator Review Model Report", phase: "P108.2" },
);

printCheckReport("P108.2 Founder Live Approval Operator Review Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
