import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_METADATA_PHASE,
  FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_VERSION,
  buildFounderApprovalDecisionApplicationEligibilityMetadata,
} from "../shared/founderApprovalDecisionApplicationEligibilityMetadata.js";
import {
  FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_PHASE,
  FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_VERSION,
  buildFounderApprovalDecisionApplicationIntentModel,
  validateFounderApprovalDecisionApplicationIntentModel,
} from "../shared/founderApprovalDecisionApplicationIntentModel.js";
import {
  FOUNDER_APPROVAL_DECISION_APPLICATION_PREVIEW_PHASE,
  FOUNDER_APPROVAL_DECISION_APPLICATION_PREVIEW_VERSION,
  buildFounderApprovalDecisionApplicationPreview,
  validateFounderApprovalDecisionApplicationPreview,
} from "../shared/founderApprovalDecisionApplicationPreview.js";
import { buildFounderApprovalDecisionApplicationBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1216-founder-runtime-approval-decision-application-boundary-report.md";

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
    const context = `${lines[index - 1] || ""} ${line}`;
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|validation-only|docs-only|dry-run|preview-only|display-only|read-only|metadata-only|model-only|safe dry-run)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p121-founder-runtime-approval-decision-application-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1216 = subphaseById.get("P121.6") || {};
const p1217 = subphaseById.get("P121.7") || {};
const plan = readText("docs/architecture/P121_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1215Checker = readText("scripts/check-p1215-founder-runtime-approval-decision-application-boundary.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P121.6";
const allowedFiles = new Set(p1216.allowedFiles || []);
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

const metadata = buildFounderApprovalDecisionApplicationEligibilityMetadata();
const intentModel = buildFounderApprovalDecisionApplicationIntentModel({
  intentState: "ready_for_safe_dry_run",
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const preview = buildFounderApprovalDecisionApplicationPreview({ intentModel });
const displayModel = buildFounderApprovalDecisionApplicationBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
  applicationPreview: preview,
});
const intentValidation = validateFounderApprovalDecisionApplicationIntentModel(intentModel);
const previewValidation = validateFounderApprovalDecisionApplicationPreview(preview);
const serializedDisplayModel = JSON.stringify(displayModel);
const serializedPreview = JSON.stringify(preview.data || {});
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const publicDocsBundle = [platformRoadmap, readme].join("\n");
const primaryUxSource = [businessBuildSource, pageSource, serializedDisplayModel].join("\n");

const requiredScripts = [
  "check:p1211-founder-runtime-approval-decision-application-boundary-contract",
  "check:p1212-founder-runtime-approval-decision-application-boundary",
  "check:p1213-founder-runtime-approval-decision-application-boundary",
  "check:p1214-founder-runtime-approval-decision-application-boundary",
  "check:p1215-founder-runtime-approval-decision-application-boundary",
  "check:p1216-founder-runtime-approval-decision-application-boundary",
];
const requiredReports = [
  "reports/p1211-founder-runtime-approval-decision-application-boundary-contract-report.md",
  "reports/p1212-founder-runtime-approval-decision-application-boundary-report.md",
  "reports/p1213-founder-runtime-approval-decision-application-boundary-report.md",
  "reports/p1214-founder-runtime-approval-decision-application-boundary-report.md",
  "reports/p1215-founder-runtime-approval-decision-application-boundary-report.md",
];
const completedSubphases = ["P121.1", "P121.2", "P121.3", "P121.4", "P121.5", "P121.6"];
const validationCommands = [
  "npm run check:p1216-founder-runtime-approval-decision-application-boundary",
  "npm run check:p1215-founder-runtime-approval-decision-application-boundary",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Approval decision application boundary appears only on scoped pages\"",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const zeroDisplayCounts = [
  "applicationCandidateCount",
  "applicableDecisionCount",
  "approvalApplicationCandidateCount",
  "decisionRecordableCandidateCount",
  "approvalDecisionRecordableCandidateCount",
  "dbWritableCandidateCount",
  "runtimeWritableCandidateCount",
  "runtimeExecutableCandidateCount",
  "executionUnlockCandidateCount",
  "agentDispatchCandidateCount",
  "projectMutationCandidateCount",
  "hostedDbMutationCandidateCount",
  "providerSpendCandidateCount",
].every((field) => displayModel[field] === 0);
const metadataFlagsBlocked = metadata.sections?.every((section) => (
  section.authorityFlags
  && Object.values(section.authorityFlags).every((value) => value === false)
));

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P121.1-P121.6 contract statuses complete", completedSubphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete") && ["planned", "complete"].includes(p1217.status));
addCheck("P121.6 records validation commands", validationCommands.every((command) => p1216.validationCommands?.includes(command)));
addCheck("prior reports exist and pass", requiredReports.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*(PASS|PASS \()/.test(readText(report))));
addCheck("metadata model remains metadata-only", metadata.phaseId === FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_METADATA_PHASE && metadata.metadataVersion === FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_VERSION && metadata.metadataOnly === true && metadata.commandCenterVisible === false && metadataFlagsBlocked);
addCheck("intent model validates", intentValidation.valid && intentModel.phaseId === FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_PHASE && intentModel.schemaVersion === FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_VERSION, intentValidation.errors.join("; "));
addCheck("preview validates", previewValidation.valid && preview.phase === FOUNDER_APPROVAL_DECISION_APPLICATION_PREVIEW_PHASE && preview.data?.schemaVersion === FOUNDER_APPROVAL_DECISION_APPLICATION_PREVIEW_VERSION, previewValidation.errors.join("; "));
addCheck("preview remains dry-run hidden", preview.data?.dryRunOnly === true && preview.data?.commandCenterVisible === false && preview.data?.previewMode === "local-only-application-dry-run" && !/approval_decision_application|founderApprovalDecisionApplication/i.test(serializedPreview));
addCheck("display model remains blocked and useful", displayModel.readinessRowCount === 3 && displayModel.blockedReadinessRowCount === 3 && zeroDisplayCounts && displayModel.ownerCapability === "NEXUS Approval Decision Application Boundary" && displayModel.readinessRows.every((row) => row.label && row.nextAction && row.blocker && row.disabledReason));
addCheck("P121.5 scoped Command Center UX preserved", pageSource.includes("FounderApprovalDecisionBoundaryCard") && pageSource.includes("Business Build Approval Decision Application Boundary") && pageSource.includes("Agent Flow Approval Decision Application Boundary") && !pageSource.includes("Lite Approval Decision Application Boundary") && !pageSource.includes("Chat Approval Decision Application Boundary") && !pageSource.includes("Live Readiness Approval Decision Application Boundary"));
addCheck("P121.5 display model preserved", businessBuildSource.includes("buildFounderApprovalDecisionApplicationBoundaryDisplayModel") && businessBuildSource.includes("founderApprovalDecisionApplicationBoundary") && businessBuildSource.includes("Approval decision application safe dry-run report"));
addCheck("P121.5 Playwright coverage preserved", routeTests.includes("Approval decision application boundary appears only on scoped pages") && routeTests.includes("Founder runtime approval decision application boundary") && routeTests.includes("/command-center/business-build") && routeTests.includes("/command-center/agent-flow") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("dark") && routeTests.includes("light") && routeTests.includes("system"));
addCheck("P121.5 checker accepts P121.6 handoff", p1215Checker.includes("P121.6") && p1215Checker.includes("P121.7") && p1215Checker.includes("scope check relaxed"));
addCheck("P121 plan records all completed subphases", [
  /P121\.1 Application Boundary Contract \/ Policy[\s\S]*Status:\s+complete/,
  /P121\.2 Application Eligibility Metadata[\s\S]*Status:\s+complete/,
  /P121\.3 Governed Application Intent Model[\s\S]*Status:\s+complete/,
  /P121\.4 Application Safe Dry Run[\s\S]*Status:\s+complete/,
  /P121\.5 Command Center Application Boundary UX[\s\S]*Status:\s+complete/,
  /P121\.6 Application Validation \/ Docs[\s\S]*Status:\s+complete/,
].every((pattern) => pattern.test(plan)));
addCheck("README records P121.6", /P121\.6 approval decision application validation/i.test(readme) && /P121\.7\s+is\s+next/.test(readme));
addCheck("platform roadmap records P121.6", /P121\.6 is complete/.test(platformRoadmap) && /P121\.7\s+is\s+next/.test(platformRoadmap));

