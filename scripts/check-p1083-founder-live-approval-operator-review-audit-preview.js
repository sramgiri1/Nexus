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
  P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_AUDIT_PREVIEW_PHASE,
  P108_OPERATOR_REVIEW_AUDIT_PREVIEW_STATES,
  buildFounderLiveApprovalOperatorReviewAuditPreview,
  validateFounderLiveApprovalOperatorReviewAuditPreview,
} from "../live-ready/founderLiveApprovalOperatorReviewAuditPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1083-founder-live-approval-operator-review-audit-preview-report.md";

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
const p1082Checker = readText("scripts/check-p1082-founder-live-approval-operator-review-model.js");
const source = readText("live-ready/founderLiveApprovalOperatorReviewAuditPreview.js");
const envelope = buildFounderLiveApprovalOperatorReviewAuditPreview({ founderIdea: "Build a simple iOS Snake game for the App Store" });
const validation = validateFounderLiveApprovalOperatorReviewAuditPreview(envelope);
const data = envelope.data || {};
const p1083 = subphaseById.get("P108.3") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serialized = JSON.stringify({ data, contract, plan, platformRoadmap, readme });
const serializedData = JSON.stringify(data);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1083-founder-live-approval-operator-review-audit-preview"]));
addCheck("contract marks P108.3 complete", contract.status === "in_progress" && p1083.status === "complete" && subphaseById.get("P108.2")?.status === "complete" && subphaseById.get("P108.4")?.status === "planned");
addCheck("P108.3 is NEXUS OS scoped", p1083.scopeClassification === "NEXUS_OS_CHANGE");
addCheck("P108.3 records exact implementation files", (p1083.allowedFiles || []).includes("live-ready/founderLiveApprovalOperatorReviewAuditPreview.js") && (p1083.allowedFiles || []).includes("scripts/check-p1083-founder-live-approval-operator-review-audit-preview.js"));
addCheck("P108.3 avoids forbidden file scope", !(p1083.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("P108.3 expected exports present", ["P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_AUDIT_PREVIEW_PHASE", "P108_OPERATOR_REVIEW_AUDIT_PREVIEW_STATES", "buildFounderLiveApprovalOperatorReviewAuditPreview", "validateFounderLiveApprovalOperatorReviewAuditPreview"].every((name) => p1083.expectedExportsSchemasDataShapes?.exports?.includes(name)));
addCheck("module reuses P108.2 model", source.includes("buildFounderLiveApprovalOperatorReviewModel"));
addCheck("phase constant", P108_FOUNDER_LIVE_APPROVAL_OPERATOR_REVIEW_AUDIT_PREVIEW_PHASE === "P108.3");
addCheck("state constant", P108_OPERATOR_REVIEW_AUDIT_PREVIEW_STATES.OPERATOR_REVIEW_AUDIT_PREVIEW_READY_CAPTURE_BLOCKED.includes("capture_blocked"));
addCheck("schema validates", validation.valid, validation.errors.join("; "));
addCheck("schema shape", data.schemaVersion === "1.0" && data.operatorReviewAuditSummary && Array.isArray(data.auditRows) && Array.isArray(data.auditSections) && data.sourceOperatorReviewModelPhase === "P108.2");
addCheck("audit preview rows useful", data.auditRows?.length === 6 && data.auditRows.every((row) => row.auditPreviewRef && row.displayLabel && row.auditQuestions?.length >= 4 && row.disabledReason));
addCheck("audit sections useful", data.auditSections?.length === 1 && data.auditSections[0]?.auditPreviewCount === 6 && data.auditSections[0]?.blockedCount === 6);
addCheck("audit summary blocks unsafe counts", data.operatorReviewAuditSummary?.auditPreviewCount === 6 && data.operatorReviewAuditSummary?.capturableOperatorDecisionCount === 0 && data.operatorReviewAuditSummary?.persistedOperatorDecisionCount === 0 && data.operatorReviewAuditSummary?.executableOperatorReviewCount === 0);
addCheck("required evidence retained", P108_OPERATOR_REVIEW_REQUIRED_EVIDENCE.length >= 32 && data.requiredEvidence?.includes("operatorReviewScopeConfirmed") && data.auditRows?.every((row) => row.missingEvidence?.includes("runtimeAdmissionStillBlocked")));
addCheck("forbidden actions retained", P108_OPERATOR_REVIEW_FORBIDDEN_ACTIONS.includes("operator review decision capture") && data.forbiddenActions?.includes("operator review write that unlocks execution"));
addCheck("all blocked flags false", P108_OPERATOR_REVIEW_BLOCKED_FLAGS.every((flag) => data[flag] === false && data.auditRows?.every((row) => row[flag] === false)));
addCheck("operator review cannot unlock execution", data.operatorReviewCanUnlockExecution === false && data.auditRows?.every((row) => row.operatorReviewCanUnlockExecution === false));
addCheck("contract records validation commands", ["npm run check:p1083-founder-live-approval-operator-review-audit-preview", "npm run check:p1082-founder-live-approval-operator-review-model", "npm run check:p1081-founder-live-approval-operator-review-contract", "npm run check:os-phase-status", "npm run check:phase-validation-coverage", "git diff --check"].every((command) => p1083.validationCommands?.includes(command)));
addCheck("plan records P108.3 complete", /P108\.3 Operator Review Audit Preview[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P108.3", /P108\.3 is\s+complete/.test(platformRoadmap) && /P108\.4\s+is\s+next/.test(platformRoadmap));
addCheck("README records P108.3", /P108\.3 operator-review audit preview/.test(readme) && /P108\.4 is next/.test(readme));
addCheck(
  "phase status advanced to P108.3",
  status.currentPhase === "P108.3"
    && status.previousPhase === "P108.2"
    && status.nextPhase === "P108.4"
    && statusById.get("P108")?.status === "in_progress"
    && statusById.get("P108.3")?.status === "complete"
    && statusById.get("P108.4")?.status === "planned"
    && roadmapById.get("P108")?.status === "in_progress"
    && roadmapById.get("P108.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}/${statusById.get("P108")?.status}`,
);
addCheck("P108.2 checker accepts P108.3 handoff", p1082Checker.includes("P108.3") && p1082Checker.includes("P108.4"));
addCheck("operator review audit preview stays Command Center hidden", data.commandCenterVisible === false);
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
        "- Validates P108.3 display-safe local founder live approval operator-review audit preview.",
        "- Confirms operator-review audit rows cannot capture, persist, write, unlock execution, or admit runtime execution.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, approval capture writes, runtime admission, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1083-founder-live-approval-operator-review-audit-preview",
        "- npm run check:p1082-founder-live-approval-operator-review-model",
        "- npm run check:p1081-founder-live-approval-operator-review-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P108.3 is local audit preview only. It does not capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P108.3 Founder Live Approval Operator Review Audit Preview Report", phase: "P108.3" },
);

printCheckReport("P108.3 Founder Live Approval Operator Review Audit Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
