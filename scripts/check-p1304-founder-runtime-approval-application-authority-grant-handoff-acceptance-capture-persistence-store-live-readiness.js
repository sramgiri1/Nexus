import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_ACTION_NAMES,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_FLAGS,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1304-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p130-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-contracts.json";
const PLAN_PATH = "docs/architecture/P130_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_PLAN.md";
const MODEL_PATH = "shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun.js";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|safe dry-run|dry-run-only|planned-only|display-only|read-only|future|local-only|model-only|evidence gate|gate only|cannot)\b/i.test(context);
  });
}

function booleanValuesFalse(object = {}) {
  return Object.values(object)
    .filter((value) => typeof value === "boolean")
    .every((value) => value === false);
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
const p1304 = subphaseById.get("P130.4") || {};
const p1305 = subphaseById.get("P130.5") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1303Checker = readText("scripts/check-p1303-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness.js");
const modelSource = readText(MODEL_PATH);
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const model = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun();
const modelValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun(model);
const invalidValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun({
  ...model,
  admissionDryRunPolicy: {
    ...model.admissionDryRunPolicy,
    approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRunAllowed: true,
  },
  safeDryRunEnvelopes: model.safeDryRunEnvelopes.map((envelope, index) => (
    index === 0 ? { ...envelope, data: { ...envelope.data, canAdmitLiveStore: true } } : envelope
  )),
});
const p1304ContractState = contract.status === "in_progress"
  && contract.currentSubphase === "P130.4"
  && contract.previousSubphase === "P130.3"
  && contract.nextSubphase === "P130.5";
const p1305ContractState = contract.status === "in_progress"
  && contract.currentSubphase === "P130.5"
  && contract.previousSubphase === "P130.4"
  && contract.nextSubphase === "P130.6";
const p1304CurrentState = status.currentPhase === "P130.4"
  && status.previousPhase === "P130.3"
  && status.nextPhase === "P130.5"
  && roadmap.currentPhase === "P130.4"
  && roadmap.previousPhase === "P130.3"
  && roadmap.nextPhase === "P130.5";
const p1305StartedState = status.currentPhase === "P130.5"
  && status.previousPhase === "P130.4"
  && status.nextPhase === "P130.6"
  && roadmap.currentPhase === "P130.5"
  && roadmap.previousPhase === "P130.4"
  && roadmap.nextPhase === "P130.6";
const serializedModel = JSON.stringify(model);
const readmeP130Slice = readme.match(/- P130\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const roadmapP130Slice = platformRoadmap.match(/P130\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${plan}\n${readmeP130Slice}\n${roadmapP130Slice}`;
const publicDocsBundle = `${readmeP130Slice}\n${roadmapP130Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P130.4";
const allowedFiles = new Set(p1304.allowedFiles || []);
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
const requiredScript = "check:p1304-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness";
const validationCommands = [
  "npm run check:p1304-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness",
  "npm run check:p1303-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"capture persistence store readiness appears only on scoped pages\"",
  "git diff --check",
];
const envelopesUseful = model.safeDryRunEnvelopes?.every((envelope) => (
  envelope.status === "BLOCKED"
  && envelope.ok === false
  && envelope.mode === "store-live-admission-safe-dry-run"
  && envelope.data?.actionName
  && envelope.data?.publicLabel
  && envelope.data?.targetName
  && envelope.data?.admissionState === "blocked"
  && envelope.data?.disabledReason
  && envelope.data?.ownerCapability
  && envelope.data?.nextAction
  && envelope.data?.evidenceLabels?.length > 0
  && envelope.data?.activityLabels?.length > 0
  && envelope.data?.costImpactLabel === "No provider spend"
));
const envelopesBlocked = model.safeDryRunEnvelopes?.every((envelope) => (
  booleanValuesFalse(envelope.data || {})
  && booleanValuesFalse(envelope.data?.authorityFlags || {})
));

addCheck("package script registered", Boolean(packageJson.scripts?.[requiredScript]));
addCheck("contract marks P130.4 complete", (p1304ContractState || p1305ContractState) && p1304.status === "complete");
addCheck("P130.4 records expected base commit", p1304.expectedBaseCommit === "8a7efdaf");
addCheck("P130.5 remains planned or complete", ["planned", "complete"].includes(p1305.status));
addCheck("P130.4 allowed files include model and checker", p1304.allowedFiles?.includes(MODEL_PATH) && p1304.allowedFiles?.includes("scripts/check-p1304-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness.js"));
addCheck("P130.4 forbids project/dashboard/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1304.forbiddenFiles?.includes(path)));
addCheck("P130.4 records validation commands", validationCommands.every((command) => p1304.validationCommands?.includes(command)));
addCheck("P130.4 exports expected symbols", [
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_PHASE",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_VERSION",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_ACTION_NAMES",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_FLAGS",
  "buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun",
  "validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessSafeDryRun",
].every((exportName) => modelSource.includes(`export ${exportName}`) || modelSource.includes(`export const ${exportName}`) || modelSource.includes(`export function ${exportName}`)));
addCheck("P130.4 reuses P130.3 gate and result envelopes", modelSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessApprovalGate") && modelSource.includes("validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessApprovalGate") && modelSource.includes("createBlockedResult") && modelSource.includes("validateResultEnvelope"));
addCheck("store live admission safe dry run validates and rejects unsafe envelope", modelValidation.valid && invalidValidation.valid === false && invalidValidation.errors.length > 0, modelValidation.errors.join("; "));
addCheck("store live admission safe dry run preserves lineage", model.sourceApprovalGatePhase === "P130.3" && model.sourcePrerequisitesPhase === "P130.2" && model.sourceStoreSafeDryRunPhase === "P129.5" && model.sourceMigrationPreviewPhase === "P129.4" && model.sourceRepositoryIntentPhase === "P129.3" && model.sourceStoreMetadataPhase === "P129.2" && model.sourcePersistenceBoundaryPhase === "P128.2" && model.sourceCapturePhase === "P127.2");
addCheck("store live admission safe dry run remains hidden and local", model.safeDryRunOnly === true && model.admissionDryRunOnly === true && model.localOnly === true && model.commandCenterVisible === false);
addCheck("store live admission safe dry-run actions are complete", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_ACTION_NAMES.length === 7 && model.safeDryRunEnvelopes?.length === 7);
addCheck("store live admission safe dry-run counts remain blocked", model.blockedSafeDryRunEnvelopeCount === model.safeDryRunEnvelopeCount && model.liveAdmissionCandidateCount === 0 && model.liveCrudCandidateCount === 0 && model.approvalCaptureCandidateCount === 0 && model.decisionPersistenceCandidateCount === 0 && model.dbReadableCandidateCount === 0 && model.dbWritableCandidateCount === 0 && model.runtimeWritableCandidateCount === 0 && model.providerSpendCandidateCount === 0);
addCheck("store live admission safe dry-run flags remain false", Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_SAFE_DRY_RUN_FLAGS).filter((value) => typeof value === "boolean").every((value) => value === false));
addCheck("store live admission safe dry-run envelopes are useful and blocked", envelopesUseful && envelopesBlocked);
addCheck("P130.3 checker accepts P130.4 handoff", p1303Checker.includes("p1304StartedState") && p1303Checker.includes('status.currentPhase === "P130.4"'));
addCheck("P130.3 report passes", reportPassed("reports/p1303-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-report.md"));
addCheck("plan records P130.4 implementation", /## P130\.4 Store Live Admission Safe Dry Run[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P130.4", /P130\.4 store live admission safe dry run/i.test(readme));
addCheck("platform roadmap records P130.4", /P130\.4 is complete/i.test(platformRoadmap) && /P130\.5\s+is next/i.test(platformRoadmap));
addCheck("Command Center UX remains unchanged and scoped", pageSource.includes("Business Build Capture Persistence Store Readiness") && pageSource.includes("Agent Flow Capture Persistence Store Readiness") && !pageSource.includes("Lite Capture Persistence Store Readiness") && !pageSource.includes("Chat Capture Persistence Store Readiness") && !pageSource.includes("DemoApp"));
addCheck("Playwright scoped store readiness coverage remains", routeTests.includes("capture persistence store readiness appears only on scoped pages"));
addCheck(
  "phase status advanced",
  (p1304CurrentState || p1305StartedState)
    && statusById.get("P130")?.status === "in_progress"
    && roadmapById.get("P130")?.status === "in_progress"
    && statusById.get("P130.3")?.status === "complete"
    && roadmapById.get("P130.3")?.status === "complete"
    && statusById.get("P130.4")?.status === "complete"
    && roadmapById.get("P130.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("completed P130.4 entries have required fields", [statusById.get("P130"), statusById.get("P130.4"), roadmapById.get("P130.4")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck(
  "changed files stay in P130.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P130.4 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("model has no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(modelSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(modelSource));
addCheck("model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedModel));
addCheck("model avoids fake runnable actions", !/persist now|save now|write now|capture approval now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now|admit live store now/i.test(serializedModel));
addCheck("public docs avoid raw store table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_store|acceptance_capture_store|persistence_store_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/persist now|save now|write now|capture approval now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now|admit live store now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval capture is enabled|approval decision is persisted|store CRUD is enabled|CRUD is live|live store is enabled|live admission is enabled|DB reads are enabled|DB writes are enabled|runtime writes are enabled|migration is enabled|schema is created|acceptance capture is persisted|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P130.4 browser-safe store live admission safe dry-run model.",
        "- Confirms the model reuses P130.3 approval evidence gate and `shared/resultEnvelope.js` while keeping admission, CRUD, DB/runtime write, provider, dispatch, mutation, network, and spend candidates blocked.",
        "- Does not capture approvals, persist decisions, create DB schemas, create migrations, read or write DB records, write runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1304.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P130.4 is safe dry-run modeling only. It does not capture approvals, persist decisions, create DB schemas, run migrations, read or write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P130.4 Store Live Admission Safe Dry Run Report", phase: "P130.4" },
);

printCheckReport("P130.4 Store Live Admission Safe Dry Run Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
