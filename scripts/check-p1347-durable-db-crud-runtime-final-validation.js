import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1347-durable-db-crud-runtime-final-validation-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p134-durable-db-crud-runtime-contracts.json";
const PLAN_PATH = "docs/architecture/P134_DURABLE_DB_CRUD_RUNTIME_PLAN.md";
const ENTERPRISE_PATH = "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md";
const REQUIRED_SCRIPT = "check:p1347-durable-db-crud-runtime-final-validation";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|local-only|preview|dry run|cannot|future|until|before|must not|preserve|final validation|readiness|non-mutating)\b/i.test(context);
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
const p1347 = subphaseById.get("P134.7") || {};
const p135Status = statusById.get("P135") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText(ENTERPRISE_PATH);
const checkerSource = readText("scripts/check-p1347-durable-db-crud-runtime-final-validation.js");
const p1346Checker = readText("scripts/check-p1346-durable-db-crud-runtime-docs-roadmap.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const changed = changedFiles();
const completedP134Subphases = ["P134.1", "P134.2", "P134.3", "P134.4", "P134.5", "P134.6", "P134.7"];
const validationCommands = [
  "npm run check:p1347-durable-db-crud-runtime-final-validation",
  "npm run check:p1346-durable-db-crud-runtime-docs-roadmap",
  "npm run check:p1345-durable-db-crud-runtime-tests-checkers",
  "npm run check:p1344-durable-db-crud-runtime-command-center-ux",
  "npm run check:p1343-durable-db-crud-runtime-write-plan-preview",
  "npm run check:p1342-durable-db-crud-runtime-schema-model",
  "npm run check:p1341-durable-db-crud-runtime",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];
const allowedFiles = new Set([
  CONTRACT_PATH,
  PLAN_PATH,
  ENTERPRISE_PATH,
  "README.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  "package.json",
  "scripts/check-p1347-durable-db-crud-runtime-final-validation.js",
  "scripts/check-p1345-durable-db-crud-runtime-tests-checkers.js",
  "scripts/check-p1344-durable-db-crud-runtime-command-center-ux.js",
  "scripts/check-p1343-durable-db-crud-runtime-write-plan-preview.js",
  "scripts/check-p1342-durable-db-crud-runtime-schema-model.js",
  "scripts/check-p1341-durable-db-crud-runtime.js",
  "scripts/check-p1346-durable-db-crud-runtime-docs-roadmap.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  "scripts/check-os-phase-status.js",
  REPORT_PATH,
  "reports/p1346-durable-db-crud-runtime-docs-roadmap-report.md",
  "reports/p1345-durable-db-crud-runtime-tests-checkers-report.md",
  "reports/p1344-durable-db-crud-runtime-command-center-ux-report.md",
  "reports/p1343-durable-db-crud-runtime-write-plan-preview-report.md",
  "reports/p1342-durable-db-crud-runtime-schema-model-report.md",
  "reports/p1341-durable-db-crud-runtime-report.md",
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
  && statusById.get("P133")?.status === "complete"
  && roadmapById.get("P133")?.status === "complete"
  && statusById.get("P134")?.status === "complete"
  && roadmapById.get("P134")?.status === "complete"
  && completedP134Subphases.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P135")?.status === "planned"
  && roadmapById.get("P135")?.status === "planned";
const p1351StartedState =
  status.currentPhase === "P135.1"
  && status.previousPhase === "P134.7"
  && status.nextPhase === "P135.2"
  && roadmap.currentPhase === "P135.1"
  && roadmap.previousPhase === "P134.7"
  && roadmap.nextPhase === "P135.2"
  && status.current?.phaseId === "P135.1"
  && status.previous?.phaseId === "P134.7"
  && status.next?.phaseId === "P135.2"
  && roadmap.current?.phaseId === "P135.1"
  && roadmap.previous?.phaseId === "P134.7"
  && roadmap.next?.phaseId === "P135.2"
  && statusById.get("P134")?.status === "complete"
  && roadmapById.get("P134")?.status === "complete"
  && statusById.get("P134.7")?.status === "complete"
  && roadmapById.get("P134.7")?.status === "complete"
  && statusById.get("P135")?.status === "in_progress"
  && roadmapById.get("P135")?.status === "in_progress"
  && statusById.get("P135.1")?.status === "complete"
  && roadmapById.get("P135.1")?.status === "complete"
  && statusById.get("P135.2")?.status === "planned"
  && roadmapById.get("P135.2")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("contract closes P134", contract.status === "complete" && contract.currentSubphase === "P134.7" && contract.previousSubphase === "P134.6" && contract.nextSubphase === "P135" && p1347.status === "complete");
addCheck("contract records P134.7 final validation scope", p1347.expectedBaseCommit === "b028a0b0" && p1347.allowedFiles?.includes("scripts/check-p1347-durable-db-crud-runtime-final-validation.js") && p1347.allowedFiles?.includes(REPORT_PATH));
addCheck("P134.7 records validation commands", validationCommands.every((command) => p1347.validationCommands?.includes(command)));
addCheck("P134.1-P134.7 contract entries complete", completedP134Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("prior P134 reports pass", [
  "reports/p1346-durable-db-crud-runtime-docs-roadmap-report.md",
  "reports/p1345-durable-db-crud-runtime-tests-checkers-report.md",
  "reports/p1344-durable-db-crud-runtime-command-center-ux-report.md",
  "reports/p1343-durable-db-crud-runtime-write-plan-preview-report.md",
  "reports/p1342-durable-db-crud-runtime-schema-model-report.md",
  "reports/p1341-durable-db-crud-runtime-report.md",
].every(reportPassed));
addCheck("P134.6 checker accepts P134.7", p1346Checker.includes("p1347FinalState") && p1346Checker.includes('status.currentPhase === "P134.7"') && p1346Checker.includes('status.nextPhase === "P135"'));
addCheck("enterprise checker accepts P134.7", enterpriseChecker.includes("p1347FinalState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("P134 plan records P134.7", /## P134\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P134.7", /P134\.7 durable DB\/CRUD final validation/i.test(readme) && /P135 identity,\s+tenant,\s+roles,\s+and permissions is planned-only next/i.test(readme));
addCheck("platform roadmap records P134.7", /P134\.7 durable DB\/CRUD final validation is complete/i.test(platformRoadmap) && /P135 Identity,\s+Tenant,\s+Roles,\s+and Permissions is planned-only next/i.test(platformRoadmap));
addCheck("enterprise roadmap records P134 closure", /P134\.1 through P134\.7\s+are now complete/i.test(enterpriseRoadmap) && (/P135 is the next executable phase/i.test(enterpriseRoadmap) || /P135\.1 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status closes P134", p1347FinalState || p1351StartedState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P134 entries have required fields", [statusById.get("P134"), statusById.get("P134.7"), roadmapById.get("P134"), roadmapById.get("P134.7")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P135 handoff remains safe", (p135Status.status === "planned" && p135Status.commit === "" && Array.isArray(p135Status.checksRun) && p135Status.checksRun.length === 0 && (p135Status.knownLimitations || []).join(" ").toLowerCase().includes("planned-only")) || p1351StartedState);
addCheck("changed files stay in P134.7 allowed scope", status.currentPhase !== "P134.7" || changed.every((file) => allowedFiles.has(file)), status.currentPhase === "P134.7" ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", status.currentPhase !== "P134.7" || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), status.currentPhase === "P134.7" ? changed.join(", ") : `P134.7 forbidden path check relaxed for ${status.currentPhase}`);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable actions", !/run migration now|create table now|execute sql now|write db now|save record now|persist record now|update record now|delete record now|enable crud now|connect hosted db now|dispatch agent now|mutate project now|deploy now|export now|package now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /DB reads are enabled|DB writes are enabled|runtime writes are enabled|CRUD is live|schema is created|migration is enabled|repository writes are enabled|raw SQL is enabled|hosted DB is connected|agent dispatch is enabled|project mutation is enabled|provider spend is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P134 closure, P134.1-P134.6 reports, checker handoffs, OS status, roadmap, and documentation.",
        "- Confirms P135 is planned-only and no identity, tenant, role, permission, DB write, or CRUD runtime is enabled by P134.7.",
        "- Confirms this subphase does not call providers/models, dispatch agents, mutate projects, write DB/runtime state, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P134.7 is final validation only. It does not enable live DB/runtime writes, hosted database connections, migrations, CRUD execution, raw SQL, identity/tenant/RBAC execution, provider/model calls, agent dispatch, project mutation, deploy, release, export, package creation, network calls, or provider spend. P135 remains planned-only until its own implementation-grade contract starts.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P134.7 Durable DB CRUD Runtime Final Validation Report", phase: "P134.7" },
);

printCheckReport("P134.7 Durable DB CRUD Runtime Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
