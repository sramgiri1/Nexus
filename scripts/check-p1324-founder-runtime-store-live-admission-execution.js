import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_FLAGS,
  FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_STEP_NAMES,
  buildFounderRuntimeStoreLiveAdmissionDbWritePlanPreview,
  validateFounderRuntimeStoreLiveAdmissionDbWritePlanPreview,
} from "../shared/founderRuntimeStoreLiveAdmissionDbWritePlanPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1324-founder-runtime-store-live-admission-execution-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p132-founder-runtime-store-live-admission-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P132_FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_PLAN.md";
const MODEL_PATH = "shared/founderRuntimeStoreLiveAdmissionDbWritePlanPreview.js";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|display-only|read-only|future|local-only|model-only|preview-only|gate-only|preview|dry run|dry-run-only|cannot|later subphase)\b/i.test(context);
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
const p1324 = subphaseById.get("P132.4") || {};
const p1325 = subphaseById.get("P132.5") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1317Checker = readText("scripts/check-p1317-founder-runtime-store-live-admission-scope.js");
const p1321Checker = readText("scripts/check-p1321-founder-runtime-store-live-admission-execution.js");
const p1322Checker = readText("scripts/check-p1322-founder-runtime-store-live-admission-execution.js");
const p1323Checker = readText("scripts/check-p1323-founder-runtime-store-live-admission-execution.js");
const modelSource = readText(MODEL_PATH);
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const writePlanPreview = buildFounderRuntimeStoreLiveAdmissionDbWritePlanPreview();
const writePlanPreviewValidation = validateFounderRuntimeStoreLiveAdmissionDbWritePlanPreview(writePlanPreview);
const serializedPreview = JSON.stringify(writePlanPreview);
const readmeP132Slice = readme.match(/- P132\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const roadmapP132Slice = platformRoadmap.match(/P132\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${plan}\n${readmeP132Slice}\n${roadmapP132Slice}`;
const publicDocsBundle = `${readmeP132Slice}\n${roadmapP132Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P132.4";
const allowedFiles = new Set(p1324.allowedFiles || []);
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
const requiredScript = "check:p1324-founder-runtime-store-live-admission-execution";
const validationCommands = [
  "npm run check:p1324-founder-runtime-store-live-admission-execution",
  "npm run check:p1323-founder-runtime-store-live-admission-execution",
  "npm run check:p1322-founder-runtime-store-live-admission-execution",
  "npm run check:p1321-founder-runtime-store-live-admission-execution",
  "npm run check:p1317-founder-runtime-store-live-admission-scope",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"store live readiness gate appears only on scoped pages\"",
  "git diff --check",
];
const p1324CurrentState =
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
  && statusById.get("P132")?.status === "in_progress"
  && roadmapById.get("P132")?.status === "in_progress"
  && statusById.get("P132.3")?.status === "complete"
  && roadmapById.get("P132.3")?.status === "complete"
  && statusById.get("P132.4")?.status === "complete"
  && roadmapById.get("P132.4")?.status === "complete"
  && statusById.get("P132.5")?.status === "planned"
  && roadmapById.get("P132.5")?.status === "planned";
const p1325StartedState =
  status.currentPhase === "P132.5"
  && status.previousPhase === "P132.4"
  && status.nextPhase === "P132.6"
  && roadmap.currentPhase === "P132.5"
  && roadmap.previousPhase === "P132.4"
  && roadmap.nextPhase === "P132.6"
  && status.current?.phaseId === "P132.5"
  && status.previous?.phaseId === "P132.4"
  && status.next?.phaseId === "P132.6"
  && roadmap.current?.phaseId === "P132.5"
  && roadmap.previous?.phaseId === "P132.4"
  && roadmap.next?.phaseId === "P132.6"
  && statusById.get("P132")?.status === "in_progress"
  && roadmapById.get("P132")?.status === "in_progress"
  && statusById.get("P132.4")?.status === "complete"
  && roadmapById.get("P132.4")?.status === "complete"
  && statusById.get("P132.5")?.status === "complete"
  && roadmapById.get("P132.5")?.status === "complete"
  && statusById.get("P132.6")?.status === "planned"
  && roadmapById.get("P132.6")?.status === "planned";
const p1326StartedState =
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
  && statusById.get("P132.4")?.status === "complete"
  && roadmapById.get("P132.4")?.status === "complete"
  && statusById.get("P132.5")?.status === "complete"
  && roadmapById.get("P132.5")?.status === "complete"
  && statusById.get("P132.6")?.status === "complete"
  && roadmapById.get("P132.6")?.status === "complete"
  && statusById.get("P132.7")?.status === "planned"
  && roadmapById.get("P132.7")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[requiredScript]));
addCheck("contract marks P132.4 complete", contract.status === "in_progress" && ((contract.currentSubphase === "P132.4" && contract.previousSubphase === "P132.3" && contract.nextSubphase === "P132.5") || (contract.currentSubphase === "P132.5" && contract.previousSubphase === "P132.4" && contract.nextSubphase === "P132.6") || (contract.currentSubphase === "P132.6" && contract.previousSubphase === "P132.5" && contract.nextSubphase === "P132.7")) && p1324.status === "complete");
addCheck("P132.4 records expected base commit", p1324.expectedBaseCommit === "de20e30f");
addCheck("P132.5 remains planned or complete", ["planned", "complete"].includes(p1325.status));
addCheck("P132.4 allowed files include model and checker", p1324.allowedFiles?.includes(MODEL_PATH) && p1324.allowedFiles?.includes("scripts/check-p1324-founder-runtime-store-live-admission-execution.js"));
addCheck("P132.4 forbids project/dashboard/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1324.forbiddenFiles?.includes(path)));
addCheck("P132.4 records validation commands", validationCommands.every((command) => p1324.validationCommands?.includes(command)));
addCheck("P132.4 exports expected symbols", [
  "FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_PHASE",
  "FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_VERSION",
  "FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_STEP_NAMES",
  "FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_FLAGS",
  "buildFounderRuntimeStoreLiveAdmissionDbWritePlanPreview",
  "validateFounderRuntimeStoreLiveAdmissionDbWritePlanPreview",
].every((exportName) => modelSource.includes(`export const ${exportName}`) || modelSource.includes(`export function ${exportName}`)));
addCheck("P132.4 reuses P132.3 adapter gate", modelSource.includes("buildFounderRuntimeStoreLiveAdmissionStoreAdapterCapabilityGate") && modelSource.includes("validateFounderRuntimeStoreLiveAdmissionStoreAdapterCapabilityGate"));
addCheck("DB write-plan preview validates", writePlanPreviewValidation.valid, writePlanPreviewValidation.errors.join("; "));
addCheck("DB write-plan preview preserves lineage", writePlanPreview.sourceAdapterCapabilityGatePhase === "P132.3" && writePlanPreview.sourceExecutionRequestEnvelopePhase === "P132.2" && writePlanPreview.sourceAdmissionRequestPhase === "P131.2" && writePlanPreview.sourceSafeDryRunPhase === "P130.4" && writePlanPreview.sourceStoreSafeDryRunPhase === "P129.5" && writePlanPreview.sourceMigrationPreviewPhase === "P129.4" && writePlanPreview.sourceRepositoryIntentPhase === "P129.3" && writePlanPreview.sourcePersistenceBoundaryPhase === "P128.2");
addCheck("DB write-plan preview remains hidden and local", writePlanPreview.modelOnly === true && writePlanPreview.previewOnly === true && writePlanPreview.localOnly === true && writePlanPreview.commandCenterVisible === false);
addCheck("DB write-plan preview steps are complete", FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_STEP_NAMES.length === 9 && writePlanPreview.writePlanSteps?.length === 9);
addCheck("DB write-plan counts remain blocked", writePlanPreview.blockedWritePlanStepCount === writePlanPreview.writePlanStepCount && writePlanPreview.satisfiedWritePlanStepCount === 0 && writePlanPreview.writePlanPreviewCandidateCount === 0 && writePlanPreview.writePlanPersistenceCandidateCount === 0 && writePlanPreview.schemaCandidateCount === 0 && writePlanPreview.migrationCandidateCount === 0 && writePlanPreview.tableCandidateCount === 0 && writePlanPreview.dbReadableCandidateCount === 0 && writePlanPreview.dbWritableCandidateCount === 0 && writePlanPreview.liveCrudCandidateCount === 0 && writePlanPreview.runtimeWritableCandidateCount === 0 && writePlanPreview.providerCallCandidateCount === 0 && writePlanPreview.agentDispatchCandidateCount === 0 && writePlanPreview.projectMutationCandidateCount === 0 && writePlanPreview.providerSpendCandidateCount === 0);
addCheck("DB write-plan preview flags remain false", Object.values(FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_DB_WRITE_PLAN_PREVIEW_FLAGS).filter((value) => typeof value === "boolean").every((value) => value === false));
addCheck("DB write-plan step booleans remain false", writePlanPreview.writePlanSteps?.every((step) => Object.values(step).filter((value) => typeof value === "boolean").every((value) => value === false) && Object.values(step.authorityFlags || {}).filter((value) => typeof value === "boolean").every((value) => value === false)));
addCheck("DB write-plan boundaries are explicit", writePlanPreview.writePlanBoundaries?.length >= 3 && writePlanPreview.writePlanBoundaries.join(" ").includes("No schema, migration, table, query, or runtime record"));
addCheck("P132.3 report passes", reportPassed("reports/p1323-founder-runtime-store-live-admission-execution-report.md"));
addCheck("P132.3 checker accepts P132.4 handoff", p1323Checker.includes("p1324StartedState") && p1323Checker.includes('status.currentPhase === "P132.4"') && p1323Checker.includes('status.nextPhase === "P132.5"'));
addCheck("P132.2 checker accepts P132.4 handoff", p1322Checker.includes("p1324StartedState") && p1322Checker.includes('status.currentPhase === "P132.4"') && p1322Checker.includes('status.nextPhase === "P132.5"'));
addCheck("P132.1 checker accepts P132.4 handoff", p1321Checker.includes("p1324StartedState") && p1321Checker.includes('status.currentPhase === "P132.4"') && p1321Checker.includes('status.nextPhase === "P132.5"'));
addCheck("P131.7 checker accepts P132.4 handoff", p1317Checker.includes("p1324StartedState") && p1317Checker.includes('status.currentPhase === "P132.4"') && p1317Checker.includes('status.nextPhase === "P132.5"'));
addCheck("plan records P132.4 implementation", /## P132\.4 DB Write Plan Preview[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P132.4", /P132\.4 DB write-plan preview/i.test(readme));
addCheck("platform roadmap records P132.4", /P132\.4 is complete/i.test(platformRoadmap) && (/P132\.5\s+is next/i.test(platformRoadmap) || /P132\.5 is complete/i.test(platformRoadmap)));
addCheck("Command Center UX remains unchanged and scoped", pageSource.includes("Business Build Store Live Admission Scope") && pageSource.includes("Agent Flow Store Live Admission Scope") && !pageSource.includes("Lite Store Live Admission Scope") && !pageSource.includes("Chat Store Live Admission Scope") && !pageSource.includes("DemoApp"));
addCheck("Playwright scoped store readiness coverage remains", routeTests.includes("store live readiness gate appears only on scoped pages") && routeTests.includes("Store live admission scope"));
addCheck(
  "phase status advanced",
  p1324CurrentState || p1325StartedState || p1326StartedState,
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("completed P132.4 entries have required fields", [statusById.get("P132"), statusById.get("P132.4"), roadmapById.get("P132.4")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck(
  "changed files stay in P132.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P132.4 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("model has no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(modelSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(modelSource));
addCheck("model avoids raw SQL/table names", !/(CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM|SELECT \\* FROM|ALTER TABLE|DROP TABLE|approval_authority_grant_handoff_acceptance_capture_persistence_store|acceptance_capture_store|persistence_store_records)/i.test(modelSource));
addCheck("model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedPreview));
addCheck("model avoids fake runnable actions", !/write plan now|persist now|save now|write now|read now|migrate now|create schema now|create table now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now|admit live store now/i.test(serializedPreview));
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
        "- Validates the P132.4 browser-safe DB write-plan preview model.",
        "- Confirms the model reuses P132.3 adapter capability gate evidence and keeps write-plan persistence, schemas, migrations, tables, DB reads/writes, CRUD, runtime writes, adapter selection, adapter connection, provider calls, dispatch, mutation, network, deploy, release, export, package, and spend candidates blocked.",
        "- Does not create DB schemas, create migrations, read or write DB records, write runtime records, select adapters, connect adapters, persist requests, run CRUD actions, capture approvals, accept handoff, grant authority, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1324.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P132.4 is a DB write-plan preview model only. It does not create DB schemas, run migrations, read or write DB/runtime records, select or connect adapters, persist requests, execute CRUD, capture approvals, accept handoff, grant authority, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P132.4 DB Write Plan Preview Report", phase: "P132.4" },
);

printCheckReport("P132.4 DB Write Plan Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
