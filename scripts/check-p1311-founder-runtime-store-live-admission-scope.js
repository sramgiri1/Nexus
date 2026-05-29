import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1311-founder-runtime-store-live-admission-scope-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p131-founder-runtime-store-live-admission-scope-contracts.json";
const PLAN_PATH = "docs/architecture/P131_FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_PLAN.md";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|safe dry-run|dry-run-only|planned-only|display-only|read-only|future|local-only|model-only|evidence gate|gate only|cannot|contract\/policy|safety boundary)\b/i.test(context);
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
const p1311 = subphaseById.get("P131.1") || {};
const p1312 = subphaseById.get("P131.2") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const osChecker = readText("scripts/check-os-phase-status.js");
const p1307Checker = readText("scripts/check-p1307-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness.js");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const readmeP131Slice = readme.match(/- P131\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const roadmapP131Slice = platformRoadmap.match(/P131\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${plan}\n${readmeP131Slice}\n${roadmapP131Slice}`;
const publicDocsBundle = `${readmeP131Slice}\n${roadmapP131Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P131.1";
const allowedFiles = new Set(p1311.allowedFiles || []);
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
const requiredScript = "check:p1311-founder-runtime-store-live-admission-scope";
const validationCommands = [
  "npm run check:p1311-founder-runtime-store-live-admission-scope",
  "npm run check:p1307-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"store live readiness gate appears only on scoped pages\"",
  "git diff --check",
];
const expectedSubphases = ["P131.1", "P131.2", "P131.3", "P131.4", "P131.5", "P131.6", "P131.7"];

addCheck("package script registered", Boolean(packageJson.scripts?.[requiredScript]));
addCheck("contract marks P131.1 current", contract.status === "in_progress" && contract.currentSubphase === "P131.1" && contract.previousSubphase === "P130.7" && contract.nextSubphase === "P131.2");
addCheck("contract records expected base commit", contract.expectedBaseCommit === "d63816a9" && p1311.expectedBaseCommit === "d63816a9");
addCheck("contract has seven implementation-grade subphases", expectedSubphases.every((phaseId) => subphaseById.has(phaseId)) && expectedSubphases.every((phaseId) => subphaseById.get(phaseId)?.scopeClassification === "NEXUS_OS_CHANGE"));
addCheck("P131.1 complete and P131.2 planned", p1311.status === "complete" && p1312.status === "planned");
addCheck("P131.1 allowed files include contract, checker, docs, reports", [
  CONTRACT_PATH,
  PLAN_PATH,
  "scripts/check-p1307-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness.js",
  "scripts/check-p1311-founder-runtime-store-live-admission-scope.js",
  "scripts/check-os-phase-status.js",
  REPORT_PATH,
].every((file) => p1311.allowedFiles?.includes(file)));
addCheck("P131.1 forbids dashboard/project/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1311.forbiddenFiles?.includes(path)));
addCheck("P131.1 records validation commands", validationCommands.every((command) => p1311.validationCommands?.includes(command)));
addCheck("P130.7 report passes", reportPassed("reports/p1307-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-report.md"));
addCheck("P130.7 checker accepts P131.1 handoff", p1307Checker.includes("p1311StartedState") && p1307Checker.includes('status.currentPhase === "P131.1"') && p1307Checker.includes('status.nextPhase === "P131.2"'));
addCheck("OS checker recognizes P131 subphases", expectedSubphases.every((phaseId) => osChecker.includes(`"${phaseId}"`)));
addCheck("P130.5 scoped data export remains intact", dataSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessDisplayModel") && dataSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun"));
addCheck("P130.5 scoped page labels remain intact", pageSource.includes("Business Build Store Live Readiness Gate") && pageSource.includes("Agent Flow Store Live Readiness Gate") && pageSource.includes('ariaLabel="Store live readiness gate"') && !pageSource.includes("Lite Store Live Readiness Gate") && !pageSource.includes("Chat Store Live Readiness Gate"));
addCheck("P130.5 scoped route coverage remains", routeTests.includes("store live readiness gate appears only on scoped pages") && routeTests.includes("Business Build Store Live Readiness Gate") && routeTests.includes("Agent Flow Store Live Readiness Gate") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness"));
addCheck("plan records P131.1 implementation", /## P131\.1 Store Live Admission Contract \/ Safety Boundary[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P131.1", /P131\.1 store live admission contract/i.test(readme));
addCheck("platform roadmap records P131.1", /P131\.1 is complete/i.test(platformRoadmap) && /P131\.2\s+is next/i.test(platformRoadmap));
addCheck(
  "phase status advanced",
  status.currentPhase === "P131.1"
    && status.previousPhase === "P130.7"
    && status.nextPhase === "P131.2"
    && roadmap.currentPhase === "P131.1"
    && roadmap.previousPhase === "P130.7"
    && roadmap.nextPhase === "P131.2"
    && statusById.get("P130")?.status === "complete"
    && roadmapById.get("P130")?.status === "complete"
    && statusById.get("P130.7")?.status === "complete"
    && roadmapById.get("P130.7")?.status === "complete"
    && statusById.get("P131")?.status === "in_progress"
    && roadmapById.get("P131")?.status === "in_progress"
    && statusById.get("P131.1")?.status === "complete"
    && roadmapById.get("P131.1")?.status === "complete"
    && statusById.get("P131.2")?.status === "planned"
    && roadmapById.get("P131.2")?.status === "planned",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "phase status summary objects advanced",
  status.current?.phaseId === "P131.1"
    && status.previous?.phaseId === "P130.7"
    && status.next?.phaseId === "P131.2"
    && roadmap.current?.phaseId === "P131.1"
    && roadmap.previous?.phaseId === "P130.7"
    && roadmap.next?.phaseId === "P131.2",
);
addCheck("completed P131.1 entries have required fields", [statusById.get("P131"), statusById.get("P131.1"), roadmapById.get("P131.1")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck(
  "changed files stay in P131.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P131.1 forbidden path check relaxed for ${status.currentPhase}`,
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
        "- Creates the P131 implementation-grade store live admission scope contract, seven-subphase split, safety boundary, docs, checker, status handoff, and planned P131.2 handoff.",
        "- Preserves the existing P130.5 Store Live Readiness Gate and does not change dashboard source or tests.",
        "- Does not enable DB/runtime writes, live CRUD, migrations, approval capture, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1311.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P131.1 is contract/checker/docs/status only. It does not capture approvals, persist decisions, create DB schemas, run migrations, read or write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P131.1 Store Live Admission Contract / Safety Boundary Report", phase: "P131.1" },
);

printCheckReport("P131.1 Store Live Admission Contract / Safety Boundary Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
