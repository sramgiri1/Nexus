import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1326-founder-runtime-store-live-admission-execution-report.md";
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|display-only|read-only|future|local-only|model-only|preview-only|gate-only|validation\/docs|validation-only|docs-only|cannot|preserve)\b/i.test(context);
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
const p1326 = subphaseById.get("P132.6") || {};
const p1327 = subphaseById.get("P132.7") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1325Checker = readText("scripts/check-p1325-founder-runtime-store-live-admission-execution.js");
const checkerSource = readText("scripts/check-p1326-founder-runtime-store-live-admission-execution.js");
const businessData = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const readmeP132Slice = readme.match(/- P132\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const roadmapP132Slice = platformRoadmap.match(/P132\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readmeP132Slice}\n${roadmapP132Slice}`;
const publicDocsBundle = `${readmeP132Slice}\n${roadmapP132Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P132.6";
const allowedFiles = new Set(p1326.allowedFiles || []);
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
const completedSubphases = ["P132.1", "P132.2", "P132.3", "P132.4", "P132.5", "P132.6"];
const previousReports = [
  "reports/p1321-founder-runtime-store-live-admission-execution-report.md",
  "reports/p1322-founder-runtime-store-live-admission-execution-report.md",
  "reports/p1323-founder-runtime-store-live-admission-execution-report.md",
  "reports/p1324-founder-runtime-store-live-admission-execution-report.md",
  "reports/p1325-founder-runtime-store-live-admission-execution-report.md",
];
const requiredScripts = [
  "check:p1321-founder-runtime-store-live-admission-execution",
  "check:p1322-founder-runtime-store-live-admission-execution",
  "check:p1323-founder-runtime-store-live-admission-execution",
  "check:p1324-founder-runtime-store-live-admission-execution",
  "check:p1325-founder-runtime-store-live-admission-execution",
  "check:p1326-founder-runtime-store-live-admission-execution",
];
const validationCommands = [
  "npm run check:p1326-founder-runtime-store-live-admission-execution",
  "npm run check:p1325-founder-runtime-store-live-admission-execution",
  "npm run check:p1324-founder-runtime-store-live-admission-execution",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"store live readiness gate appears only on scoped pages\"",
  "git diff --check",
];

const p1326CurrentState =
  status.currentPhase === "P132.6"
  && status.previousPhase === "P132.5"
  && status.nextPhase === "P132.7"
  && roadmap.currentPhase === "P132.6"
  && roadmap.previousPhase === "P132.5"
  && roadmap.nextPhase === "P132.7"
  && status.current?.phaseId === "P132.6"
  && status.previous?.phaseId === "P132.5"
  && status.next?.phaseId === "P132.7"
  && roadmap.current?.phaseId === "P132.6"
  && roadmap.previous?.phaseId === "P132.5"
  && roadmap.next?.phaseId === "P132.7"
  && statusById.get("P132")?.status === "in_progress"
  && roadmapById.get("P132")?.status === "in_progress"
  && completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P132.7")?.status === "planned"
  && roadmapById.get("P132.7")?.status === "planned";
const p1327FinalState =
  status.currentPhase === "P132.7"
  && status.previousPhase === "P132.6"
  && roadmap.currentPhase === "P132.7"
  && roadmap.previousPhase === "P132.6"
  && statusById.get("P132.6")?.status === "complete"
  && roadmapById.get("P132.6")?.status === "complete"
  && statusById.get("P132.7")?.status === "complete"
  && roadmapById.get("P132.7")?.status === "complete";

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck(
  "contract marks P132.6 complete",
  contract.status === "in_progress"
    && ((contract.currentSubphase === "P132.6" && contract.previousSubphase === "P132.5" && contract.nextSubphase === "P132.7")
      || (contract.currentSubphase === "P132.7" && contract.previousSubphase === "P132.6"))
    && p1326.status === "complete",
);
addCheck("P132.6 records expected base commit", p1326.expectedBaseCommit === "c5c82c78");
addCheck("P132.7 remains planned or complete", ["planned", "complete"].includes(p1327.status));
addCheck("P132.6 allowed files include checker and reports", p1326.allowedFiles?.includes("scripts/check-p1326-founder-runtime-store-live-admission-execution.js") && p1326.allowedFiles?.includes(REPORT_PATH) && p1326.allowedFiles?.includes("scripts/check-p1325-founder-runtime-store-live-admission-execution.js") && p1326.allowedFiles?.includes("reports/p1325-founder-runtime-store-live-admission-execution-report.md"));
addCheck("P132.6 forbids dashboard/project/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1326.forbiddenFiles?.includes(path)));
addCheck("P132.6 records validation commands", validationCommands.every((command) => p1326.validationCommands?.includes(command)));
addCheck("P132.1-P132.6 contract entries complete", completedSubphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P132.1-P132.5 reports pass", previousReports.every(reportPassed));
addCheck("P132.5 checker accepts P132.6 handoff", p1325Checker.includes("p1326HandoffState") && p1325Checker.includes('status.currentPhase === "P132.6"') && p1325Checker.includes('status.nextPhase === "P132.7"'));
addCheck("P132.5 scoped data export remains intact", businessData.includes("buildFounderRuntimeStoreLiveAdmissionExecutionScopeDisplayModel") && businessData.includes("founderRuntimeStoreLiveAdmissionExecutionScope") && businessData.includes("buildFounderRuntimeStoreLiveAdmissionDbWritePlanPreview"));
addCheck("P132.5 scoped page labels remain intact", pageSource.includes("Business Build Store Execution Scope") && pageSource.includes("Agent Flow Store Execution Scope") && pageSource.includes('ariaLabel="Store execution scope"') && !pageSource.includes("Lite Store Execution Scope") && !pageSource.includes("Chat Store Execution Scope"));
addCheck("P132.5 scoped route coverage remains", routeTests.includes("store live readiness gate appears only on scoped pages") && routeTests.includes("Store execution scope") && routeTests.includes("Business Build Store Execution Scope") && routeTests.includes("Agent Flow Store Execution Scope") && routeTests.includes("/command-center/business-build") && routeTests.includes("/command-center/agent-flow") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("dark") && routeTests.includes("light") && routeTests.includes("system"));
addCheck("P132 plan records P132.6", /## P132\.6 Validation \/ Docs[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P132.6", /P132\.6 validation\/docs aggregation/i.test(readme));
addCheck("platform roadmap records P132.6", /P132\.6 is complete/i.test(platformRoadmap) && (/P132\.7\s+is next/i.test(platformRoadmap) || /P132\.7\s+is complete/i.test(platformRoadmap)));
addCheck("phase status advanced", p1326CurrentState || p1327FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P132.6 entries have required fields", [statusById.get("P132"), statusById.get("P132.6"), roadmapById.get("P132.6")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck(
  "changed files stay in P132.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P132.6 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P132.6 contract avoids forbidden file scope", !(p1326.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("primary UX avoids DemoApp leakage", !pageSource.includes("DemoApp"));
addCheck("primary UX avoids raw phase labels", !/P132\.6|reports\/p132|founderRuntimeStoreLiveAdmissionExecutionScope|founderRuntimeStoreLiveAdmissionDbWritePlanPreview/.test(pageSource));
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
        "- Validates aggregate P132.1-P132.5 evidence, reports, docs, scoped route coverage, checker handoffs, and OS status before final validation.",
        "- Confirms P132.5 Store Execution Scope remains scoped to Business Build and Agent Flow with Chat with NEXUS, Lite, OS Roadmap, and Live Readiness clean.",
        "- Does not modify dashboard source/tests, create runtime exports, create schemas, write DB/runtime records, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1326.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P132.6 is validation/docs closure only. It does not create DB schemas, run migrations, create tables, read or write DB/runtime records, select or connect adapters, persist requests, execute CRUD, capture approvals, accept handoff, grant authority, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P132.6 Store Live Admission Execution Validation / Docs Report", phase: "P132.6" },
);

printCheckReport("P132.6 Store Live Admission Execution Validation / Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
