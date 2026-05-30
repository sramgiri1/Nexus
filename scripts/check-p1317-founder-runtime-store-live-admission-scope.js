import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1317-founder-runtime-store-live-admission-scope-report.md";
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|safe dry-run|dry-run-only|planned-only|display-only|read-only|future|local-only|model-only|request model|request shape|readiness resolver|resolver only|readiness only|dry-run model|dry run|ux only|display-safe|validation\/docs|validation-only|docs-only|final validation|cannot)\b/i.test(context);
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
const p1317 = subphaseById.get("P131.7") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1316Checker = readText("scripts/check-p1316-founder-runtime-store-live-admission-scope.js");
const checkerSource = readText("scripts/check-p1317-founder-runtime-store-live-admission-scope.js");
const businessData = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const readmeP131Slice = readme.match(/- P131\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const roadmapP131Slice = platformRoadmap.match(/P131\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readmeP131Slice}\n${roadmapP131Slice}`;
const publicDocsBundle = `${readmeP131Slice}\n${roadmapP131Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P131.7";
const allowedFiles = new Set(p1317.allowedFiles || []);
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
const completedSubphases = ["P131.1", "P131.2", "P131.3", "P131.4", "P131.5", "P131.6", "P131.7"];
const previousReports = [
  "reports/p1311-founder-runtime-store-live-admission-scope-report.md",
  "reports/p1312-founder-runtime-store-live-admission-scope-report.md",
  "reports/p1313-founder-runtime-store-live-admission-scope-report.md",
  "reports/p1314-founder-runtime-store-live-admission-scope-report.md",
  "reports/p1315-founder-runtime-store-live-admission-scope-report.md",
  "reports/p1316-founder-runtime-store-live-admission-scope-report.md",
];
const requiredScripts = [
  "check:p1311-founder-runtime-store-live-admission-scope",
  "check:p1312-founder-runtime-store-live-admission-scope",
  "check:p1313-founder-runtime-store-live-admission-scope",
  "check:p1314-founder-runtime-store-live-admission-scope",
  "check:p1315-founder-runtime-store-live-admission-scope",
  "check:p1316-founder-runtime-store-live-admission-scope",
  "check:p1317-founder-runtime-store-live-admission-scope",
];
const validationCommands = [
  "npm run check:p1317-founder-runtime-store-live-admission-scope",
  "npm run check:p1316-founder-runtime-store-live-admission-scope",
  "npm run check:p1315-founder-runtime-store-live-admission-scope",
  "npm run check:p1314-founder-runtime-store-live-admission-scope",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"store live readiness gate appears only on scoped pages\"",
  "git diff --check",
];
const p1317FinalState =
  status.currentPhase === "P131.7"
  && status.previousPhase === "P131.6"
  && status.nextPhase === "P132"
  && roadmap.currentPhase === "P131.7"
  && roadmap.previousPhase === "P131.6"
  && roadmap.nextPhase === "P132"
  && statusById.get("P131")?.status === "complete"
  && roadmapById.get("P131")?.status === "complete"
  && statusById.get("P131.7")?.status === "complete"
  && roadmapById.get("P131.7")?.status === "complete"
  && statusById.get("P132")?.status === "planned"
  && roadmapById.get("P132")?.status === "planned";
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

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("contract marks P131 final", contract.status === "complete" && contract.currentSubphase === "P131.7" && contract.previousSubphase === "P131.6" && contract.nextSubphase === "P132" && p1317.status === "complete");
addCheck("P131.7 records expected base commit", p1317.expectedBaseCommit === "875b1228");
addCheck("P131.7 allowed files include final checker and reports", p1317.allowedFiles?.includes("scripts/check-p1317-founder-runtime-store-live-admission-scope.js") && p1317.allowedFiles?.includes(REPORT_PATH) && p1317.allowedFiles?.includes("scripts/check-os-phase-status.js") && p1317.allowedFiles?.includes("reports/p1316-founder-runtime-store-live-admission-scope-report.md"));
addCheck("P131.7 forbids dashboard/project/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1317.forbiddenFiles?.includes(path)));
addCheck("P131.7 records validation commands", validationCommands.every((command) => p1317.validationCommands?.includes(command)));
addCheck("P131.1-P131.7 contract entries complete", completedSubphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P131.1-P131.6 reports pass", previousReports.every(reportPassed));
addCheck("P131.6 checker accepts P131.7 final state", p1316Checker.includes("p1317FinalState") && p1316Checker.includes('status.currentPhase === "P131.7"') && p1316Checker.includes('status.nextPhase === "P132"'));
addCheck("OS phase checker recognizes P132 handoff", osStatusChecker.includes('"P132"'));
addCheck("P131.5 scoped data export remains intact", businessData.includes("buildFounderRuntimeStoreLiveAdmissionScopeDisplayModel") && businessData.includes("founderRuntimeStoreLiveAdmissionScope") && businessData.includes("buildFounderRuntimeStoreLiveAdmissionScopeWriteBoundaryAdmissionDryRun"));
addCheck("P131.5 scoped page labels remain intact", pageSource.includes("Business Build Store Live Admission Scope") && pageSource.includes("Agent Flow Store Live Admission Scope") && pageSource.includes('ariaLabel="Store live admission scope"') && !pageSource.includes("Lite Store Live Admission Scope") && !pageSource.includes("Chat Store Live Admission Scope"));
addCheck("P131.5 scoped route coverage remains", routeTests.includes("store live readiness gate appears only on scoped pages") && routeTests.includes("Store live admission scope") && routeTests.includes("Business Build Store Live Admission Scope") && routeTests.includes("/command-center/business-build") && routeTests.includes("/command-center/agent-flow") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("dark") && routeTests.includes("light") && routeTests.includes("system"));
addCheck("P131 plan records P131.7", /## P131\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P131.7", /P131\.7 final validation/i.test(readme) && /P132 is planned-only/i.test(readme));
addCheck("platform roadmap records P131.7", /P131\.7 is complete/i.test(platformRoadmap) && /P132 is planned-only/i.test(platformRoadmap));
addCheck(
  "phase status closes P131",
  p1317FinalState || p1321StartedState || p1322StartedState,
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "phase status summary objects close P131",
  p1317FinalState || p1321StartedState || p1322StartedState,
);
addCheck("completed P131.7 entries have required fields", [statusById.get("P131"), statusById.get("P131.7"), roadmapById.get("P131.7")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P132 handoff remains safe", (statusById.get("P132")?.status === "planned" && roadmapById.get("P132")?.status === "planned" && !(statusById.get("P132")?.checksRun || []).length && !(roadmapById.get("P132")?.checksRun || []).length) || p1321StartedState || p1322StartedState);
addCheck(
  "changed files stay in P131.7 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P131.7 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P131.7 contract avoids forbidden file scope", !(p1317.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("checker reuses report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("primary UX avoids DemoApp leakage", !pageSource.includes("DemoApp"));
addCheck("public docs avoid raw store table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_store|acceptance_capture_store|persistence_store_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/persist now|save now|write now|capture approval now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now|admit live store now/i.test(docsBundle));
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
        "- Validates P131.7 final validation closure for P131.",
        "- Confirms P131 is complete, P131.7 is complete, and the P132 handoff remains safe.",
        "- Confirms the P131.5 Store Live Admission Scope UX remains scoped to Business Build and Agent Flow with Chat with NEXUS, Lite, OS Roadmap, and Live Readiness clean.",
        "- Does not modify dashboard source/tests, create runtime exports, create schemas, write DB/runtime records, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1317.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P131.7 is final validation closure only. The P132 handoff is contract-gated. This does not capture approvals, persist decisions, submit requests, persist requests, create DB schemas, run migrations, read or write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P131.7 Store Live Admission Scope Final Validation Report", phase: "P131.7" },
);

printCheckReport("P131.7 Store Live Admission Scope Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
