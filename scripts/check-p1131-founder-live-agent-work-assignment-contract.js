import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1131-founder-live-agent-work-assignment-contract-report.md";

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
const contract = readJson("contracts/os-roadmap/p113-founder-live-agent-work-assignment-readiness-contracts.json");
const p112Contract = readJson("contracts/os-roadmap/p112-founder-live-agent-work-queue-admission-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1131 = subphaseById.get("P113.1") || {};
const p1132 = subphaseById.get("P113.2") || {};
const p1133 = subphaseById.get("P113.3") || {};
const plan = readText("docs/architecture/P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1127Checker = readText("scripts/check-p1127-founder-live-agent-work-queue-admission-final.js");
const dbSchema = readText("db/schema.json");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P113.1";
const allowedFiles = new Set(p1131.allowedFiles || []);
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
const expectedSubphases = ["P113.1", "P113.2", "P113.3", "P113.4", "P113.5", "P113.6", "P113.7"];
const futureSchemas = [
  "founder_agent_work_assignments",
  "founder_agent_work_assignment_events",
  "founder_agent_work_assignment_evidence_refs",
];
const futureExports = [
  "P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PHASE",
  "P113_AGENT_WORK_ASSIGNMENT_DB_ENTITIES",
  "buildFounderLiveAgentWorkAssignmentReadinessContract",
  "validateFounderLiveAgentWorkAssignmentReadinessContract",
  "buildSafeAgentWorkAssignmentDbRecord",
  "executeApprovedAgentWorkAssignmentDbCrudRequest",
  "buildAgentWorkAssignmentReadinessViewModel",
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
  "live-ready/founderLiveAgentWorkQueueAdmission.js",
  "live-ready/founderLiveAgentWorkOrderPersistence.js",
  "live-ready/founderLiveHandoffWorkOrders.js",
  "existing Command Center route matrix, tabs, cards, badges, evidence, audit, and activity helpers",
];
const validationCommands = [
  "npm run check:p1131-founder-live-agent-work-assignment-contract",
  "npm run check:p1127-founder-live-agent-work-queue-admission-final",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const unsafeClaims = /hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|assignment execution is enabled|work assignment execution is enabled/i;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1131-founder-live-agent-work-assignment-contract"]));
addCheck("P113 contract status in progress", contract.phaseId === "P113" && contract.status === "in_progress");
addCheck("P113 subphase split is implementation-grade", (contract.subphases || []).length === 7 && expectedSubphases.every((phaseId) => subphaseById.has(phaseId)));
addCheck("P113.1 is complete and follow-on subphases are tracked", p1131.status === "complete" && ["planned", "complete"].includes(p1132.status) && ["planned", "complete"].includes(p1133.status));
addCheck("P113.1 is contract only", p1131.scopeClassification === "NEXUS_OS_CHANGE" && (p1131.forbiddenFiles || []).includes("db/**") && (p1131.forbiddenFiles || []).includes("live-ready/**") && (p1131.forbiddenFiles || []).includes("dashboard/src/**"));
addCheck("P113.1 records validation commands", validationCommands.every((command) => p1131.validationCommands?.includes(command)));
addCheck(
  "future schemas are documented only",
  futureSchemas.every((schemaName) => p1131.futureSchemas?.includes(schemaName))
    && (!enforceCurrentDiffScope || futureSchemas.every((schemaName) => !dbSchema.includes(`"name": "${schemaName}"`))),
  enforceCurrentDiffScope ? "P113.1 schema must remain planned only" : `schema implementation allowed for ${status.currentPhase}`,
);
addCheck("future exports are documented only", futureExports.every((exportName) => p1131.futureExports?.includes(exportName)));
addCheck("reuse requirements are explicit", requiredReuse.every((helper) => (contract.reuseRequired || []).includes(helper)));
addCheck("OS checker accepts P113 subphases", ["P113", ...expectedSubphases, "P114"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P112 remains complete", p112Contract.status === "complete" && statusById.get("P112")?.status === "complete" && roadmapById.get("P112")?.status === "complete");
addCheck("P112.7 checker accepts P113.1 handoff", p1127Checker.includes("P113.1") && p1127Checker.includes("P113.2") && p1127Checker.includes("scope check relaxed"));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P113.1"
      && status.previousPhase === "P112.7"
      && status.nextPhase === "P113.2"
      && roadmap.currentPhase === "P113.1"
      && roadmap.previousPhase === "P112.7"
      && roadmap.nextPhase === "P113.2")
    || (status.currentPhase === "P113.2"
      && status.previousPhase === "P113.1"
      && status.nextPhase === "P113.3"
      && roadmap.currentPhase === "P113.2"
      && roadmap.previousPhase === "P113.1"
      && roadmap.nextPhase === "P113.3"))
    && statusById.get("P113")?.status === "in_progress"
    && statusById.get("P113.1")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P113.2")?.status)
    && ["planned", "complete"].includes(statusById.get("P113.3")?.status)
    && roadmapById.get("P113")?.status === "in_progress"
    && roadmapById.get("P113.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("docs record P113.1", /P113\.1 Assignment Readiness Contract \/ Policy \/ Schema Plan[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P113.1", /P113\.1 work assignment readiness contract/.test(readme) && /P113\.2\s+is\s+next/.test(readme));
addCheck("platform roadmap records P113.1", /P113\.1 is complete/.test(platformRoadmap) && /P113\.2\s+is\s+next/.test(platformRoadmap));
addCheck(
  "changed files stay in P113.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P113.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write assignment now|migrate now/i.test(docsBundle));
addCheck("docs do not claim unsafe authority live", !unsafeClaims.test(docsBundle));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P113.1 founder live agent work assignment readiness contract.",
        "- Confirms P113 is split into implementation-grade subphases and P113.1 is contract/docs/status/checker only.",
        "- Confirms future local assignment CRUD must reuse the existing DB runtime, repository, queue admission, work order persistence, and founder handoff helpers and remains planned until later subphases.",
        "- Does not change DB schema, live runtime models, Command Center source, project files, runtime data, providers, tools, workers, deploy, release, exports, packages, env files, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P113.1 is contract-only. It does not add DB schema, write assignment records, dispatch agents, admit runtime execution, unlock execution, call providers/models, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P113.1 Founder Live Agent Work Assignment Contract Report", phase: "P113.1" },
);

printCheckReport("P113.1 Founder Live Agent Work Assignment Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
