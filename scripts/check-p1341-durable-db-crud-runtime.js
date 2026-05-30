import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1341-durable-db-crud-runtime-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p134-durable-db-crud-runtime-contracts.json";
const PLAN_PATH = "docs/architecture/P134_DURABLE_DB_CRUD_RUNTIME_PLAN.md";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|read-only|checker|report|docs?|roadmap|status)\b/i.test(context);
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
const p1341 = subphaseById.get("P134.1") || {};
const p1342 = subphaseById.get("P134.2") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1337Checker = readText("scripts/check-p1337-founder-idea-to-prd-final-validation.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1341-durable-db-crud-runtime.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P134.1";
const validationCommands = [
  "npm run check:p1341-durable-db-crud-runtime",
  "npm run check:p1337-founder-idea-to-prd-final-validation",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];
const expectedSubphases = ["P134.1", "P134.2", "P134.3", "P134.4", "P134.5", "P134.6", "P134.7"];
const allowedFiles = new Set([
  CONTRACT_PATH,
  PLAN_PATH,
  "README.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  "package.json",
  "scripts/check-p1341-durable-db-crud-runtime.js",
  "scripts/check-p1337-founder-idea-to-prd-final-validation.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  "scripts/check-os-phase-status.js",
  REPORT_PATH,
  "reports/p1337-founder-idea-to-prd-final-validation-report.md",
  "reports/enterprise-readiness-roadmap-report.md",
  "reports/os-phase-status-report.md",
  "reports/phase-validation-coverage-report.md",
]);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
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
const p1341StartedState =
  status.currentPhase === "P134.1"
  && status.previousPhase === "P133.7"
  && status.nextPhase === "P134.2"
  && roadmap.currentPhase === "P134.1"
  && roadmap.previousPhase === "P133.7"
  && roadmap.nextPhase === "P134.2"
  && status.current?.phaseId === "P134.1"
  && status.previous?.phaseId === "P133.7"
  && status.next?.phaseId === "P134.2"
  && roadmap.current?.phaseId === "P134.1"
  && roadmap.previous?.phaseId === "P133.7"
  && roadmap.next?.phaseId === "P134.2"
  && statusById.get("P133")?.status === "complete"
  && roadmapById.get("P133")?.status === "complete"
  && statusById.get("P133.7")?.status === "complete"
  && roadmapById.get("P133.7")?.status === "complete"
  && statusById.get("P134")?.status === "in_progress"
  && roadmapById.get("P134")?.status === "in_progress"
  && statusById.get("P134.1")?.status === "complete"
  && roadmapById.get("P134.1")?.status === "complete"
  && statusById.get("P134.2")?.status === "planned"
  && roadmapById.get("P134.2")?.status === "planned";
const p1342CurrentState =
  status.currentPhase === "P134.2"
  && status.previousPhase === "P134.1"
  && status.nextPhase === "P134.3"
  && roadmap.currentPhase === "P134.2"
  && roadmap.previousPhase === "P134.1"
  && roadmap.nextPhase === "P134.3"
  && status.current?.phaseId === "P134.2"
  && status.previous?.phaseId === "P134.1"
  && status.next?.phaseId === "P134.3"
  && roadmap.current?.phaseId === "P134.2"
  && roadmap.previous?.phaseId === "P134.1"
  && roadmap.next?.phaseId === "P134.3"
  && statusById.get("P133")?.status === "complete"
  && roadmapById.get("P133")?.status === "complete"
  && statusById.get("P133.7")?.status === "complete"
  && roadmapById.get("P133.7")?.status === "complete"
  && statusById.get("P134")?.status === "in_progress"
  && roadmapById.get("P134")?.status === "in_progress"
  && statusById.get("P134.1")?.status === "complete"
  && roadmapById.get("P134.1")?.status === "complete"
  && statusById.get("P134.2")?.status === "complete"
  && roadmapById.get("P134.2")?.status === "complete"
  && statusById.get("P134.3")?.status === "planned"
  && roadmapById.get("P134.3")?.status === "planned";
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
  && expectedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P135")?.status === "planned"
  && roadmapById.get("P135")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1341-durable-db-crud-runtime"]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract starts P134 safely", contract.phaseId === "P134" && (contract.status === "in_progress" || contract.status === "complete") && ((contract.currentSubphase === "P134.1" && contract.previousSubphase === "P133.7" && contract.nextSubphase === "P134.2") || (contract.currentSubphase === "P134.2" && contract.previousSubphase === "P134.1" && contract.nextSubphase === "P134.3") || (contract.currentSubphase === "P134.7" && contract.previousSubphase === "P134.6" && contract.nextSubphase === "P135")));
