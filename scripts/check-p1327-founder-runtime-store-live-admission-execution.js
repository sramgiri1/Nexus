import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1327-founder-runtime-store-live-admission-execution-report.md";
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|display-only|read-only|future|local-only|model-only|preview-only|gate-only|validation\/docs|validation-only|docs-only|final validation|cannot|preserve)\b/i.test(context);
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
const p1327 = subphaseById.get("P132.7") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1326Checker = readText("scripts/check-p1326-founder-runtime-store-live-admission-execution.js");
const checkerSource = readText("scripts/check-p1327-founder-runtime-store-live-admission-execution.js");
const businessData = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const readmeP132Slice = readme.match(/- P132\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const roadmapP132Slice = platformRoadmap.match(/P132\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readmeP132Slice}\n${roadmapP132Slice}`;
const publicDocsBundle = `${readmeP132Slice}\n${roadmapP132Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P132.7";
const allowedFiles = new Set(p1327.allowedFiles || []);
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
const completedSubphases = ["P132.1", "P132.2", "P132.3", "P132.4", "P132.5", "P132.6", "P132.7"];
const previousReports = [
  "reports/p1321-founder-runtime-store-live-admission-execution-report.md",
  "reports/p1322-founder-runtime-store-live-admission-execution-report.md",
  "reports/p1323-founder-runtime-store-live-admission-execution-report.md",
  "reports/p1324-founder-runtime-store-live-admission-execution-report.md",
  "reports/p1325-founder-runtime-store-live-admission-execution-report.md",
  "reports/p1326-founder-runtime-store-live-admission-execution-report.md",
];
const requiredScripts = [
  "check:p1321-founder-runtime-store-live-admission-execution",
  "check:p1322-founder-runtime-store-live-admission-execution",
  "check:p1323-founder-runtime-store-live-admission-execution",
  "check:p1324-founder-runtime-store-live-admission-execution",
  "check:p1325-founder-runtime-store-live-admission-execution",
  "check:p1326-founder-runtime-store-live-admission-execution",
  "check:p1327-founder-runtime-store-live-admission-execution",
];
const validationCommands = [
  "npm run check:p1327-founder-runtime-store-live-admission-execution",
  "npm run check:p1326-founder-runtime-store-live-admission-execution",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"store live readiness gate appears only on scoped pages\"",
  "git diff --check",
];
const p1327FinalState =
  status.currentPhase === "P132.7"
  && status.previousPhase === "P132.6"
  && status.nextPhase === "P133"
  && roadmap.currentPhase === "P132.7"
  && roadmap.previousPhase === "P132.6"
  && roadmap.nextPhase === "P133"
  && status.current?.phaseId === "P132.7"
  && status.previous?.phaseId === "P132.6"
  && status.next?.phaseId === "P133"
  && roadmap.current?.phaseId === "P132.7"
  && roadmap.previous?.phaseId === "P132.6"
  && roadmap.next?.phaseId === "P133"
  && statusById.get("P132")?.status === "complete"
  && roadmapById.get("P132")?.status === "complete"
  && statusById.get("P132.7")?.status === "complete"
  && roadmapById.get("P132.7")?.status === "complete"
  && statusById.get("P133")?.status === "planned"
  && roadmapById.get("P133")?.status === "planned";
const p1331StartedState =
  status.currentPhase === "P133.1"
  && status.previousPhase === "P132.7"
  && status.nextPhase === "P133.2"
  && roadmap.currentPhase === "P133.1"
  && roadmap.previousPhase === "P132.7"
  && roadmap.nextPhase === "P133.2"
  && status.current?.phaseId === "P133.1"
  && status.previous?.phaseId === "P132.7"
  && status.next?.phaseId === "P133.2"
  && roadmap.current?.phaseId === "P133.1"
  && roadmap.previous?.phaseId === "P132.7"
  && roadmap.next?.phaseId === "P133.2"
  && statusById.get("P132")?.status === "complete"
  && roadmapById.get("P132")?.status === "complete"
  && statusById.get("P132.7")?.status === "complete"
  && roadmapById.get("P132.7")?.status === "complete"
  && statusById.get("P133")?.status === "in_progress"
  && roadmapById.get("P133")?.status === "in_progress"
  && statusById.get("P133.1")?.status === "complete"
  && roadmapById.get("P133.1")?.status === "complete"
  && statusById.get("P133.2")?.status === "planned"
  && roadmapById.get("P133.2")?.status === "planned";
const p1332CompleteState =
  status.currentPhase === "P133.2"
  && status.previousPhase === "P133.1"
  && status.nextPhase === "P133.3"
  && roadmap.currentPhase === "P133.2"
  && roadmap.previousPhase === "P133.1"
  && roadmap.nextPhase === "P133.3"
  && status.current?.phaseId === "P133.2"
  && status.previous?.phaseId === "P133.1"
  && status.next?.phaseId === "P133.3"
  && roadmap.current?.phaseId === "P133.2"
  && roadmap.previous?.phaseId === "P133.1"
  && roadmap.next?.phaseId === "P133.3"
  && statusById.get("P132")?.status === "complete"
  && roadmapById.get("P132")?.status === "complete"
  && statusById.get("P132.7")?.status === "complete"
  && roadmapById.get("P132.7")?.status === "complete"
  && statusById.get("P133")?.status === "in_progress"
  && roadmapById.get("P133")?.status === "in_progress"
  && statusById.get("P133.1")?.status === "complete"
  && roadmapById.get("P133.1")?.status === "complete"
  && statusById.get("P133.2")?.status === "complete"
  && roadmapById.get("P133.2")?.status === "complete"
  && statusById.get("P133.3")?.status === "planned"
  && roadmapById.get("P133.3")?.status === "planned";
const p1333CompleteState =
  status.currentPhase === "P133.3"
  && status.previousPhase === "P133.2"
  && status.nextPhase === "P133.4"
  && roadmap.currentPhase === "P133.3"
  && roadmap.previousPhase === "P133.2"
  && roadmap.nextPhase === "P133.4"
  && status.current?.phaseId === "P133.3"
  && status.previous?.phaseId === "P133.2"
  && status.next?.phaseId === "P133.4"
  && roadmap.current?.phaseId === "P133.3"
  && roadmap.previous?.phaseId === "P133.2"
  && roadmap.next?.phaseId === "P133.4"
  && statusById.get("P132")?.status === "complete"
  && roadmapById.get("P132")?.status === "complete"
  && statusById.get("P132.7")?.status === "complete"
  && roadmapById.get("P132.7")?.status === "complete"
  && statusById.get("P133")?.status === "in_progress"
  && roadmapById.get("P133")?.status === "in_progress"
  && statusById.get("P133.1")?.status === "complete"
  && roadmapById.get("P133.1")?.status === "complete"
  && statusById.get("P133.2")?.status === "complete"
  && roadmapById.get("P133.2")?.status === "complete"
  && statusById.get("P133.3")?.status === "complete"
  && roadmapById.get("P133.3")?.status === "complete"
  && statusById.get("P133.4")?.status === "planned"
  && roadmapById.get("P133.4")?.status === "planned";
const p1334CompleteState =
  status.currentPhase === "P133.4"
  && status.previousPhase === "P133.3"
  && status.nextPhase === "P133.5"
  && roadmap.currentPhase === "P133.4"
  && roadmap.previousPhase === "P133.3"
  && roadmap.nextPhase === "P133.5"
  && status.current?.phaseId === "P133.4"
  && status.previous?.phaseId === "P133.3"
  && status.next?.phaseId === "P133.5"
  && roadmap.current?.phaseId === "P133.4"
  && roadmap.previous?.phaseId === "P133.3"
  && roadmap.next?.phaseId === "P133.5"
  && statusById.get("P132")?.status === "complete"
  && roadmapById.get("P132")?.status === "complete"
  && statusById.get("P132.7")?.status === "complete"
  && roadmapById.get("P132.7")?.status === "complete"
  && statusById.get("P133")?.status === "in_progress"
  && roadmapById.get("P133")?.status === "in_progress"
  && statusById.get("P133.1")?.status === "complete"
  && roadmapById.get("P133.1")?.status === "complete"
  && statusById.get("P133.2")?.status === "complete"
  && roadmapById.get("P133.2")?.status === "complete"
  && statusById.get("P133.3")?.status === "complete"
  && roadmapById.get("P133.3")?.status === "complete"
  && statusById.get("P133.4")?.status === "complete"
  && roadmapById.get("P133.4")?.status === "complete"
  && statusById.get("P133.5")?.status === "planned"
  && roadmapById.get("P133.5")?.status === "planned";
const p1335CompleteState =
  status.currentPhase === "P133.5"
  && status.previousPhase === "P133.4"
  && status.nextPhase === "P133.6"
  && roadmap.currentPhase === "P133.5"
  && roadmap.previousPhase === "P133.4"
  && roadmap.nextPhase === "P133.6"
  && status.current?.phaseId === "P133.5"
  && status.previous?.phaseId === "P133.4"
  && status.next?.phaseId === "P133.6"
  && roadmap.current?.phaseId === "P133.5"
  && roadmap.previous?.phaseId === "P133.4"
  && roadmap.next?.phaseId === "P133.6"
  && statusById.get("P132")?.status === "complete"
  && roadmapById.get("P132")?.status === "complete"
  && statusById.get("P132.7")?.status === "complete"
  && roadmapById.get("P132.7")?.status === "complete"
  && statusById.get("P133")?.status === "in_progress"
  && roadmapById.get("P133")?.status === "in_progress"
  && ["P133.1", "P133.2", "P133.3", "P133.4", "P133.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P133.6")?.status === "planned"
  && roadmapById.get("P133.6")?.status === "planned";
const p133SafeProgressState = p1331StartedState || p1332CompleteState || p1333CompleteState || p1334CompleteState || p1335CompleteState;

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("contract marks P132 final", contract.status === "complete" && contract.currentSubphase === "P132.7" && contract.previousSubphase === "P132.6" && contract.nextSubphase === "P133" && p1327.status === "complete");
addCheck("P132.7 records expected base commit", p1327.expectedBaseCommit === "b94b6081");
addCheck("P132.7 allowed files include final checker and reports", p1327.allowedFiles?.includes("scripts/check-p1327-founder-runtime-store-live-admission-execution.js") && p1327.allowedFiles?.includes(REPORT_PATH) && p1327.allowedFiles?.includes("scripts/check-p1326-founder-runtime-store-live-admission-execution.js") && p1327.allowedFiles?.includes("reports/p1326-founder-runtime-store-live-admission-execution-report.md"));
addCheck("P132.7 forbids dashboard/project/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1327.forbiddenFiles?.includes(path)));
addCheck("P132.7 records validation commands", validationCommands.every((command) => p1327.validationCommands?.includes(command)));
addCheck("P132.1-P132.7 contract entries complete", completedSubphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P132.1-P132.6 reports pass", previousReports.every(reportPassed));
addCheck("P132.6 checker accepts P132.7 final state", p1326Checker.includes("p1327FinalState") && p1326Checker.includes('status.currentPhase === "P132.7"') && p1326Checker.includes('contract.status === "complete"'));
addCheck("OS phase checker recognizes P133 handoff", osStatusChecker.includes('"P133"'));
addCheck("P132.5 scoped data export remains intact", businessData.includes("buildFounderRuntimeStoreLiveAdmissionExecutionScopeDisplayModel") && businessData.includes("founderRuntimeStoreLiveAdmissionExecutionScope") && businessData.includes("buildFounderRuntimeStoreLiveAdmissionDbWritePlanPreview"));
addCheck("P132.5 scoped page labels remain intact", pageSource.includes("Business Build Store Execution Scope") && pageSource.includes("Agent Flow Store Execution Scope") && pageSource.includes('ariaLabel="Store execution scope"') && !pageSource.includes("Lite Store Execution Scope") && !pageSource.includes("Chat Store Execution Scope"));
addCheck("P132.5 scoped route coverage remains", routeTests.includes("store live readiness gate appears only on scoped pages") && routeTests.includes("Store execution scope") && routeTests.includes("Business Build Store Execution Scope") && routeTests.includes("Agent Flow Store Execution Scope") && routeTests.includes("/command-center/business-build") && routeTests.includes("/command-center/agent-flow") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("dark") && routeTests.includes("light") && routeTests.includes("system"));
addCheck("P132 plan records P132.7", /## P132\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P132.7", /P132\.7 final validation/i.test(readme) && /P133-P145 enterprise readiness roadmap/i.test(readme));
addCheck("platform roadmap records P132.7", /P132\.7 is complete/i.test(platformRoadmap) && /P133-P145 Enterprise Readiness Roadmap/i.test(platformRoadmap));
addCheck("phase status closes P132", p1327FinalState || p133SafeProgressState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P132.7 entries have required fields", [statusById.get("P132"), statusById.get("P132.7"), roadmapById.get("P132.7")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P133 handoff remains safe", (statusById.get("P133")?.status === "planned" && roadmapById.get("P133")?.status === "planned" && !(statusById.get("P133")?.checksRun || []).length && !(roadmapById.get("P133")?.checksRun || []).length) || p133SafeProgressState);
addCheck(
  "changed files stay in P132.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P132.7 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P132.7 contract avoids forbidden file scope", !(p1327.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("primary UX avoids DemoApp leakage", !pageSource.includes("DemoApp"));
addCheck("primary UX avoids raw phase labels", !/P132\.7|reports\/p132|founderRuntimeStoreLiveAdmissionExecutionScope|founderRuntimeStoreLiveAdmissionDbWritePlanPreview/.test(pageSource));
addCheck("public docs avoid raw store table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_store|acceptance_capture_store|persistence_store_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM|SELECT \\* FROM|ALTER TABLE|DROP TABLE)/i.test(publicDocsBundle));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/write plan now|persist now|save now|write now|read now|migrate now|create schema now|create table now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now|admit live store now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /write plan is enabled|write-plan is enabled|schema is enabled|migration is enabled|table is created|adapter selection is enabled|adapter is connected|request persistence is enabled|store CRUD is enabled|CRUD is live|live store is enabled|live admission is enabled|DB reads are enabled|DB writes are enabled|runtime writes are enabled|schema is created|acceptance capture is persisted|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P132 closure, P132.1-P132.6 reports, scoped route coverage, checker handoffs, and OS status.",
        "- Confirms P132.5 Store Execution Scope remains scoped to Business Build and Agent Flow with Chat with NEXUS, Lite, OS Roadmap, and Live Readiness clean.",
        "- Confirms P133 remains planned-only or safely started at P133.1 without enabling DB/runtime writes, live CRUD, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1327.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P132.7 is final validation only. It does not create DB schemas, run migrations, create tables, read or write DB/runtime records, select or connect adapters, persist requests, execute CRUD, capture approvals, accept handoff, grant authority, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P132.7 Store Live Admission Execution Final Validation Report", phase: "P132.7" },
);

printCheckReport("P132.7 Store Live Admission Execution Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
