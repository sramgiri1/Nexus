import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_FLAGS,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_PHASE,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_ROWS,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_VERSION,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_OPERATION_NAMES,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentModel,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentModel,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntent.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1293-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md";
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|metadata-only|schema-only|model-only|intent-only|planned-only|read-only|future|local-only)\b/i.test(context);
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
const p1293 = subphaseById.get("P129.3") || {};
const p1294 = subphaseById.get("P129.4") || {};
const model = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentModel();
const modelValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentModel(model);
const invalidValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentModel({
  ...model,
  repositoryPolicy: {
    ...model.repositoryPolicy,
    approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentAllowed: true,
  },
  intentRows: model.intentRows.map((row, index) => (index === 0 ? { ...row, canWriteDb: true } : row)),
});
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1292Checker = readText("scripts/check-p1292-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js");
const helperSource = readText("shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntent.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P129.3";
const allowedFiles = new Set(p1293.allowedFiles || []);
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
const serializedModel = JSON.stringify(model);
const rowsUseful = model.intentRows.every((row) => (
  row.operationName
  && row.publicLabel
  && row.operationKind
  && row.targetEntityName
  && row.currentState === "blocked"
  && row.disabledReason
  && row.ownerCapability
  && row.nextAction
  && row.evidenceLabels?.length > 0
  && row.activityLabels?.length > 0
  && row.costImpactLabel === "No provider spend"
));
const rowsBlocked = model.intentRows.every((row) => (
  booleanValuesFalse(row)
  && booleanValuesFalse(row.authorityFlags)
));
const p1293CurrentState = status.currentPhase === "P129.3"
  && status.previousPhase === "P129.2"
  && status.nextPhase === "P129.4"
  && roadmap.currentPhase === "P129.3"
  && roadmap.previousPhase === "P129.2"
  && roadmap.nextPhase === "P129.4";
const p1294StartedState = status.currentPhase === "P129.4"
  && status.previousPhase === "P129.3"
  && status.nextPhase === "P129.5"
  && roadmap.currentPhase === "P129.4"
  && roadmap.previousPhase === "P129.3"
  && roadmap.nextPhase === "P129.5";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1293-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store"]));
addCheck("phase export is P129.3", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_PHASE === "P129.3" && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_VERSION === "1.0");
addCheck("operation names are allowlisted", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_OPERATION_NAMES.length === 6 && model.operationNames.every((name) => FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_OPERATION_NAMES.includes(name)));
addCheck("intent model is local and hidden", model.modelOnly === true && model.intentOnly === true && model.localOnly === true && model.commandCenterVisible === false && model.repositoryPolicy?.mode === "intent-only");
addCheck("intent model reuses P129.2 store metadata", model.sourceStoreMetadataPhase === "P129.2" && model.sourceStoreMetadataVersion === "1.0" && model.sourcePersistenceBoundaryPhase === "P128.2" && model.sourceCapturePhase === "P127.2" && model.sourceStoreMetadataValid === true);
addCheck("intent model validation accepts default and rejects unsafe row", modelValidation.valid === true && invalidValidation.valid === false && invalidValidation.errors.length > 0);
addCheck("intent rows are founder-useful and display-safe", rowsUseful && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_ROWS.length === 6 && model.intentRows.length === 6);
addCheck("intent rows map to store entities", ["acceptanceCaptureStoreRecord", "acceptanceCaptureStoreIndex", "acceptanceCaptureStoreEvidenceLink"].every((name) => model.intentRows.some((row) => row.targetEntityName === name)));
addCheck("repository flags are blocked", Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_FLAGS).every((value) => value === false) && booleanValuesFalse(model.repositoryPolicy) && rowsBlocked);
addCheck("repository policy blocks CRUD, DB, runtime, and execution", model.repositoryPolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentAllowed === false && model.repositoryPolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudAllowed === false && model.repositoryPolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDbReadAllowed === false && model.repositoryPolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDbWriteAllowed === false && model.repositoryPolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRuntimeWriteAllowed === false && model.repositoryPolicy?.runtimeExecutionAllowed === false && model.repositoryPolicy?.providerCallAllowed === false && model.repositoryPolicy?.agentDispatchAllowed === false && model.repositoryPolicy?.providerSpendAllowed === false);
addCheck("intent model carries blockers, next action, owner, evidence, activity, and cost", model.blockers.length >= 4 && Boolean(model.nextAction) && Boolean(model.ownerCapability) && model.evidenceLabels.length > 0 && model.activityLabels.length > 0 && model.costImpactLabel === "No provider spend");
addCheck("helper reuses P129.2 store metadata", helperSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata") && helperSource.includes("validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMetadata"));
addCheck("helper has no DB/runtime/provider imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|from\s+["']\.\.\/providers|from\s+["']\.\.\/tools|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+|DELETE\s+FROM/i.test(helperSource));
addCheck("contract marks P129.3 complete and P129.4 handoff valid", p1293.status === "complete" && ["planned", "complete"].includes(p1294.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_PHASE",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_VERSION",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_OPERATION_NAMES",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_FLAGS",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_REPOSITORY_INTENT_ROWS",
  "buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentModel",
  "validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRepositoryIntentModel",
].every((name) => p1293.expectedExports?.includes(name)));
addCheck("P129.2 checker accepts P129.3 handoff", p1292Checker.includes("p1293StartedState") && p1292Checker.includes('status.nextPhase === "P129.4"'));
addCheck("docs record P129.3", /## P129\.3 Store Repository Intent Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P129.3", /P129\.3 store repository intent model/i.test(readme) && /P129\.4 is next/i.test(readme));
addCheck("platform roadmap records P129.3", /P129\.3 is complete/i.test(platformRoadmap) && /P129\.4 is next/i.test(platformRoadmap));
addCheck(
  "phase status advanced",
  (p1293CurrentState || p1294StartedState)
    && statusById.get("P129")?.status === "in_progress"
    && statusById.get("P129.2")?.status === "complete"
    && statusById.get("P129.3")?.status === "complete"
    && roadmapById.get("P129.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P129.3 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P129.3 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw persistence table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_records|acceptance_capture_persistence_events|capture_persistence_records|persistence_store_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("intent model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedModel));
addCheck("intent model avoids fake runnable actions", !/persist now|save now|write now|capture acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|apply approval now|approve now|reject now|run now|execute now|deploy now|call provider now|create project now|dispatch agent now|write sqlite now|unlock execution now/i.test(serializedModel));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /store CRUD is enabled|CRUD is live|repository CRUD is enabled|repository is live|acceptance capture persistence is enabled|acceptance capture is persisted|DB reads are enabled|DB writes are enabled|runtime writes are enabled|migration is created|table is created|raw SQL is allowed|acceptance capture is live|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P129.3 browser-safe acceptance capture persistence store repository intent model.",
        "- Confirms the model reuses P129.2 store metadata and remains local, intent-only, model-only, and hidden from primary Command Center UX.",
        "- Does not create DB schemas, create migrations, read DB records, write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1293.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P129.3 is repository intent modeling only. It does not create DB schemas, run migrations, read DB records, write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P129.3 Store Repository Intent Model Report", phase: "P129.3" },
);

printCheckReport("P129.3 Store Repository Intent Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
