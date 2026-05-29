import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1306-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p130-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-contracts.json";
const PLAN_PATH = "docs/architecture/P130_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_PLAN.md";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|safe dry-run|dry-run-only|planned-only|display-only|read-only|future|local-only|model-only|evidence gate|gate only|cannot|validation\/docs)\b/i.test(context);
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
const p1306 = subphaseById.get("P130.6") || {};
const p1307 = subphaseById.get("P130.7") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1305Checker = readText("scripts/check-p1305-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness.js");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const readmeP130Slice = readme.match(/- P130\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const roadmapP130Slice = platformRoadmap.match(/P130\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${plan}\n${readmeP130Slice}\n${roadmapP130Slice}`;
const publicDocsBundle = `${readmeP130Slice}\n${roadmapP130Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P130.6";
const allowedFiles = new Set(p1306.allowedFiles || []);
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
const requiredScript = "check:p1306-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness";
const validationCommands = [
  "npm run check:p1306-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness",
  "npm run check:p1305-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"store live readiness gate appears only on scoped pages\"",
  "git diff --check",
];
const p130Reports = [
  "reports/p1301-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-report.md",
  "reports/p1302-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-report.md",
  "reports/p1303-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-report.md",
  "reports/p1304-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-report.md",
  "reports/p1305-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-report.md",
];
const completedSubphases = ["P130.1", "P130.2", "P130.3", "P130.4", "P130.5"];

addCheck("package script registered", Boolean(packageJson.scripts?.[requiredScript]));
addCheck("contract marks P130.6 complete", contract.status === "in_progress" && contract.currentSubphase === "P130.6" && contract.previousSubphase === "P130.5" && contract.nextSubphase === "P130.7" && p1306.status === "complete");
addCheck("P130.6 records expected base commit", p1306.expectedBaseCommit === "ebda5611");
addCheck("P130.7 remains planned", p1307.status === "planned");
addCheck("P130.6 allowed files include checker and reports", p1306.allowedFiles?.includes("scripts/check-p1306-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness.js") && p1306.allowedFiles?.includes(REPORT_PATH));
addCheck("P130.6 forbids dashboard/project/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1306.forbiddenFiles?.includes(path)));
addCheck("P130.6 records validation commands", validationCommands.every((command) => p1306.validationCommands?.includes(command)));
addCheck("P130.1-P130.5 contract entries complete", completedSubphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P130.1-P130.5 reports pass", p130Reports.every(reportPassed));
addCheck("P130.5 checker accepts P130.6 handoff", p1305Checker.includes("p1306StartedState") && p1305Checker.includes('status.currentPhase === "P130.6"'));
addCheck("P130.5 scoped data export remains intact", dataSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessDisplayModel") && dataSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun"));
addCheck("P130.5 scoped page labels remain intact", pageSource.includes("Business Build Store Live Readiness Gate") && pageSource.includes("Agent Flow Store Live Readiness Gate") && pageSource.includes('ariaLabel="Store live readiness gate"') && !pageSource.includes("Lite Store Live Readiness Gate") && !pageSource.includes("Chat Store Live Readiness Gate"));
addCheck("P130.5 scoped route coverage remains", routeTests.includes("store live readiness gate appears only on scoped pages") && routeTests.includes("Business Build Store Live Readiness Gate") && routeTests.includes("Agent Flow Store Live Readiness Gate") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness"));
addCheck("plan records P130.6 implementation", /## P130\.6 Store Live Readiness Validation \/ Docs[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P130.6", /P130\.6 store live readiness validation/i.test(readme));
addCheck("platform roadmap records P130.6", /P130\.6 is complete/i.test(platformRoadmap) && /P130\.7\s+is next/i.test(platformRoadmap));
addCheck(
  "phase status advanced",
  status.currentPhase === "P130.6"
    && status.previousPhase === "P130.5"
    && status.nextPhase === "P130.7"
    && roadmap.currentPhase === "P130.6"
    && roadmap.previousPhase === "P130.5"
    && roadmap.nextPhase === "P130.7"
    && statusById.get("P130")?.status === "in_progress"
    && roadmapById.get("P130")?.status === "in_progress"
    && statusById.get("P130.5")?.status === "complete"
    && roadmapById.get("P130.5")?.status === "complete"
    && statusById.get("P130.6")?.status === "complete"
    && roadmapById.get("P130.6")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "phase status summary objects advanced",
  status.current?.phaseId === "P130.6"
    && status.previous?.phaseId === "P130.5"
    && status.next?.phaseId === "P130.7"
    && roadmap.current?.phaseId === "P130.6"
    && roadmap.previous?.phaseId === "P130.5"
    && roadmap.next?.phaseId === "P130.7",
);
addCheck("completed P130.6 entries have required fields", [statusById.get("P130"), statusById.get("P130.6"), roadmapById.get("P130.6")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck(
  "changed files stay in P130.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P130.6 forbidden path check relaxed for ${status.currentPhase}`,
);
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
        "- Validates aggregate P130.1-P130.5 evidence, reports, docs, scoped route coverage, checker handoffs, and OS status before final validation.",
        "- Confirms P130.5 Store Live Readiness Gate remains scoped to Business Build and Agent Flow with Chat with NEXUS, Lite, OS Roadmap, and Live Readiness clean.",
        "- Does not modify dashboard source/tests, create runtime exports, create schemas, write DB/runtime records, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1306.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P130.6 is validation/docs closure only. It does not capture approvals, persist decisions, create DB schemas, run migrations, read or write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P130.6 Store Live Readiness Validation / Docs Report", phase: "P130.6" },
);

printCheckReport("P130.6 Store Live Readiness Validation / Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
