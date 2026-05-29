import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1315-founder-runtime-store-live-admission-scope-report.md";
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|safe dry-run|dry-run-only|planned-only|display-only|read-only|future|local-only|model-only|request model|request shape|readiness resolver|resolver only|readiness only|dry-run model|dry run|ux only|display-safe)\b/i.test(context);
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
const p1315 = subphaseById.get("P131.5") || {};
const p1316 = subphaseById.get("P131.6") || {};
const p1317 = subphaseById.get("P131.7") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1314Checker = readText("scripts/check-p1314-founder-runtime-store-live-admission-scope.js");
const businessData = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const scopeModel = viewModel.founderRuntimeStoreLiveAdmissionScope || {};
const serializedScope = JSON.stringify(scopeModel);
const readmeP131Slice = readme.match(/- P131\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const roadmapP131Slice = platformRoadmap.match(/P131\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${plan}\n${readmeP131Slice}\n${roadmapP131Slice}`;
const publicDocsBundle = `${readmeP131Slice}\n${roadmapP131Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P131.5";
const allowedFiles = new Set(p1315.allowedFiles || []);
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
const requiredScript = "check:p1315-founder-runtime-store-live-admission-scope";
const validationCommands = [
  "npm run check:p1315-founder-runtime-store-live-admission-scope",
  "npm run check:p1314-founder-runtime-store-live-admission-scope",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"store live readiness gate appears only on scoped pages\"",
  "git diff --check",
];
const p1315HandoffState =
  contract.status === "in_progress"
    && contract.currentSubphase === "P131.5"
    && contract.previousSubphase === "P131.4"
    && contract.nextSubphase === "P131.6"
    && p1315.status === "complete";
const p1316HandoffState =
  contract.status === "in_progress"
    && contract.currentSubphase === "P131.6"
    && contract.previousSubphase === "P131.5"
    && contract.nextSubphase === "P131.7"
    && p1315.status === "complete"
    && p1316.status === "complete";
const p1317FinalState =
  contract.status === "complete"
    && contract.currentSubphase === "P131.7"
    && contract.previousSubphase === "P131.6"
    && p1315.status === "complete"
    && p1316.status === "complete"
    && p1317.status === "complete";

addCheck("package script registered", Boolean(packageJson.scripts?.[requiredScript]));
addCheck("contract marks P131.5 complete", p1315HandoffState || p1316HandoffState || p1317FinalState);
addCheck("P131.5 records expected base commit", p1315.expectedBaseCommit === "093d69f4");
addCheck("P131.6 remains planned or complete", ["planned", "complete"].includes(p1316.status));
addCheck("P131.5 allowed files include dashboard and checker", p1315.allowedFiles?.includes("dashboard/src/data/businessBuild.js") && p1315.allowedFiles?.includes("dashboard/src/pages/CommandCenterV2.jsx") && p1315.allowedFiles?.includes("dashboard/tests/routes.spec.js") && p1315.allowedFiles?.includes("scripts/check-p1315-founder-runtime-store-live-admission-scope.js") && p1315.allowedFiles?.includes(REPORT_PATH));
addCheck("P131.5 forbids project/db/runtime/provider paths", ["projects/**", "careloop/**", "generated-projects/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1315.forbiddenFiles?.includes(path)) && !p1315.forbiddenFiles?.includes("dashboard/src/**") && !p1315.forbiddenFiles?.includes("dashboard/tests/**"));
addCheck("P131.5 records validation commands", validationCommands.every((command) => p1315.validationCommands?.includes(command)));
addCheck("Business Build data reuses P131.4 dry run", businessData.includes("buildFounderRuntimeStoreLiveAdmissionScopeWriteBoundaryAdmissionDryRun") && businessData.includes("buildFounderRuntimeStoreLiveAdmissionScopeDisplayModel"));
addCheck("view model exposes admission scope", Boolean(scopeModel.currentState) && scopeModel.previewMode === "Admission scope display-only");
addCheck("view model exposes useful UX fields", Boolean(scopeModel.whatChanged) && Boolean(scopeModel.nextAction) && Boolean(scopeModel.disabledReason) && Boolean(scopeModel.ownerCapability) && Boolean(scopeModel.evidenceLocation) && Boolean(scopeModel.activityLocation) && Boolean(scopeModel.costImpact));
addCheck("view model rows and sections are complete", scopeModel.readinessRows?.length === 7 && scopeModel.readinessSections?.length === 3 && scopeModel.safetyRows?.length >= 10);
addCheck("view model candidate counts remain blocked", scopeModel.requestPersistenceCandidateCount === 0 && scopeModel.approvalCaptureCandidateCount === 0 && scopeModel.decisionPersistenceCandidateCount === 0 && scopeModel.liveAdmissionCandidateCount === 0 && scopeModel.liveCrudCandidateCount === 0 && scopeModel.dbWritableCandidateCount === 0 && scopeModel.runtimeWritableCandidateCount === 0 && scopeModel.providerSpendCandidateCount === 0);
addCheck("view model avoids raw report paths", !/reports\/|\\.md/i.test(serializedScope));
addCheck("view model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedScope));
addCheck("view model avoids fake runnable actions", !/persist now|save now|write now|capture approval now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now|admit live store now/i.test(serializedScope));
addCheck("Command Center renders scoped admission scope", pageSource.includes("Business Build Store Live Admission Scope") && pageSource.includes("Agent Flow Store Live Admission Scope") && pageSource.includes('ariaLabel="Store live admission scope"'));
addCheck("Chat and Lite remain clean", !pageSource.includes("Lite Store Live Admission Scope") && !pageSource.includes("Chat Store Live Admission Scope") && !pageSource.includes("Ask NEXUS Store Live Admission Scope"));
addCheck("Command Center avoids DemoApp leakage", !pageSource.includes("DemoApp"));
addCheck(
  "Playwright coverage updated",
  routeTests.includes("Store live admission scope")
    && routeTests.includes("Admission scope display-only")
    && routeTests.includes("Business Build Store Live Admission Scope")
    && routeTests.includes('label.replace("Store Live Readiness Gate", "Store Live Admission Scope")')
    && routeTests.includes("/command-center/business-build")
    && routeTests.includes("/command-center/agent-flow"),
);
addCheck("Playwright absence coverage updated", routeTests.includes('page.getByLabel("Store live admission scope", { exact: true })).toHaveCount(0)') && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness"));
addCheck("P131.4 checker accepts P131.5 handoff", p1314Checker.includes("p1315ContractState") && p1314Checker.includes('status.currentPhase === "P131.5"') && p1314Checker.includes('status.nextPhase === "P131.6"'));
addCheck("P131.4 report passes", reportPassed("reports/p1314-founder-runtime-store-live-admission-scope-report.md"));
addCheck("plan records P131.5 implementation", /## P131\.5 Command Center Admission Scope UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P131.5", /P131\.5 Command Center admission scope UX/i.test(readme));
addCheck("platform roadmap records P131.5", /P131\.5 is complete/i.test(platformRoadmap) && (/P131\.6\s+is\s+next/i.test(platformRoadmap) || /P131\.6\s+is\s+complete/i.test(platformRoadmap)));
const p1315StatusState =
  status.currentPhase === "P131.5"
    && status.previousPhase === "P131.4"
    && status.nextPhase === "P131.6"
    && roadmap.currentPhase === "P131.5"
    && roadmap.previousPhase === "P131.4"
    && roadmap.nextPhase === "P131.6"
    && statusById.get("P131.6")?.status === "planned"
    && roadmapById.get("P131.6")?.status === "planned";
const p1316StatusState =
  status.currentPhase === "P131.6"
    && status.previousPhase === "P131.5"
    && status.nextPhase === "P131.7"
    && roadmap.currentPhase === "P131.6"
    && roadmap.previousPhase === "P131.5"
    && roadmap.nextPhase === "P131.7"
    && statusById.get("P131.6")?.status === "complete"
    && roadmapById.get("P131.6")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P131.7")?.status)
    && ["planned", "complete"].includes(roadmapById.get("P131.7")?.status);
const p1317StatusState =
  status.currentPhase === "P131.7"
    && status.previousPhase === "P131.6"
    && status.nextPhase === "P132"
    && roadmap.currentPhase === "P131.7"
    && roadmap.previousPhase === "P131.6"
    && roadmap.nextPhase === "P132"
    && statusById.get("P131.6")?.status === "complete"
    && roadmapById.get("P131.6")?.status === "complete"
    && statusById.get("P131.7")?.status === "complete"
    && roadmapById.get("P131.7")?.status === "complete";
addCheck(
  "phase status advanced",
  (p1315StatusState || p1316StatusState || p1317StatusState)
    && ["in_progress", "complete"].includes(statusById.get("P131")?.status)
    && ["in_progress", "complete"].includes(roadmapById.get("P131")?.status)
    && statusById.get("P131.4")?.status === "complete"
    && roadmapById.get("P131.4")?.status === "complete"
    && statusById.get("P131.5")?.status === "complete"
    && roadmapById.get("P131.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "phase status summary objects advanced",
  (status.current?.phaseId === "P131.5"
    && status.previous?.phaseId === "P131.4"
    && status.next?.phaseId === "P131.6"
    && roadmap.current?.phaseId === "P131.5"
    && roadmap.previous?.phaseId === "P131.4"
    && roadmap.next?.phaseId === "P131.6")
    || (status.current?.phaseId === "P131.6"
      && status.previous?.phaseId === "P131.5"
      && status.next?.phaseId === "P131.7"
      && roadmap.current?.phaseId === "P131.6"
      && roadmap.previous?.phaseId === "P131.5"
      && roadmap.next?.phaseId === "P131.7")
    || (status.current?.phaseId === "P131.7"
      && status.previous?.phaseId === "P131.6"
      && status.next?.phaseId === "P132"
      && roadmap.current?.phaseId === "P131.7"
      && roadmap.previous?.phaseId === "P131.6"
      && roadmap.next?.phaseId === "P132"),
);
addCheck("completed P131.5 entries have required fields", [statusById.get("P131"), statusById.get("P131.5"), roadmapById.get("P131.5")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck(
  "changed files stay in P131.5 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P131.5 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw store table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_store|acceptance_capture_store|persistence_store_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/persist now|save now|write now|capture approval now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now|admit live store now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval capture is enabled|approval decision is persisted|request persistence is enabled|store CRUD is enabled|CRUD is live|live store is enabled|live admission is enabled|DB reads are enabled|DB writes are enabled|runtime writes are enabled|migration is enabled|schema is created|acceptance capture is persisted|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P131.5 scoped Command Center admission scope UX.",
        "- Confirms Business Build and Agent Flow render display-safe Store Live Admission Scope while Chat with NEXUS and Lite stay clean.",
        "- Confirms the UX does not enable request persistence, approval capture, decision persistence, live admission, CRUD, DB/runtime writes, provider/model calls, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1315.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P131.5 is display-safe Command Center UX only. It does not capture approvals, persist decisions, submit requests, persist requests, create DB schemas, run migrations, read or write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P131.5 Command Center Admission Scope UX Report", phase: "P131.5" },
);

printCheckReport("P131.5 Command Center Admission Scope UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
