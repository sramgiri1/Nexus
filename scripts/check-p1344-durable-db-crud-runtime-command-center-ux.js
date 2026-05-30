import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1344-durable-db-crud-runtime-command-center-ux-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p134-durable-db-crud-runtime-contracts.json";
const PLAN_PATH = "docs/architecture/P134_DURABLE_DB_CRUD_RUNTIME_PLAN.md";
const DATA_PATH = "dashboard/src/data/dbRuntimeReadiness.js";
const PAGE_PATH = "dashboard/src/pages/CommandCenterV2.jsx";
const TEST_PATH = "dashboard/tests/routes.spec.js";
const REQUIRED_SCRIPT = "check:p1344-durable-db-crud-runtime-command-center-ux";
const VALIDATION_COMMANDS = [
  "npm run check:p1344-durable-db-crud-runtime-command-center-ux",
  "npm run check:p1343-durable-db-crud-runtime-write-plan-preview",
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
const p1344 = subphaseById.get("P134.4") || {};
const p1345 = subphaseById.get("P134.5") || {};
const dataSource = readText(DATA_PATH);
const pageSource = readText(PAGE_PATH);
const testSource = readText(TEST_PATH);
const checkerSource = readText("scripts/check-p1344-durable-db-crud-runtime-command-center-ux.js");
const p1343Checker = readText("scripts/check-p1343-durable-db-crud-runtime-write-plan-preview.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const changed = changedFiles();
const allowedFiles = new Set(p1344.allowedFiles || []);
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
const allowedDashboardFiles = new Set([DATA_PATH, PAGE_PATH, TEST_PATH]);
const p1344Slice = pageSource.match(/aria-label=\"P134 Durable DB CRUD Runtime\"[\s\S]*?<div className=\"ccv2-card\">\s*<div className=\"ccv2-section-heading\">Enterprise Runtime CRUD/)?.[0] || "";
const dataP1344Slice = dataSource.match(/const durableCrudRuntimeUx = \{[\s\S]*?\n  \};/)?.[0] || "";
const p1344CurrentState =
  status.currentPhase === "P134.4"
  && status.previousPhase === "P134.3"
  && status.nextPhase === "P134.5"
  && roadmap.currentPhase === "P134.4"
  && roadmap.previousPhase === "P134.3"
  && roadmap.nextPhase === "P134.5"
  && status.current?.phaseId === "P134.4"
  && status.previous?.phaseId === "P134.3"
  && status.next?.phaseId === "P134.5"
  && roadmap.current?.phaseId === "P134.4"
  && roadmap.previous?.phaseId === "P134.3"
  && roadmap.next?.phaseId === "P134.5"
  && statusById.get("P134")?.status === "in_progress"
  && roadmapById.get("P134")?.status === "in_progress"
  && ["P134.1", "P134.2", "P134.3", "P134.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P134.5")?.status === "planned"
  && roadmapById.get("P134.5")?.status === "planned";
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
const p1347FinalState =
  status.currentPhase === "P134.7"
  && status.previousPhase === "P134.6"
  && status.nextPhase === "P135"
  && roadmap.currentPhase === "P134.7"
  && roadmap.previousPhase === "P134.6"
  && roadmap.nextPhase === "P135"
  && status.current?.phaseId === "P134.7"
  && status.previous?.phaseId === "P134.6"
  && status.next?.phaseId === "P135"
  && roadmap.current?.phaseId === "P134.7"
  && roadmap.previous?.phaseId === "P134.6"
  && roadmap.next?.phaseId === "P135"
  && statusById.get("P134")?.status === "complete"
  && roadmapById.get("P134")?.status === "complete"
  && ["P134.1", "P134.2", "P134.3", "P134.4", "P134.5", "P134.6", "P134.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P135")?.status === "planned"
  && roadmapById.get("P135")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract marks P134.4 complete", (contract.status === "in_progress" || contract.status === "complete") && ((contract.currentSubphase === "P134.4" && contract.previousSubphase === "P134.3" && contract.nextSubphase === "P134.5") || (contract.currentSubphase === "P134.5" && contract.previousSubphase === "P134.4" && contract.nextSubphase === "P134.6") || (contract.currentSubphase === "P134.7" && contract.previousSubphase === "P134.6" && contract.nextSubphase === "P135")) && p1344.status === "complete");
addCheck("P134.4 records expected base commit", p1344.expectedBaseCommit === "73c464ec");
addCheck("P134.5 remains planned or complete", ["planned", "complete"].includes(p1345.status));
addCheck("P134.4 allowed files include dashboard data page and route test", p1344.allowedFiles?.includes(DATA_PATH) && p1344.allowedFiles?.includes(PAGE_PATH) && p1344.allowedFiles?.includes(TEST_PATH));
addCheck("P134.4 forbids project/db/runtime/provider/tool paths", ["projects/**", "careloop/**", "generated-projects/**", "db/**", "local-state/runtime/**", "providers/**", "tools/**", "worker-runtime/**"].every((path) => p1344.forbiddenFiles?.includes(path)));
addCheck("P134.4 records validation commands", VALIDATION_COMMANDS.every((command) => p1344.validationCommands?.includes(command)));
addCheck("DB runtime data exposes P134.4 UX shape", [
  "durableCrudRuntimeUx",
  'phaseId: "P134.4"',
  "schemaCoverage",
  "writePlan",
  "summaryRows",
  "evidenceRows",
  "safetyRows",
  "P134 Durable DB/CRUD Runtime",
  "9 groups / 29 OS records",
  "8 blocked gates / 6 blocked repository intents",
].every((text) => dataSource.includes(text)));
addCheck("DB runtime page renders P134.4 section", [
  'aria-label="P134 Durable DB CRUD Runtime"',
  "{durableCrudRuntimeUx.title}",
  "Schema model groups",
  "Write-plan gates",
  "durableCrudRuntimeUx.writePlan.steps.map",
  "durableCrudRuntimeUx.evidenceRows.map",
  "durableCrudRuntimeUx.blockers.map",
].every((text) => pageSource.includes(text)));
addCheck("P134.4 Playwright coverage added", [
  "P134 Durable DB/CRUD Runtime",
  "P134.4 Command Center UX",
  "9 groups / 29 OS records",
  "8 blocked gates / 6 blocked repository intents",
  "reports/p1344-durable-db-crud-runtime-command-center-ux-report.md",
].every((text) => testSource.includes(text)));
addCheck("P134.4 UX avoids raw table names", !/founder_sessions|founder_qna_turns|business_build_sessions|founder_agent_work_orders|founder_runtime_execution/i.test(`${dataP1344Slice}\n${p1344Slice}`));
addCheck("P134.4 UX avoids fake runnable actions", !/run migration now|create table now|execute sql now|write db now|save record now|persist record now|update record now|delete record now|enable crud now|dispatch agent now|mutate project now|deploy now|spend now|write sqlite now/i.test(`${dataP1344Slice}\n${p1344Slice}`));
addCheck("P134.4 UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(`${dataP1344Slice}\n${p1344Slice}`));
addCheck("P134.4 UX includes required operator fields", [
  "What changed",
  "Current state",
  "Next action",
  "Owner capability",
  "Disabled reason",
  "Cost impact",
  "Schema model",
  "Write-plan preview",
  "Activity",
].every((text) => dataP1344Slice.includes(text)));
addCheck("P134.3 report passes", reportPassed("reports/p1343-durable-db-crud-runtime-write-plan-preview-report.md"));
addCheck("P134.3 checker accepts P134.4 handoff", p1343Checker.includes("p1344CurrentState") && p1343Checker.includes('status.currentPhase === "P134.4"') && p1343Checker.includes('status.nextPhase === "P134.5"'));
addCheck("enterprise checker accepts P134.4", enterpriseChecker.includes("p1344CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("plan records P134.4 implementation", /## P134\.4 DB Runtime Command Center UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P134.4", /P134\.4 durable DB\/CRUD Command Center UX/i.test(readme));
addCheck("platform roadmap records P134.4", /P134\.4 durable DB\/CRUD Command Center UX/i.test(platformRoadmap) && (/P134\.5 Tests \/ Checkers is planned-only next/i.test(platformRoadmap) || /P134\.5 Tests \/ Checkers is now complete/i.test(platformRoadmap)));
addCheck("enterprise roadmap records P134.4", /P134\.4 is now complete/i.test(enterpriseRoadmap) && (/P134\.5 is the next executable subphase/i.test(enterpriseRoadmap) || /P134\.6 is the next executable subphase/i.test(enterpriseRoadmap) || /P135 is the next executable phase/i.test(enterpriseRoadmap)));
addCheck("phase status advanced", p1344CurrentState || p1345CurrentState || p1347FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P134.4 entries have required fields", [statusById.get("P134"), statusById.get("P134.4"), roadmapById.get("P134.4")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("changed files stay in P134.4 allowed scope", p1345CurrentState || p1347FinalState || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH), (p1345CurrentState || p1347FinalState) ? `scope check relaxed for ${status.currentPhase}` : changed.join(", "));
addCheck("forbidden paths unchanged", p1345CurrentState || p1347FinalState || changed.every((file) => allowedDashboardFiles.has(file) || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), (p1345CurrentState || p1347FinalState) ? `P134.4 forbidden path check relaxed for ${status.currentPhase}` : changed.join(", "));
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
        "- Validates the P134.4 DB Runtime Command Center UX.",
        "- Confirms the existing Durable State DB Runtime tab shows P134 schema coverage, write-plan gates, blockers, next action, owner, evidence, activity, and cost impact.",
        "- Confirms the UX remains display-safe and non-runnable.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1344.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P134.4 is Command Center UX only. It does not create DB schemas, run migrations, read or write DB/runtime records, execute CRUD, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P134.4 Durable DB CRUD Runtime Command Center UX Report", phase: "P134.4" },
);

printCheckReport("P134.4 Durable DB CRUD Runtime Command Center UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
