import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1087-founder-live-approval-operator-review-final-report.md";

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
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const build = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const operatorReview = build.founderLiveApprovalOperatorReview || {};
const p1087 = subphaseById.get("P108.7") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const p108Scripts = [
  "check:p1081-founder-live-approval-operator-review-contract",
  "check:p1082-founder-live-approval-operator-review-model",
  "check:p1083-founder-live-approval-operator-review-audit-preview",
  "check:p1084-command-center-operator-review-ux",
  "check:p1085-founder-live-approval-operator-review-validation",
  "check:p1086-founder-live-approval-operator-review-docs",
  "check:p1087-founder-live-approval-operator-review-final",
];
const p108Reports = [
  "reports/p1081-founder-live-approval-operator-review-contract-report.md",
  "reports/p1082-founder-live-approval-operator-review-model-report.md",
  "reports/p1083-founder-live-approval-operator-review-audit-preview-report.md",
  "reports/p1084-command-center-operator-review-ux-report.md",
  "reports/p1085-founder-live-approval-operator-review-validation-report.md",
  "reports/p1086-founder-live-approval-operator-review-docs-report.md",
];
const serializedOperatorReview = JSON.stringify(operatorReview);
const docsBundle = [contract, plan, platformRoadmap, readme].map((entry) => JSON.stringify(entry)).join(" ");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1087-founder-live-approval-operator-review-final"]));
addCheck("all P108 scripts registered", p108Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P108 reports exist", p108Reports.every((report) => readText(report).includes("Result")));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P108 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("contract records final validation commands", ["npm run check:p1087-founder-live-approval-operator-review-final", "npm run check:p1086-founder-live-approval-operator-review-docs", "npm run check:p1085-founder-live-approval-operator-review-validation", "npm run check:p1084-command-center-operator-review-ux", "cd dashboard && npm run build", "npm run check:phase-validation-coverage", "git diff --check"].every((command) => p1087.validationCommands?.includes(command)));
addCheck("P108.7 avoids forbidden file scope", !(p1087.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("P109 handoff placeholder is supported", status.nextPhase === "P109" && roadmap.nextPhase === "P109" && osStatusChecker.includes('"P109"') && osStatusChecker.includes('phaseStatus.nextPhase === "P109"'));
addCheck("docs record P108.7", /P108\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P108 complete", /P108\.7 is\s+complete/.test(platformRoadmap) && /P108 is\s+complete/.test(platformRoadmap) && /P109 is\s+next/.test(platformRoadmap));
addCheck("README records P108 complete", /P108\.7 final validation/.test(readme) && /P108 is complete/.test(readme) && /P109 is next/.test(readme));
addCheck("Command Center operator-review UX retained", operatorReview.auditPreviewCount === 6 && operatorReview.blockedAuditPreviewCount === 6 && operatorReview.auditRows?.length === 6 && pageSource.includes("FounderLiveApprovalOperatorReviewCard"));
addCheck("route safety coverage retained", routeTests.includes("Founder live operator review appears on non-chat founder routes") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness"));
addCheck(
  "phase status closed",
  status.currentPhase === "P108.7"
    && status.previousPhase === "P108.6"
    && status.nextPhase === "P109"
    && statusById.get("P108")?.status === "complete"
    && statusById.get("P108.7")?.status === "complete"
    && roadmapById.get("P108")?.status === "complete"
    && roadmapById.get("P108.7")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}/${statusById.get("P108")?.status}`,
);
addCheck("phase commits recorded", [statusById.get("P108")?.commit, statusById.get("P108.7")?.commit, roadmapById.get("P108")?.commit, roadmapById.get("P108.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P108")?.commandCenterVisible === true && statusById.get("P108.7")?.commandCenterVisible === true);
addCheck("operator review authority remains blocked", operatorReview.capturableOperatorDecisionCount === 0 && operatorReview.persistedOperatorDecisionCount === 0 && operatorReview.writableOperatorDecisionCount === 0 && operatorReview.executableOperatorReviewCount === 0);
addCheck("final UX avoids raw private IDs", !/(?:private|token|tenant|workspace|project)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedOperatorReview));
addCheck("final UX avoids raw packet keys", !/(recordRef|auditPreviewRef|reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestKey|approvalCaptureRecordKey|auditPreviewKey)/.test(serializedOperatorReview));
addCheck("final UX avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serializedOperatorReview + pageSource + docsBundle));
addCheck("final UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedOperatorReview));
addCheck("docs do not claim execution live", !/execution is live|approval capture is live|operator decision capture is live|runtime admission is enabled|provider spend is enabled/i.test(docsBundle));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P108 founder live approval operator-review closure.",
        "- Confirms parent P108 and all subphases are complete, reports and scripts exist, Command Center route safety is retained, and P109 is the next planned handoff placeholder.",
        "- Does not enable operator decision capture, approval capture, approval persistence, approval writes, execution unlock, runtime admission, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1087-founder-live-approval-operator-review-final",
        "- npm run check:p1086-founder-live-approval-operator-review-docs",
        "- npm run check:p1085-founder-live-approval-operator-review-validation",
        "- npm run check:p1084-command-center-operator-review-ux",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P108.7 closes P108 validation only. It does not capture operator decisions, capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend. P109 remains a planned handoff placeholder.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P108.7 Founder Live Approval Operator Review Final Report", phase: "P108.7" },
);

printCheckReport("P108.7 Founder Live Approval Operator Review Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
