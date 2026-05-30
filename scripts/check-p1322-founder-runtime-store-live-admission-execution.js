import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_FIELD_NAMES,
  FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_FLAGS,
  buildFounderRuntimeStoreLiveAdmissionExecutionRequestEnvelope,
  validateFounderRuntimeStoreLiveAdmissionExecutionRequestEnvelope,
} from "../shared/founderRuntimeStoreLiveAdmissionExecutionRequestEnvelope.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1322-founder-runtime-store-live-admission-execution-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p132-founder-runtime-store-live-admission-execution-contracts.json";
const PLAN_PATH = "docs/architecture/P132_FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_PLAN.md";
const MODEL_PATH = "shared/founderRuntimeStoreLiveAdmissionExecutionRequestEnvelope.js";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|display-only|read-only|future|local-only|model-only|envelope-only|request envelope|request model|preview|dry run|dry-run-only|cannot|later subphase)\b/i.test(context);
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
const p1322 = subphaseById.get("P132.2") || {};
const p1323 = subphaseById.get("P132.3") || {};
const p1322ContractState = contract.status === "in_progress"
  && contract.currentSubphase === "P132.2"
  && contract.previousSubphase === "P132.1"
  && contract.nextSubphase === "P132.3";
const p1323ContractState = contract.status === "in_progress"
  && contract.currentSubphase === "P132.3"
  && contract.previousSubphase === "P132.2"
  && contract.nextSubphase === "P132.4";
const p1324ContractState = contract.status === "in_progress"
  && contract.currentSubphase === "P132.4"
  && contract.previousSubphase === "P132.3"
  && contract.nextSubphase === "P132.5";
