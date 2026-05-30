import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1321-founder-runtime-store-live-admission-execution-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p132-founder-runtime-store-live-admission-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P132_FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_PLAN.md";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|contract-only|contract-gated|future|local-only|model-only|preview|dry run|dry-run-only|validation-only|docs-only|cannot|later subphase|safety boundary)\b/i.test(context);
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
const p1321 = subphaseById.get("P132.1") || {};
const p1322 = subphaseById.get("P132.2") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1317Checker = readText("scripts/check-p1317-founder-runtime-store-live-admission-scope.js");
const checkerSource = readText("scripts/check-p1321-founder-runtime-store-live-admission-execution.js");
const businessData = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const readmeP132Slice = readme.match(/- P132\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const roadmapP132Slice = platformRoadmap.match(/P132\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readmeP132Slice}\n${roadmapP132Slice}`;
const publicDocsBundle = `${readmeP132Slice}\n${roadmapP132Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P132.1";
const allowedFiles = new Set(p1321.allowedFiles || []);
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
const expectedSubphases = ["P132.1", "P132.2", "P132.3", "P132.4", "P132.5", "P132.6", "P132.7"];
const requiredScript = "check:p1321-founder-runtime-store-live-admission-execution";
const validationCommands = [
  "npm run check:p1321-founder-runtime-store-live-admission-execution",
  "npm run check:p1317-founder-runtime-store-live-admission-scope",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"store live readiness gate appears only on scoped pages\"",
  "git diff --check",
];
const p1321StartedState =
  status.currentPhase === "P132.1"
  && status.previousPhase === "P131.7"
  && status.nextPhase === "P132.2"
  && roadmap.currentPhase === "P132.1"
  && roadmap.previousPhase === "P131.7"
  && roadmap.nextPhase === "P132.2"
  && status.current?.phaseId === "P132.1"
  && status.previous?.phaseId === "P131.7"
  && status.next?.phaseId === "P132.2"
  && roadmap.current?.phaseId === "P132.1"
  && roadmap.previous?.phaseId === "P131.7"
  && roadmap.next?.phaseId === "P132.2"
  && statusById.get("P131")?.status === "complete"
  && roadmapById.get("P131")?.status === "complete"
  && statusById.get("P131.7")?.status === "complete"
  && roadmapById.get("P131.7")?.status === "complete"
  && statusById.get("P132")?.status === "in_progress"
  && roadmapById.get("P132")?.status === "in_progress"
  && statusById.get("P132.1")?.status === "complete"
  && roadmapById.get("P132.1")?.status === "complete"
  && statusById.get("P132.2")?.status === "planned"
  && roadmapById.get("P132.2")?.status === "planned";
const p1322StartedState =
  status.currentPhase === "P132.2"
  && status.previousPhase === "P132.1"
  && status.nextPhase === "P132.3"
  && roadmap.currentPhase === "P132.2"
  && roadmap.previousPhase === "P132.1"
  && roadmap.nextPhase === "P132.3"
  && status.current?.phaseId === "P132.2"
  && status.previous?.phaseId === "P132.1"
  && status.next?.phaseId === "P132.3"
  && roadmap.current?.phaseId === "P132.2"
  && roadmap.previous?.phaseId === "P132.1"
  && roadmap.next?.phaseId === "P132.3"
  && statusById.get("P131")?.status === "complete"
  && roadmapById.get("P131")?.status === "complete"
  && statusById.get("P131.7")?.status === "complete"
  && roadmapById.get("P131.7")?.status === "complete"
  && statusById.get("P132")?.status === "in_progress"
  && roadmapById.get("P132")?.status === "in_progress"
  && statusById.get("P132.1")?.status === "complete"
  && roadmapById.get("P132.1")?.status === "complete"
  && statusById.get("P132.2")?.status === "complete"
  && roadmapById.get("P132.2")?.status === "complete"
  && statusById.get("P132.3")?.status === "planned"
  && roadmapById.get("P132.3")?.status === "planned";
const p1323StartedState =
  status.currentPhase === "P132.3"
  && status.previousPhase === "P132.2"
  && status.nextPhase === "P132.4"
  && roadmap.currentPhase === "P132.3"
  && roadmap.previousPhase === "P132.2"
  && roadmap.nextPhase === "P132.4"
  && status.current?.phaseId === "P132.3"
  && status.previous?.phaseId === "P132.2"
  && status.next?.phaseId === "P132.4"
  && roadmap.current?.phaseId === "P132.3"
  && roadmap.previous?.phaseId === "P132.2"
  && roadmap.next?.phaseId === "P132.4"
  && statusById.get("P131")?.status === "complete"
  && roadmapById.get("P131")?.status === "complete"
  && statusById.get("P131.7")?.status === "complete"
  && roadmapById.get("P131.7")?.status === "complete"
  && statusById.get("P132")?.status === "in_progress"
  && roadmapById.get("P132")?.status === "in_progress"
  && statusById.get("P132.1")?.status === "complete"
  && roadmapById.get("P132.1")?.status === "complete"
  && statusById.get("P132.2")?.status === "complete"
  && roadmapById.get("P132.2")?.status === "complete"
  && statusById.get("P132.3")?.status === "complete"
  && roadmapById.get("P132.3")?.status === "complete"
  && statusById.get("P132.4")?.status === "planned"
  && roadmapById.get("P132.4")?.status === "planned";
const p1324StartedState =
  status.currentPhase === "P132.4"
  && status.previousPhase === "P132.3"
  && status.nextPhase === "P132.5"
  && roadmap.currentPhase === "P132.4"
  && roadmap.previousPhase === "P132.3"
  && roadmap.nextPhase === "P132.5"
  && status.current?.phaseId === "P132.4"
  && status.previous?.phaseId === "P132.3"
  && status.next?.phaseId === "P132.5"
  && roadmap.current?.phaseId === "P132.4"
  && roadmap.previous?.phaseId === "P132.3"
  && roadmap.next?.phaseId === "P132.5"
  && statusById.get("P131")?.status === "complete"
  && roadmapById.get("P131")?.status === "complete"
  && statusById.get("P131.7")?.status === "complete"
  && roadmapById.get("P131.7")?.status === "complete"
  && statusById.get("P132")?.status === "in_progress"
  && roadmapById.get("P132")?.status === "in_progress"
  && statusById.get("P132.1")?.status === "complete"
  && roadmapById.get("P132.1")?.status === "complete"
  && statusById.get("P132.2")?.status === "complete"
  && roadmapById.get("P132.2")?.status === "complete"
  && statusById.get("P132.3")?.status === "complete"
  && roadmapById.get("P132.3")?.status === "complete"
  && statusById.get("P132.4")?.status === "complete"
  && roadmapById.get("P132.4")?.status === "complete"
  && statusById.get("P132.5")?.status === "planned"
  && roadmapById.get("P132.5")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[requiredScript]));