const p1216HandoffState =
  status.currentPhase === "P121.6"
    && status.previousPhase === "P121.5"
    && status.nextPhase === "P121.7"
    && roadmap.currentPhase === "P121.6"
    && roadmap.previousPhase === "P121.5"
    && roadmap.nextPhase === "P121.7"
    && statusById.get("P121")?.status === "in_progress"
    && roadmapById.get("P121")?.status === "in_progress"
    && completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
    && ["planned", "complete"].includes(statusById.get("P121.7")?.status);
const p1217FinalState =
  status.currentPhase === "P121.7"
    && status.previousPhase === "P121.6"
    && roadmap.currentPhase === "P121.7"
    && roadmap.previousPhase === "P121.6"
    && statusById.get("P121")?.status === "complete"
    && roadmapById.get("P121")?.status === "complete"
    && completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
    && statusById.get("P121.7")?.status === "complete"
    && roadmapById.get("P121.7")?.status === "complete";

addCheck("phase status advanced", p1216HandoffState || p1217FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("contract handoff points to final validation", (contract.currentSubphase === "P121.6" && contract.previousSubphase === "P121.5" && contract.nextSubphase === "P121.7") || (contract.currentSubphase === "P121.7" && contract.previousSubphase === "P121.6"));
addCheck(
  "changed files stay in P121.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P121.6 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P121.6 contract avoids forbidden file scope", !(p1216.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("primary UX avoids raw schema names and record refs", !/(founderApprovalDecisionApplication|approval_decision_application|applicationDraftRef|applicationEventRef|applicationEvidenceRef|approvalDecisionApplicationKey|sqliteEntity|recordRef|requestKey)/i.test(serializedDisplayModel));
addCheck("public docs avoid raw table names", !/(founder_runtime_approval_decision_application|approval_decision_application|founderApprovalDecisionApplication)/.test(publicDocsBundle));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|reject now|save decision now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(primaryUxSource));
addCheck(
  "docs and UX avoid unsafe positive claims",
  !hasUnsafePositiveClaim(
    `${docsBundle}\n${primaryUxSource}`,
    /approval decision application is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i,
  ),
);
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump/i));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(primaryUxSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${docsBundle}\n${primaryUxSource}`));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P121.1-P121.5 together before final validation.",
        "- Confirms approval decision application contract, eligibility metadata, intent model, safe dry-run preview, scoped Command Center UX, Playwright coverage, docs, reports, package scripts, and phase status are aligned.",
        "- Does not apply approval decisions, capture approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, dispatch agents, execute workers/tools, mutate projects, call providers/models, use hosted DBs, run raw SQL, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P121.6 is aggregate validation and docs closure only. Approval decision application, approval capture, approval persistence, approve/reject decision recording, DB/runtime writes, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, and provider spend remain blocked.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P121.6 Founder Runtime Approval Decision Application Boundary Validation Report", phase: "P121.6" },
);

printCheckReport("P121.6 Founder Runtime Approval Decision Application Boundary Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
