import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_FLAGS,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_METADATA_PHASE,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_METADATA_VERSION,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SECTIONS,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_STATES,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1262-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|metadata-only|model-only|planned-only|read-only|safe dry-run only|future)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p126-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1262 = subphaseById.get("P126.2") || {};
const p1263 = subphaseById.get("P126.3") || {};
const plan = readText("docs/architecture/P126_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1261Checker = readText("scripts/check-p1261-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js");
const helperSource = readText("shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata.js");
const metadata = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata();
const metadataValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata(metadata);
const invalidValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata({
  ...metadata,
  acceptancePolicy: {
    ...metadata.acceptancePolicy,
    approvalApplicationAuthorityGrantHandoffAcceptanceAllowed: true,
  },
});
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P126.2";
const allowedFiles = new Set(p1262.allowedFiles || []);
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
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;
const serializedMetadata = JSON.stringify(metadata);

function booleanValuesFalse(object = {}) {
  return Object.values(object)
    .filter((value) => typeof value === "boolean")
    .every((value) => value === false);
}

const metadataAcceptanceBlocked = booleanValuesFalse(metadata.acceptancePolicy)
  && metadata.sections.every((section) => booleanValuesFalse(section.authorityFlags))
  && booleanValuesFalse(metadata.priorHandoffBoundary?.authorityFlags || {});
const sectionsUseful = metadata.sections.every((section) => (
  section.sectionKey
  && section.publicLabel
  && section.purpose
  && section.defaultState
  && section.nextAction
  && section.blocker
  && Array.isArray(section.evidenceLabels)
  && section.evidenceLabels.length > 0
  && Array.isArray(section.activityLabels)
  && section.activityLabels.length > 0
));
const p1262CurrentState = status.currentPhase === "P126.2"
  && status.previousPhase === "P126.1"
  && status.nextPhase === "P126.3"
  && roadmap.currentPhase === "P126.2"
  && roadmap.previousPhase === "P126.1"
  && roadmap.nextPhase === "P126.3";
const p1263StartedState = status.currentPhase === "P126.3"
  && status.previousPhase === "P126.2"
  && status.nextPhase === "P126.4"
  && roadmap.currentPhase === "P126.3"
  && roadmap.previousPhase === "P126.2"
  && roadmap.nextPhase === "P126.4";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1262-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary"]));
addCheck("phase export is P126.2", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_METADATA_PHASE === "P126.2" && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_METADATA_VERSION === "1.0");
addCheck("acceptance states are allowlisted", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_STATES.length === 5 && metadata.acceptanceStates.includes("ready_for_local_acceptance_intent_model_only") && !metadata.acceptanceStates.includes("accepted") && !metadata.acceptanceStates.includes("handed_off") && !metadata.acceptanceStates.includes("granted") && !metadata.acceptanceStates.includes("approved"));
addCheck("metadata is metadata-only", metadata.metadataOnly === true && metadata.localOnly === true && metadata.commandCenterVisible === false && metadata.acceptancePolicy?.mode === "metadata-only");
addCheck("metadata reuses P125.2 handoff metadata", metadata.sourceHandoffPhase === "P125.2" && metadata.sourceHandoffVersion === "1.0" && metadata.priorHandoffBoundary?.sectionLabels?.includes("Handoff scope"));
addCheck("metadata sections are display-safe", sectionsUseful && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SECTIONS.length === 4 && metadata.sections.length === 4);
addCheck("metadata has founder-useful acceptance sections", ["prior_handoff_boundary", "acceptance_scope", "runtime_acceptance_guard", "operator_acceptance_evidence"].every((key) => metadata.sections.some((section) => section.sectionKey === key)));
addCheck("authority flags are blocked", Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_FLAGS).every((value) => value === false) && metadataAcceptanceBlocked);
addCheck("acceptance policy blocks writes and execution", metadata.acceptancePolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceAllowed === false && metadata.acceptancePolicy?.approvalApplicationAuthorityGrantHandoffAcceptanceCaptureAllowed === false && metadata.acceptancePolicy?.approvalApplicationAuthorityGrantHandoffAllowed === false && metadata.acceptancePolicy?.approvalApplicationAuthorityGrantAllowed === false && metadata.acceptancePolicy?.dbWriteAllowed === false && metadata.acceptancePolicy?.runtimeWriteAllowed === false && metadata.acceptancePolicy?.runtimeExecutionAllowed === false && metadata.acceptancePolicy?.executionUnlockAllowed === false && metadata.acceptancePolicy?.providerCallAllowed === false && metadata.acceptancePolicy?.agentDispatchAllowed === false && metadata.acceptancePolicy?.providerSpendAllowed === false);
addCheck("metadata carries blockers, next action, owner, and cost", metadata.blockers.length >= 4 && Boolean(metadata.nextAction) && Boolean(metadata.ownerCapability) && metadata.costImpactLabel === "No provider spend");
addCheck("metadata validation accepts default and rejects unsafe policy", metadataValidation.valid === true && invalidValidation.valid === false && invalidValidation.errors.length > 0);
addCheck("helper reuses P125.2 metadata", helperSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffEligibilityMetadata") && helperSource.includes("FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_FLAGS"));
addCheck("helper has no DB/runtime/provider imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|from\s+["']\.\.\/providers|from\s+["']\.\.\/tools|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+/i.test(helperSource));
addCheck("contract marks P126.2 complete and P126.3 handoff valid", p1262.status === "complete" && ["planned", "complete"].includes(p1263.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_METADATA_PHASE",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_METADATA_VERSION",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_STATES",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_FLAGS",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SECTIONS",
  "buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata",
  "validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata",
].every((name) => p1262.expectedExports?.includes(name)));
addCheck("P126.1 checker accepts P126.2 handoff", p1261Checker.includes("P126.2") && p1261Checker.includes("P126.3") && p1261Checker.includes("p1262StartedState"));
addCheck("docs record P126.2", /P126\.2 Acceptance Eligibility Metadata[\s\S]*Status:\s+complete/.test(plan));
addCheck(
  "README records P126.2",
  /P126\.2 approval application authority grant handoff acceptance eligibility\s+metadata/i.test(readme)
    && (/P126\.3\s+is\s+next/.test(readme) || /P126\.3 governed approval application authority grant handoff acceptance/i.test(readme)),
);
addCheck(
  "platform roadmap records P126.2",
  /P126\.2 is complete/.test(platformRoadmap)
    && (/P126\.3\s+is\s+next/.test(platformRoadmap) || /P126\.3 is complete/.test(platformRoadmap)),
);
addCheck(
  "phase status advanced",
  (p1262CurrentState || p1263StartedState)
    && statusById.get("P126")?.status === "in_progress"
    && statusById.get("P126.1")?.status === "complete"
    && statusById.get("P126.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P126.3")?.status)
    && roadmapById.get("P126.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P126.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P126.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw acceptance table names", !/(approval_authority_grant_handoff_acceptance_records|grant_handoff_acceptance_events|handoff_acceptance_requests|acceptance_boundary_records)/i.test(publicDocsBundle));
addCheck("metadata avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedMetadata));
addCheck("metadata avoids fake runnable actions", !/accept handoff now|handoff authority now|grant authority now|activate now|apply approval now|apply decision now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedMetadata));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /handoff acceptance is enabled|acceptance capture is enabled|grant handoff is enabled|authority handoff is enabled|approval application authority grant handoff is enabled|grant authority is enabled|approval application authority grant is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P126.2 browser-safe approval application authority grant handoff acceptance boundary eligibility metadata.",
        "- Confirms the metadata reuses P125.2 handoff metadata and remains local, metadata-only, and hidden from primary Command Center UX.",
        "- Does not accept handoff, capture acceptance, hand off authority, grant authority, activate authority, apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1262.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P126.2 is metadata-only. It does not accept handoff, capture acceptance, hand off authority, grant authority, activate authority, apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P126.2 Approval Application Authority Grant Handoff Acceptance Boundary Eligibility Metadata Report", phase: "P126.2" },
);

printCheckReport("P126.2 Approval Application Authority Grant Handoff Acceptance Boundary Eligibility Metadata Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
