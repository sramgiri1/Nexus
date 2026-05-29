import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ELIGIBILITY_METADATA_PHASE,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ELIGIBILITY_VERSION,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_FLAGS,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SECTIONS,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_STATES,
  buildFounderApprovalApplicationAuthorityGrantHandoffEligibilityMetadata,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffEligibilityMetadata.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1252-founder-runtime-approval-application-authority-grant-handoff-report.md";

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
const contract = readJson("contracts/os-roadmap/p125-founder-runtime-approval-application-authority-grant-handoff-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1252 = subphaseById.get("P125.2") || {};
const p1253 = subphaseById.get("P125.3") || {};
const plan = readText("docs/architecture/P125_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1251Checker = readText("scripts/check-p1251-founder-runtime-approval-application-authority-grant-handoff.js");
const helperSource = readText("shared/founderApprovalApplicationAuthorityGrantHandoffEligibilityMetadata.js");
const metadata = buildFounderApprovalApplicationAuthorityGrantHandoffEligibilityMetadata();
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P125.2";
const allowedFiles = new Set(p1252.allowedFiles || []);
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

const metadataAuthorityBlocked = booleanValuesFalse(metadata.handoffPolicy)
  && metadata.sections.every((section) => booleanValuesFalse(section.authorityFlags))
  && booleanValuesFalse(metadata.priorGrantBoundary?.authorityFlags || {});
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
const p1252CurrentState = status.currentPhase === "P125.2"
  && status.previousPhase === "P125.1"
  && status.nextPhase === "P125.3"
  && roadmap.currentPhase === "P125.2"
  && roadmap.previousPhase === "P125.1"
  && roadmap.nextPhase === "P125.3";
const p1253StartedState = status.currentPhase === "P125.3"
  && status.previousPhase === "P125.2"
  && status.nextPhase === "P125.4"
  && roadmap.currentPhase === "P125.3"
  && roadmap.previousPhase === "P125.2"
  && roadmap.nextPhase === "P125.4";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1252-founder-runtime-approval-application-authority-grant-handoff"]));
addCheck("phase export is P125.2", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ELIGIBILITY_METADATA_PHASE === "P125.2" && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ELIGIBILITY_VERSION === "1.0");
addCheck("handoff states are allowlisted", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_STATES.length === 5 && metadata.handoffStates.includes("ready_for_local_handoff_intent_model_only") && !metadata.handoffStates.includes("handed_off") && !metadata.handoffStates.includes("granted") && !metadata.handoffStates.includes("approved"));
addCheck("metadata is metadata-only", metadata.metadataOnly === true && metadata.localOnly === true && metadata.commandCenterVisible === false && metadata.handoffPolicy?.mode === "metadata-only");
addCheck("metadata reuses P124.2 grant metadata", metadata.sourceGrantPhase === "P124.2" && metadata.sourceGrantVersion === "1.0" && metadata.priorGrantBoundary?.sectionLabels?.includes("Grant scope"));
addCheck("metadata sections are display-safe", sectionsUseful && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SECTIONS.length === 4 && metadata.sections.length === 4);
addCheck("metadata has founder-useful handoff sections", ["prior_grant_boundary", "handoff_scope", "runtime_handoff_guard", "operator_handoff_evidence"].every((key) => metadata.sections.some((section) => section.sectionKey === key)));
addCheck("authority flags are blocked", Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_FLAGS).every((value) => value === false) && metadataAuthorityBlocked);
addCheck("handoff policy blocks writes and execution", metadata.handoffPolicy?.approvalApplicationAuthorityGrantHandoffAllowed === false && metadata.handoffPolicy?.approvalApplicationAuthorityGrantAllowed === false && metadata.handoffPolicy?.dbWriteAllowed === false && metadata.handoffPolicy?.runtimeWriteAllowed === false && metadata.handoffPolicy?.runtimeExecutionAllowed === false && metadata.handoffPolicy?.executionUnlockAllowed === false && metadata.handoffPolicy?.providerCallAllowed === false && metadata.handoffPolicy?.agentDispatchAllowed === false && metadata.handoffPolicy?.providerSpendAllowed === false);
addCheck("metadata carries blockers, next action, owner, and cost", metadata.blockers.length >= 4 && Boolean(metadata.nextAction) && Boolean(metadata.ownerCapability) && metadata.costImpactLabel === "No provider spend");
addCheck("helper reuses P124.2 metadata", helperSource.includes("buildFounderApprovalApplicationAuthorityGrantEligibilityMetadata") && helperSource.includes("FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_FLAGS"));
addCheck("helper has no DB/runtime/provider imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|from\s+["']\.\.\/providers|from\s+["']\.\.\/tools|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+/i.test(helperSource));
addCheck("contract marks P125.2 complete and P125.3 handoff valid", p1252.status === "complete" && ["planned", "complete"].includes(p1253.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ELIGIBILITY_METADATA_PHASE",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ELIGIBILITY_VERSION",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_STATES",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_FLAGS",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SECTIONS",
  "buildFounderApprovalApplicationAuthorityGrantHandoffEligibilityMetadata",
].every((name) => p1252.expectedExports?.includes(name)));
addCheck("P125.1 checker accepts P125.2 handoff", p1251Checker.includes("P125.2") && p1251Checker.includes("P125.3") && p1251Checker.includes("p1252StartedState"));
addCheck("docs record P125.2", /P125\.2 Handoff Eligibility Metadata[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P125.2", /P125\.2 approval application authority grant handoff eligibility metadata/i.test(readme) && /P125\.3\s+is\s+next/.test(readme));
addCheck("platform roadmap records P125.2", /P125\.2 is complete/.test(platformRoadmap) && /P125\.3\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  (p1252CurrentState || p1253StartedState)
    && statusById.get("P125")?.status === "in_progress"
    && statusById.get("P125.1")?.status === "complete"
    && statusById.get("P125.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P125.3")?.status)
    && roadmapById.get("P125.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P125.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P125.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw handoff table names", !/(approval_authority_grant_handoff_records|grant_handoff_events|grant_handoff_requests|handoff_boundary_records)/i.test(publicDocsBundle));
addCheck("metadata avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedMetadata));
addCheck("metadata avoids fake runnable actions", !/handoff authority now|grant authority now|activate now|apply approval now|apply decision now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedMetadata));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /grant handoff is enabled|authority handoff is enabled|approval application authority grant handoff is enabled|grant authority is enabled|approval application authority grant is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P125.2 browser-safe approval application authority grant handoff eligibility metadata.",
        "- Confirms the metadata reuses P124.2 grant metadata and remains local, metadata-only, and hidden from primary Command Center UX.",
        "- Does not hand off authority, grant authority, activate authority, apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1252.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P125.2 is metadata-only. It does not hand off authority, grant authority, activate authority, apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P125.2 Approval Application Authority Grant Handoff Eligibility Metadata Report", phase: "P125.2" },
);

printCheckReport("P125.2 Approval Application Authority Grant Handoff Eligibility Metadata Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
