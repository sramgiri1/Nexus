import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1287-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p128-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-contracts.json";
const PLAN_PATH = "docs/architecture/P128_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_PLAN.md";

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

function reportPassed(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) return false;
  return /## Result[\s\S]*PASS/i.test(readText(relativePath));
}

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|dry run|preview-only|planned-only|display-only|read-only|future|local-only|validation only|docs only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson(CONTRACT_PATH);
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1287 = subphaseById.get("P128.7") || {};
const plan = readText(PLAN_PATH);
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1285Checker = readText("scripts/check-p1285-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js");
const p1286Checker = readText("scripts/check-p1286-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js");
const osChecker = readText("scripts/check-os-phase-status.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedDisplayModel = JSON.stringify(displayModel);
const primaryUxSource = `${pageSource}\n${serializedDisplayModel}`;
const readmeP128Slice = readme.match(/- P128\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const platformP128Slice = platformRoadmap.match(/P128\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${plan}\n${platformP128Slice}\n${readmeP128Slice}`;
const publicDocsBundle = `${platformP128Slice}\n${readmeP128Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P128.7";
const allowedFiles = new Set(p1287.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
  "db/",
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
const p128Reports = [
  "reports/p1281-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md",
  "reports/p1282-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md",
  "reports/p1283-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md",
  "reports/p1284-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md",
  "reports/p1285-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md",
  "reports/p1286-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md",
];
const requiredCommands = [
  "npm run check:p1287-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary",
  "npm run check:p1286-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary",
  "npm run check:p1285-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Approval application authority grant handoff acceptance capture persistence appears only on scoped pages\"",
  "git diff --check",
];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1287-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary"]));
addCheck("contract final state set", contract.status === "complete" && contract.currentSubphase === "P128.7" && contract.previousSubphase === "P128.6" && contract.nextSubphase === "P129" && contract.expectedBaseCommit === "5df76f71" && contract.nextPhase === "P129");
addCheck("contract marks P128.1-P128.7 complete", ["P128.1", "P128.2", "P128.3", "P128.4", "P128.5", "P128.6", "P128.7"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract records validation commands", requiredCommands.every((command) => p1287.validationCommands?.includes(command)));
addCheck("contract records no runtime exports", Array.isArray(p1287.expectedExports) && p1287.expectedExports.length === 0 && /No runtime exports/i.test(p1287.dataShape || ""));
addCheck("P128.7 avoids forbidden file scope", !(p1287.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("P128.7 includes handoff checker scope", p1287.allowedFiles?.includes("scripts/check-p1285-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js") && p1287.allowedFiles?.includes("scripts/check-p1286-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js"));
addCheck("P128.1-P128.6 reports pass", p128Reports.every(reportPassed), p128Reports.filter((report) => !reportPassed(report)).join(", "));
addCheck("P128.5 checker accepts P128.7 final state", p1285Checker.includes('status.currentPhase === "P128.7"') && p1285Checker.includes('status.nextPhase === "P129"') && p1285Checker.includes('["in_progress", "complete"].includes(statusById.get("P128")?.status)'));
addCheck("P128.6 checker accepts P128.7 final state", p1286Checker.includes('contract.currentSubphase === "P128.7"') && p1286Checker.includes('status.nextPhase === "P129"') && p1286Checker.includes('["in_progress", "complete"].includes(statusById.get("P128")?.status)'));
addCheck("OS checker recognizes P129", osChecker.includes('"P129"'));
addCheck("Command Center scoped UX remains in place", pageSource.includes("Business Build Approval Application Authority Grant Handoff Acceptance Capture Persistence") && pageSource.includes("Agent Flow Approval Application Authority Grant Handoff Acceptance Capture Persistence") && !pageSource.includes("Lite Approval Application Authority Grant Handoff Acceptance Capture Persistence") && !pageSource.includes("Chat Approval Application Authority Grant Handoff Acceptance Capture Persistence"));
addCheck("display model remains useful and blocked", displayModel.readinessRowCount === 3 && displayModel.blockedReadinessRowCount === 3 && displayModel.dbWritableCandidateCount === 0 && displayModel.runtimeWritableCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0 && displayModel.readinessRows?.every((row) => row.nextAction && row.blocker && row.disabledReason && row.ownerCapability));
addCheck("Playwright coverage remains scoped", routeTests.includes("Approval application authority grant handoff acceptance capture persistence appears only on scoped pages") && routeTests.includes("/command-center/business-build") && routeTests.includes("/command-center/agent-flow") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness"));
addCheck("docs record P128.7 complete", /P128\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P128\.7 final validation/i.test(readme) && /P128\.7 is\s+complete/i.test(platformRoadmap));
addCheck("docs record P129 planned-only", /P129[\s\S]*planned-only/i.test(readme) && /P129[\s\S]*planned-only/i.test(platformRoadmap));
addCheck(
  "phase status closed",
  ((status.currentPhase === "P128.7"
    && status.previousPhase === "P128.6"
    && status.nextPhase === "P129"
    && roadmap.currentPhase === "P128.7"
    && roadmap.previousPhase === "P128.6"
    && roadmap.nextPhase === "P129")
    || (status.currentPhase === "P129.1"
      && status.previousPhase === "P128.7"
      && status.nextPhase === "P129.2"
      && roadmap.currentPhase === "P129.1"
      && roadmap.previousPhase === "P128.7"
      && roadmap.nextPhase === "P129.2"))
    && statusById.get("P128")?.status === "complete"
    && statusById.get("P128.7")?.status === "complete"
    && ["planned", "in_progress"].includes(statusById.get("P129")?.status)
    && roadmapById.get("P128")?.status === "complete"
    && roadmapById.get("P128.7")?.status === "complete"
    && ["planned", "in_progress"].includes(roadmapById.get("P129")?.status),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P128.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P128.7 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("display model avoids raw schema names and record refs", !/(founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistence|approval_authority_grant_handoff_acceptance_capture_persistence|acceptanceCapturePersistenceDraftRef|acceptanceCapturePersistenceEventRef|acceptanceCapturePersistenceEvidenceRef|approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceKey|recordRef|requestKey)/i.test(serializedDisplayModel));
addCheck("display model avoids fake runnable actions", !/persist now|save now|write now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedDisplayModel));
addCheck("primary UX avoids internal phase labels and report paths", !/P128|p128\d|reports\/p128/i.test(primaryUxSource));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));
addCheck("public docs avoid raw persistence table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_records|acceptance_capture_persistence_events|capture_persistence_records|persistence_boundary_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/persist now|save now|write now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /acceptance capture persistence is enabled|acceptance capture is persisted|DB writes are enabled|runtime writes are enabled|migration is created|table is created|raw SQL is allowed|acceptance capture is live|handoff acceptance is enabled|authority grant is enabled|authority handoff is enabled|authority activation is enabled|approval application is enabled|approval decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P128 final validation for the acceptance capture persistence boundary.",
        "- Confirms P128.1-P128.6 reports, final OS status, P129 planned-only handoff, and scoped Command Center UX evidence.",
        "- Does not persist acceptance capture, create DB schemas, create migrations, write DB/runtime records, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: requiredCommands.map((command) => `- ${command}`).join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P128.7 is final validation only. P128 does not persist acceptance capture, create DB schemas, create migrations, write DB/runtime records, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend. P129 is planned-only until its own implementation-grade contract is written.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P128.7 Capture Persistence Final Validation Report", phase: "P128.7" },
);

printCheckReport("P128.7 Capture Persistence Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
