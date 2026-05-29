import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalApplicationAuthorityActivationPreview } from "../shared/founderApprovalApplicationAuthorityActivationPreview.js";
import { buildFounderApprovalApplicationAuthorityActivationBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1236-founder-runtime-approval-application-authority-activation-boundary-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function changedFiles() {
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]{1,2}\s+/, ""))
    .map((line) => (line.includes(" -> ") ? line.split(" -> ").pop() : line));
}

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|preview-only|display-only|read-only|future|validation-only|docs-only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p123-founder-runtime-approval-application-authority-activation-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1236 = subphaseById.get("P123.6") || {};
const p1237 = subphaseById.get("P123.7") || {};
const plan = readText("docs/architecture/P123_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1235Checker = readText("scripts/check-p1235-founder-runtime-approval-application-authority-activation-boundary.js");
const checkerSource = readText("scripts/check-p1236-founder-runtime-approval-application-authority-activation-boundary.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P123.6";
const allowedFiles = new Set(p1236.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
  "db/",
  "live-ready/",
  "local-state/runtime/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
  ".env",
];

const preview = buildFounderApprovalApplicationAuthorityActivationPreview({
  intentState: "ready_for_safe_activation_dry_run",
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
  nextAction: "Review approval application authority activation readiness on scoped founder work pages while activation, writes, and execution controls remain unavailable.",
});
const displayModel = buildFounderApprovalApplicationAuthorityActivationBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
  activationPreview: preview,
});
const serializedDisplayModel = JSON.stringify(displayModel);
const serializedPreview = JSON.stringify(preview.data || {});
const primaryUxSource = `${pageSource}\n${serializedDisplayModel}`;
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;
const completedSubphases = ["P123.1", "P123.2", "P123.3", "P123.4", "P123.5", "P123.6"];
const requiredScripts = [
  "check:p1231-founder-runtime-approval-application-authority-activation-boundary",
  "check:p1232-founder-runtime-approval-application-authority-activation-boundary",
  "check:p1233-founder-runtime-approval-application-authority-activation-boundary",
  "check:p1234-founder-runtime-approval-application-authority-activation-boundary",
  "check:p1235-founder-runtime-approval-application-authority-activation-boundary",
  "check:p1236-founder-runtime-approval-application-authority-activation-boundary",
];
const requiredReports = [
  "reports/p1231-founder-runtime-approval-application-authority-activation-boundary-report.md",
  "reports/p1232-founder-runtime-approval-application-authority-activation-boundary-report.md",
  "reports/p1233-founder-runtime-approval-application-authority-activation-boundary-report.md",
  "reports/p1234-founder-runtime-approval-application-authority-activation-boundary-report.md",
  "reports/p1235-founder-runtime-approval-application-authority-activation-boundary-report.md",
];
const validationCommands = [
  "npm run check:p1236-founder-runtime-approval-application-authority-activation-boundary",
  "npm run check:p1235-founder-runtime-approval-application-authority-activation-boundary",
  "npm run check:p1234-founder-runtime-approval-application-authority-activation-boundary",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Approval application authority activation appears only on scoped pages\"",
  "git diff --check",
];
const zeroDisplayCounts = [
  "activationCandidateCount",
  "authorityGrantCandidateCount",
  "applicationCandidateCount",
  "approvalApplicationCandidateCount",
  "decisionRecordableCandidateCount",
  "approvalDecisionRecordableCandidateCount",
  "dbWritableCandidateCount",
  "runtimeWritableCandidateCount",
  "runtimeExecutableCandidateCount",
  "executionUnlockCandidateCount",
  "agentDispatchCandidateCount",
  "workerExecutionCandidateCount",
  "toolExecutionCandidateCount",
  "projectMutationCandidateCount",
  "hostedDbMutationCandidateCount",
  "networkCallCandidateCount",
  "providerSpendCandidateCount",
].every((field) => displayModel[field] === 0);

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P123.1-P123.6 contract statuses complete", completedSubphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete") && ["planned", "complete"].includes(p1237.status));
addCheck("P123.6 records validation commands", validationCommands.every((command) => p1236.validationCommands?.includes(command)));
addCheck("P123.6 records validation/docs-only scope", p1236.narrowGoal?.includes("validation/docs") && p1236.expectedExports?.length === 0 && p1236.dataShape?.includes("No runtime exports"));
addCheck("P123.6 forbids dashboard source edits", (p1236.forbiddenFiles || []).includes("dashboard/src/**") && (p1236.forbiddenFiles || []).includes("dashboard/tests/**"));
addCheck("prior reports exist and pass", requiredReports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*(PASS|PASS \()/.test(readText(report))));
addCheck("P123.5 checker accepts P123.6 handoff", p1235Checker.includes("P123.6") && p1235Checker.includes("P123.7") && p1235Checker.includes("p1235HandoffAccepted"));
addCheck("P123.5 Playwright coverage preserved", routeTests.includes("Approval application authority activation appears only on scoped pages") && routeTests.includes("Founder approval application authority activation") && routeTests.includes("/command-center/business-build") && routeTests.includes("/command-center/agent-flow") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("dark") && routeTests.includes("light") && routeTests.includes("system"));
addCheck("P123.5 display model preserved", businessBuildSource.includes("buildFounderApprovalApplicationAuthorityActivationBoundaryDisplayModel") && businessBuildSource.includes("founderApprovalApplicationAuthorityActivationBoundary") && businessBuildSource.includes("Approval application authority activation safe dry-run report"));
addCheck("P123.5 scoped Command Center UX preserved", pageSource.includes("Business Build Approval Application Authority Activation") && pageSource.includes("Agent Flow Approval Application Authority Activation") && !pageSource.includes("Lite Approval Application Authority Activation") && !pageSource.includes("Chat Approval Application Authority Activation") && !pageSource.includes("Live Readiness Approval Application Authority Activation"));
addCheck("preview remains dry-run hidden", preview.data?.dryRunOnly === true && preview.data?.commandCenterVisible === false && preview.data?.previewMode === "local-only-authority-activation-dry-run" && !/approval_authority_activation|founderApprovalApplicationAuthorityActivation/i.test(serializedPreview));
addCheck("display model remains blocked and useful", displayModel.readinessRowCount === 4 && displayModel.blockedReadinessRowCount === 4 && zeroDisplayCounts && displayModel.ownerCapability === "NEXUS Approval Application Authority Activation Guard" && displayModel.readinessRows.every((row) => row.label && row.nextAction && row.blocker && row.disabledReason));
addCheck("primary UX avoids internal phase labels and report paths", !/P123|p123\d|reports\/p123/i.test(primaryUxSource));
addCheck("primary UX avoids raw schema names and private IDs", !/(founderApprovalApplicationAuthorityActivation|approval_authority_activation|activationDraftRef|activationEventRef|activationEvidenceRef|approvalApplicationAuthorityActivationKey|sqliteEntity|recordRef|requestKey|(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*)/i.test(serializedDisplayModel));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|activate now|grant authority now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(primaryUxSource));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));
addCheck("P123 plan records P123.6", /P123\.6 Activation Validation \/ Docs[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P123.6", /P123\.6 is complete/.test(platformRoadmap) && (/P123\.7\s+is\s+next/.test(platformRoadmap) || /P123\.7\s+is\s+complete/.test(platformRoadmap)));
addCheck("README records P123.6", /P123\.6 approval application authority activation validation\/docs closure/.test(readme) && (/P123\.7\s+is\s+next/.test(readme) || /P123\.7\s+is\s+complete/.test(readme)));

const p1236HandoffState =
  status.currentPhase === "P123.6"
    && status.previousPhase === "P123.5"
    && status.nextPhase === "P123.7"
    && roadmap.currentPhase === "P123.6"
    && roadmap.previousPhase === "P123.5"
    && roadmap.nextPhase === "P123.7"
    && statusById.get("P123")?.status === "in_progress"
    && roadmapById.get("P123")?.status === "in_progress"
    && completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
    && ["planned", "complete"].includes(statusById.get("P123.7")?.status);
const p1237FinalState =
  status.currentPhase === "P123.7"
    && status.previousPhase === "P123.6"
    && roadmap.currentPhase === "P123.7"
    && roadmap.previousPhase === "P123.6"
    && completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
    && statusById.get("P123.7")?.status === "complete"
    && roadmapById.get("P123.7")?.status === "complete";

addCheck("phase status advanced", p1236HandoffState || p1237FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("contract handoff points to final validation", (contract.currentSubphase === "P123.6" && contract.previousSubphase === "P123.5" && contract.nextSubphase === "P123.7") || (contract.currentSubphase === "P123.7" && contract.previousSubphase === "P123.6"));
addCheck(
  "changed files stay in P123.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P123.6 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P123.6 contract avoids forbidden file scope", !(p1236.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("public docs avoid raw activation table names", !/(founder_runtime_approval_activation|approval_authority_activation_records|approval_authority_activation_events|approval_authority_activation_requests|activation_boundary_records|founderApprovalApplicationAuthorityActivation)/i.test(publicDocsBundle));
addCheck("docs and UX avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /activation is enabled|approval application authority activation is enabled|authority grant is enabled|approval decision application is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|activation authority is granted|DB writes are enabled|runtime writes are enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump/i));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(`${checkerSource}\n${primaryUxSource}`) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${docsBundle}\n${primaryUxSource}`));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P123.6 approval application authority activation validation/docs closure.",
        "- Confirms the P123.5 UX remains scoped while P123.6 updates docs, contract, status, and generated reports only.",
        "- Does not modify Command Center source/tests and does not enable activation, authority grant, apply, submit, approve, reject, save, decision persistence, approve/reject recording, DB/runtime writes, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1236.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P123.6 is validation/docs closure only. It does not activate authority, grant authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P123.6 Approval Application Authority Activation Validation / Docs Report", phase: "P123.6" },
);

printCheckReport("P123.6 Approval Application Authority Activation Validation / Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
