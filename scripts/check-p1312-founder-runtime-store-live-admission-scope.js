import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FIELD_NAMES,
  FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FLAGS,
  buildFounderRuntimeStoreLiveAdmissionScopeRequestModel,
  validateFounderRuntimeStoreLiveAdmissionScopeRequestModel,
} from "../shared/founderRuntimeStoreLiveAdmissionScopeRequestModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1312-founder-runtime-store-live-admission-scope-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p131-founder-runtime-store-live-admission-scope-contracts.json";
const PLAN_PATH = "docs/architecture/P131_FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_PLAN.md";
const MODEL_PATH = "shared/founderRuntimeStoreLiveAdmissionScopeRequestModel.js";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|safe dry-run|dry-run-only|planned-only|display-only|read-only|future|local-only|model-only|request model|request shape)\b/i.test(context);
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
const p1312 = subphaseById.get("P131.2") || {};
const p1313 = subphaseById.get("P131.3") || {};
const p1312ContractState = contract.status === "in_progress"
  && contract.currentSubphase === "P131.2"
  && contract.previousSubphase === "P131.1"
  && contract.nextSubphase === "P131.3";
const p1313ContractState = contract.status === "in_progress"
  && contract.currentSubphase === "P131.3"
  && contract.previousSubphase === "P131.2"
  && contract.nextSubphase === "P131.4";
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1311Checker = readText("scripts/check-p1311-founder-runtime-store-live-admission-scope.js");
const modelSource = readText(MODEL_PATH);
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const model = buildFounderRuntimeStoreLiveAdmissionScopeRequestModel();
const modelValidation = validateFounderRuntimeStoreLiveAdmissionScopeRequestModel(model);
const serializedModel = JSON.stringify(model);
const readmeP131Slice = readme.match(/- P131\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const roadmapP131Slice = platformRoadmap.match(/P131\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${plan}\n${readmeP131Slice}\n${roadmapP131Slice}`;
const publicDocsBundle = `${readmeP131Slice}\n${roadmapP131Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P131.2";
const allowedFiles = new Set(p1312.allowedFiles || []);
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
const requiredScript = "check:p1312-founder-runtime-store-live-admission-scope";
const validationCommands = [
  "npm run check:p1312-founder-runtime-store-live-admission-scope",
  "npm run check:p1311-founder-runtime-store-live-admission-scope",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"store live readiness gate appears only on scoped pages\"",
  "git diff --check",
];

addCheck("package script registered", Boolean(packageJson.scripts?.[requiredScript]));
addCheck("contract marks P131.2 complete", (p1312ContractState || p1313ContractState) && p1312.status === "complete");
addCheck("P131.2 records expected base commit", p1312.expectedBaseCommit === "2f6dd27f");
addCheck("P131.3 remains planned or complete", ["planned", "complete"].includes(p1313.status));
addCheck("P131.2 allowed files include model and checker", p1312.allowedFiles?.includes(MODEL_PATH) && p1312.allowedFiles?.includes("scripts/check-p1312-founder-runtime-store-live-admission-scope.js"));
addCheck("P131.2 forbids project/dashboard/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1312.forbiddenFiles?.includes(path)));
addCheck("P131.2 records validation commands", validationCommands.every((command) => p1312.validationCommands?.includes(command)));
addCheck("P131.2 exports expected symbols", [
  "FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_MODEL_PHASE",
  "FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_MODEL_VERSION",
  "FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FIELD_NAMES",
  "FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FLAGS",
  "buildFounderRuntimeStoreLiveAdmissionScopeRequestModel",
  "validateFounderRuntimeStoreLiveAdmissionScopeRequestModel",
].every((exportName) => modelSource.includes(`export const ${exportName}`) || modelSource.includes(`export function ${exportName}`)));
addCheck("P131.2 reuses P130.4 safe dry run", modelSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun") && modelSource.includes("validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun"));
addCheck("request model validates", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("request model preserves lineage", model.sourceSafeDryRunPhase === "P130.4" && model.sourceApprovalGatePhase === "P130.3" && model.sourcePrerequisitesPhase === "P130.2" && model.sourceStoreSafeDryRunPhase === "P129.5" && model.sourceMigrationPreviewPhase === "P129.4" && model.sourceRepositoryIntentPhase === "P129.3" && model.sourceStoreMetadataPhase === "P129.2" && model.sourcePersistenceBoundaryPhase === "P128.2" && model.sourceCapturePhase === "P127.2");
addCheck("request model remains hidden and local", model.modelOnly === true && model.requestModelOnly === true && model.localOnly === true && model.commandCenterVisible === false);
addCheck("request fields are complete", FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FIELD_NAMES.length === 7 && model.requestFields?.length === 7);
addCheck("request counts remain blocked", model.blockedRequestFieldCount === model.requestFieldCount && model.satisfiedRequestFieldCount === 0 && model.requestSubmissionCandidateCount === 0 && model.requestPersistenceCandidateCount === 0 && model.liveAdmissionCandidateCount === 0 && model.liveCrudCandidateCount === 0 && model.dbReadableCandidateCount === 0 && model.dbWritableCandidateCount === 0 && model.runtimeWritableCandidateCount === 0 && model.providerSpendCandidateCount === 0);
addCheck("request flags remain false", Object.values(FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_REQUEST_FLAGS).filter((value) => typeof value === "boolean").every((value) => value === false));
addCheck("request field booleans remain false", model.requestFields?.every((field) => Object.values(field).filter((value) => typeof value === "boolean").every((value) => value === false) && Object.values(field.authorityFlags || {}).filter((value) => typeof value === "boolean").every((value) => value === false)));
addCheck("P131.1 checker accepts P131.2 handoff", p1311Checker.includes("p1312StartedState") && p1311Checker.includes('status.currentPhase === "P131.2"') && p1311Checker.includes('status.nextPhase === "P131.3"'));
addCheck("P131.1 report passes", reportPassed("reports/p1311-founder-runtime-store-live-admission-scope-report.md"));
addCheck("plan records P131.2 implementation", /## P131\.2 Live Admission Request Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P131.2", /P131\.2 live admission request model/i.test(readme));
addCheck("platform roadmap records P131.2", /P131\.2 is complete/i.test(platformRoadmap) && (/P131\.3\s+is next/i.test(platformRoadmap) || /P131\.3 is complete/i.test(platformRoadmap)));
addCheck("Command Center UX remains unchanged and scoped", pageSource.includes("Business Build Store Live Readiness Gate") && pageSource.includes("Agent Flow Store Live Readiness Gate") && !pageSource.includes("Lite Store Live Readiness Gate") && !pageSource.includes("Chat Store Live Readiness Gate") && !pageSource.includes("DemoApp"));
addCheck("Playwright scoped store readiness coverage remains", routeTests.includes("store live readiness gate appears only on scoped pages"));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P131.2"
    && status.previousPhase === "P131.1"
    && status.nextPhase === "P131.3"
    && roadmap.currentPhase === "P131.2"
    && roadmap.previousPhase === "P131.1"
    && roadmap.nextPhase === "P131.3")
    || (status.currentPhase === "P131.3"
      && status.previousPhase === "P131.2"
      && status.nextPhase === "P131.4"
      && roadmap.currentPhase === "P131.3"
      && roadmap.previousPhase === "P131.2"
      && roadmap.nextPhase === "P131.4"))
    && statusById.get("P131")?.status === "in_progress"
    && roadmapById.get("P131")?.status === "in_progress"
    && statusById.get("P131.1")?.status === "complete"
    && roadmapById.get("P131.1")?.status === "complete"
    && statusById.get("P131.2")?.status === "complete"
    && roadmapById.get("P131.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P131.3")?.status)
    && ["planned", "complete"].includes(roadmapById.get("P131.3")?.status),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "phase status summary objects advanced",
  (status.current?.phaseId === "P131.2"
    && status.previous?.phaseId === "P131.1"
    && status.next?.phaseId === "P131.3"
    && roadmap.current?.phaseId === "P131.2"
    && roadmap.previous?.phaseId === "P131.1"
    && roadmap.next?.phaseId === "P131.3")
    || (status.current?.phaseId === "P131.3"
      && status.previous?.phaseId === "P131.2"
      && status.next?.phaseId === "P131.4"
      && roadmap.current?.phaseId === "P131.3"
      && roadmap.previous?.phaseId === "P131.2"
      && roadmap.next?.phaseId === "P131.4"),
);
addCheck("completed P131.2 entries have required fields", [statusById.get("P131"), statusById.get("P131.2"), roadmapById.get("P131.2")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck(
  "changed files stay in P131.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P131.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("model has no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(modelSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(modelSource));
addCheck("model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedModel));
addCheck("model avoids fake runnable actions", !/persist now|save now|write now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now|admit live store now/i.test(serializedModel));
addCheck("public docs avoid raw store table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_store|acceptance_capture_store|persistence_store_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/persist now|save now|write now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now|admit live store now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /store CRUD is enabled|CRUD is live|live store is enabled|live admission is enabled|DB reads are enabled|DB writes are enabled|runtime writes are enabled|migration is enabled|schema is created|acceptance capture is persisted|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P131.2 browser-safe store live admission request model.",
        "- Confirms the model reuses P130.4 safe dry-run evidence and keeps request submission, persistence, admission, CRUD, DB/runtime, provider, dispatch, mutation, network, and spend candidates blocked.",
        "- Does not create DB schemas, create migrations, read or write DB records, write runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1312.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P131.2 is a request model only. It does not create DB schemas, run migrations, read or write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P131.2 Live Admission Request Model Report", phase: "P131.2" },
);

printCheckReport("P131.2 Live Admission Request Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
