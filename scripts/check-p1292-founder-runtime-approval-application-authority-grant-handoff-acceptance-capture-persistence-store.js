import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_ENTITIES,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_ENTITY_NAMES,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_FLAGS,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_METADATA_PHASE,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_METADATA_VERSION,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1292-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md";
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|metadata-only|schema-only|model-only|planned-only|read-only|future|local-only)\b/i.test(context);
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
const p1292 = subphaseById.get("P129.2") || {};
const p1293 = subphaseById.get("P129.3") || {};
const metadata = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata();
const metadataValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata(metadata);
const invalidValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata({
  ...metadata,
  storePolicy: {
    ...metadata.storePolicy,
    approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudAllowed: true,
    approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDbWriteAllowed: true,
  },
});
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1291Checker = readText("scripts/check-p1291-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js");
const helperSource = readText("shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P129.2";
const allowedFiles = new Set(p1292.allowedFiles || []);
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
const serializedMetadata = JSON.stringify(metadata);
const sectionsUseful = metadata.entities.every((entity) => (
  entity.entityName
  && entity.publicLabel
  && entity.purpose
  && entity.primaryKeyLabel
  && entity.retentionClass
  && entity.piiRisk
  && entity.redactionRequired === true
  && entity.fields
  && Object.keys(entity.fields).length >= 8
));
const metadataBlocked = booleanValuesFalse(metadata.storePolicy)
  && metadata.entities.every((entity) => booleanValuesFalse(entity.authorityFlags))
  && booleanValuesFalse(metadata.sourcePersistenceBoundary?.authorityFlags || {});
const p1292CurrentState = status.currentPhase === "P129.2"
  && status.previousPhase === "P129.1"
  && status.nextPhase === "P129.3"
  && roadmap.currentPhase === "P129.2"
  && roadmap.previousPhase === "P129.1"
  && roadmap.nextPhase === "P129.3";
const p1293StartedState = status.currentPhase === "P129.3"
  && status.previousPhase === "P129.2"
  && status.nextPhase === "P129.4"
  && roadmap.currentPhase === "P129.3"
  && roadmap.previousPhase === "P129.2"
  && roadmap.nextPhase === "P129.4";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1292-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store"]));
addCheck("phase export is P129.2", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_METADATA_PHASE === "P129.2" && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_METADATA_VERSION === "1.0");
addCheck("entity names are allowlisted", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_ENTITY_NAMES.length === 3 && metadata.entityNames.every((name) => FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_ENTITY_NAMES.includes(name)));
addCheck("metadata is schema-only", metadata.metadataOnly === true && metadata.schemaOnly === true && metadata.localOnly === true && metadata.commandCenterVisible === false && metadata.storePolicy?.mode === "metadata-only");
addCheck("metadata reuses P128.2 persistence boundary metadata", metadata.sourcePersistenceBoundaryPhase === "P128.2" && metadata.sourcePersistenceBoundaryVersion === "1.0" && metadata.sourceCapturePhase === "P127.2");
addCheck("metadata entities are display-safe", sectionsUseful && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_ENTITIES.length === 3 && metadata.entities.length === 3);
addCheck("metadata has founder-useful store entities", ["acceptanceCaptureStoreRecord", "acceptanceCaptureStoreIndex", "acceptanceCaptureStoreEvidenceLink"].every((name) => metadata.entities.some((entity) => entity.entityName === name)));
addCheck("authority flags are blocked", Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_FLAGS).every((value) => value === false) && metadataBlocked);
addCheck("store policy blocks CRUD, DB, runtime, and execution", metadata.storePolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudAllowed === false && metadata.storePolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCreateAllowed === false && metadata.storePolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreReadAllowed === false && metadata.storePolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreUpdateAllowed === false && metadata.storePolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDeleteAllowed === false && metadata.storePolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDbReadAllowed === false && metadata.storePolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDbWriteAllowed === false && metadata.storePolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRuntimeWriteAllowed === false && metadata.storePolicy?.runtimeExecutionAllowed === false && metadata.storePolicy?.executionUnlockAllowed === false && metadata.storePolicy?.providerCallAllowed === false && metadata.storePolicy?.agentDispatchAllowed === false && metadata.storePolicy?.providerSpendAllowed === false);
addCheck("metadata carries blockers, next action, owner, and cost", metadata.blockers.length >= 4 && Boolean(metadata.nextAction) && Boolean(metadata.ownerCapability) && metadata.costImpactLabel === "No provider spend");
addCheck("metadata validation accepts default and rejects unsafe policy", metadataValidation.valid === true && invalidValidation.valid === false && invalidValidation.errors.length > 0);
addCheck("helper reuses P128.2 persistence boundary metadata", helperSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata") && helperSource.includes("FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_FLAGS"));
addCheck("helper has no DB/runtime/provider imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|from\s+["']\.\.\/providers|from\s+["']\.\.\/tools|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+|DELETE\s+FROM/i.test(helperSource));
addCheck("contract marks P129.2 complete and P129.3 handoff valid", p1292.status === "complete" && ["planned", "complete"].includes(p1293.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_METADATA_PHASE",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_METADATA_VERSION",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_ENTITY_NAMES",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_FLAGS",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_ENTITIES",
  "buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata",
  "validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata",
].every((name) => p1292.expectedExports?.includes(name)));
addCheck("P129.1 checker accepts P129.2 handoff", p1291Checker.includes("P129.2 remains planned or complete") && p1291Checker.includes("p129ProgressState"));
addCheck("docs record P129.2", /## P129\.2 Store Record Schema Metadata[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P129.2", /P129\.2 store record schema metadata/i.test(readme) && /P129\.3 is next/i.test(readme));
addCheck("platform roadmap records P129.2", /P129\.2 is complete/i.test(platformRoadmap) && /P129\.3 is next/i.test(platformRoadmap));
addCheck(
  "phase status advanced",
  (p1292CurrentState || p1293StartedState)
    && statusById.get("P129")?.status === "in_progress"
    && statusById.get("P129.1")?.status === "complete"
    && statusById.get("P129.2")?.status === "complete"
    && roadmapById.get("P129.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P129.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P129.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw persistence table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_records|acceptance_capture_persistence_events|capture_persistence_records|persistence_store_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("metadata avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedMetadata));
addCheck("metadata avoids fake runnable actions", !/persist now|save now|write now|capture acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|apply approval now|approve now|reject now|run now|execute now|deploy now|call provider now|create project now|dispatch agent now|write sqlite now|unlock execution now/i.test(serializedMetadata));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /store CRUD is enabled|CRUD is live|acceptance capture persistence is enabled|acceptance capture is persisted|DB writes are enabled|runtime writes are enabled|migration is created|table is created|raw SQL is allowed|acceptance capture is live|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P129.2 browser-safe acceptance capture persistence store schema metadata.",
        "- Confirms the metadata reuses P128.2 persistence boundary metadata and remains local, schema-only, metadata-only, and hidden from primary Command Center UX.",
        "- Does not create DB schemas, create migrations, write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1292.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P129.2 is schema metadata only. It does not create DB schemas, run migrations, write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P129.2 Store Record Schema Metadata Report", phase: "P129.2" },
);

printCheckReport("P129.2 Store Record Schema Metadata Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
