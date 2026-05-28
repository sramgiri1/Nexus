import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";
import {
  buildFounderLiveApprovalOperatorReviewBoundary,
  validateFounderLiveApprovalOperatorReviewBoundary,
} from "../live-ready/founderLiveApprovalOperatorReviewBoundary.js";
import {
  buildFounderLiveApprovalOperatorReviewModel,
  validateFounderLiveApprovalOperatorReviewModel,
} from "../live-ready/founderLiveApprovalOperatorReviewModel.js";
import {
  buildFounderLiveApprovalOperatorReviewAuditPreview,
  validateFounderLiveApprovalOperatorReviewAuditPreview,
} from "../live-ready/founderLiveApprovalOperatorReviewAuditPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1085-founder-live-approval-operator-review-validation-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function currentChangedFiles() {
  try {
    return execSync("git status --porcelain", { cwd: ROOT, encoding: "utf8" })
      .split("\n")
      .map((line) => line.slice(3).trim())
      .map((line) => line.replace(/^.* -> /, ""))
      .filter(Boolean);
  } catch {
    return [];
  }
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
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1081Checker = readText("scripts/check-p1081-founder-live-approval-operator-review-contract.js");
const p1084Checker = readText("scripts/check-p1084-command-center-operator-review-ux.js");
const p1085 = subphaseById.get("P108.5") || {};
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "dashboard/src/",
  "dashboard/tests/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
];
const p108Scripts = [
  "check:p1081-founder-live-approval-operator-review-contract",
  "check:p1082-founder-live-approval-operator-review-model",
  "check:p1083-founder-live-approval-operator-review-audit-preview",
  "check:p1084-command-center-operator-review-ux",
  "check:p1085-founder-live-approval-operator-review-validation",
];
const p108Reports = [
  "reports/p1081-founder-live-approval-operator-review-contract-report.md",
  "reports/p1082-founder-live-approval-operator-review-model-report.md",
  "reports/p1083-founder-live-approval-operator-review-audit-preview-report.md",
  "reports/p1084-command-center-operator-review-ux-report.md",
];
const validationCommands = [
  "npm run check:p1085-founder-live-approval-operator-review-validation",
  "npm run check:p1084-command-center-operator-review-ux",
  "cd dashboard && npm run build",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const boundaryEnvelope = buildFounderLiveApprovalOperatorReviewBoundary();
const modelEnvelope = buildFounderLiveApprovalOperatorReviewModel({ operatorReviewBoundaryEnvelope: boundaryEnvelope });
const auditPreviewEnvelope = buildFounderLiveApprovalOperatorReviewAuditPreview({ operatorReviewModelEnvelope: modelEnvelope });
const boundaryValidation = validateFounderLiveApprovalOperatorReviewBoundary(boundaryEnvelope);
const modelValidation = validateFounderLiveApprovalOperatorReviewModel(modelEnvelope);
const auditValidation = validateFounderLiveApprovalOperatorReviewAuditPreview(auditPreviewEnvelope);
const build = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const operatorReview = build.founderLiveApprovalOperatorReview || {};
const serializedOperatorReview = JSON.stringify(operatorReview);
const serializedAuditPreview = JSON.stringify(auditPreviewEnvelope.data || {});
const currentDiffFiles = currentChangedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P108.5";
const p108AllowedFiles = new Set([
  ...(p1085.allowedFiles || []),
  "reports/os-phase-status-report.md",
  "reports/phase-validation-coverage-report.md",
  ...p108Reports,
]);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1085-founder-live-approval-operator-review-validation"]));
addCheck("all P108 scripts registered", p108Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P108 reports exist", p108Reports.every((report) => readText(report).includes("Result")));
addCheck("contract marks P108.1-P108.5 complete", ["P108.1", "P108.2", "P108.3", "P108.4", "P108.5"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract keeps P108.6 planned or complete", ["planned", "complete"].includes(subphaseById.get("P108.6")?.status));
addCheck("contract records aggregate validation commands", validationCommands.every((command) => p1085.validationCommands?.includes(command)));
addCheck("P108.5 avoids forbidden file scope", !(p1085.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck(
  "working diff stays in P108.5 allowed scope",
  !enforceCurrentDiffScope || currentDiffFiles.every((file) => p108AllowedFiles.has(file)),
  enforceCurrentDiffScope ? currentDiffFiles.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck("operator review boundary schema validates", boundaryValidation.valid, boundaryValidation.errors.join("; "));
addCheck("operator review model schema validates", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("operator review audit preview schema validates", auditValidation.valid, auditValidation.errors.join("; "));
addCheck("boundary readiness remains blocked", boundaryEnvelope.data?.operatorReviewReadiness?.operatorReviewRecordCount === 6 && boundaryEnvelope.data?.operatorReviewReadiness?.capturedOperatorDecisionCount === 0);
addCheck("model readiness remains blocked", modelEnvelope.data?.operatorReviewModelSummary?.operatorReviewRecordCount === 6 && modelEnvelope.data?.operatorReviewModelSummary?.writableOperatorDecisionCount === 0);
addCheck("audit preview remains blocked", auditPreviewEnvelope.data?.operatorReviewAuditSummary?.auditPreviewCount === 6 && auditPreviewEnvelope.data?.operatorReviewAuditSummary?.capturableOperatorDecisionCount === 0);
addCheck("dashboard data and page still expose operator review UX", dataSource.includes("founderLiveApprovalOperatorReview") && dataSource.includes("buildFounderLiveApprovalOperatorReviewDisplayModel") && pageSource.includes("FounderLiveApprovalOperatorReviewCard"));
addCheck("route safety coverage retained", routeTests.includes("Founder live operator review appears on non-chat founder routes") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("Operator review read-only"));
addCheck("operator review UX remains useful", operatorReview.auditPreviewCount === 6 && operatorReview.blockedAuditPreviewCount === 6 && operatorReview.auditRows?.length === 6 && operatorReview.auditRows?.some((row) => row.proposedAgentLane === "Product Strategist"));
addCheck("operator review unsafe counts remain zero", operatorReview.capturableOperatorDecisionCount === 0 && operatorReview.persistedOperatorDecisionCount === 0 && operatorReview.writableOperatorDecisionCount === 0 && operatorReview.executableOperatorReviewCount === 0 && operatorReview.dispatchableOperatorReviewCount === 0 && operatorReview.projectMutationOperatorReviewCount === 0 && operatorReview.hostedDbMutationOperatorReviewCount === 0);
addCheck("operator review rows remain blocked", operatorReview.auditRows?.every((row) => row.operatorDecisionCaptured === "Blocked" && row.operatorDecisionPersisted === "Blocked" && row.operatorReviewWriteAllowed === "Blocked" && row.executionUnlockAllowed === "Blocked" && row.runtimeAdmissionAllowed === "Blocked" && row.dispatchAllowed === "Blocked"));
addCheck("chat and lite stay clean in source", !pageSource.includes("Chat Operator Review") && !pageSource.includes("Lite Operator Review"));
addCheck("handoff compatibility retained", p1081Checker.includes("P108.5") && p1084Checker.includes("P108.5"));
addCheck("docs record P108.5", /P108\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P108.5", /P108\.5 is\s+complete/.test(platformRoadmap) && (/P108\.6 is\s+next/.test(platformRoadmap) || /P108\.6 is\s+complete/.test(platformRoadmap)));
addCheck("README records P108.5", /P108\.5 aggregate validation/.test(readme) && (/P108\.6\s+is\s+next/.test(readme) || /P108\.6 docs closure/.test(readme)));
addCheck(
  "phase status advanced",
  ["P108.5", "P108.6", "P108.7"].includes(status.currentPhase)
    && ["P108.4", "P108.5", "P108.6"].includes(status.previousPhase)
    && ["P108.6", "P108.7", "P109"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P108")?.status)
    && statusById.get("P108.5")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P108.6")?.status)
    && roadmapById.get("P108.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("aggregate UX avoids raw private IDs", !/(?:private|token|tenant|workspace|project|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedOperatorReview));
addCheck("aggregate UX avoids raw packet keys", !/(recordRef|auditPreviewRef|reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestKey|approvalCaptureRecordKey|auditPreviewKey)/.test(serializedOperatorReview));
addCheck("aggregate audit preview remains hidden from primary UX", /(recordRef|auditPreviewRef)/.test(serializedAuditPreview) && !/(recordRef|auditPreviewRef)/.test(serializedOperatorReview));
addCheck("aggregate UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|capture approval now/i.test(serializedOperatorReview));
addCheck("aggregate UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedOperatorReview));
addCheck("DemoApp not exposed in Command Center source", !pageSource.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates aggregate P108 founder live approval operator-review coverage across contract, boundary schema, local model, audit preview, Command Center UX, route tests, docs, reports, and phase status.",
        "- Confirms operator-review UX remains display-safe, useful, non-runnable, and absent from Chat with NEXUS/Lite.",
        "- Does not enable operator decision capture, approval capture, persistence, writes, execution unlock, runtime admission, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1085-founder-live-approval-operator-review-validation",
        "- npm run check:p1084-command-center-operator-review-ux",
        "- cd dashboard && npm run build",
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
      body: "- P108.5 is validation only. It does not capture operator decisions, capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P108.5 Founder Live Approval Operator Review Validation Report", phase: "P108.5" },
);

printCheckReport("P108.5 Founder Live Approval Operator Review Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
