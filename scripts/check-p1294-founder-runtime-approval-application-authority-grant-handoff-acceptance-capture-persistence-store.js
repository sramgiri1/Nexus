import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_AREA_NAMES,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_FLAGS,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_ITEMS,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_PHASE,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_VERSION,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1294-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p129-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-contracts.json";
const PLAN_PATH = "docs/architecture/P129_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_PLAN.md";

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

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|metadata-only|schema-only|model-only|intent-only|preview-only|planned-only|read-only|future|local-only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

function booleanValuesFalse(object = {}) {
  return Object.values(object)
    .filter((value) => typeof value === "boolean")
    .every((value) => value === false);
}

const packageJson = readJson("package.json");
const contract = readJson(CONTRACT_PATH);
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1294 = subphaseById.get("P129.4") || {};
const p1295 = subphaseById.get("P129.5") || {};
const preview = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview();
const previewValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview(preview);
const invalidValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview({
  ...preview,
  migrationPolicy: {
    ...preview.migrationPolicy,
    approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreviewAllowed: true,
  },
  previewItems: preview.previewItems.map((item, index) => (index === 0 ? { ...item, canRunMigration: true } : item)),
});
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1293Checker = readText("scripts/check-p1293-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js");
const helperSource = readText("shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P129.4";
const allowedFiles = new Set(p1294.allowedFiles || []);
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
const p129ReadmeSlice = readme.match(/- P129\.1[\s\S]*?## CareLoop Project Progress/)?.[0] || readme;
const p129RoadmapSlice = platformRoadmap.match(/P129\.1 is complete[\s\S]*?Implementation follows/)?.[0] || platformRoadmap;
const docsBundle = `${plan}\n${p129ReadmeSlice}\n${p129RoadmapSlice}`;
const publicDocsBundle = `${p129ReadmeSlice}\n${p129RoadmapSlice}`;
const serializedPreview = JSON.stringify(preview);
const itemsUseful = preview.previewItems.every((item) => (
  item.previewAreaName
  && item.publicLabel
  && item.targetEntityName
  && item.previewState === "blocked"
  && item.disabledReason
  && item.ownerCapability
  && item.nextAction
  && item.evidenceLabels?.length > 0
  && item.activityLabels?.length > 0
  && item.costImpactLabel === "No provider spend"
));
const itemsBlocked = preview.previewItems.every((item) => (
  booleanValuesFalse(item)
  && booleanValuesFalse(item.authorityFlags)
));
const p1294CurrentState = status.currentPhase === "P129.4"
  && status.previousPhase === "P129.3"
  && status.nextPhase === "P129.5"
  && roadmap.currentPhase === "P129.4"
  && roadmap.previousPhase === "P129.3"
  && roadmap.nextPhase === "P129.5";
const p1295StartedState = status.currentPhase === "P129.5"
  && status.previousPhase === "P129.4"
  && status.nextPhase === "P129.6"
  && roadmap.currentPhase === "P129.5"
  && roadmap.previousPhase === "P129.4"
  && roadmap.nextPhase === "P129.6";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1294-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store"]));
addCheck("phase export is P129.4", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_PHASE === "P129.4" && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_VERSION === "1.0");
addCheck("preview areas are allowlisted", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_AREA_NAMES.length === 5 && preview.previewAreaNames.every((name) => FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_AREA_NAMES.includes(name)));
addCheck("migration preview is local and hidden", preview.previewOnly === true && preview.migrationPreviewOnly === true && preview.localOnly === true && preview.commandCenterVisible === false && preview.migrationPolicy?.mode === "preview-only");
addCheck("migration preview reuses P129.3 repository intent", preview.sourceRepositoryIntentPhase === "P129.3" && preview.sourceRepositoryIntentVersion === "1.0" && preview.sourceStoreMetadataPhase === "P129.2" && preview.sourcePersistenceBoundaryPhase === "P128.2" && preview.sourceCapturePhase === "P127.2" && preview.sourceRepositoryIntentValid === true);
addCheck("migration preview validation accepts default and rejects unsafe item", previewValidation.valid === true && invalidValidation.valid === false && invalidValidation.errors.length > 0);
addCheck("preview items are founder-useful and display-safe", itemsUseful && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_ITEMS.length === 5 && preview.previewItems.length === 5);
addCheck("preview items map to store entities", ["acceptanceCaptureStoreRecord", "acceptanceCaptureStoreIndex", "acceptanceCaptureStoreEvidenceLink"].every((name) => preview.previewItems.some((item) => item.targetEntityName === name)));
addCheck("migration flags are blocked", Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_FLAGS).every((value) => value === false) && booleanValuesFalse(preview.migrationPolicy) && itemsBlocked);
addCheck("migration policy blocks schemas, DB, runtime, CRUD, and execution", preview.migrationPolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreviewAllowed === false && preview.migrationPolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationAllowed === false && preview.migrationPolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudAllowed === false && preview.migrationPolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDbReadAllowed === false && preview.migrationPolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDbWriteAllowed === false && preview.migrationPolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRuntimeWriteAllowed === false && preview.migrationPolicy?.runtimeExecutionAllowed === false && preview.migrationPolicy?.providerCallAllowed === false && preview.migrationPolicy?.agentDispatchAllowed === false && preview.migrationPolicy?.providerSpendAllowed === false);
addCheck("migration preview carries blockers, next action, owner, evidence, activity, and cost", preview.blockers.length >= 4 && Boolean(preview.nextAction) && Boolean(preview.ownerCapability) && preview.evidenceLabels.length > 0 && preview.activityLabels.length > 0 && preview.costImpactLabel === "No provider spend");
addCheck("helper reuses P129.3 repository intent model", helperSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentModel") && helperSource.includes("validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentModel"));
addCheck("helper has no DB/runtime/provider imports or SQL statements", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|from\s+["']\.\.\/providers|from\s+["']\.\.\/tools|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+|DELETE\s+FROM/i.test(helperSource));
addCheck("contract marks P129.4 complete and P129.5 handoff valid", p1294.status === "complete" && ["planned", "complete"].includes(p1295.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_PHASE",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_VERSION",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_AREA_NAMES",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_FLAGS",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_MIGRATION_PREVIEW_ITEMS",
  "buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview",
  "validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview",
].every((name) => p1294.expectedExports?.includes(name)));
addCheck("P129.3 checker accepts P129.4 handoff", p1293Checker.includes("p1294StartedState") && p1293Checker.includes('status.nextPhase === "P129.5"'));
addCheck("docs record P129.4", /## P129\.4 Store Migration Preview[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P129.4", /P129\.4 store migration preview/i.test(readme) && /P129\.5 is next/i.test(readme));
addCheck("platform roadmap records P129.4", /P129\.4 is complete/i.test(platformRoadmap) && /P129\.5 is next/i.test(platformRoadmap));
addCheck(
  "phase status advanced",
  (p1294CurrentState || p1295StartedState)
    && statusById.get("P129")?.status === "in_progress"
    && statusById.get("P129.3")?.status === "complete"
    && statusById.get("P129.4")?.status === "complete"
    && roadmapById.get("P129.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P129.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P129.4 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw persistence table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_records|acceptance_capture_persistence_events|capture_persistence_records|persistence_store_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("migration preview avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedPreview));
addCheck("migration preview avoids fake runnable actions", !/persist now|save now|write now|capture acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|apply approval now|approve now|reject now|run now|execute now|deploy now|call provider now|create project now|dispatch agent now|write sqlite now|unlock execution now|run migration now/i.test(serializedPreview));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /store CRUD is enabled|CRUD is live|repository CRUD is enabled|migration is enabled|migration is live|migration is created|schema is created|acceptance capture persistence is enabled|acceptance capture is persisted|DB reads are enabled|DB writes are enabled|runtime writes are enabled|table is created|raw SQL is allowed|acceptance capture is live|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P129.4 browser-safe acceptance capture persistence store migration preview.",
        "- Confirms the preview reuses P129.3 repository intent model and remains local, preview-only, and hidden from primary Command Center UX.",
        "- Does not create DB schemas, create migration files, run migrations, read DB records, write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1294.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P129.4 is migration preview only. It does not create DB schemas, create migration files, run migrations, read DB records, write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P129.4 Store Migration Preview Report", phase: "P129.4" },
);

printCheckReport("P129.4 Store Migration Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
