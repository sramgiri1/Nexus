import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_ACTION_NAMES,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_FLAGS,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_PHASE,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_VERSION,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1295-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md";
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|metadata-only|schema-only|model-only|intent-only|preview-only|safe dry-run|safe-dry-run-only|planned-only|read-only|future|local-only)\b/i.test(context);
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
const p1295 = subphaseById.get("P129.5") || {};
const p1296 = subphaseById.get("P129.6") || {};
const dryRun = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun();
const dryRunValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun(dryRun);
const invalidValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun({
  ...dryRun,
  dryRunPolicy: {
    ...dryRun.dryRunPolicy,
    approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRunAllowed: true,
  },
  dryRunEnvelopes: dryRun.dryRunEnvelopes.map((envelope, index) => (
    index === 0 ? { ...envelope, data: { ...envelope.data, canRunCrud: true } } : envelope
  )),
});
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1294Checker = readText("scripts/check-p1294-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js");
const helperSource = readText("shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P129.5";
const allowedFiles = new Set(p1295.allowedFiles || []);
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
const serializedDryRun = JSON.stringify(dryRun);
const envelopesUseful = dryRun.dryRunEnvelopes.every((envelope) => (
  envelope.status === "BLOCKED"
  && envelope.ok === false
  && envelope.mode === "safe-dry-run"
  && envelope.data?.actionName
  && envelope.data?.publicLabel
  && envelope.data?.targetEntityName
  && envelope.data?.dryRunState === "blocked"
  && envelope.data?.disabledReason
  && envelope.data?.ownerCapability
  && envelope.data?.nextAction
  && envelope.data?.evidenceLabels?.length > 0
  && envelope.data?.activityLabels?.length > 0
  && envelope.data?.costImpactLabel === "No provider spend"
));
const envelopesBlocked = dryRun.dryRunEnvelopes.every((envelope) => (
  booleanValuesFalse(envelope.data || {})
  && booleanValuesFalse(envelope.data?.authorityFlags || {})
));
const p1295CurrentState = status.currentPhase === "P129.5"
  && status.previousPhase === "P129.4"
  && status.nextPhase === "P129.6"
  && roadmap.currentPhase === "P129.5"
  && roadmap.previousPhase === "P129.4"
  && roadmap.nextPhase === "P129.6";
const p1296StartedState = status.currentPhase === "P129.6"
  && status.previousPhase === "P129.5"
  && status.nextPhase === "P129.7"
  && roadmap.currentPhase === "P129.6"
  && roadmap.previousPhase === "P129.5"
  && roadmap.nextPhase === "P129.7";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1295-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store"]));
addCheck("phase export is P129.5", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_PHASE === "P129.5" && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_VERSION === "1.0");
addCheck("safe dry-run actions are allowlisted", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_ACTION_NAMES.length === 6 && dryRun.actionNames.every((name) => FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_ACTION_NAMES.includes(name)));
addCheck("safe dry run is local and hidden", dryRun.safeDryRunOnly === true && dryRun.localOnly === true && dryRun.commandCenterVisible === false && dryRun.dryRunPolicy?.mode === "safe-dry-run-only");
addCheck("safe dry run reuses P129.4 migration preview", dryRun.sourceMigrationPreviewPhase === "P129.4" && dryRun.sourceMigrationPreviewVersion === "1.0" && dryRun.sourceRepositoryIntentPhase === "P129.3" && dryRun.sourceStoreMetadataPhase === "P129.2" && dryRun.sourcePersistenceBoundaryPhase === "P128.2" && dryRun.sourceCapturePhase === "P127.2" && dryRun.sourceMigrationPreviewValid === true);
addCheck("safe dry-run validation accepts default and rejects unsafe envelope", dryRunValidation.valid === true && invalidValidation.valid === false && invalidValidation.errors.length > 0);
addCheck("safe dry-run envelopes are founder-useful and display-safe", envelopesUseful && dryRun.dryRunEnvelopes.length === 6);
addCheck("safe dry-run envelopes map to store entities", ["acceptanceCaptureStoreRecord", "acceptanceCaptureStoreIndex", "acceptanceCaptureStoreEvidenceLink"].every((name) => dryRun.dryRunEnvelopes.some((envelope) => envelope.data?.targetEntityName === name)));
addCheck("safe dry-run flags are blocked", Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_FLAGS).every((value) => value === false) && booleanValuesFalse(dryRun.dryRunPolicy) && envelopesBlocked);
addCheck("safe dry-run policy blocks CRUD, DB, runtime, and execution", dryRun.dryRunPolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRunAllowed === false && dryRun.dryRunPolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudAllowed === false && dryRun.dryRunPolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDbReadAllowed === false && dryRun.dryRunPolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreDbWriteAllowed === false && dryRun.dryRunPolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreRuntimeWriteAllowed === false && dryRun.dryRunPolicy?.runtimeExecutionAllowed === false && dryRun.dryRunPolicy?.providerCallAllowed === false && dryRun.dryRunPolicy?.agentDispatchAllowed === false && dryRun.dryRunPolicy?.providerSpendAllowed === false);
addCheck("safe dry run carries blockers, next action, owner, evidence, activity, and cost", dryRun.blockers.length >= 4 && Boolean(dryRun.nextAction) && Boolean(dryRun.ownerCapability) && dryRun.evidenceLabels.length > 0 && dryRun.activityLabels.length > 0 && dryRun.costImpactLabel === "No provider spend");
addCheck("helper reuses P129.4 migration preview and result envelope", helperSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreMigrationPreview") && helperSource.includes("createBlockedResult") && helperSource.includes("validateResultEnvelope"));
addCheck("helper has no DB/runtime/provider imports or SQL statements", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|from\s+["']\.\.\/providers|from\s+["']\.\.\/tools|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+|DELETE\s+FROM/i.test(helperSource));
addCheck("contract marks P129.5 complete and P129.6 handoff valid", p1295.status === "complete" && ["planned", "complete"].includes(p1296.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_PHASE",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_VERSION",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_ACTION_NAMES",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_CRUD_SAFE_DRY_RUN_FLAGS",
  "buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun",
  "validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceStoreCrudSafeDryRun",
].every((name) => p1295.expectedExports?.includes(name)));
addCheck("P129.4 checker accepts P129.5 handoff", p1294Checker.includes("p1295StartedState") && p1294Checker.includes('status.nextPhase === "P129.6"'));
addCheck("docs record P129.5", /## P129\.5 Store CRUD Safe Dry Run[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P129.5", /P129\.5 store CRUD safe dry run/i.test(readme) && /P129\.6 is next/i.test(readme));
addCheck("platform roadmap records P129.5", /P129\.5 is complete/i.test(platformRoadmap) && /P129\.6 is next/i.test(platformRoadmap));
addCheck(
  "phase status advanced",
  (p1295CurrentState || p1296StartedState)
    && statusById.get("P129")?.status === "in_progress"
    && statusById.get("P129.4")?.status === "complete"
    && statusById.get("P129.5")?.status === "complete"
    && roadmapById.get("P129.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P129.5 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P129.5 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw persistence table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_records|acceptance_capture_persistence_events|capture_persistence_records|persistence_store_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("safe dry run avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDryRun));
addCheck("safe dry run avoids fake runnable actions", !/persist now|save now|write now|capture acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|apply approval now|approve now|reject now|run now|execute now|deploy now|call provider now|create project now|dispatch agent now|write sqlite now|unlock execution now|run migration now/i.test(serializedDryRun));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /store CRUD is enabled|CRUD is live|repository CRUD is enabled|safe dry run is live|migration is enabled|migration is live|migration is created|schema is created|acceptance capture persistence is enabled|acceptance capture is persisted|DB reads are enabled|DB writes are enabled|runtime writes are enabled|table is created|raw SQL is allowed|acceptance capture is live|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P129.5 browser-safe acceptance capture persistence store CRUD safe dry-run model.",
        "- Confirms the dry run reuses P129.4 migration preview, uses result envelopes, and remains local, safe-dry-run-only, and hidden from primary Command Center UX.",
        "- Does not create DB schemas, create migration files, run migrations, read DB records, write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1295.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P129.5 is safe dry-run modeling only. It does not create DB schemas, create migration files, run migrations, read DB records, write DB/runtime records, persist acceptance capture, run CRUD actions, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P129.5 Store CRUD Safe Dry Run Report", phase: "P129.5" },
);

printCheckReport("P129.5 Store CRUD Safe Dry Run Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
