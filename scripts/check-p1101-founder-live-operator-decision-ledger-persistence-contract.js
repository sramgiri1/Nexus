import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1101-founder-live-operator-decision-ledger-persistence-contract-report.md";

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
const contract = readJson("contracts/os-roadmap/p110-founder-live-operator-decision-ledger-persistence-contracts.json");
const p109Contract = readJson("contracts/os-roadmap/p109-founder-live-operator-decision-ledger-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1101 = subphaseById.get("P110.1") || {};
const p1102 = subphaseById.get("P110.2") || {};
const plan = readText("docs/architecture/P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const dbSchema = readText("db/schema.json");
const changed = changedFiles();
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
const allowedFiles = new Set(p1101.allowedFiles || []);
const docsBundle = JSON.stringify(contract) + "\n" + plan + "\n" + platformRoadmap + "\n" + readme;

const expectedFutureSchemas = [
  "operator_decision_ledger_entries",
  "operator_decision_ledger_events",
  "operator_decision_ledger_evidence_refs",
];
const expectedFutureExports = [
  "P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PHASE",
  "P110_OPERATOR_DECISION_LEDGER_DB_ENTITIES",
  "buildFounderLiveOperatorDecisionLedgerPersistenceContract",
  "validateFounderLiveOperatorDecisionLedgerPersistenceContract",
  "buildSafeOperatorDecisionLedgerDbRecord",
  "executeApprovedOperatorDecisionLedgerDbCrudRequest",
  "buildOperatorDecisionLedgerDbViewModel",
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
  "live-ready/founderLiveOperatorDecisionLedgerBoundary.js",
  "live-ready/founderLiveOperatorDecisionLedgerModel.js",
  "live-ready/founderLiveOperatorDecisionLedgerAuditPreview.js",
];
const requiredValidationCommands = [
  "npm run check:p1101-founder-live-operator-decision-ledger-persistence-contract",
  "npm run check:p1097-founder-live-operator-decision-ledger-final",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const unsafeClaims = /hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled/i;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1101-founder-live-operator-decision-ledger-persistence-contract"]));
addCheck("P110 contract status in progress", contract.phaseId === "P110" && contract.status === "in_progress");
addCheck("P110 subphase split is implementation-grade", (contract.subphases || []).length === 7 && ["P110.1", "P110.2", "P110.3", "P110.4", "P110.5", "P110.6", "P110.7"].every((phaseId) => subphaseById.has(phaseId)));
addCheck("P110.1 is complete and P110.2 next", p1101.status === "complete" && p1102.status === "planned");
addCheck("P110.1 is contract only", p1101.scopeClassification === "NEXUS_OS_CHANGE" && (p1101.forbiddenFiles || []).includes("db/**") && (p1101.forbiddenFiles || []).includes("live-ready/**") && (p1101.forbiddenFiles || []).includes("dashboard/src/**"));
addCheck("P110.1 records validation commands", requiredValidationCommands.every((command) => p1101.validationCommands?.includes(command)));
addCheck("future schemas are documented only", expectedFutureSchemas.every((schemaName) => p1101.futureSchemas?.includes(schemaName)) && expectedFutureSchemas.every((schemaName) => !dbSchema.includes(`"name": "${schemaName}"`)));
addCheck("future exports are documented only", expectedFutureExports.every((exportName) => p1101.futureExports?.includes(exportName)));
addCheck("reuse requirements are explicit", requiredReuse.every((helper) => (contract.reuseRequired || []).includes(helper)));
addCheck("OS checker accepts P110 subphases", ["P110.1", "P110.2", "P110.3", "P110.4", "P110.5", "P110.6", "P110.7"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P109.7 remains complete", p109Contract.status === "complete" && statusById.get("P109.7")?.status === "complete" && roadmapById.get("P109.7")?.status === "complete");
addCheck(
  "phase status advanced",
  status.currentPhase === "P110.1"
    && status.previousPhase === "P109.7"
    && status.nextPhase === "P110.2"
    && statusById.get("P110")?.status === "in_progress"
    && statusById.get("P110.1")?.status === "complete"
    && statusById.get("P110.2")?.status === "planned"
    && roadmap.currentPhase === "P110.1"
    && roadmap.previousPhase === "P109.7"
    && roadmap.nextPhase === "P110.2"
    && roadmapById.get("P110")?.status === "in_progress"
    && roadmapById.get("P110.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("docs record P110.1", /P110\.1 Persistence Contract \/ Policy \/ Schema Plan[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P110.1", /P110\.1 decision-ledger persistence contract/.test(readme) && /P110\.2 is next/.test(readme));
addCheck("platform roadmap records P110.1", /P110\.1 is complete/.test(platformRoadmap) && /P110\.2 is next/.test(platformRoadmap));
addCheck("changed files stay in P110.1 allowed scope", changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH), changed.join(", "));
addCheck("forbidden paths unchanged", changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write ledger now|migrate now/i.test(docsBundle));
addCheck("docs do not claim unsafe authority live", !unsafeClaims.test(docsBundle));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P110.1 founder live operator decision-ledger persistence contract.",
        "- Confirms P110 is split into implementation-grade subphases and P110.1 is contract/docs/status/checker only.",
        "- Confirms future local SQLite CRUD must reuse the existing DB runtime and repository and remains planned until later subphases.",
        "- Does not change DB schema, live runtime models, Command Center source, project files, runtime data, providers, tools, workers, deploy, release, exports, packages, env files, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: requiredValidationCommands.map((command) => `- ${command}`).join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P110.1 is contract-only. It does not add DB schema, write ledger records, capture operator decisions, admit runtime execution, unlock execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P110.1 Founder Live Operator Decision Ledger Persistence Contract Report", phase: "P110.1" },
);

printCheckReport("P110.1 Founder Live Operator Decision Ledger Persistence Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
