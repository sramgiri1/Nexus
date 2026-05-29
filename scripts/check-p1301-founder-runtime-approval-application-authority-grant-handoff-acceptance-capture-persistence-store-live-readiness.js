import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1301-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-report.md";
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|safe dry-run|dry-run-only|planned-only|display-only|read-only|future|local-only|contract\/policy only|contract\/checker\/docs\/status|contract\/policy-only)\b/i.test(context);
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
const p1301 = subphaseById.get("P130.1") || {};
const p1302 = subphaseById.get("P130.2") || {};
const p130Subphases = ["P130.1", "P130.2", "P130.3", "P130.4", "P130.5", "P130.6", "P130.7"];
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1297Checker = readText("scripts/check-p1297-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const readmeP130Slice = readme.match(/- P130\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const roadmapP130Slice = platformRoadmap.match(/P130\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${plan}\n${readmeP130Slice}\n${roadmapP130Slice}`;
const publicDocsBundle = `${readmeP130Slice}\n${roadmapP130Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P130.1";
const allowedFiles = new Set(p1301.allowedFiles || []);
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
const requiredScript = "check:p1301-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness";
const validationCommands = [
  "npm run check:p1301-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness",
  "npm run check:p1297-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"capture persistence store readiness appears only on scoped pages\"",
  "git diff --check",
];
const p130Status = statusById.get("P130") || {};
const p130Roadmap = roadmapById.get("P130") || {};
const p1301Status = statusById.get("P130.1") || {};
const p1301Roadmap = roadmapById.get("P130.1") || {};
const p130ProgressState =
  /^P130\.[2-7]$/.test(status.currentPhase || "")
  && /^P130\.[1-6]$/.test(status.previousPhase || "")
  && /^P130\.[3-7]$/.test(status.nextPhase || "")
  && roadmap.currentPhase === status.currentPhase
  && roadmap.previousPhase === status.previousPhase
  && roadmap.nextPhase === status.nextPhase
  && p130Status.status === "in_progress"
  && p130Roadmap.status === "in_progress";

addCheck("package script registered", Boolean(packageJson.scripts?.[requiredScript]));
addCheck("contract exists", existsSync(join(ROOT, CONTRACT_PATH)) && contract.phaseId === "P130");
addCheck("contract marks P130 in progress", contract.status === "in_progress" && ["P130.1", "P130.2", "P130.3"].includes(contract.currentSubphase) && ["P129.7", "P130.1", "P130.2"].includes(contract.previousSubphase) && ["P130.2", "P130.3", "P130.4"].includes(contract.nextSubphase));
addCheck("contract splits P130 into seven subphases", p130Subphases.every((phaseId) => subphaseById.has(phaseId)));
addCheck("P130.1 contract is complete", p1301.status === "complete" && p1301.scopeClassification === "NEXUS_OS_CHANGE" && p1301.expectedExports?.length === 0);
addCheck("P130.2 remains planned or complete", ["planned", "complete"].includes(p1302.status));
addCheck("P130.1 records narrow scope", /contract/i.test(p1301.narrowGoal || "") && /live store CRUD|DB\/runtime writes/i.test(p1301.narrowGoal || ""));
addCheck("P130.1 forbids project/dashboard/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1301.forbiddenFiles?.includes(path)));
addCheck("P130.1 records validation commands", validationCommands.every((command) => p1301.validationCommands?.includes(command)));
addCheck("P130.1 reuses report helpers", p1301.checkerUpdates?.some((item) => item.includes("shared/reportWriter.js")) && p1301.checkerUpdates?.some((item) => item.includes("shared/checkResultFormatter.js")));
addCheck("OS checker recognizes P130.1-P130.7", p130Subphases.every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P129.7 checker accepts P130.1 handoff", p1297Checker.includes("p1301StartedState") && p1297Checker.includes('status.currentPhase === "P130.1"') && p1297Checker.includes('status.nextPhase === "P130.2"'));
addCheck("P129.7 report passes", reportPassed("reports/p1297-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md"));
addCheck("plan records P130.1 implementation contract", /## P130\.1 Live Readiness Contract \/ Policy/.test(plan) && /Validation commands:/.test(plan) && /Rollback plan:/.test(plan));
addCheck("README records P130.1", /P130\.1 live readiness contract\/policy/i.test(readme));
addCheck("platform roadmap records P130.1", /P130\.1 is complete/i.test(platformRoadmap) && /P130\.2 is next/i.test(platformRoadmap));
addCheck("Command Center UX remains scoped and existing", pageSource.includes("Business Build Capture Persistence Store Readiness") && pageSource.includes("Agent Flow Capture Persistence Store Readiness") && !pageSource.includes("Lite Capture Persistence Store Readiness") && !pageSource.includes("Chat Capture Persistence Store Readiness") && !pageSource.includes("DemoApp"));
addCheck("Playwright scoped store readiness coverage remains", routeTests.includes("capture persistence store readiness appears only on scoped pages") && routeTests.includes("/command-center/business-build") && routeTests.includes("/command-center/agent-flow") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness"));
addCheck(
  "phase status advanced",
  ((
    status.currentPhase === "P130.1"
    && status.previousPhase === "P129.7"
    && status.nextPhase === "P130.2"
    && roadmap.currentPhase === "P130.1"
    && roadmap.previousPhase === "P129.7"
    && roadmap.nextPhase === "P130.2"
  ) || p130ProgressState)
    && statusById.get("P129")?.status === "complete"
    && roadmapById.get("P129")?.status === "complete"
    && p130Status.status === "in_progress"
    && p130Roadmap.status === "in_progress"
    && p1301Status.status === "complete"
    && p1301Roadmap.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P130.1 command center visibility recorded", p130Status.commandCenterVisible === true && p1301Status.commandCenterVisible === true && p1301Roadmap.commandCenterVisible === true);
addCheck("completed P130.1 entries have required fields", [p130Status, p1301Status, p1301Roadmap].every((entry) => Boolean(entry.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck(
  "changed files stay in P130.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P130.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P130.1 contract avoids forbidden allowed scope", !(p1301.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("public docs avoid raw store table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_store|acceptance_capture_store|persistence_store_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("checker has no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(readText("scripts/check-p1301-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness.js")) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(docsBundle));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/persist now|save now|write now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /store CRUD is enabled|CRUD is live|live store is enabled|DB reads are enabled|DB writes are enabled|runtime writes are enabled|migration is enabled|schema is created|acceptance capture is persisted|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P130.1 live readiness contract/policy setup.",
        "- Confirms P130 is in progress, P130.1 is complete, P130.2 is next, and P129.7 accepts the handoff.",
        "- Does not create DB schemas, create migrations, read or write DB records, write runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1301.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P130.1 is contract/policy only. It does not create DB schemas, run migrations, read or write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P130.1 Store Live Readiness Contract / Policy Report", phase: "P130.1" },
);

printCheckReport("P130.1 Store Live Readiness Contract / Policy Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
