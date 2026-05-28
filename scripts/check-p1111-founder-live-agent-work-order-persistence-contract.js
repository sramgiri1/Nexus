import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1111-founder-live-agent-work-order-persistence-contract-report.md";

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
    .map((line) => line.includes(" -> ") ? line.split(" -> ").pop() : line);
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p111-founder-live-agent-work-order-persistence-contracts.json");
const p110Contract = readJson("contracts/os-roadmap/p110-founder-live-operator-decision-ledger-persistence-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1111 = subphaseById.get("P111.1") || {};
const p1112 = subphaseById.get("P111.2") || {};
const plan = readText("docs/architecture/P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1107Checker = readText("scripts/check-p1107-founder-live-operator-decision-ledger-persistence-final.js");
const dbSchema = readText("db/schema.json");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P111.1";
const allowedFiles = new Set(p1111.allowedFiles || []);
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
const expectedSubphases = ["P111.1", "P111.2", "P111.3", "P111.4", "P111.5", "P111.6", "P111.7"];
const futureSchemas = [
  "founder_agent_work_orders",
  "founder_agent_work_order_events",
  "founder_agent_work_order_evidence_refs",
];
const futureExports = [
  "P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PHASE",
  "P111_AGENT_WORK_ORDER_DB_ENTITIES",
  "buildFounderLiveAgentWorkOrderPersistenceContract",
  "validateFounderLiveAgentWorkOrderPersistenceContract",
  "buildSafeAgentWorkOrderDbRecord",
  "executeApprovedAgentWorkOrderDbCrudRequest",
  "buildAgentWorkOrderDbViewModel",
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
  "live-ready/founderLiveHandoffWorkOrders.js",
  "live-ready/founderLiveWorkAdmission.js",
  "existing Command Center route matrix, tabs, cards, badges, evidence, audit, and activity helpers",
];
const validationCommands = [
  "npm run check:p1111-founder-live-agent-work-order-persistence-contract",
  "npm run check:p1107-founder-live-operator-decision-ledger-persistence-final",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const unsafeClaims = /hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|work order execution is enabled/i;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1111-founder-live-agent-work-order-persistence-contract"]));
addCheck("P111 contract status in progress", contract.phaseId === "P111" && contract.status === "in_progress");
addCheck("P111 subphase split is implementation-grade", (contract.subphases || []).length === 7 && expectedSubphases.every((phaseId) => subphaseById.has(phaseId)));
addCheck("P111.1 is complete and P111.2 next", p1111.status === "complete" && ["planned", "complete"].includes(p1112.status));
addCheck("P111.1 is contract only", p1111.scopeClassification === "NEXUS_OS_CHANGE" && (p1111.forbiddenFiles || []).includes("db/**") && (p1111.forbiddenFiles || []).includes("live-ready/**") && (p1111.forbiddenFiles || []).includes("dashboard/src/**"));
addCheck("P111.1 records validation commands", validationCommands.every((command) => p1111.validationCommands?.includes(command)));
addCheck(
  "future schemas are documented only",
  futureSchemas.every((schemaName) => p1111.futureSchemas?.includes(schemaName))
    && (!enforceCurrentDiffScope || futureSchemas.every((schemaName) => !dbSchema.includes(`"name": "${schemaName}"`))),
  enforceCurrentDiffScope ? "P111.1 schema must remain planned only" : `schema implementation allowed for ${status.currentPhase}`,
);
addCheck("future exports are documented only", futureExports.every((exportName) => p1111.futureExports?.includes(exportName)));
addCheck("reuse requirements are explicit", requiredReuse.every((helper) => (contract.reuseRequired || []).includes(helper)));
addCheck("OS checker accepts P111 subphases", ["P111", ...expectedSubphases].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P110 remains complete", p110Contract.status === "complete" && statusById.get("P110")?.status === "complete" && roadmapById.get("P110")?.status === "complete");
addCheck("P110.7 checker accepts P111.1 handoff", p1107Checker.includes("P111.1") && p1107Checker.includes("P111.2"));
addCheck(
  "phase status advanced",
  status.currentPhase === "P111.1"
    && status.previousPhase === "P110.7"
    && status.nextPhase === "P111.2"
    && roadmap.currentPhase === "P111.1"
    && roadmap.previousPhase === "P110.7"
    && roadmap.nextPhase === "P111.2"
    && statusById.get("P111")?.status === "in_progress"
    && statusById.get("P111.1")?.status === "complete"
    && statusById.get("P111.2")?.status === "planned"
    && roadmapById.get("P111")?.status === "in_progress"
    && roadmapById.get("P111.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("docs record P111.1", /P111\.1 Work Order Persistence Contract \/ Policy \/ Schema Plan[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P111.1", /P111\.1 work order persistence contract/.test(readme) && /P111\.2 is next/.test(readme));
addCheck("platform roadmap records P111.1", /P111\.1 is complete/.test(platformRoadmap) && /P111\.2 is next/.test(platformRoadmap));
addCheck(
  "changed files stay in P111.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P111.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write work order now|migrate now/i.test(docsBundle));
addCheck("docs do not claim unsafe authority live", !unsafeClaims.test(docsBundle));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P111.1 founder live agent work order persistence contract.",
        "- Confirms P111 is split into implementation-grade subphases and P111.1 is contract/docs/status/checker only.",
        "- Confirms future local SQLite CRUD must reuse the existing DB runtime, repository, and founder live handoff/work admission helpers and remains planned until later subphases.",
        "- Does not change DB schema, live runtime models, Command Center source, project files, runtime data, providers, tools, workers, deploy, release, exports, packages, env files, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P111.1 is contract-only. It does not add DB schema, write work order records, dispatch agents, admit runtime execution, unlock execution, call providers/models, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P111.1 Founder Live Agent Work Order Persistence Contract Report", phase: "P111.1" },
);

printCheckReport("P111.1 Founder Live Agent Work Order Persistence Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