addCheck("contract marks P132.1 complete", contract.status === "in_progress" && ((contract.currentSubphase === "P132.1" && contract.previousSubphase === "P131.7" && contract.nextSubphase === "P132.2") || (contract.currentSubphase === "P132.2" && contract.previousSubphase === "P132.1" && contract.nextSubphase === "P132.3") || (contract.currentSubphase === "P132.3" && contract.previousSubphase === "P132.2" && contract.nextSubphase === "P132.4") || (contract.currentSubphase === "P132.4" && contract.previousSubphase === "P132.3" && contract.nextSubphase === "P132.5")) && p1321.status === "complete");
addCheck("contract records expected base commit", contract.expectedBaseCommit === "39e2da0a" && p1321.expectedBaseCommit === "39e2da0a");
addCheck("contract has seven implementation-grade subphases", expectedSubphases.every((phaseId) => subphaseById.has(phaseId)) && expectedSubphases.every((phaseId) => subphaseById.get(phaseId)?.scopeClassification === "NEXUS_OS_CHANGE"));
addCheck("P132.1 complete and P132.2 planned or complete", p1321.status === "complete" && ["planned", "complete"].includes(p1322.status));
addCheck("P132.1 allowed files include contract, checker, docs, reports", [
  CONTRACT_PATH,
  PLAN_PATH,
  "scripts/check-p1321-founder-runtime-store-live-admission-execution.js",
  "scripts/check-p1317-founder-runtime-store-live-admission-scope.js",
  "scripts/check-os-phase-status.js",
  REPORT_PATH,
  "reports/p1317-founder-runtime-store-live-admission-scope-report.md",
].every((file) => p1321.allowedFiles?.includes(file)));
addCheck("P132.1 forbids dashboard/project/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1321.forbiddenFiles?.includes(path)));
addCheck("P132.1 records validation commands", validationCommands.every((command) => p1321.validationCommands?.includes(command)));
addCheck("P131.7 report passes", reportPassed("reports/p1317-founder-runtime-store-live-admission-scope-report.md"));
addCheck("P131.7 checker accepts P132.1 handoff", p1317Checker.includes("p1321StartedState") && p1317Checker.includes('status.currentPhase === "P132.1"') && p1317Checker.includes('status.nextPhase === "P132.2"'));
addCheck("OS checker recognizes P132 subphases", expectedSubphases.every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P131.5 scoped data export remains intact", businessData.includes("buildFounderRuntimeStoreLiveAdmissionScopeDisplayModel") && businessData.includes("founderRuntimeStoreLiveAdmissionScope") && businessData.includes("buildFounderRuntimeStoreLiveAdmissionScopeWriteBoundaryAdmissionDryRun"));
addCheck("P131.5 scoped page labels remain intact", pageSource.includes("Business Build Store Live Admission Scope") && pageSource.includes("Agent Flow Store Live Admission Scope") && pageSource.includes('ariaLabel="Store live admission scope"') && !pageSource.includes("Lite Store Live Admission Scope") && !pageSource.includes("Chat Store Live Admission Scope"));
addCheck("P131.5 scoped route coverage remains", routeTests.includes("store live readiness gate appears only on scoped pages") && routeTests.includes("Store live admission scope") && routeTests.includes("Business Build Store Live Admission Scope") && routeTests.includes("/command-center/business-build") && routeTests.includes("/command-center/agent-flow") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("dark") && routeTests.includes("light") && routeTests.includes("system"));
addCheck("P132 plan records P132.1 implementation", /## P132\.1 Store Live Execution Contract \/ Safety Boundary[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P132.1", /P132\.1 store live execution contract/i.test(readme));
addCheck("platform roadmap records P132.1", /P132\.1 is complete/i.test(platformRoadmap) && (/P132\.2\s+is planned/i.test(platformRoadmap) || /P132\.2 is complete/i.test(platformRoadmap)));
addCheck("phase status advanced", p1321StartedState || p1322StartedState || p1323StartedState || p1324StartedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P132.1 entries have required fields", [statusById.get("P132"), statusById.get("P132.1"), roadmapById.get("P132.1")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P132 handoff remains safe", (statusById.get("P132.2")?.status === "planned" && roadmapById.get("P132.2")?.status === "planned" && !(statusById.get("P132.2")?.checksRun || []).length && !(roadmapById.get("P132.2")?.checksRun || []).length) || p1322StartedState || p1323StartedState || p1324StartedState);
addCheck(
  "changed files stay in P132.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P132.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P132.1 contract avoids forbidden file scope", !(p1321.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("primary UX avoids DemoApp leakage", !pageSource.includes("DemoApp"));
addCheck("public docs avoid raw store table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_store|acceptance_capture_store|persistence_store_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/persist now|save now|write now|capture approval now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now|admit live store now|execute live now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval capture is enabled|approval decision is persisted|request persistence is enabled|store CRUD is enabled|CRUD is live|live store is enabled|live admission is enabled|DB reads are enabled|DB writes are enabled|runtime writes are enabled|migration is enabled|schema is created|acceptance capture is persisted|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump/i));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(checkerSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(docsBundle));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Creates the P132 implementation-grade store live execution contract, seven-subphase split, safety boundary, checker, docs, status handoff, and planned P132.2 handoff.",
        "- Preserves the existing scoped Store Live Admission Scope UX and does not change dashboard source or tests.",
        "- Does not create DB schemas, run migrations, read or write DB/runtime records, execute CRUD, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1321.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P132.1 is contract/checker/docs/status only. It does not create DB schemas, run migrations, read or write DB/runtime records, persist requests, execute CRUD, capture approvals, accept handoff, grant authority, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P132.1 Store Live Admission Execution Contract Report", phase: "P132.1" },
);

printCheckReport("P132.1 Store Live Admission Execution Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
