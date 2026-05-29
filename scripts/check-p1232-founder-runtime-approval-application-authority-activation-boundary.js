import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_ELIGIBILITY_METADATA_PHASE,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_ELIGIBILITY_VERSION,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_FLAGS,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_SECTIONS,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_STATES,
  buildFounderApprovalApplicationAuthorityActivationEligibilityMetadata,
} from "../shared/founderApprovalApplicationAuthorityActivationEligibilityMetadata.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1232-founder-runtime-approval-application-authority-activation-boundary-report.md";

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
const contract = readJson("contracts/os-roadmap/p123-founder-runtime-approval-application-authority-activation-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1232 = subphaseById.get("P123.2") || {};
const p1233 = subphaseById.get("P123.3") || {};
const plan = readText("docs/architecture/P123_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1231Checker = readText("scripts/check-p1231-founder-runtime-approval-application-authority-activation-boundary.js");
const helperSource = readText("shared/founderApprovalApplicationAuthorityActivationEligibilityMetadata.js");
const metadata = buildFounderApprovalApplicationAuthorityActivationEligibilityMetadata();
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P123.2";
const allowedFiles = new Set(p1232.allowedFiles || []);
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

const metadataAuthorityBlocked = booleanValuesFalse(metadata.activationPolicy)
  && metadata.sections.every((section) => booleanValuesFalse(section.authorityFlags))
  && booleanValuesFalse(metadata.priorHandoff?.authorityFlags || {});
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
const p1232CurrentState = status.currentPhase === "P123.2"
  && status.previousPhase === "P123.1"
  && status.nextPhase === "P123.3"
  && roadmap.currentPhase === "P123.2"
  && roadmap.previousPhase === "P123.1"
  && roadmap.nextPhase === "P123.3";
const p1233StartedState = status.currentPhase === "P123.3"
  && status.previousPhase === "P123.2"
  && status.nextPhase === "P123.4"
  && roadmap.currentPhase === "P123.3"
  && roadmap.previousPhase === "P123.2"
  && roadmap.nextPhase === "P123.4";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1232-founder-runtime-approval-application-authority-activation-boundary"]));
addCheck("phase export is P123.2", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_ELIGIBILITY_METADATA_PHASE === "P123.2" && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_ELIGIBILITY_VERSION === "1.0");
addCheck("activation states are allowlisted", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_STATES.length === 5 && metadata.activationStates.includes("ready_for_local_activation_intent_model_only") && !metadata.activationStates.includes("activated") && !metadata.activationStates.includes("approved"));
addCheck("metadata is metadata-only", metadata.metadataOnly === true && metadata.localOnly === true && metadata.commandCenterVisible === false && metadata.activationPolicy?.mode === "metadata-only");
addCheck("metadata reuses P122.2 prior handoff", metadata.sourceHandoffPhase === "P122.2" && metadata.sourceHandoffVersion === "1.0" && metadata.priorHandoff?.sectionLabels?.includes("Authority scope"));
addCheck("metadata sections are display-safe", sectionsUseful && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_SECTIONS.length === 4 && metadata.sections.length === 4);
addCheck("metadata has founder-useful activation sections", ["prior_handoff", "activation_scope", "runtime_write_guard", "operator_evidence"].every((key) => metadata.sections.some((section) => section.sectionKey === key)));
addCheck("authority flags are blocked", Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_FLAGS).every((value) => value === false) && metadataAuthorityBlocked);
addCheck("activation policy blocks writes and execution", metadata.activationPolicy?.approvalApplicationAuthorityActivationAllowed === false && metadata.activationPolicy?.approvalApplicationAuthorityGrantAllowed === false && metadata.activationPolicy?.dbWriteAllowed === false && metadata.activationPolicy?.runtimeWriteAllowed === false && metadata.activationPolicy?.runtimeExecutionAllowed === false && metadata.activationPolicy?.executionUnlockAllowed === false && metadata.activationPolicy?.providerCallAllowed === false && metadata.activationPolicy?.agentDispatchAllowed === false && metadata.activationPolicy?.providerSpendAllowed === false);
addCheck("metadata carries blockers, next action, owner, and cost", metadata.blockers.length >= 4 && Boolean(metadata.nextAction) && Boolean(metadata.ownerCapability) && metadata.costImpactLabel === "No provider spend");
addCheck("helper reuses P122.2 metadata", helperSource.includes("buildFounderApprovalDecisionApplicationAuthorityEligibilityMetadata") && helperSource.includes("FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_FLAGS"));
addCheck("helper has no DB/runtime/provider imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|from\s+["']\.\.\/providers|from\s+["']\.\.\/tools|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+/i.test(helperSource));
addCheck("contract marks P123.2 complete and P123.3 handoff valid", p1232.status === "complete" && ["planned", "complete"].includes(p1233.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_ELIGIBILITY_METADATA_PHASE",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_ELIGIBILITY_VERSION",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_STATES",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_FLAGS",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_SECTIONS",
  "buildFounderApprovalApplicationAuthorityActivationEligibilityMetadata",
].every((name) => p1232.expectedExports?.includes(name)));
addCheck("P123.1 checker accepts P123.2 handoff", p1231Checker.includes("P123.2") && p1231Checker.includes("P123.3") && p1231Checker.includes("p1232StartedState"));
addCheck("docs record P123.2", /P123\.2 Activation Eligibility Metadata[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P123.2", /P123\.2 approval application authority activation eligibility metadata/i.test(readme) && /P123\.3\s+is\s+next/.test(readme));
addCheck("platform roadmap records P123.2", /P123\.2 is complete/.test(platformRoadmap) && /P123\.3\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  (p1232CurrentState || p1233StartedState)
    && statusById.get("P123")?.status === "in_progress"
    && statusById.get("P123.1")?.status === "complete"
    && statusById.get("P123.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P123.3")?.status)
    && roadmapById.get("P123.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P123.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P123.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw activation table names", !/(founder_runtime_approval_activation|approval_authority_activation_records|approval_authority_activation_events|approval_authority_activation_requests|activation_boundary_records)/i.test(publicDocsBundle));
addCheck("metadata avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedMetadata));
addCheck("metadata avoids fake runnable actions", !/activate now|grant authority now|apply approval now|apply decision now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedMetadata));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /activation is enabled|approval application authority activation is enabled|approval decision application is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority activation is granted|authority grant is enabled|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P123.2 browser-safe approval application authority activation eligibility metadata.",
        "- Confirms the metadata reuses P122.2 authority handoff metadata and remains local, metadata-only, and hidden from primary Command Center UX.",
        "- Does not activate authority, grant authority, apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1232.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P123.2 is metadata-only. It does not activate authority, grant authority, apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P123.2 Approval Application Authority Activation Eligibility Metadata Report", phase: "P123.2" },
);

printCheckReport("P123.2 Approval Application Authority Activation Eligibility Metadata Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
