import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1297-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p129-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-contracts.json";
const PLAN_PATH = "docs/architecture/P129_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_PLAN.md";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|safe dry-run|dry-run-only|planned-only|display-only|read-only|future|local-only|validation only|docs only)\b/i.test(context);
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
const p1297 = subphaseById.get("P129.7") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const osChecker = readText("scripts/check-os-phase-status.js");
const p1295Checker = readText("scripts/check-p1295-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js");
const p1296Checker = readText("scripts/check-p1296-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedDisplayModel = JSON.stringify(displayModel);
const primaryUxSource = `${pageSource}\n${serializedDisplayModel}`;
const readmeP129Slice = readme.match(/- P129\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const platformP129Slice = platformRoadmap.match(/P129\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${plan}\n${readmeP129Slice}\n${platformP129Slice}`;
const publicDocsBundle = `${readmeP129Slice}\n${platformP129Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P129.7";
const allowedFiles = new Set(p1297.allowedFiles || []);
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
const p129Reports = [
  "reports/p1291-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md",
  "reports/p1292-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md",
  "reports/p1293-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md",
  "reports/p1294-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md",
  "reports/p1295-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md",
  "reports/p1296-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md",
];
const requiredCommands = [
  "npm run check:p1297-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store",
  "npm run check:p1296-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store",
  "npm run check:p1295-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"capture persistence store readiness appears only on scoped pages\"",
  "git diff --check",
];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1297-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store"]));
addCheck("contract final state set", contract.status === "complete" && contract.currentSubphase === "P129.7" && contract.previousSubphase === "P129.6" && contract.nextSubphase === "P130" && contract.expectedBaseCommit === "16f5cb5a" && contract.nextPhase === "P130");
addCheck("contract marks P129.1-P129.7 complete", ["P129.1", "P129.2", "P129.3", "P129.4", "P129.5", "P129.6", "P129.7"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract records validation commands", requiredCommands.every((command) => p1297.validationCommands?.includes(command)));
addCheck("contract records no runtime exports", Array.isArray(p1297.expectedExports) && p1297.expectedExports.length === 0 && /No runtime exports/i.test(p1297.dataShape || ""));
addCheck("P129.7 avoids forbidden file scope", !(p1297.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("P129.7 includes final checker handoff scope", p1297.allowedFiles?.includes("scripts/check-p1295-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js") && p1297.allowedFiles?.includes("scripts/check-p1296-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js"));
addCheck("P129.1-P129.6 reports pass", p129Reports.every(reportPassed), p129Reports.filter((report) => !reportPassed(report)).join(", "));
addCheck("P129.5 checker accepts P129.7 final state", p1295Checker.includes("p1297FinalState") && p1295Checker.includes('status.nextPhase === "P130"') && p1295Checker.includes('["in_progress", "complete"].includes(statusById.get("P129")?.status)'));
addCheck("P129.6 checker accepts P129.7 final state", p1296Checker.includes("p1297StartedState") && p1296Checker.includes('status.nextPhase === "P130"') && p1296Checker.includes('["in_progress", "complete"].includes(statusById.get("P129")?.status)'));
addCheck("OS checker recognizes P130", osChecker.includes('"P130"'));
addCheck("store display model remains useful and blocked", displayModel.readinessRowCount === 6 && displayModel.blockedReadinessRowCount === 6 && displayModel.liveCrudActionCount === 0 && displayModel.dbWritableCandidateCount === 0 && displayModel.runtimeWritableCandidateCount === 0 && displayModel.providerSpendCandidateCount === 0 && displayModel.readinessRows?.every((row) => row.nextAction && row.blocker && row.disabledReason && row.ownerCapability));
addCheck("Command Center scoped UX remains in place", pageSource.includes("Business Build Capture Persistence Store Readiness") && pageSource.includes("Agent Flow Capture Persistence Store Readiness") && !pageSource.includes("Lite Capture Persistence Store Readiness") && !pageSource.includes("Chat Capture Persistence Store Readiness"));
addCheck("Chat and Lite remain clean", !pageSource.includes("Lite Capture Persistence Store Readiness") && !pageSource.includes("Chat Capture Persistence Store Readiness") && !pageSource.includes("Ask NEXUS Capture Persistence Store Readiness"));
addCheck("Playwright coverage remains scoped", routeTests.includes("capture persistence store readiness appears only on scoped pages") && routeTests.includes("/command-center/business-build") && routeTests.includes("/command-center/agent-flow") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness"));
addCheck("docs record P129.7 complete", /## P129\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P129\.7 final validation/i.test(readme) && /P129\.7 is complete/i.test(platformRoadmap));
addCheck("docs record P130 planned-only", /P130[\s\S]*planned-only/i.test(readme) && /P130[\s\S]*planned-only/i.test(platformRoadmap));
addCheck(
  "phase status closed",
  status.currentPhase === "P129.7"
    && status.previousPhase === "P129.6"
    && status.nextPhase === "P130"
    && roadmap.currentPhase === "P129.7"
    && roadmap.previousPhase === "P129.6"
    && roadmap.nextPhase === "P130"
    && statusById.get("P129")?.status === "complete"
    && statusById.get("P129.7")?.status === "complete"
    && statusById.get("P130")?.status === "planned"
    && roadmapById.get("P129")?.status === "complete"
    && roadmapById.get("P129.7")?.status === "complete"
    && roadmapById.get("P130")?.status === "planned",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P129.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P129.7 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("display model avoids raw store internals", !/(founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStore|approval_authority_grant_handoff_acceptance_capture|acceptanceCaptureStoreRecord|acceptanceCaptureStoreIndex|acceptanceCaptureStoreEvidenceLink|targetEntityName|actionName|recordRef|requestKey)/i.test(serializedDisplayModel));
addCheck("display model avoids fake runnable actions", !/persist now|save now|write now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedDisplayModel));
addCheck("primary UX avoids internal phase labels and report paths", !/P129|p129\d|reports\/p129/i.test(primaryUxSource));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));
addCheck("public docs avoid raw store table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_store|acceptance_capture_store|persistence_store_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/persist now|save now|write now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /store CRUD is enabled|CRUD is live|DB reads are enabled|DB writes are enabled|runtime writes are enabled|migration is enabled|migration is live|schema is created|acceptance capture is persisted|capture persistence store is live|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P129 final validation for the acceptance capture persistence store.",
        "- Confirms P129.1-P129.6 reports, final OS status, P130 planned-only handoff, and scoped Command Center store readiness evidence.",
        "- Does not create DB schemas, run migrations, read or write DB records, write runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: requiredCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P129.7 is final validation only. P129 does not create DB schemas, create migrations, read or write DB records, write runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend. P130 is planned-only until its own implementation-grade contract is written.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P129.7 Capture Persistence Store Final Validation Report", phase: "P129.7" },
);

printCheckReport("P129.7 Capture Persistence Store Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
