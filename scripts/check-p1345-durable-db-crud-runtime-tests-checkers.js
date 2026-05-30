import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1345-durable-db-crud-runtime-tests-checkers-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p134-durable-db-crud-runtime-contracts.json";
const PLAN_PATH = "docs/architecture/P134_DURABLE_DB_CRUD_RUNTIME_PLAN.md";
const DATA_PATH = "dashboard/src/data/dbRuntimeReadiness.js";
const TEST_PATH = "dashboard/tests/routes.spec.js";
const REQUIRED_SCRIPT = "check:p1345-durable-db-crud-runtime-tests-checkers";
const VALIDATION_COMMANDS = [
  "npm run check:p1345-durable-db-crud-runtime-tests-checkers",
  "npm run check:p1344-durable-db-crud-runtime-command-center-ux",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function reportPassed(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) return false;
  return /## Result[\s\S]*PASS/i.test(readText(relativePath));
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|local-only|preview|dry run|cannot|later subphase|before|until|non-runnable|readiness)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson(CONTRACT_PATH);
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1345 = subphaseById.get("P134.5") || {};
const p1346 = subphaseById.get("P134.6") || {};
const dataSource = readText(DATA_PATH);
const testSource = readText(TEST_PATH);
const checkerSource = readText("scripts/check-p1345-durable-db-crud-runtime-tests-checkers.js");
const p1344Checker = readText("scripts/check-p1344-durable-db-crud-runtime-command-center-ux.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const allowedFiles = new Set(p1345.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "db/",
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
const allowedDashboardFiles = new Set([DATA_PATH, TEST_PATH]);
const dataP134Slice = dataSource.match(/const durableCrudRuntimeUx = \{[\s\S]*?\n  \};/)?.[0] || "";
const p1345CurrentState =
  status.currentPhase === "P134.5"
  && status.previousPhase === "P134.4"
  && status.nextPhase === "P134.6"
  && roadmap.currentPhase === "P134.5"
  && roadmap.previousPhase === "P134.4"
  && roadmap.nextPhase === "P134.6"
  && status.current?.phaseId === "P134.5"
  && status.previous?.phaseId === "P134.4"
  && status.next?.phaseId === "P134.6"
  && roadmap.current?.phaseId === "P134.5"
  && roadmap.previous?.phaseId === "P134.4"
  && roadmap.next?.phaseId === "P134.6"
  && statusById.get("P134")?.status === "in_progress"
  && roadmapById.get("P134")?.status === "in_progress"
  && ["P134.1", "P134.2", "P134.3", "P134.4", "P134.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P134.6")?.status === "planned"
  && roadmapById.get("P134.6")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract marks P134.5 complete", contract.status === "in_progress" && contract.currentSubphase === "P134.5" && contract.previousSubphase === "P134.4" && contract.nextSubphase === "P134.6" && p1345.status === "complete");
addCheck("P134.5 records expected base commit", p1345.expectedBaseCommit === "c9ed2d84");
addCheck("P134.6 remains planned-only", p1346.status === "planned" && p1346.allowedFiles?.length === 0);
addCheck("P134.5 allowed files include checker, route test, and DB runtime data", [DATA_PATH, TEST_PATH, "scripts/check-p1345-durable-db-crud-runtime-tests-checkers.js"].every((file) => p1345.allowedFiles?.includes(file)));
addCheck("P134.5 forbids project/db/runtime/provider/tool paths", ["projects/**", "careloop/**", "generated-projects/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1345.forbiddenFiles?.includes(path)));
addCheck("P134.5 records validation commands", VALIDATION_COMMANDS.every((command) => p1345.validationCommands?.includes(command)));
addCheck("P134.1-P134.4 reports pass", [
  "reports/p1341-durable-db-crud-runtime-report.md",
  "reports/p1342-durable-db-crud-runtime-schema-model-report.md",
  "reports/p1343-durable-db-crud-runtime-write-plan-preview-report.md",
  "reports/p1344-durable-db-crud-runtime-command-center-ux-report.md",
].every((reportPath) => reportPassed(reportPath)));
addCheck("P134.4 checker accepts P134.5 handoff", p1344Checker.includes("p1345CurrentState") && p1344Checker.includes('status.currentPhase === "P134.5"') && p1344Checker.includes('status.nextPhase === "P134.6"'));
addCheck("enterprise checker accepts P134.5", enterpriseChecker.includes("p1345CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("DB Runtime evidence includes P134.5", [
  "P134.5 validation hardened",
  "P134.5 tests/checkers complete",
  "reports/p1345-durable-db-crud-runtime-tests-checkers-report.md",
  "P134.6 to close docs and roadmap status",
].every((text) => dataSource.includes(text)));
addCheck("P134.5 Playwright coverage added", [
  "P134.5 tests/checkers complete",
  "P134.6 to close docs and roadmap status",
  "reports/p1345-durable-db-crud-runtime-tests-checkers-report.md",
].every((text) => testSource.includes(text)));
addCheck("P134.5 data avoids raw table names", !/founder_sessions|founder_qna_turns|business_build_sessions|founder_agent_work_orders|founder_runtime_execution/i.test(dataP134Slice));
addCheck("P134.5 data avoids fake runnable actions", !/run migration now|create table now|execute sql now|write db now|save record now|persist record now|update record now|delete record now|enable crud now|dispatch agent now|mutate project now|deploy now|spend now|write sqlite now/i.test(dataP134Slice));
addCheck("P134.5 data avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(dataP134Slice));
addCheck("plan records P134.5 implementation", /## P134\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P134.5", /P134\.5 durable DB\/CRUD tests\/checkers/i.test(readme));
addCheck("platform roadmap records P134.5", /P134\.5 durable DB\/CRUD tests\/checkers/i.test(platformRoadmap) && /P134\.6 Docs \/ Roadmap is planned-only next/i.test(platformRoadmap));
addCheck("enterprise roadmap records P134.5", /P134\.5 is now complete/i.test(enterpriseRoadmap) && /P134\.6 is the next executable subphase/i.test(enterpriseRoadmap));
addCheck("phase status advanced", p1345CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P134.5 entries have required fields", [statusById.get("P134"), statusById.get("P134.5"), roadmapById.get("P134.5")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("changed files stay in P134.5 allowed scope", changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH), changed.join(", "));
addCheck("forbidden paths unchanged", changed.every((file) => allowedDashboardFiles.has(file) || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable DB actions", !/run migration now|create table now|execute sql now|write db now|save record now|persist record now|update record now|delete record now|enable crud now|connect hosted db now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /DB reads are enabled|DB writes are enabled|runtime writes are enabled|CRUD is live|schema is created|migration is enabled|repository writes are enabled|raw SQL is enabled|hosted DB is connected|agent dispatch is enabled|project mutation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P134.5 durable DB/CRUD tests and checker hardening.",
        "- Confirms P134.1-P134.4 evidence remains passing and the DB Runtime surface shows P134.5 validation evidence.",
        "- Confirms the durable DB/CRUD lane remains display-safe and non-runnable.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1345.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P134.5 is test/checker hardening only. It does not create DB schemas, run migrations, read or write DB/runtime records, execute CRUD, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P134.5 Durable DB CRUD Runtime Tests Checkers Report", phase: "P134.5" },
);

printCheckReport("P134.5 Durable DB CRUD Runtime Tests Checkers Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
