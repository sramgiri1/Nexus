import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1291-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md";
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|dry run|preview-only|planned-only|planned|display-only|read-only|future|local-only|contract\/policy only)\b/i.test(context);
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
const p1291 = subphaseById.get("P129.1") || {};
const p1292 = subphaseById.get("P129.2") || {};
const p129Subphases = ["P129.1", "P129.2", "P129.3", "P129.4", "P129.5", "P129.6", "P129.7"];
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1287Checker = readText("scripts/check-p1287-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p129ReadmeSlice = readme.match(/- P129\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const p129RoadmapSlice = platformRoadmap.match(/P129\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${plan}\n${p129ReadmeSlice}\n${p129RoadmapSlice}`;
const publicDocsBundle = `${p129ReadmeSlice}\n${p129RoadmapSlice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P129.1";
const allowedFiles = new Set(p1291.allowedFiles || []);
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
const requiredScript = "check:p1291-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store";
const validationCommands = [
  "npm run check:p1291-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store",
  "npm run check:p1287-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Approval application authority grant handoff acceptance capture persistence appears only on scoped pages\"",
  "git diff --check",
];
const p129Status = statusById.get("P129") || {};
const p129Roadmap = roadmapById.get("P129") || {};
const p1291Status = statusById.get("P129.1") || {};
const p1291Roadmap = roadmapById.get("P129.1") || {};
const p129ProgressState =
  /^P129\.[2-7]$/.test(status.currentPhase || "")
  && /^P129\.[1-6]$/.test(status.previousPhase || "")
  && /^P129\.[3-7]$/.test(status.nextPhase || "")
  && roadmap.currentPhase === status.currentPhase
  && roadmap.previousPhase === status.previousPhase
  && roadmap.nextPhase === status.nextPhase
  && p129Status.status === "in_progress"
  && p129Roadmap.status === "in_progress";

addCheck("package script registered", Boolean(packageJson.scripts?.[requiredScript]));
addCheck("contract exists", existsSync(join(ROOT, CONTRACT_PATH)) && contract.phaseId === "P129");
addCheck("contract marks P129 in progress", contract.status === "in_progress" && ["P129.1", "P129.2", "P129.3"].includes(contract.currentSubphase) && ["P128.7", "P129.1", "P129.2"].includes(contract.previousSubphase) && ["P129.2", "P129.3", "P129.4"].includes(contract.nextSubphase));
addCheck("contract splits P129 into seven subphases", p129Subphases.every((phaseId) => subphaseById.has(phaseId)));
addCheck("P129.1 contract is complete", p1291.status === "complete" && p1291.scopeClassification === "NEXUS_OS_CHANGE" && p1291.expectedExports?.length === 0);
addCheck("P129.2 remains planned or complete", ["planned", "complete"].includes(p1292.status));
addCheck("P129.1 records narrow scope", /contract/i.test(p1291.narrowGoal || "") && /DB\/runtime writes blocked|store CRUD/i.test(p1291.narrowGoal || ""));
addCheck("P129.1 forbids project/dashboard/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1291.forbiddenFiles?.includes(path)));
addCheck("P129.1 records validation commands", validationCommands.every((command) => p1291.validationCommands?.includes(command)));
addCheck("P129.1 reuses report helpers", p1291.checkerUpdates?.some((item) => item.includes("shared/reportWriter.js")) && p1291.checkerUpdates?.some((item) => item.includes("shared/checkResultFormatter.js")));
addCheck("OS checker recognizes P129.1-P129.7", p129Subphases.every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P128.7 checker accepts P129.1 handoff", p1287Checker.includes('status.currentPhase === "P129.1"') && p1287Checker.includes('status.nextPhase === "P129.2"') && p1287Checker.includes('["planned", "in_progress"].includes(statusById.get("P129")?.status)'));
addCheck("P128.7 report passes", reportPassed("reports/p1287-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md"));
addCheck("plan records P129.1 implementation contract", /## P129\.1 Persistence Store Contract \/ Policy/.test(plan) && /Validation commands:/.test(plan) && /Rollback plan:/.test(plan));
addCheck("README records P129.1", /P129\.1 persistence store contract\/policy/i.test(readme));
addCheck("platform roadmap records P129.1", /P129\.1 is complete/i.test(platformRoadmap) && /P129\.2 is next/i.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ((
    status.currentPhase === "P129.1"
    && status.previousPhase === "P128.7"
    && status.nextPhase === "P129.2"
    && roadmap.currentPhase === "P129.1"
    && roadmap.previousPhase === "P128.7"
    && roadmap.nextPhase === "P129.2"
  ) || p129ProgressState)
    && statusById.get("P128")?.status === "complete"
    && roadmapById.get("P128")?.status === "complete"
    && p129Status.status === "in_progress"
    && p129Roadmap.status === "in_progress"
    && p1291Status.status === "complete"
    && p1291Roadmap.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P129.1 command center visibility recorded", p129Status.commandCenterVisible === true && p1291Status.commandCenterVisible === true && p1291Roadmap.commandCenterVisible === true);
addCheck("completed P129.1 entries have required fields", [p129Status, p1291Status, p1291Roadmap].every((entry) => Boolean(entry.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck(
  "changed files stay in P129.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P129.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P129.1 contract avoids forbidden allowed scope", !(p1291.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("public docs avoid raw persistence table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_records|acceptance_capture_persistence_events|capture_persistence_records|persistence_store_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("checker has no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(readText("scripts/check-p1291-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js")) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(docsBundle));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/persist now|save now|write now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /store CRUD is enabled|CRUD is live|acceptance capture persistence is enabled|DB writes are enabled|runtime writes are enabled|migration is created|table is created|acceptance capture is persisted|acceptance capture is live|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P129.1 persistence store contract/policy setup.",
        "- Confirms P129 is in progress, P129.1 is complete, P129.2 is next, and P128.7 accepts the handoff.",
        "- Does not create DB schemas, create migrations, write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, call providers/models, dispatch agents, execute tools/workers, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1291.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P129.1 is contract/policy only. It does not create DB schemas, run migrations, write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P129.1 Persistence Store Contract / Policy Report", phase: "P129.1" },
);

printCheckReport("P129.1 Persistence Store Contract / Policy Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
