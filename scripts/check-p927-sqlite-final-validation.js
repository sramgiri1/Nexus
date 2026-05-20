import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p927-sqlite-final-validation-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const phaseStatus = readJson("os-roadmap/phase-status.json");
const statusById = new Map((phaseStatus.phases || []).map((phase) => [phase.phaseId, phase]));
const dbIndex = readText("db/index.js");
const dbRuntimeUx = readText("dashboard/src/data/dbRuntimeReadiness.js");
const p92Docs = readText("docs/architecture/P92_LOCAL_SQLITE_RUNTIME_PLAN.md");
const contract = readText("contracts/os-roadmap/p92-execution-contracts.json");
const p92Reports = [
  "reports/p921-sqlite-runtime-foundation-report.md",
  "reports/p922-sqlite-crud-repository-report.md",
  "reports/p923-sqlite-runtime-read-wiring-report.md",
  "reports/p924-governed-sqlite-runtime-writes-report.md",
  "reports/p925-command-center-db-live-state-ux-report.md",
  "reports/p926-sqlite-maintenance-closure-report.md",
];
const p92Scripts = [
  "check:p921-sqlite-runtime-foundation",
  "check:p922-sqlite-crud-repository",
  "check:p923-sqlite-runtime-read-wiring",
  "check:p924-governed-sqlite-runtime-writes",
  "check:p925-command-center-db-live-state-ux",
  "check:p926-sqlite-maintenance-closure",
  "check:p927-sqlite-final-validation",
];
const source = [
  readText("db/sqliteRuntime.js"),
  readText("db/sqliteCrudRepository.js"),
  readText("db/sqliteRuntimeWrites.js"),
  readText("db/sqliteMaintenance.js"),
  dbRuntimeUx,
].join("\n");

addCheck("P92 subphase reports exist", p92Reports.every(fileExists));
addCheck("P92 package scripts registered", p92Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("SQLite runtime exports registered", dbIndex.includes("initializeSqliteRuntime") && dbIndex.includes("createSqliteCrudRepository"));
addCheck("SQLite write and maintenance exports registered", dbIndex.includes("appendSqliteEvidence") && dbIndex.includes("createSqliteRuntimeBackup"));
addCheck("Command Center DB live state is present", dbRuntimeUx.includes("Local SQLite ready when initialized") && dbRuntimeUx.includes("Repository reads"));
addCheck("P92 docs cover all subphases", ["P92.1", "P92.2", "P92.3", "P92.4", "P92.5", "P92.6"].every((id) => p92Docs.includes(id)));
addCheck("P92 contract covers all subphases", ["P92.1", "P92.2", "P92.3", "P92.4", "P92.5", "P92.6", "P92.7"].every((id) => contract.includes(`\"phaseId\": \"${id}\"`)));
addCheck("P92.1-P92.6 complete", ["P92.1", "P92.2", "P92.3", "P92.4", "P92.5", "P92.6"].every((id) => statusById.get(id)?.status === "complete"));
addCheck("P92.7 current or planned", ["planned", "complete"].includes(statusById.get("P92.7")?.status));
addCheck("no stale pending-final-commit in completed P92 entries", ["P92.1", "P92.2", "P92.3", "P92.4", "P92.5", "P92.6"].every((id) => statusById.get(id)?.commit !== "pending-final-commit"));
addCheck("local-only DB safety preserved", source.includes("externalDbAllowed: false") && source.includes("productionDbAllowed: false"));
addCheck("no raw hosted DB URLs or secrets", !/postgres:\/\/|postgresql:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(source));
addCheck("no provider/tool/worker/project/deploy imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(source));
addCheck("no DemoApp exposure in DB live UX", !dbRuntimeUx.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P92 local SQLite runtime closure.",
        "- Confirms foundation, CRUD, read wiring, governed writes, Command Center DB live-state UX, and backup maintenance are present.",
        "- Confirms local-only safety boundaries remain intact.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p927-sqlite-final-validation",
        "- npm run check:p926-sqlite-maintenance-closure",
        "- npm run check:p925-command-center-db-live-state-ux",
        "- npm run check:p924-governed-sqlite-runtime-writes",
        "- npm run check:p923-sqlite-runtime-read-wiring",
        "- npm run check:p922-sqlite-crud-repository",
        "- npm run check:p921-sqlite-runtime-foundation",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"DB live state\"",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P92 closes local SQLite runtime readiness. Hosted DBs, general entity mutation, provider calls, worker execution, project mutation, deploy, package, export, network calls, and provider spend remain blocked.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P92.7 SQLite Final Validation Report", phase: "P92.7" },
);

printCheckReport("P92.7 SQLite Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
