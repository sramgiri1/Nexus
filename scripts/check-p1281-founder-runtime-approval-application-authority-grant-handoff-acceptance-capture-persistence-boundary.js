import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1281-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md";
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

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|dry run|display-only|read-only|validation-only|planned-only|planned|future|local-only|contract\/policy only)\b/i.test(context);
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
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1277Checker = readText("scripts/check-p1277-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1281 = subphaseById.get("P128.1") || {};
const p128Subphases = ["P128.1", "P128.2", "P128.3", "P128.4", "P128.5", "P128.6", "P128.7"];
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P128.1";
const allowedFiles = new Set(p1281.allowedFiles || []);
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
const requiredScript = "check:p1281-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary";
const validationCommands = [
  "npm run check:p1281-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary",
  "npm run check:p1277-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Approval application authority grant handoff acceptance capture appears only on scoped pages\"",
  "git diff --check",
];
const docsBundle = `${plan}\n${readme}\n${platformRoadmap}`;
const publicDocsBundle = `${readme}\n${platformRoadmap}`;
const p128Status = statusById.get("P128") || {};
const p128Roadmap = roadmapById.get("P128") || {};
const p1281Status = statusById.get("P128.1") || {};
const p1281Roadmap = roadmapById.get("P128.1") || {};
const p1282StartedState =
  status.currentPhase === "P128.2"
  && status.previousPhase === "P128.1"
  && status.nextPhase === "P128.3"
  && roadmap.currentPhase === "P128.2"
  && roadmap.previousPhase === "P128.1"
  && roadmap.nextPhase === "P128.3"
  && p128Status.status === "in_progress"
  && p128Roadmap.status === "in_progress";
const p128ProgressState =
  /^P128\.[2-7]$/.test(status.currentPhase || "")
  && /^P128\.[1-6]$/.test(status.previousPhase || "")
  && /^P128\.[3-7]$/.test(status.nextPhase || "")
  && roadmap.currentPhase === status.currentPhase
  && roadmap.previousPhase === status.previousPhase
  && roadmap.nextPhase === status.nextPhase
  && p128Status.status === "in_progress"
  && p128Roadmap.status === "in_progress";

addCheck("package script registered", Boolean(packageJson.scripts?.[requiredScript]));
addCheck("contract exists", existsSync(join(ROOT, CONTRACT_PATH)) && contract.phaseId === "P128");
addCheck("contract marks P128 in progress", contract.status === "in_progress" && ["P128.1", "P128.2", "P128.3"].includes(contract.currentSubphase) && ["P127.7", "P128.1", "P128.2"].includes(contract.previousSubphase) && ["P128.2", "P128.3", "P128.4"].includes(contract.nextSubphase));
addCheck("contract splits P128 into seven subphases", p128Subphases.every((phaseId) => subphaseById.has(phaseId)));
addCheck("P128.1 contract is complete", p1281.status === "complete" && p1281.scopeClassification === "NEXUS_OS_CHANGE" && p1281.expectedExports?.length === 0);
addCheck("P128.1 records narrow scope", /contract/i.test(p1281.narrowGoal || "") && /acceptance capture persistence blocked/i.test(p1281.narrowGoal || ""));
addCheck("P128.1 forbids project and runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1281.forbiddenFiles?.includes(path)));
addCheck("P128.1 records validation commands", validationCommands.every((command) => p1281.validationCommands?.includes(command)));
addCheck("P128.1 reuses report helpers", p1281.checkerUpdates?.some((item) => item.includes("shared/reportWriter.js")) && p1281.checkerUpdates?.some((item) => item.includes("shared/checkResultFormatter.js")));
addCheck("OS checker recognizes P128.1-P128.7", p128Subphases.every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P127.7 checker accepts P128.1 handoff", p1277Checker.includes("p1281HandoffState") && p1277Checker.includes('status.nextPhase === "P128.2"'));
addCheck("plan records P128.1 implementation contract", /## P128\.1 Capture Persistence Boundary Contract \/ Policy/.test(plan) && /Validation commands:/.test(plan) && /Rollback plan:/.test(plan));
addCheck("README records P128.1", /P128\.1 capture persistence boundary contract\/policy/i.test(readme));
addCheck("platform roadmap records P128.1", /P128\.1 is complete/i.test(platformRoadmap) && /P128\.2 is next/i.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ((
    status.currentPhase === "P128.1"
    && status.previousPhase === "P127.7"
    && status.nextPhase === "P128.2"
    && roadmap.currentPhase === "P128.1"
    && roadmap.previousPhase === "P127.7"
    && roadmap.nextPhase === "P128.2"
  ) || p1282StartedState || p128ProgressState)
    && p128Status.status === "in_progress"
    && p128Roadmap.status === "in_progress"
    && p1281Status.status === "complete"
    && p1281Roadmap.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P128.1 command center visibility recorded", p128Status.commandCenterVisible === true && p1281Status.commandCenterVisible === true && p1281Roadmap.commandCenterVisible === true);
addCheck("completed P128.1 entries have required fields", [p128Status, p1281Status, p1281Roadmap].every((entry) => Boolean(entry.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck(
  "changed files stay in P128.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P128.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P128.1 contract avoids forbidden allowed scope", !(p1281.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("public docs avoid raw persistence table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_records|acceptance_capture_persistence_events|capture_persistence_records|persistence_boundary_records|raw sql table|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("checker has no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(readText("scripts/check-p1281-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js")) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /acceptance capture persistence is enabled|DB writes are enabled|runtime writes are enabled|migration is created|table is created|acceptance capture is persisted|acceptance capture is live|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P128.1 capture persistence boundary contract/policy setup.",
        "- Confirms P128 is in progress, P128.1 is complete, P128.2 is next, and P127.7 accepts the handoff.",
        "- Does not persist acceptance capture, create DB schemas, create migrations, write DB/runtime records, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, call providers/models, dispatch agents, execute tools/workers, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1281.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P128.1 is contract/policy only. It does not persist acceptance capture, create DB schemas, create migrations, write DB/runtime records, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P128.1 Capture Persistence Boundary Contract / Policy Report", phase: "P128.1" },
);

printCheckReport("P128.1 Capture Persistence Boundary Contract / Policy Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
