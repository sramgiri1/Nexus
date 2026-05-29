import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_FLAGS,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_REQUIREMENT_NAMES,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessPrerequisites,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessPrerequisites,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessPrerequisites.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1302-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p130-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-contracts.json";
const PLAN_PATH = "docs/architecture/P130_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_PLAN.md";
const MODEL_PATH = "shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessPrerequisites.js";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|safe dry-run|dry-run-only|planned-only|display-only|read-only|future|local-only|model-only|prerequisite model|prerequisites only)\b/i.test(context);
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
const p1302 = subphaseById.get("P130.2") || {};
const p1303 = subphaseById.get("P130.3") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1301Checker = readText("scripts/check-p1301-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness.js");
const modelSource = readText(MODEL_PATH);
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const model = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessPrerequisites();
const modelValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessPrerequisites(model);
const serializedModel = JSON.stringify(model);
const readmeP130Slice = readme.match(/- P130\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const roadmapP130Slice = platformRoadmap.match(/P130\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${plan}\n${readmeP130Slice}\n${roadmapP130Slice}`;
const publicDocsBundle = `${readmeP130Slice}\n${roadmapP130Slice}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P130.2";
const allowedFiles = new Set(p1302.allowedFiles || []);
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
const requiredScript = "check:p1302-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness";
const validationCommands = [
  "npm run check:p1302-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness",
  "npm run check:p1301-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"capture persistence store readiness appears only on scoped pages\"",
  "git diff --check",
];

addCheck("package script registered", Boolean(packageJson.scripts?.[requiredScript]));
addCheck("contract marks P130.2 complete", contract.status === "in_progress" && contract.currentSubphase === "P130.2" && contract.previousSubphase === "P130.1" && contract.nextSubphase === "P130.3" && p1302.status === "complete");
addCheck("P130.2 records expected base commit", p1302.expectedBaseCommit === "8c3a4b65");
addCheck("P130.3 remains planned", p1303.status === "planned");
addCheck("P130.2 allowed files include model and checker", p1302.allowedFiles?.includes(MODEL_PATH) && p1302.allowedFiles?.includes("scripts/check-p1302-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness.js"));
addCheck("P130.2 forbids project/dashboard/db/runtime paths", ["projects/**", "careloop/**", "generated-projects/**", "dashboard/src/**", "dashboard/tests/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1302.forbiddenFiles?.includes(path)));
addCheck("P130.2 records validation commands", validationCommands.every((command) => p1302.validationCommands?.includes(command)));
addCheck("P130.2 exports expected symbols", [
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_PREREQUISITES_PHASE",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_PREREQUISITES_VERSION",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_REQUIREMENT_NAMES",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_FLAGS",
  "buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessPrerequisites",
  "validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreLiveReadinessPrerequisites",
].every((exportName) => modelSource.includes(`export ${exportName}`) || modelSource.includes(`export const ${exportName}`) || modelSource.includes(`export function ${exportName}`)));
addCheck("P130.2 reuses P129.5 safe dry run", modelSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun") && modelSource.includes("validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun"));
addCheck("prerequisite model validates", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("prerequisite model preserves lineage", model.sourceStoreSafeDryRunPhase === "P129.5" && model.sourceMigrationPreviewPhase === "P129.4" && model.sourceRepositoryIntentPhase === "P129.3" && model.sourceStoreMetadataPhase === "P129.2" && model.sourcePersistenceBoundaryPhase === "P128.2" && model.sourceCapturePhase === "P127.2");
addCheck("prerequisite model remains hidden and local", model.modelOnly === true && model.prerequisitesOnly === true && model.localOnly === true && model.commandCenterVisible === false);
addCheck("prerequisite names are complete", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_REQUIREMENT_NAMES.length === 7 && model.requirementRows?.length === 7);
addCheck("prerequisite counts remain blocked", model.blockedRequirementCount === model.requirementCount && model.satisfiedRequirementCount === 0 && model.liveAdmissionCandidateCount === 0 && model.liveCrudCandidateCount === 0 && model.dbReadableCandidateCount === 0 && model.dbWritableCandidateCount === 0 && model.runtimeWritableCandidateCount === 0 && model.providerSpendCandidateCount === 0);
addCheck("prerequisite flags remain false", Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_FLAGS).filter((value) => typeof value === "boolean").every((value) => value === false));
addCheck("prerequisite row booleans remain false", model.requirementRows?.every((row) => Object.values(row).filter((value) => typeof value === "boolean").every((value) => value === false) && Object.values(row.authorityFlags || {}).filter((value) => typeof value === "boolean").every((value) => value === false)));
addCheck("P130.1 checker accepts P130.2 handoff", p1301Checker.includes("p130ProgressState") && p1301Checker.includes("/^P130\\.[2-7]$/"));
addCheck("P130.1 report passes", reportPassed("reports/p1301-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-report.md"));
addCheck("plan records P130.2 implementation", /## P130\.2 Store Live Prerequisite Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P130.2", /P130\.2 store live prerequisite model/i.test(readme));
addCheck("platform roadmap records P130.2", /P130\.2 is complete/i.test(platformRoadmap) && /P130\.3 is next/i.test(platformRoadmap));
addCheck("Command Center UX remains unchanged and scoped", pageSource.includes("Business Build Capture Persistence Store Readiness") && pageSource.includes("Agent Flow Capture Persistence Store Readiness") && !pageSource.includes("Lite Capture Persistence Store Readiness") && !pageSource.includes("Chat Capture Persistence Store Readiness") && !pageSource.includes("DemoApp"));
addCheck("Playwright scoped store readiness coverage remains", routeTests.includes("capture persistence store readiness appears only on scoped pages"));
addCheck(
  "phase status advanced",
  status.currentPhase === "P130.2"
    && status.previousPhase === "P130.1"
    && status.nextPhase === "P130.3"
    && roadmap.currentPhase === "P130.2"
    && roadmap.previousPhase === "P130.1"
    && roadmap.nextPhase === "P130.3"
    && statusById.get("P130")?.status === "in_progress"
    && roadmapById.get("P130")?.status === "in_progress"
    && statusById.get("P130.1")?.status === "complete"
    && roadmapById.get("P130.1")?.status === "complete"
    && statusById.get("P130.2")?.status === "complete"
    && roadmapById.get("P130.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("completed P130.2 entries have required fields", [statusById.get("P130"), statusById.get("P130.2"), roadmapById.get("P130.2")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck(
  "changed files stay in P130.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P130.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("model has no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(modelSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(modelSource));
addCheck("model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedModel));
addCheck("model avoids fake runnable actions", !/persist now|save now|write now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedModel));
addCheck("public docs avoid raw store table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_store|acceptance_capture_store|persistence_store_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/persist now|save now|write now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /store CRUD is enabled|CRUD is live|live store is enabled|DB reads are enabled|DB writes are enabled|runtime writes are enabled|migration is enabled|schema is created|acceptance capture is persisted|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P130.2 browser-safe store live prerequisite model.",
        "- Confirms the model reuses P129.5 safe dry-run evidence and keeps all live candidates blocked.",
        "- Does not create DB schemas, create migrations, read or write DB records, write runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1302.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P130.2 is a prerequisite model only. It does not create DB schemas, run migrations, read or write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P130.2 Store Live Prerequisite Model Report", phase: "P130.2" },
);

printCheckReport("P130.2 Store Live Prerequisite Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
