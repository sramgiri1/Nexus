import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_FLAGS,
  FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_NAMES,
  buildFounderRuntimeStoreLiveAdmissionScopeWriteBoundaryAdmissionDryRun,
  validateFounderRuntimeStoreLiveAdmissionScopeWriteBoundaryAdmissionDryRun,
} from "../shared/founderRuntimeStoreLiveAdmissionScopeWriteBoundaryAdmissionDryRun.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1314-founder-runtime-store-live-admission-scope-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p131-founder-runtime-store-live-admission-scope-contracts.json";
const PLAN_PATH = "docs/architecture/P131_FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_PLAN.md";
const MODEL_PATH = "shared/founderRuntimeStoreLiveAdmissionScopeWriteBoundaryAdmissionDryRun.js";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|safe dry-run|dry-run-only|planned-only|display-only|read-only|future|local-only|model-only|request model|request shape|readiness resolver|resolver only|readiness only|dry-run model|dry run)\b/i.test(context);
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
const p1314 = subphaseById.get("P131.4") || {};
const p1315 = subphaseById.get("P131.5") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1313Checker = readText("scripts/check-p1313-founder-runtime-store-live-admission-scope.js");
const modelSource = readText(MODEL_PATH);
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const model = buildFounderRuntimeStoreLiveAdmissionScopeWriteBoundaryAdmissionDryRun();
const modelValidation = validateFounderRuntimeStoreLiveAdmissionScopeWriteBoundaryAdmissionDryRun(model);
const serializedModel = JSON.stringify(model);
const readmeP131Slice = readme.match(/- P131\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const roadmapP131Slice = platformRoadmap.match(/P131\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${plan}\n${readmeP131Slice}\n${roadmapP131Slice}`;
const publicDocsBundle = `${readmeP131Slice}\n${roadmapP131Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P131.4";
const allowedFiles = new Set(p1314.allowedFiles || []);
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
const requiredScript = "check:p1314-founder-runtime-store-live-admission-scope";
const validationCommands = [
  "npm run check:p1314-founder-runtime-store-live-admission-scope",
  "npm run check:p1313-founder-runtime-store-live-admission-scope",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"store live readiness gate appears only on scoped pages\"",
  "git diff --check",
];

addCheck("package script registered", Boolean(packageJson.scripts?.[requiredScript]));
addCheck("contract marks P131.4 current", contract.status === "in_progress" && contract.currentSubphase === "P131.4" && contract.previousSubphase === "P131.3" && contract.nextSubphase === "P131.5" && p1314.status === "complete");
addCheck("P131.4 records expected base commit", p1314.expectedBaseCommit === "dbc9a686");
addCheck("P131.5 remains planned", p1315.status === "planned");
addCheck("P131.4 allowed files include dry-run model and checker", p1314.allowedFiles?.includes(MODEL_PATH) && p1314.allowedFiles?.includes("scripts/check-p1314-founder-runtime-store-live-admission-scope.js") && p1314.allowedFiles?.includes(REPORT_PATH));
addCheck("P131.4 forbids project/dashboard/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1314.forbiddenFiles?.includes(path)));
addCheck("P131.4 records validation commands", validationCommands.every((command) => p1314.validationCommands?.includes(command)));
addCheck("P131.4 exports expected symbols", [
  "FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_PHASE",
  "FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_VERSION",
  "FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_NAMES",
  "FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_FLAGS",
  "buildFounderRuntimeStoreLiveAdmissionScopeWriteBoundaryAdmissionDryRun",
  "validateFounderRuntimeStoreLiveAdmissionScopeWriteBoundaryAdmissionDryRun",
].every((exportName) => modelSource.includes(`export const ${exportName}`) || modelSource.includes(`export function ${exportName}`)));
addCheck("P131.4 reuses P131.3 readiness resolver", modelSource.includes("buildFounderRuntimeStoreLiveAdmissionScopeApprovalEvidenceReadinessResolver") && modelSource.includes("validateFounderRuntimeStoreLiveAdmissionScopeApprovalEvidenceReadinessResolver"));
addCheck("write-boundary dry-run model validates", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("write-boundary dry-run model preserves lineage", model.sourceReadinessResolverPhase === "P131.3" && model.sourceRequestModelPhase === "P131.2" && model.sourceSafeDryRunPhase === "P130.4" && model.sourceApprovalGatePhase === "P130.3" && model.sourcePrerequisitesPhase === "P130.2" && model.sourceStoreSafeDryRunPhase === "P129.5" && model.sourceMigrationPreviewPhase === "P129.4" && model.sourceRepositoryIntentPhase === "P129.3" && model.sourceStoreMetadataPhase === "P129.2" && model.sourcePersistenceBoundaryPhase === "P128.2" && model.sourceCapturePhase === "P127.2");
addCheck("write-boundary dry-run model remains hidden and local", model.modelOnly === true && model.dryRunOnly === true && model.localOnly === true && model.commandCenterVisible === false);
addCheck("write-boundary dry-run rows are complete", FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_NAMES.length === 7 && model.dryRunRows?.length === 7);
addCheck("write-boundary dry-run counts remain blocked", model.blockedDryRunRowCount === model.dryRunRowCount && model.readyDryRunRowCount === 0 && model.requestPersistenceCandidateCount === 0 && model.approvalCaptureCandidateCount === 0 && model.decisionPersistenceCandidateCount === 0 && model.liveAdmissionCandidateCount === 0 && model.liveCrudCandidateCount === 0 && model.dbReadableCandidateCount === 0 && model.dbWritableCandidateCount === 0 && model.runtimeWritableCandidateCount === 0 && model.providerSpendCandidateCount === 0);
addCheck("write-boundary dry-run flags remain false", Object.values(FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_WRITE_BOUNDARY_ADMISSION_DRY_RUN_FLAGS).filter((value) => typeof value === "boolean").every((value) => value === false));
addCheck("write-boundary dry-run row booleans remain false except source presence", model.dryRunRows?.every((row) => Object.entries(row).every(([key, value]) => typeof value !== "boolean" || key === "sourceReadinessPresent" || value === false) && row.sourceReadinessPresent === true && Object.values(row.authorityFlags || {}).filter((value) => typeof value === "boolean").every((value) => value === false)));
addCheck("P131.3 checker accepts P131.4 handoff", p1313Checker.includes("p1314ContractState") && p1313Checker.includes('status.currentPhase === "P131.4"') && p1313Checker.includes('status.nextPhase === "P131.5"'));
addCheck("P131.3 report passes", reportPassed("reports/p1313-founder-runtime-store-live-admission-scope-report.md"));
addCheck("plan records P131.4 implementation", /## P131\.4 Write Boundary Admission Dry Run[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P131.4", /P131\.4 write boundary admission dry run/i.test(readme));
addCheck("platform roadmap records P131.4", /P131\.4 is complete/i.test(platformRoadmap) && /P131\.5\s+is\s+next/i.test(platformRoadmap));
addCheck("Command Center UX remains unchanged and scoped", pageSource.includes("Business Build Store Live Readiness Gate") && pageSource.includes("Agent Flow Store Live Readiness Gate") && !pageSource.includes("Lite Store Live Readiness Gate") && !pageSource.includes("Chat Store Live Readiness Gate") && !pageSource.includes("DemoApp"));
addCheck("Playwright scoped store readiness coverage remains", routeTests.includes("store live readiness gate appears only on scoped pages"));
addCheck(
  "phase status advanced",
  status.currentPhase === "P131.4"
    && status.previousPhase === "P131.3"
    && status.nextPhase === "P131.5"
    && roadmap.currentPhase === "P131.4"
    && roadmap.previousPhase === "P131.3"
    && roadmap.nextPhase === "P131.5"
    && statusById.get("P131")?.status === "in_progress"
    && roadmapById.get("P131")?.status === "in_progress"
    && statusById.get("P131.3")?.status === "complete"
    && roadmapById.get("P131.3")?.status === "complete"
    && statusById.get("P131.4")?.status === "complete"
    && roadmapById.get("P131.4")?.status === "complete"
    && statusById.get("P131.5")?.status === "planned"
    && roadmapById.get("P131.5")?.status === "planned",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "phase status summary objects advanced",
  status.current?.phaseId === "P131.4"
    && status.previous?.phaseId === "P131.3"
    && status.next?.phaseId === "P131.5"
    && roadmap.current?.phaseId === "P131.4"
    && roadmap.previous?.phaseId === "P131.3"
    && roadmap.next?.phaseId === "P131.5",
);
addCheck("completed P131.4 entries have required fields", [statusById.get("P131"), statusById.get("P131.4"), roadmapById.get("P131.4")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck(
  "changed files stay in P131.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P131.4 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("dry-run model has no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(modelSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(modelSource));
addCheck("dry-run model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedModel));
addCheck("dry-run model avoids fake runnable actions", !/persist now|save now|write now|capture approval now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now|admit live store now/i.test(serializedModel));
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
        "- Validates the P131.4 browser-safe write-boundary admission dry-run model.",
        "- Confirms the dry-run model reuses the P131.3 readiness resolver and keeps request persistence, approval capture, decision persistence, admission, CRUD, DB/runtime, provider, dispatch, mutation, network, and spend candidates blocked.",
        "- Does not capture approvals, persist decisions, submit requests, persist requests, create DB schemas, create migrations, read or write DB records, write runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1314.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P131.4 is a write-boundary admission dry-run model only. It does not capture approvals, persist decisions, submit requests, persist requests, create DB schemas, run migrations, read or write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P131.4 Write Boundary Admission Dry Run Report", phase: "P131.4" },
);

printCheckReport("P131.4 Write Boundary Admission Dry Run Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
