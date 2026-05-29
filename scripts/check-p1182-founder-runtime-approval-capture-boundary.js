import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_CAPTURE_AUTHORITY_FLAGS,
  FOUNDER_APPROVAL_CAPTURE_ENTITY_NAMES,
  FOUNDER_APPROVAL_CAPTURE_SCHEMA_ENTITIES,
  FOUNDER_APPROVAL_CAPTURE_SCHEMA_METADATA_PHASE,
  FOUNDER_APPROVAL_CAPTURE_SCHEMA_VERSION,
  buildFounderApprovalCaptureSchemaMetadata,
} from "../shared/founderApprovalCaptureSchemaMetadata.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1182-founder-runtime-approval-capture-boundary-report.md";

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
const contract = readJson("contracts/os-roadmap/p118-founder-runtime-approval-capture-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1182 = subphaseById.get("P118.2") || {};
const p1183 = subphaseById.get("P118.3") || {};
const plan = readText("docs/architecture/P118_FOUNDER_RUNTIME_APPROVAL_CAPTURE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1181Checker = readText("scripts/check-p1181-founder-runtime-approval-capture-boundary-contract.js");
const helperSource = readText("shared/founderApprovalCaptureSchemaMetadata.js");
const metadata = buildFounderApprovalCaptureSchemaMetadata();
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P118.2";
const allowedFiles = new Set(p1182.allowedFiles || []);
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

const allAuthorityBlocked = Object.values(FOUNDER_APPROVAL_CAPTURE_AUTHORITY_FLAGS).every((value) => value === false);
const metadataAuthorityBlocked = Object.values(metadata.writePolicy || {}).filter((value) => typeof value === "boolean").every((value) => value === false)
  && metadata.entities.every((entity) => Object.values(entity.authorityFlags || {}).every((value) => value === false));
const entityNamesMatch = JSON.stringify(FOUNDER_APPROVAL_CAPTURE_ENTITY_NAMES) === JSON.stringify(metadata.entities.map((entity) => entity.entityName));
const requiredFieldsPresent = metadata.entities.every((entity) => (
  entity.publicLabel
  && entity.purpose
  && entity.retentionClass === "local_os_metadata"
  && entity.piiRisk === "low"
  && entity.redactionRequired === true
  && entity.fields
  && entity.authorityFlags
));

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1182-founder-runtime-approval-capture-boundary"]));
addCheck("contract marks P118.2 complete", p1182.status === "complete" && p1182.allowedFiles?.includes("shared/founderApprovalCaptureSchemaMetadata.js"));
addCheck("P118.3 remains planned or complete", ["planned", "complete"].includes(p1183.status));
addCheck("schema metadata phase and version", FOUNDER_APPROVAL_CAPTURE_SCHEMA_METADATA_PHASE === "P118.2" && FOUNDER_APPROVAL_CAPTURE_SCHEMA_VERSION === "1.0" && metadata.phaseId === "P118.2" && metadata.schemaVersion === "1.0");
addCheck("schema metadata is metadata-only", metadata.schemaOnly === true && metadata.commandCenterVisible === false && metadata.writePolicy?.mode === "metadata-only");
addCheck("schema entity names are stable", entityNamesMatch && FOUNDER_APPROVAL_CAPTURE_ENTITY_NAMES.length === 3 && FOUNDER_APPROVAL_CAPTURE_SCHEMA_ENTITIES.length === 3);
addCheck("schema entities are display-safe", requiredFieldsPresent);
addCheck("authority flags are blocked", allAuthorityBlocked && metadataAuthorityBlocked);
addCheck("request metadata has founder-useful fields", Boolean(metadata.entities.find((entity) => entity.entityName === "founderApprovalCaptureRequests")?.fields?.founderQuestion) && Boolean(metadata.entities.find((entity) => entity.entityName === "founderApprovalCaptureRequests")?.fields?.disabledReason));
addCheck("event metadata has audit fields", Boolean(metadata.entities.find((entity) => entity.entityName === "founderApprovalCaptureEvents")?.fields?.eventSummary) && Boolean(metadata.entities.find((entity) => entity.entityName === "founderApprovalCaptureEvents")?.fields?.rollbackLabel));
addCheck("evidence metadata has redaction fields", metadata.entities.find((entity) => entity.entityName === "founderApprovalCaptureEvidenceRefs")?.fields?.redactionRequired === "boolean");
addCheck("helper has no DB/runtime imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+/i.test(helperSource));
addCheck("P118.1 checker accepts P118.2 handoff", p1181Checker.includes("P118.2") && p1181Checker.includes("P118.3") && p1181Checker.includes("scope check relaxed"));
addCheck("docs record P118.2", /P118\.2 Approval Capture Schema Metadata[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P118.2", /P118\.2 approval capture schema metadata/i.test(readme) && /P118\.3\s+is\s+next/.test(readme));
addCheck("platform roadmap records P118.2", /P118\.2 is complete/.test(platformRoadmap) && /P118\.3\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P118.2"
      && status.previousPhase === "P118.1"
      && status.nextPhase === "P118.3"
      && roadmap.currentPhase === "P118.2"
      && roadmap.previousPhase === "P118.1"
      && roadmap.nextPhase === "P118.3")
    || (status.currentPhase === "P118.3"
      && status.previousPhase === "P118.2"
      && status.nextPhase === "P118.4"
      && roadmap.currentPhase === "P118.3"
      && roadmap.previousPhase === "P118.2"
      && roadmap.nextPhase === "P118.4")
    || (status.currentPhase === "P118.4"
      && status.previousPhase === "P118.3"
      && status.nextPhase === "P118.5"
      && roadmap.currentPhase === "P118.4"
      && roadmap.previousPhase === "P118.3"
      && roadmap.nextPhase === "P118.5"))
    && statusById.get("P118")?.status === "in_progress"
    && statusById.get("P118.1")?.status === "complete"
    && statusById.get("P118.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P118.3")?.status)
    && roadmapById.get("P118.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P118.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P118.2 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw table names", !/(founder_runtime_approval_capture|approval_capture_requests|approval_capture_events|approval_capture_evidence_refs)/.test(publicDocsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));
addCheck("docs avoid fake runnable actions", !/approve now|reject now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(docsBundle));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P118.2 browser-safe founder runtime approval capture schema metadata.",
        "- Confirms the metadata is reusable by later P118 subphases without DB files, DB writes, approval capture, approval persistence, or approval decision recording.",
        "- Does not enable runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: p1182.validationCommands.map((command) => `- ${command}`).join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P118.2 is schema metadata only. It does not create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P118.2 Founder Runtime Approval Capture Boundary Schema Report", phase: "P118.2" },
);

printCheckReport("P118.2 Founder Runtime Approval Capture Boundary Schema Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
