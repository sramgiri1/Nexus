import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_DECISION_PERSISTENCE_AUTHORITY_FLAGS,
  FOUNDER_APPROVAL_DECISION_PERSISTENCE_ENTITY_NAMES,
  FOUNDER_APPROVAL_DECISION_PERSISTENCE_SCHEMA_ENTITIES,
  FOUNDER_APPROVAL_DECISION_PERSISTENCE_SCHEMA_METADATA_PHASE,
  FOUNDER_APPROVAL_DECISION_PERSISTENCE_SCHEMA_VERSION,
  buildFounderApprovalDecisionPersistenceSchemaMetadata,
} from "../shared/founderApprovalDecisionPersistenceSchemaMetadata.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1202-founder-runtime-approval-decision-persistence-boundary-report.md";

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
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|schema-only|metadata-only|planned-only|read-only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p120-founder-runtime-approval-decision-persistence-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1202 = subphaseById.get("P120.2") || {};
const p1203 = subphaseById.get("P120.3") || {};
const p1204 = subphaseById.get("P120.4") || {};
const plan = readText("docs/architecture/P120_FOUNDER_RUNTIME_APPROVAL_DECISION_PERSISTENCE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1201Checker = readText("scripts/check-p1201-founder-runtime-approval-decision-persistence-boundary-contract.js");
const helperSource = readText("shared/founderApprovalDecisionPersistenceSchemaMetadata.js");
const metadata = buildFounderApprovalDecisionPersistenceSchemaMetadata();
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P120.2";
const allowedFiles = new Set(p1202.allowedFiles || []);
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

const allAuthorityBlocked = Object.values(FOUNDER_APPROVAL_DECISION_PERSISTENCE_AUTHORITY_FLAGS).every((value) => value === false);
const metadataAuthorityBlocked = Object.values(metadata.writePolicy || {}).filter((value) => typeof value === "boolean").every((value) => value === false)
  && metadata.entities.every((entity) => Object.values(entity.authorityFlags || {}).every((value) => value === false));
const entityNamesMatch = JSON.stringify(FOUNDER_APPROVAL_DECISION_PERSISTENCE_ENTITY_NAMES) === JSON.stringify(metadata.entities.map((entity) => entity.entityName));
const requiredFieldsPresent = metadata.entities.every((entity) => (
  entity.publicLabel
  && entity.purpose
  && entity.retentionClass === "local_os_metadata"
  && entity.piiRisk === "low"
  && entity.redactionRequired === true
  && entity.fields
  && entity.authorityFlags
));

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1202-founder-runtime-approval-decision-persistence-boundary"]));
addCheck("contract marks P120.2 complete", p1202.status === "complete" && p1202.allowedFiles?.includes("shared/founderApprovalDecisionPersistenceSchemaMetadata.js"));
addCheck("P120.3/P120.4 handoff remains planned or complete", ["planned", "complete"].includes(p1203.status) && ["planned", "complete"].includes(p1204.status));
addCheck("schema metadata phase and version", FOUNDER_APPROVAL_DECISION_PERSISTENCE_SCHEMA_METADATA_PHASE === "P120.2" && FOUNDER_APPROVAL_DECISION_PERSISTENCE_SCHEMA_VERSION === "1.0" && metadata.phaseId === "P120.2" && metadata.schemaVersion === "1.0");
addCheck("schema metadata is metadata-only", metadata.schemaOnly === true && metadata.commandCenterVisible === false && metadata.writePolicy?.mode === "metadata-only");
addCheck("schema entity names are stable", entityNamesMatch && FOUNDER_APPROVAL_DECISION_PERSISTENCE_ENTITY_NAMES.length === 3 && FOUNDER_APPROVAL_DECISION_PERSISTENCE_SCHEMA_ENTITIES.length === 3);
addCheck("schema entities are display-safe", requiredFieldsPresent);
addCheck("authority flags are blocked", allAuthorityBlocked && metadataAuthorityBlocked);
addCheck("persistence metadata blocks writes", metadata.writePolicy?.approvalPersistenceAllowed === false && metadata.writePolicy?.decisionPersistenceAllowed === false && metadata.writePolicy?.dbWriteAllowed === false);
addCheck("draft metadata has founder-useful fields", Boolean(metadata.entities.find((entity) => entity.entityName === "founderApprovalDecisionPersistenceDrafts")?.fields?.decisionSummary) && Boolean(metadata.entities.find((entity) => entity.entityName === "founderApprovalDecisionPersistenceDrafts")?.fields?.disabledReason));
addCheck("event metadata has audit fields", Boolean(metadata.entities.find((entity) => entity.entityName === "founderApprovalDecisionPersistenceEvents")?.fields?.eventSummary) && Boolean(metadata.entities.find((entity) => entity.entityName === "founderApprovalDecisionPersistenceEvents")?.fields?.rollbackLabel));
addCheck("evidence metadata has redaction fields", metadata.entities.find((entity) => entity.entityName === "founderApprovalDecisionPersistenceEvidenceRefs")?.fields?.redactionRequired === "boolean");
addCheck("helper has no DB/runtime imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+/i.test(helperSource));
addCheck("P120.1 checker accepts P120.2 handoff", p1201Checker.includes("P120.2") && p1201Checker.includes("P120.3") && p1201Checker.includes("scope check relaxed"));
addCheck("docs record P120.2", /P120\.2 Approval Decision Persistence Schema Metadata[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P120.2", /P120\.2 approval decision persistence schema metadata/i.test(readme) && /P120\.3\s+is\s+next/.test(readme));
addCheck("platform roadmap records P120.2", /P120\.2 is complete/.test(platformRoadmap) && /P120\.3\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P120.2"
      && status.previousPhase === "P120.1"
      && status.nextPhase === "P120.3"
      && roadmap.currentPhase === "P120.2"
      && roadmap.previousPhase === "P120.1"
      && roadmap.nextPhase === "P120.3")
    || (status.currentPhase === "P120.3"
      && status.previousPhase === "P120.2"
      && status.nextPhase === "P120.4"
      && roadmap.currentPhase === "P120.3"
      && roadmap.previousPhase === "P120.2"
      && roadmap.nextPhase === "P120.4")
    || (status.currentPhase === "P120.4"
      && status.previousPhase === "P120.3"
      && status.nextPhase === "P120.5"
      && roadmap.currentPhase === "P120.4"
      && roadmap.previousPhase === "P120.3"
      && roadmap.nextPhase === "P120.5"))
    && statusById.get("P120")?.status === "in_progress"
    && statusById.get("P120.1")?.status === "complete"
    && statusById.get("P120.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P120.3")?.status)
    && roadmapById.get("P120.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P120.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P120.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw table names", !/(founder_runtime_approval_decision|approval_decision_persistence|approval_decision_persistence_drafts|approval_decision_persistence_events|approval_decision_persistence_evidence_refs)/.test(publicDocsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));
addCheck("docs avoid fake runnable actions", !/approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(docsBundle));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P120.2 browser-safe founder runtime approval decision persistence schema metadata.",
        "- Confirms the metadata is reusable by later P120.3/P120.4 handoff subphases without DB files, DB writes, approval capture, approval persistence, or approve/reject decision recording.",
        "- Does not enable runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: p1202.validationCommands.map((command) => `- ${command}`).join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P120.2 is schema metadata only. It does not create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P120.2 Founder Runtime Approval Decision Persistence Boundary Schema Report", phase: "P120.2" },
);

printCheckReport("P120.2 Founder Runtime Approval Decision Persistence Boundary Schema Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
