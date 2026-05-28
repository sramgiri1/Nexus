import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1084-command-center-operator-review-ux-report.md";

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
const dataSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1083Checker = readText("scripts/check-p1083-founder-live-approval-operator-review-audit-preview.js");
const build = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const operatorReview = build.founderLiveApprovalOperatorReview || {};
const p1084 = subphaseById.get("P108.4") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serializedOperatorReview = JSON.stringify(operatorReview);
const operatorReviewUxText = [
  serializedOperatorReview,
  "Founder Live Operator Review",
  "Business Build Operator Review",
  "Agent Flow Operator Review",
  "Live Readiness Operator Review",
  "Operator review read-only",
].join(" ");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1084-command-center-operator-review-ux"]));
addCheck("dashboard data exposes operator review", dataSource.includes("buildFounderLiveApprovalOperatorReviewDisplayModel") && dataSource.includes("founderLiveApprovalOperatorReview"));
addCheck("page renders operator review only on non-chat founder routes", pageSource.includes("FounderLiveApprovalOperatorReviewCard") && pageSource.includes("Business Build Operator Review") && pageSource.includes("Agent Flow Operator Review") && pageSource.includes("Live Readiness Operator Review") && !pageSource.includes("Chat Operator Review") && !pageSource.includes("Lite Operator Review"));
addCheck("route test covers operator review", routeTests.includes("Founder live operator review appears on non-chat founder routes") && routeTests.includes("Founder live operator review audit preview") && routeTests.includes("Operator review read-only"));
addCheck("operator review display model useful", operatorReview.currentState?.includes("Operator Review") && operatorReview.auditPreviewCount === 6 && operatorReview.blockedAuditPreviewCount === 6 && operatorReview.auditRows?.length === 6);
addCheck("operator review zeroes unsafe counts", operatorReview.capturableOperatorDecisionCount === 0 && operatorReview.persistedOperatorDecisionCount === 0 && operatorReview.writableOperatorDecisionCount === 0 && operatorReview.executableOperatorReviewCount === 0 && operatorReview.dispatchableOperatorReviewCount === 0 && operatorReview.projectMutationOperatorReviewCount === 0 && operatorReview.hostedDbMutationOperatorReviewCount === 0);
addCheck("operator review rows display safe and blocked", operatorReview.auditRows?.every((row) => row.operatorDecisionCaptured === "Blocked" && row.operatorDecisionPersisted === "Blocked" && row.operatorReviewWriteAllowed === "Blocked" && row.executionUnlockAllowed === "Blocked" && row.runtimeAdmissionAllowed === "Blocked" && !("recordRef" in row) && !("auditPreviewRef" in row) && !("approvalCaptureRecordKey" in row)));
addCheck("operator review rows include useful value", operatorReview.auditRows?.every((row) => row.proposedAgentLane && row.proposedOutcome && row.auditQuestions?.length >= 4 && row.validationCommand === "npm run check:p1083-founder-live-approval-operator-review-audit-preview"));
addCheck("safety rows retained", operatorReview.safetyRows?.some((row) => row.label === "Operator review writes" && row.value === "Blocked") && operatorReview.safetyRows?.some((row) => row.label === "Provider spend" && row.value === "Blocked"));
addCheck("contract marks P108.4 complete", p1084.status === "complete");
addCheck("P108.5 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P108.5")?.status));
addCheck("docs record P108.4", /P108\.4 Command Center Operator Review UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P108.4", /P108\.4 is\s+complete/.test(platformRoadmap) && /P108\.5\s+is\s+next/.test(platformRoadmap));
addCheck("README records P108.4", /P108\.4 Command Center operator-review UX/.test(readme) && /P108\.5 is next/.test(readme));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P108.4"
    && status.previousPhase === "P108.3"
    && status.nextPhase === "P108.5")
    || (status.currentPhase === "P108.5"
      && status.previousPhase === "P108.4"
      && status.nextPhase === "P108.6"))
    && statusById.get("P108")?.status === "in_progress"
    && statusById.get("P108.4")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P108.5")?.status)
    && roadmapById.get("P108.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P108.4 avoids forbidden file scope", !(p1084.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("P108.3 checker accepts P108.4 handoff", p1083Checker.includes("P108.4") && p1083Checker.includes("P108.5"));
addCheck("primary UX avoids raw private IDs", !/(?:private|token|tenant|workspace|project)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(operatorReviewUxText));
addCheck("primary UX avoids raw packet keys", !/(reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestKey|approvalCaptureRecordKey|auditPreviewKey|auditPreviewRef|recordRef)/.test(serializedOperatorReview));
addCheck("primary UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(operatorReviewUxText));
addCheck("primary UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(operatorReviewUxText));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P108.4 Command Center operator-review UX.",
        "- Confirms Business Build, Agent Flow, and Live Readiness render display-safe operator-review audit state while Chat with NEXUS and Lite stay clean.",
        "- Does not enable approval capture, approval persistence, approval writes, execution unlock, runtime admission, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1084-command-center-operator-review-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live operator review appears on non-chat founder routes\"",
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
      body: "- P108.4 is display-only. It does not capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P108.4 Command Center Operator Review UX Report", phase: "P108.4" },
);

printCheckReport("P108.4 Command Center Operator Review UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
