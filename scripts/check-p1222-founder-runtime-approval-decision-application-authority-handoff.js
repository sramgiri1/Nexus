import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_ELIGIBILITY_METADATA_PHASE,
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_ELIGIBILITY_VERSION,
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_FLAGS,
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_SECTIONS,
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_STATES,
  buildFounderApprovalDecisionApplicationAuthorityEligibilityMetadata,
} from "../shared/founderApprovalDecisionApplicationAuthorityEligibilityMetadata.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1222-founder-runtime-approval-decision-application-authority-handoff-report.md";

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
    const context = `${lines[index - 1] || ""} ${line}`;
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|metadata-only|model-only|planned-only|read-only|safe dry-run only|future)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p122-founder-runtime-approval-decision-application-authority-handoff-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1222 = subphaseById.get("P122.2") || {};
const p1223 = subphaseById.get("P122.3") || {};
const plan = readText("docs/architecture/P122_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1221Checker = readText("scripts/check-p1221-founder-runtime-approval-decision-application-authority-handoff-contract.js");
const helperSource = readText("shared/founderApprovalDecisionApplicationAuthorityEligibilityMetadata.js");
const metadata = buildFounderApprovalDecisionApplicationAuthorityEligibilityMetadata();
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P122.2";
const allowedFiles = new Set(p1222.allowedFiles || []);
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
  && booleanValuesFalse(metadata.priorBoundary?.authorityFlags || {});
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
const p1222CurrentState = status.currentPhase === "P122.2"
  && status.previousPhase === "P122.1"
  && status.nextPhase === "P122.3"
  && roadmap.currentPhase === "P122.2"
  && roadmap.previousPhase === "P122.1"
  && roadmap.nextPhase === "P122.3";
const p1223StartedState = status.currentPhase === "P122.3"
  && status.previousPhase === "P122.2"
  && status.nextPhase === "P122.4"
  && roadmap.currentPhase === "P122.3"
  && roadmap.previousPhase === "P122.2"
  && roadmap.nextPhase === "P122.4";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1222-founder-runtime-approval-decision-application-authority-handoff"]));
addCheck("phase export is P122.2", FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_ELIGIBILITY_METADATA_PHASE === "P122.2" && FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_ELIGIBILITY_VERSION === "1.0");
addCheck("handoff states are allowlisted", FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_STATES.length === 4 && metadata.handoffStates.includes("ready_for_local_intent_model_only") && !metadata.handoffStates.includes("approved"));
addCheck("metadata is metadata-only", metadata.metadataOnly === true && metadata.localOnly === true && metadata.commandCenterVisible === false && metadata.handoffPolicy?.mode === "metadata-only");
addCheck("metadata reuses P121.2 prior boundary", metadata.sourceBoundaryPhase === "P121.2" && metadata.sourceBoundaryVersion === "1.0" && metadata.priorBoundary?.sectionLabels?.includes("Decision source"));
addCheck("metadata sections are display-safe", sectionsUseful && FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_SECTIONS.length === 4 && metadata.sections.length === 4);
addCheck("metadata has founder-useful handoff sections", ["prior_boundary", "authority_scope", "runtime_guard", "operator_evidence"].every((key) => metadata.sections.some((section) => section.sectionKey === key)));
addCheck("authority flags are blocked", Object.values(FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_FLAGS).every((value) => value === false) && metadataAuthorityBlocked);
addCheck("handoff policy blocks writes and execution", metadata.handoffPolicy?.approvalDecisionApplicationAllowed === false && metadata.handoffPolicy?.approvalApplicationAuthorityHandoffAllowed === false && metadata.handoffPolicy?.dbWriteAllowed === false && metadata.handoffPolicy?.runtimeExecutionAllowed === false && metadata.handoffPolicy?.executionUnlockAllowed === false);
addCheck("metadata carries blockers, next action, owner, and cost", metadata.blockers.length >= 3 && Boolean(metadata.nextAction) && Boolean(metadata.ownerCapability) && metadata.costImpactLabel === "No provider spend");
addCheck("helper reuses P121.2 metadata", helperSource.includes("buildFounderApprovalDecisionApplicationEligibilityMetadata") && helperSource.includes("FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_FLAGS"));
addCheck("helper has no DB/runtime/provider imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|from\s+["']\.\.\/providers|from\s+["']\.\.\/tools|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+/i.test(helperSource));
addCheck("contract marks P122.2 complete and P122.3 handoff valid", p1222.status === "complete" && ["planned", "complete"].includes(p1223.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_ELIGIBILITY_METADATA_PHASE",
  "FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_STATES",
  "FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_FLAGS",
  "FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_SECTIONS",
  "buildFounderApprovalDecisionApplicationAuthorityEligibilityMetadata",
].every((name) => p1222.expectedExports?.includes(name)));
addCheck("P122.1 checker accepts P122.2 handoff", p1221Checker.includes("P122.2") && p1221Checker.includes("P122.3") && p1221Checker.includes("p1222StartedState"));
addCheck("docs record P122.2", /P122\.2 Application Authority Eligibility Metadata[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P122.2", /P122\.2 approval decision application authority eligibility metadata/i.test(readme) && /P122\.3\s+is\s+next/.test(readme));
addCheck("platform roadmap records P122.2", /P122\.2 is complete/.test(platformRoadmap) && /P122\.3\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  (p1222CurrentState || p1223StartedState)
    && statusById.get("P122")?.status === "in_progress"
    && statusById.get("P122.1")?.status === "complete"
    && statusById.get("P122.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P122.3")?.status)
    && roadmapById.get("P122.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P122.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P122.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw authority table names", !/(founder_runtime_approval_application|approval_decision_application_records|approval_decision_application_events|approval_decision_application_requests|approval_application_authority_records|approval_authority_events)/i.test(publicDocsBundle));
addCheck("metadata avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedMetadata));
addCheck("metadata avoids fake runnable actions", !/apply approval now|apply decision now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedMetadata));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval decision application is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority handoff is granted/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P122.2 browser-safe approval decision application authority handoff eligibility metadata.",
        "- Confirms the metadata reuses P121.2 application eligibility metadata and remains local, metadata-only, and hidden from primary Command Center UX.",
        "- Does not apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1222.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P122.2 is metadata-only. It does not apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P122.2 Founder Runtime Approval Decision Application Authority Handoff Metadata Report", phase: "P122.2" },
);

printCheckReport("P122.2 Founder Runtime Approval Decision Application Authority Handoff Metadata Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
