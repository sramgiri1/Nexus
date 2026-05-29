import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1305-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p130-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-contracts.json";
const PLAN_PATH = "docs/architecture/P130_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_PLAN.md";
const DATA_PATH = "dashboard/src/data/businessBuild.js";
const PAGE_PATH = "dashboard/src/pages/CommandCenterV2.jsx";
const ROUTE_TEST_PATH = "dashboard/tests/routes.spec.js";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|safe dry-run|dry-run-only|planned-only|display-only|read-only|future|local-only|model-only|evidence gate|gate only|cannot)\b/i.test(context);
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
const p1305 = subphaseById.get("P130.5") || {};
const p1306 = subphaseById.get("P130.6") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1304Checker = readText("scripts/check-p1304-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness.js");
const dataSource = readText(DATA_PATH);
const pageSource = readText(PAGE_PATH);
const routeTests = readText(ROUTE_TEST_PATH);
const model = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedModel = JSON.stringify(model);
const readmeP130Slice = readme.match(/- P130\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const roadmapP130Slice = platformRoadmap.match(/P130\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${plan}\n${readmeP130Slice}\n${roadmapP130Slice}`;
const publicDocsBundle = `${readmeP130Slice}\n${roadmapP130Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P130.5";
const allowedFiles = new Set(p1305.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
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
const requiredScript = "check:p1305-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness";
const validationCommands = [
  "npm run check:p1305-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness",
  "npm run check:p1304-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"store live readiness gate appears only on scoped pages\"",
  "git diff --check",
];
const summaryLabels = new Set((model.summaryRows || []).map((row) => row.label));
const rowLabels = new Set((model.readinessRows || []).map((row) => row.label));
const safetyLabels = new Set((model.safetyRows || []).map((row) => row.label));

addCheck("package script registered", Boolean(packageJson.scripts?.[requiredScript]));
addCheck("contract marks P130.5 complete", contract.status === "in_progress" && contract.currentSubphase === "P130.5" && contract.previousSubphase === "P130.4" && contract.nextSubphase === "P130.6" && p1305.status === "complete");
addCheck("P130.5 records expected base commit", p1305.expectedBaseCommit === "6e11709d");
addCheck("P130.6 remains planned", p1306.status === "planned");
addCheck("P130.5 allowed files include dashboard and checker", [DATA_PATH, PAGE_PATH, ROUTE_TEST_PATH, "scripts/check-p1305-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness.js"].every((file) => p1305.allowedFiles?.includes(file)));
addCheck("P130.5 forbids project/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1305.forbiddenFiles?.includes(path)));
addCheck("P130.5 records validation commands", validationCommands.every((command) => p1305.validationCommands?.includes(command)));
addCheck("P130.5 exports display model", dataSource.includes("export function buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessDisplayModel"));
addCheck("P130.5 reuses P130.4 safe dry run", dataSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun"));
addCheck("display model has useful summary rows", ["Founder idea", "Store live state", "Admission envelopes", "Live admission candidates", "Live CRUD candidates", "Approval-capture candidates", "Decision-persistence candidates", "DB-readable candidates", "DB-writable candidates", "Runtime-writable candidates", "Provider-spend candidates", "Owner capability", "Next action", "Disabled reason", "Evidence", "Activity", "Cost impact"].every((label) => summaryLabels.has(label)));
addCheck("display model has useful readiness rows", model.readinessRows?.length === 7 && ["Store live admission review", "Approval evidence admission", "Write boundary admission"].every((label) => rowLabels.has(label)));
addCheck("display model has scoped safety rows", ["Live admission", "Live CRUD actions", "Approval capture", "Decision persistence", "DB reads", "DB writes", "Runtime writes", "Agent dispatch", "Project mutation", "Network", "Provider spend"].every((label) => safetyLabels.has(label)));
addCheck("display model remains blocked and no-spend", model.blockedReadinessRowCount === model.readinessRowCount && model.liveAdmissionCandidateCount === 0 && model.liveCrudCandidateCount === 0 && model.approvalCaptureCandidateCount === 0 && model.decisionPersistenceCandidateCount === 0 && model.dbReadableCandidateCount === 0 && model.dbWritableCandidateCount === 0 && model.runtimeWritableCandidateCount === 0 && model.providerSpendCandidateCount === 0 && /No provider spend/i.test(model.costImpact));
addCheck("Command Center renders scoped store live gate", pageSource.includes("Business Build Store Live Readiness Gate") && pageSource.includes("Agent Flow Store Live Readiness Gate") && pageSource.includes('ariaLabel="Store live readiness gate"') && !pageSource.includes("Lite Store Live Readiness Gate") && !pageSource.includes("Chat Store Live Readiness Gate"));
addCheck("Playwright scoped route coverage added", routeTests.includes("store live readiness gate appears only on scoped pages") && routeTests.includes("Business Build Store Live Readiness Gate") && routeTests.includes("Agent Flow Store Live Readiness Gate"));
addCheck("Playwright coverage checks clean pages", ["/command-center/lite", "/command-center", "/command-center/os-roadmap", "/command-center/live-readiness"].every((path) => routeTests.includes(path)) && routeTests.includes('getByLabel("Store live readiness gate"'));
addCheck("P130.4 checker accepts P130.5 handoff", p1304Checker.includes("p1305StartedState") && p1304Checker.includes('status.currentPhase === "P130.5"'));
addCheck("P130.4 report passes", reportPassed("reports/p1304-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-report.md"));
addCheck("plan records P130.5 implementation", /## P130\.5 Command Center Store Live Gate UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P130.5", /P130\.5 Command Center store live gate UX/i.test(readme));
addCheck("platform roadmap records P130.5", /P130\.5 is complete/i.test(platformRoadmap) && /P130\.6\s+is next/i.test(platformRoadmap));
addCheck(
  "phase status advanced",
  status.currentPhase === "P130.5"
    && status.previousPhase === "P130.4"
    && status.nextPhase === "P130.6"
    && roadmap.currentPhase === "P130.5"
    && roadmap.previousPhase === "P130.4"
    && roadmap.nextPhase === "P130.6"
    && statusById.get("P130")?.status === "in_progress"
    && roadmapById.get("P130")?.status === "in_progress"
    && statusById.get("P130.4")?.status === "complete"
    && roadmapById.get("P130.4")?.status === "complete"
    && statusById.get("P130.5")?.status === "complete"
    && roadmapById.get("P130.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("completed P130.5 entries have required fields", [statusById.get("P130"), statusById.get("P130.5"), roadmapById.get("P130.5")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck(
  "changed files stay in P130.5 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P130.5 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("display model avoids raw report paths and private IDs", !/reports\/p130|private-project-|project_[A-Za-z0-9_-]*\d|token_|tenant_|workspace_|founder_[A-Za-z0-9_-]*\d/i.test(serializedModel));
addCheck("display model avoids raw table names and helper IDs", !/(approval_authority_grant_handoff_acceptance_capture_persistence_store|founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadiness|dryRunStoreLiveAdmissionReview)/i.test(serializedModel));
addCheck("display model avoids fake runnable actions", !/persist now|save now|write now|capture approval now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now|admit live store now/i.test(serializedModel));
addCheck("public docs avoid raw store table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_store|acceptance_capture_store|persistence_store_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/persist now|save now|write now|capture approval now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now|admit live store now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval capture is enabled|approval decision is persisted|store CRUD is enabled|CRUD is live|live store is enabled|live admission is enabled|DB reads are enabled|DB writes are enabled|runtime writes are enabled|migration is enabled|schema is created|acceptance capture is persisted|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P130.5 scoped Command Center store live readiness gate UX.",
        "- Confirms Business Build and Agent Flow render display-safe store live readiness while Chat with NEXUS, Lite, OS Roadmap, and Live Readiness stay clean.",
        "- Does not expose live actions, raw envelopes, raw report paths, raw table names, private IDs, DB/runtime writes, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1305.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P130.5 is display-only UX. It does not capture approvals, persist decisions, create DB schemas, run migrations, read or write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P130.5 Command Center Store Live Gate UX Report", phase: "P130.5" },
);

printCheckReport("P130.5 Command Center Store Live Gate UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