const p1324StartedState =
  status.currentPhase === "P132.4"
  && status.previousPhase === "P132.3"
  && status.nextPhase === "P132.5";
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1321Checker = readText("scripts/check-p1321-founder-runtime-store-live-admission-execution.js");
const modelSource = readText(MODEL_PATH);
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const envelope = buildFounderRuntimeStoreLiveAdmissionExecutionRequestEnvelope();
const envelopeValidation = validateFounderRuntimeStoreLiveAdmissionExecutionRequestEnvelope(envelope);
const serializedEnvelope = JSON.stringify(envelope);
const readmeP132Slice = readme.match(/- P132\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const roadmapP132Slice = platformRoadmap.match(/P132\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${plan}\n${readmeP132Slice}\n${roadmapP132Slice}`;
const publicDocsBundle = `${readmeP132Slice}\n${roadmapP132Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P132.2";
const allowedFiles = new Set(p1322.allowedFiles || []);
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
const requiredScript = "check:p1322-founder-runtime-store-live-admission-execution";
const validationCommands = [
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

addCheck("package script registered", Boolean(packageJson.scripts?.[requiredScript]));
addCheck("contract marks P132.2 complete", (p1322ContractState || p1323ContractState || p1324ContractState) && p1322.status === "complete");
addCheck("P132.2 records expected base commit", p1322.expectedBaseCommit === "894644ab");
addCheck("P132.3 remains planned or complete", ["planned", "complete"].includes(p1323.status));
addCheck("P132.2 allowed files include model and checker", p1322.allowedFiles?.includes(MODEL_PATH) && p1322.allowedFiles?.includes("scripts/check-p1322-founder-runtime-store-live-admission-execution.js"));
addCheck("P132.2 forbids project/dashboard/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1322.forbiddenFiles?.includes(path)));
addCheck("P132.2 records validation commands", validationCommands.every((command) => p1322.validationCommands?.includes(command)));
addCheck("P132.2 exports expected symbols", [
  "FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_PHASE",
  "FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_VERSION",
  "FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_FIELD_NAMES",
  "FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_FLAGS",
  "buildFounderRuntimeStoreLiveAdmissionExecutionRequestEnvelope",
  "validateFounderRuntimeStoreLiveAdmissionExecutionRequestEnvelope",
].every((exportName) => modelSource.includes(`export const ${exportName}`) || modelSource.includes(`export function ${exportName}`)));
addCheck("P132.2 reuses P131.2 request model", modelSource.includes("buildFounderRuntimeStoreLiveAdmissionScopeRequestModel") && modelSource.includes("validateFounderRuntimeStoreLiveAdmissionScopeRequestModel"));
addCheck("execution request envelope validates", envelopeValidation.valid, envelopeValidation.errors.join("; "));
addCheck("execution request envelope preserves lineage", envelope.sourceAdmissionRequestPhase === "P131.2" && envelope.sourceSafeDryRunPhase === "P130.4" && envelope.sourceStoreSafeDryRunPhase === "P129.5" && envelope.sourceMigrationPreviewPhase === "P129.4" && envelope.sourceRepositoryIntentPhase === "P129.3" && envelope.sourcePersistenceBoundaryPhase === "P128.2");
addCheck("execution request envelope remains hidden and local", envelope.modelOnly === true && envelope.envelopeOnly === true && envelope.localOnly === true && envelope.commandCenterVisible === false);
addCheck("execution envelope fields are complete", FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_FIELD_NAMES.length === 9 && envelope.envelopeFields?.length === 9);
addCheck("execution envelope counts remain blocked", envelope.blockedEnvelopeFieldCount === envelope.envelopeFieldCount && envelope.satisfiedEnvelopeFieldCount === 0 && envelope.envelopePreparationCandidateCount === 0 && envelope.envelopePersistenceCandidateCount === 0 && envelope.adapterSelectionCandidateCount === 0 && envelope.writePlanCandidateCount === 0 && envelope.liveCrudCandidateCount === 0 && envelope.dbReadableCandidateCount === 0 && envelope.dbWritableCandidateCount === 0 && envelope.runtimeWritableCandidateCount === 0 && envelope.providerCallCandidateCount === 0 && envelope.agentDispatchCandidateCount === 0 && envelope.projectMutationCandidateCount === 0 && envelope.providerSpendCandidateCount === 0);
addCheck("execution envelope flags remain false", Object.values(FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_REQUEST_ENVELOPE_FLAGS).filter((value) => typeof value === "boolean").every((value) => value === false));
addCheck("execution envelope field booleans remain false", envelope.envelopeFields?.every((field) => Object.values(field).filter((value) => typeof value === "boolean").every((value) => value === false) && Object.values(field.authorityFlags || {}).filter((value) => typeof value === "boolean").every((value) => value === false)));
addCheck("P132.1 checker accepts P132.2 handoff", p1321Checker.includes("p1322StartedState") && p1321Checker.includes('status.currentPhase === "P132.2"') && p1321Checker.includes('status.nextPhase === "P132.3"'));
addCheck("P132.1 report passes", reportPassed("reports/p1321-founder-runtime-store-live-admission-execution-report.md"));
addCheck("plan records P132.2 implementation", /## P132\.2 Execution Request Envelope Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P132.2", /P132\.2 execution request envelope model/i.test(readme));
addCheck("platform roadmap records P132.2", /P132\.2 is complete/i.test(platformRoadmap) && (/P132\.3\s+is next/i.test(platformRoadmap) || /P132\.3 is complete/i.test(platformRoadmap)));
addCheck("Command Center UX remains unchanged and scoped", pageSource.includes("Business Build Store Live Admission Scope") && pageSource.includes("Agent Flow Store Live Admission Scope") && !pageSource.includes("Lite Store Live Admission Scope") && !pageSource.includes("Chat Store Live Admission Scope") && !pageSource.includes("DemoApp"));
addCheck("Playwright scoped store readiness coverage remains", routeTests.includes("store live readiness gate appears only on scoped pages") && routeTests.includes("Store live admission scope"));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P132.2"
    && status.previousPhase === "P132.1"
    && status.nextPhase === "P132.3"
    && roadmap.currentPhase === "P132.2"
    && roadmap.previousPhase === "P132.1"
    && roadmap.nextPhase === "P132.3")
    || (status.currentPhase === "P132.3"
      && status.previousPhase === "P132.2"
      && status.nextPhase === "P132.4"
      && roadmap.currentPhase === "P132.3"
      && roadmap.previousPhase === "P132.2"
      && roadmap.nextPhase === "P132.4")
    || (status.currentPhase === "P132.4"
      && status.previousPhase === "P132.3"
      && status.nextPhase === "P132.5"
      && roadmap.currentPhase === "P132.4"
      && roadmap.previousPhase === "P132.3"
      && roadmap.nextPhase === "P132.5"))
    && statusById.get("P132")?.status === "in_progress"
    && roadmapById.get("P132")?.status === "in_progress"
    && statusById.get("P132.1")?.status === "complete"
    && roadmapById.get("P132.1")?.status === "complete"
    && statusById.get("P132.2")?.status === "complete"
    && roadmapById.get("P132.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P132.3")?.status)
    && ["planned", "complete"].includes(roadmapById.get("P132.3")?.status)
    && ["planned", "complete"].includes(statusById.get("P132.4")?.status)
    && ["planned", "complete"].includes(roadmapById.get("P132.4")?.status),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "phase status summary objects advanced",
  (status.current?.phaseId === "P132.2"
    && status.previous?.phaseId === "P132.1"
    && status.next?.phaseId === "P132.3"
    && roadmap.current?.phaseId === "P132.2"
    && roadmap.previous?.phaseId === "P132.1"
    && roadmap.next?.phaseId === "P132.3")
    || (status.current?.phaseId === "P132.3"
      && status.previous?.phaseId === "P132.2"
      && status.next?.phaseId === "P132.4"
      && roadmap.current?.phaseId === "P132.3"
      && roadmap.previous?.phaseId === "P132.2"
      && roadmap.next?.phaseId === "P132.4")
    || (status.current?.phaseId === "P132.4"
      && status.previous?.phaseId === "P132.3"
      && status.next?.phaseId === "P132.5"
      && roadmap.current?.phaseId === "P132.4"
      && roadmap.previous?.phaseId === "P132.3"
      && roadmap.next?.phaseId === "P132.5"),
);
addCheck("completed P132.2 entries have required fields", [statusById.get("P132"), statusById.get("P132.2"), roadmapById.get("P132.2")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck(
  "changed files stay in P132.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P132.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("model has no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(modelSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(modelSource));
addCheck("model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedEnvelope));
addCheck("model avoids fake runnable actions", !/persist now|save now|write now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now|admit live store now/i.test(serializedEnvelope));
addCheck("public docs avoid raw store table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_store|acceptance_capture_store|persistence_store_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/persist now|save now|write now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now|admit live store now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /request persistence is enabled|store CRUD is enabled|CRUD is live|live store is enabled|live admission is enabled|DB reads are enabled|DB writes are enabled|runtime writes are enabled|migration is enabled|schema is created|acceptance capture is persisted|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P132.2 browser-safe store live execution request envelope model.",
        "- Confirms the model reuses P131.2 admission request evidence and keeps envelope persistence, adapter selection, write plans, CRUD, DB/runtime, provider, dispatch, mutation, network, deploy, release, export, package, and spend candidates blocked.",
        "- Does not create DB schemas, create migrations, read or write DB records, write runtime records, persist requests, run CRUD actions, capture approvals, accept handoff, grant authority, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1322.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P132.2 is an execution request envelope model only. It does not create DB schemas, run migrations, read or write DB/runtime records, persist requests, execute CRUD, capture approvals, accept handoff, grant authority, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P132.2 Execution Request Envelope Model Report", phase: "P132.2" },
);

printCheckReport("P132.2 Execution Request Envelope Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
