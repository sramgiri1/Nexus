import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1121-founder-live-agent-work-queue-admission-contract-report.md";

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

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p112-founder-live-agent-work-queue-admission-contracts.json");
const p111Contract = readJson("contracts/os-roadmap/p111-founder-live-agent-work-order-persistence-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1121 = subphaseById.get("P112.1") || {};
const p1122 = subphaseById.get("P112.2") || {};
const p1123 = subphaseById.get("P112.3") || {};
const plan = readText("docs/architecture/P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1117Checker = readText("scripts/check-p1117-founder-live-agent-work-order-persistence-final.js");
const dbSchema = readText("db/schema.json");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P112.1";
const allowedFiles = new Set(p1121.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "db/",
  "live-ready/",
  "dashboard/src/",
  "dashboard/tests/",
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
const expectedSubphases = ["P112.1", "P112.2", "P112.3", "P112.4", "P112.5", "P112.6", "P112.7"];
const futureSchemas = [
  "founder_agent_work_queue_items",
  "founder_agent_work_queue_events",
  "founder_agent_work_queue_evidence_refs",
];
const futureExports = [
  "P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PHASE",
  "P112_AGENT_WORK_QUEUE_DB_ENTITIES",
  "buildFounderLiveAgentWorkQueueAdmissionContract",
  "validateFounderLiveAgentWorkQueueAdmissionContract",
  "buildSafeAgentWorkQueueDbRecord",
  "executeApprovedAgentWorkQueueDbCrudRequest",
  "buildAgentWorkQueueAdmissionViewModel",
];
const requiredReuse = [
  "shared/reportWriter.js",
  "shared/reportMetadata.js",
  "shared/resultEnvelope.js",
  "shared/modeGuard.js",
  "shared/redaction.js",
  "shared/checkResultFormatter.js",
  "os-roadmap/updatePhaseStatus.js",
  "db/sqliteRuntime.js",
  "db/sqliteCrudRepository.js",
  "live-ready/founderLiveAgentWorkOrderPersistence.js",
  "live-ready/founderLiveHandoffWorkOrders.js",
  "live-ready/founderLiveWorkAdmission.js",
  "existing Command Center route matrix, tabs, cards, badges, evidence, audit, and activity helpers",
];
const validationCommands = [
  "npm run check:p1121-founder-live-agent-work-queue-admission-contract",
  "npm run check:p1117-founder-live-agent-work-order-persistence",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const unsafeClaims = /hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|queue execution is enabled|work queue execution is enabled/i;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1121-founder-live-agent-work-queue-admission-contract"]));
addCheck("P112 contract status in progress", contract.phaseId === "P112" && contract.status === "in_progress");
addCheck("P112 subphase split is implementation-grade", (contract.subphases || []).length === 7 && expectedSubphases.every((phaseId) => subphaseById.has(phaseId)));
addCheck("P112.1 is complete and follow-on subphases are tracked", p1121.status === "complete" && ["planned", "complete"].includes(p1122.status) && ["planned", "complete"].includes(p1123.status));
addCheck("P112.1 is contract only", p1121.scopeClassification === "NEXUS_OS_CHANGE" && (p1121.forbiddenFiles || []).includes("db/**") && (p1121.forbiddenFiles || []).includes("live-ready/**") && (p1121.forbiddenFiles || []).includes("dashboard/src/**"));
addCheck("P112.1 records validation commands", validationCommands.every((command) => p1121.validationCommands?.includes(command)));
addCheck(
  "future schemas are documented only",
  futureSchemas.every((schemaName) => p1121.futureSchemas?.includes(schemaName))
    && (!enforceCurrentDiffScope || futureSchemas.every((schemaName) => !dbSchema.includes(`"name": "${schemaName}"`))),
  enforceCurrentDiffScope ? "P112.1 schema must remain planned only" : `schema implementation allowed for ${status.currentPhase}`,
);
addCheck("future exports are documented only", futureExports.every((exportName) => p1121.futureExports?.includes(exportName)));
addCheck("reuse requirements are explicit", requiredReuse.every((helper) => (contract.reuseRequired || []).includes(helper)));
addCheck("OS checker accepts P112 subphases", ["P112", ...expectedSubphases].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P111 remains complete", p111Contract.status === "complete" && statusById.get("P111")?.status === "complete" && roadmapById.get("P111")?.status === "complete");
addCheck("P111.7 checker accepts P112.1 handoff", p1117Checker.includes("P112.1") && p1117Checker.includes("P112.2") && p1117Checker.includes("scope check relaxed"));
addCheck(
  "phase status advanced",
  status.currentPhase === "P112.1"
    && status.previousPhase === "P111.7"
    && status.nextPhase === "P112.2"
    && roadmap.currentPhase === "P112.1"
    && roadmap.previousPhase === "P111.7"
    && roadmap.nextPhase === "P112.2"
    && statusById.get("P112")?.status === "in_progress"
    && statusById.get("P112.1")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P112.2")?.status)
    && roadmapById.get("P112")?.status === "in_progress"
    && roadmapById.get("P112.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("docs record P112.1", /P112\.1 Queue Admission Contract \/ Policy \/ Schema Plan[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P112.1", /P112\.1 queue admission contract/.test(readme) && /P112\.2 is next/.test(readme));
addCheck("platform roadmap records P112.1", /P112\.1 is complete/.test(platformRoadmap) && /P112\.2 is next/.test(platformRoadmap));
addCheck(
  "changed files stay in P112.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P112.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write queue now|migrate now/i.test(docsBundle));
addCheck("docs do not claim unsafe authority live", !unsafeClaims.test(docsBundle));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P112.1 founder live agent work queue admission contract.",
        "- Confirms P112 is split into implementation-grade subphases and P112.1 is contract/docs/status/checker only.",
        "- Confirms future local SQLite queue admission CRUD must reuse the existing DB runtime, repository, and founder live work order/admission helpers and remains planned until later subphases.",
        "- Does not change DB schema, live runtime models, Command Center source, project files, runtime data, providers, tools, workers, deploy, release, exports, packages, env files, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P112.1 is contract-only. It does not add DB schema, write queue records, dispatch agents, admit runtime execution, unlock execution, call providers/models, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P112.1 Founder Live Agent Work Queue Admission Contract Report", phase: "P112.1" },
);

printCheckReport("P112.1 Founder Live Agent Work Queue Admission Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