addCheck("contract has seven implementation-grade subphases", expectedSubphases.every((phaseId) => subphaseById.has(phaseId)) && expectedSubphases.every((phaseId) => subphaseById.get(phaseId)?.scopeClassification === "NEXUS_OS_CHANGE"));
addCheck("P134.1 complete and P134.2 planned or complete", p1341.status === "complete" && ["planned", "complete"].includes(p1342.status));
addCheck("P134.1 records safety boundary", p1341.safetyRules?.join(" ").includes("Do not write DB/runtime state") && p1341.forbiddenFiles?.includes("db/**") && p1341.forbiddenFiles?.includes("local-state/runtime/**"));
addCheck("P134.1 records validation commands", validationCommands.every((command) => p1341.validationCommands?.includes(command)));
addCheck("P133.7 report passes", reportPassed("reports/p1337-founder-idea-to-prd-final-validation-report.md"));
addCheck("P133.7 checker accepts P134.1 handoff", p1337Checker.includes("p1341StartedState") && p1337Checker.includes('status.currentPhase === "P134.1"'));
addCheck("enterprise checker accepts P134.1", enterpriseChecker.includes("p1341StartedState") && enterpriseChecker.includes("check:p1341-durable-db-crud-runtime"));
addCheck("OS checker recognizes P134 subphases", ["P134", "P134.1", "P134.2"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P134 plan records P134.1", /## P134\.1 Contract \/ Policy \/ Safety Boundary[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P134.1", /P134\.1 durable DB\/CRUD contract/i.test(readme));
addCheck("platform roadmap records P134.1", /P134\.1 is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P134.1", (/P134\.1 is now complete/i.test(enterpriseRoadmap) || /P134\.1 and P134\.2 are\s+now complete/i.test(enterpriseRoadmap) || /P134\.1 through P134\.7\s+are now complete/i.test(enterpriseRoadmap)) && (/P134\.2 is the next executable subphase/i.test(enterpriseRoadmap) || /P134\.3 is the next executable subphase/i.test(enterpriseRoadmap) || /P135 is the next executable phase/i.test(enterpriseRoadmap)));
addCheck("phase status starts P134.1", p1341StartedState || p1342CurrentState || p1347FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P134.1 entries have required fields", [statusById.get("P134"), statusById.get("P134.1"), roadmapById.get("P134.1")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P134.2 remains planned or safely handed off", (statusById.get("P134.2")?.status === "planned" && roadmapById.get("P134.2")?.status === "planned" && !(statusById.get("P134.2")?.checksRun || []).length) || p1342CurrentState || p1347FinalState);
addCheck(
  "changed files stay in P134.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P134.1 forbidden path check relaxed for ${status.currentPhase}`,
);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable DB actions", !/write db now|run migration now|create table now|execute sql now|save record now|persist record now|delete record now|update record now|enable crud now|connect hosted db now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /DB writes are enabled|runtime writes are enabled|CRUD is live|schema is created|migration is enabled|repository writes are enabled|raw SQL is enabled|hosted DB is connected/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Starts P134 Durable DB and CRUD Runtime with contract, policy, safety boundary, checker, docs, status, and report evidence.",
        "- Defines the staged DB/CRUD path without creating schemas, migrations, repositories, DB adapters, DB/runtime writes, or CRUD execution.",
        "- Confirms this subphase does not call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P134.1 is contract/policy/safety-boundary work only. It does not create DB schemas, run migrations, connect databases, write DB/runtime records, expose CRUD actions, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P134.1 Durable DB and CRUD Runtime Report", phase: "P134.1" },
);

printCheckReport("P134.1 Durable DB and CRUD Runtime Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
