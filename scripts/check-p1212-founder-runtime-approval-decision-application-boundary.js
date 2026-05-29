import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_FLAGS,
  FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_METADATA_PHASE,
  FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_SECTIONS,
  FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_STATES,
  FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_VERSION,
  buildFounderApprovalDecisionApplicationEligibilityMetadata,
} from "../shared/founderApprovalDecisionApplicationEligibilityMetadata.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1212-founder-runtime-approval-decision-application-boundary-report.md";

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
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|metadata-only|read-only|planned-only|safe dry-run only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p121-founder-runtime-approval-decision-application-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1212 = subphaseById.get("P121.2") || {};
const p1213 = subphaseById.get("P121.3") || {};
const plan = readText("docs/architecture/P121_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1211Checker = readText("scripts/check-p1211-founder-runtime-approval-decision-application-boundary-contract.js");
const helperSource = readText("shared/founderApprovalDecisionApplicationEligibilityMetadata.js");
const metadata = buildFounderApprovalDecisionApplicationEligibilityMetadata();
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P121.2";
const allowedFiles = new Set(p1212.allowedFiles || []);
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
const allAuthorityBlocked = Object.values(FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_FLAGS).every((value) => value === false);
const metadataAuthorityBlocked = Object.values(metadata.writePolicy || {}).filter((value) => typeof value === "boolean").every((value) => value === false)
  && metadata.sections.every((section) => Object.values(section.authorityFlags || {}).every((value) => value === false));
const sectionsUseful = metadata.sections.every((section) => (
  section.sectionKey
  && section.publicLabel
  && section.purpose
  && section.defaultState
  && section.nextAction
  && section.blocker
  && Array.isArray(section.evidenceLabels)
  && section.evidenceLabels.length > 0
));

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1212-founder-runtime-approval-decision-application-boundary"]));
addCheck("contract marks P121.2 complete", p1212.status === "complete" && p1212.allowedFiles?.includes("shared/founderApprovalDecisionApplicationEligibilityMetadata.js"));
addCheck("P121.3 handoff remains planned or complete", ["planned", "complete"].includes(p1213.status));
addCheck("metadata phase and version", FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_METADATA_PHASE === "P121.2" && FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_VERSION === "1.0" && metadata.phaseId === "P121.2" && metadata.metadataVersion === "1.0");
addCheck("metadata is metadata-only", metadata.metadataOnly === true && metadata.commandCenterVisible === false && metadata.writePolicy?.mode === "metadata-only");
addCheck("eligibility states are stable", FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_STATES.length === 4 && metadata.eligibilityStates.length === 4 && metadata.eligibilityStates.includes("ready_for_safe_dry_run_only"));
addCheck("eligibility sections are display-safe", sectionsUseful && FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_SECTIONS.length === 3 && metadata.sections.length === 3);
addCheck("authority flags are blocked", allAuthorityBlocked && metadataAuthorityBlocked);
addCheck("application metadata blocks writes and execution", metadata.writePolicy?.approvalDecisionApplicationAllowed === false && metadata.writePolicy?.dbWriteAllowed === false && metadata.writePolicy?.runtimeExecutionAllowed === false && metadata.writePolicy?.executionUnlockAllowed === false);
addCheck("metadata has founder-useful sections", metadata.sections.some((section) => section.sectionKey === "decision_source") && metadata.sections.some((section) => section.sectionKey === "runtime_authority") && metadata.sections.some((section) => section.sectionKey === "operator_evidence"));
addCheck("helper has no DB/runtime imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+/i.test(helperSource));
addCheck("P121.1 checker accepts P121.2 handoff", p1211Checker.includes("p1212StartedState") && p1211Checker.includes("P121.2") && p1211Checker.includes("P121.3"));
addCheck("docs record P121.2", /P121\.2 Application Eligibility Metadata[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P121.2", /P121\.2 approval decision application eligibility metadata/i.test(readme) && /P121\.3\s+is\s+next/.test(readme));
addCheck("platform roadmap records P121.2", /P121\.2 is complete/.test(platformRoadmap) && /P121\.3\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P121.2"
      && status.previousPhase === "P121.1"
      && status.nextPhase === "P121.3"
      && roadmap.currentPhase === "P121.2"
      && roadmap.previousPhase === "P121.1"
      && roadmap.nextPhase === "P121.3")
    || (status.currentPhase === "P121.3"
      && status.previousPhase === "P121.2"
      && status.nextPhase === "P121.4"
      && roadmap.currentPhase === "P121.3"
      && roadmap.previousPhase === "P121.2"
      && roadmap.nextPhase === "P121.4"))
    && statusById.get("P121")?.status === "in_progress"
    && statusById.get("P121.1")?.status === "complete"
    && statusById.get("P121.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P121.3")?.status)
    && roadmapById.get("P121.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P121.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P121.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw application table names", !/(founder_runtime_approval_application|approval_decision_application_records|approval_decision_application_events|approval_decision_application_requests)/i.test(publicDocsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval decision application is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));
addCheck("docs avoid fake runnable actions", !/apply approval now|apply decision now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(docsBundle));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P121.2 browser-safe founder runtime approval decision application eligibility metadata.",
        "- Confirms the metadata can be reused by later P121.3/P121.4 handoff subphases without DB files, DB writes, approval application, approval persistence, or runtime execution.",
        "- Does not enable execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1212.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P121.2 is eligibility metadata only. It does not apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P121.2 Founder Runtime Approval Decision Application Boundary Metadata Report", phase: "P121.2" },
);

printCheckReport("P121.2 Founder Runtime Approval Decision Application Boundary Metadata Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
