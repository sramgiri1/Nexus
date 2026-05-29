import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_ENTITIES,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_ENTITY_NAMES,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_FLAGS,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_METADATA_PHASE,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_METADATA_VERSION,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1282-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p128-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-contracts.json";
const PLAN_PATH = "docs/architecture/P128_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_PLAN.md";

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
const p1282 = subphaseById.get("P128.2") || {};
const p1283 = subphaseById.get("P128.3") || {};
const metadata = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata();
const metadataValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata(metadata);
const invalidValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata({
  ...metadata,
  persistencePolicy: {
    ...metadata.persistencePolicy,
    approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceWriteAllowed: true,
  },
});
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1281Checker = readText("scripts/check-p1281-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js");
const helperSource = readText("shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P128.2";
const allowedFiles = new Set(p1282.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
  "db/",
  "live-ready/",
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
const docsBundle = `${plan}\n${readme}\n${platformRoadmap}`;
const publicDocsBundle = `${readme}\n${platformRoadmap}`;
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
const metadataBlocked = booleanValuesFalse(metadata.persistencePolicy)
  && metadata.entities.every((entity) => booleanValuesFalse(entity.authorityFlags))
  && booleanValuesFalse(metadata.sourceCaptureBoundary?.authorityFlags || {});
const p1282CurrentState = status.currentPhase === "P128.2"
  && status.previousPhase === "P128.1"
  && status.nextPhase === "P128.3"
  && roadmap.currentPhase === "P128.2"
  && roadmap.previousPhase === "P128.1"
  && roadmap.nextPhase === "P128.3";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1282-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary"]));
addCheck("phase export is P128.2", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_METADATA_PHASE === "P128.2" && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_METADATA_VERSION === "1.0");
addCheck("entity names are allowlisted", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_ENTITY_NAMES.length === 3 && metadata.entityNames.every((name) => FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_ENTITY_NAMES.includes(name)));
addCheck("metadata is schema-only", metadata.metadataOnly === true && metadata.schemaOnly === true && metadata.localOnly === true && metadata.commandCenterVisible === false && metadata.persistencePolicy?.mode === "metadata-only");
addCheck("metadata reuses P127.2 capture metadata", metadata.sourceCapturePhase === "P127.2" && metadata.sourceCaptureVersion === "1.0" && metadata.sourceCaptureBoundary?.sectionLabels?.includes("Capture scope"));
addCheck("metadata entities are display-safe", sectionsUseful && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_ENTITIES.length === 3 && metadata.entities.length === 3);
addCheck("metadata has founder-useful persistence entities", ["acceptanceCapturePersistenceDraft", "acceptanceCapturePersistenceEvent", "acceptanceCapturePersistenceEvidence"].every((name) => metadata.entities.some((entity) => entity.entityName === name)));
addCheck("authority flags are blocked", Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_FLAGS).every((value) => value === false) && metadataBlocked);
addCheck("persistence policy blocks writes and execution", metadata.persistencePolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceWriteAllowed === false && metadata.persistencePolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceDbWriteAllowed === false && metadata.persistencePolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceRuntimeWriteAllowed === false && metadata.persistencePolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceMigrationAllowed === false && metadata.persistencePolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceSqlAllowed === false && metadata.persistencePolicy?.dbWriteAllowed === false && metadata.persistencePolicy?.runtimeWriteAllowed === false && metadata.persistencePolicy?.runtimeExecutionAllowed === false && metadata.persistencePolicy?.executionUnlockAllowed === false && metadata.persistencePolicy?.providerCallAllowed === false && metadata.persistencePolicy?.agentDispatchAllowed === false && metadata.persistencePolicy?.providerSpendAllowed === false);
addCheck("metadata carries blockers, next action, owner, and cost", metadata.blockers.length >= 4 && Boolean(metadata.nextAction) && Boolean(metadata.ownerCapability) && metadata.costImpactLabel === "No provider spend");
addCheck("metadata validation accepts default and rejects unsafe policy", metadataValidation.valid === true && invalidValidation.valid === false && invalidValidation.errors.length > 0);
addCheck("helper reuses P127.2 acceptance capture metadata", helperSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata") && helperSource.includes("FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_FLAGS"));
addCheck("helper has no DB/runtime/provider imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|from\s+["']\.\.\/providers|from\s+["']\.\.\/tools|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+|DELETE\s+FROM/i.test(helperSource));
addCheck("contract marks P128.2 complete and P128.3 handoff valid", p1282.status === "complete" && ["planned", "complete"].includes(p1283.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_METADATA_PHASE",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_METADATA_VERSION",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_ENTITY_NAMES",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_FLAGS",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_ENTITIES",
  "buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata",
  "validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata",
].every((name) => p1282.expectedExports?.includes(name)));
addCheck("P128.1 checker accepts P128.2 handoff", p1281Checker.includes("p1282StartedState") && p1281Checker.includes('status.nextPhase === "P128.3"'));
addCheck("docs record P128.2", /## P128\.2 Capture Persistence Schema Metadata[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P128.2", /P128\.2 capture persistence schema metadata/i.test(readme) && /P128\.3 is next/i.test(readme));
addCheck("platform roadmap records P128.2", /P128\.2 is complete/i.test(platformRoadmap) && /P128\.3 is next/i.test(platformRoadmap));
addCheck(
  "phase status advanced",
  p1282CurrentState
    && statusById.get("P128")?.status === "in_progress"
    && statusById.get("P128.1")?.status === "complete"
    && statusById.get("P128.2")?.status === "complete"
    && roadmapById.get("P128.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P128.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P128.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw persistence table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_records|acceptance_capture_persistence_events|capture_persistence_records|persistence_boundary_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("metadata avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedMetadata));
addCheck("metadata avoids fake runnable actions", !/persist now|save now|write now|capture acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|apply approval now|approve now|reject now|run now|execute now|deploy now|call provider now|create project now|dispatch agent now|write sqlite now|unlock execution now/i.test(serializedMetadata));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /acceptance capture persistence is enabled|acceptance capture is persisted|DB writes are enabled|runtime writes are enabled|migration is created|table is created|raw SQL is allowed|acceptance capture is live|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P128.2 browser-safe acceptance capture persistence schema metadata.",
        "- Confirms the metadata reuses P127.2 acceptance capture metadata and remains local, schema-only, metadata-only, and hidden from primary Command Center UX.",
        "- Does not persist acceptance capture, create DB schemas, create migrations, write DB/runtime records, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1282.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P128.2 is schema metadata only. It does not persist acceptance capture, create DB schemas, create migrations, write DB/runtime records, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P128.2 Capture Persistence Schema Metadata Report", phase: "P128.2" },
);

printCheckReport("P128.2 Capture Persistence Schema Metadata Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
