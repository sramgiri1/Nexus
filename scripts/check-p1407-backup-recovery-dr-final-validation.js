import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1407-backup-recovery-dr-final-validation-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p140-backup-recovery-dr-retention-contracts.json";
const PLAN_PATH = "docs/architecture/P140_BACKUP_RECOVERY_DR_RETENTION_PLAN.md";
const REQUIRED_SCRIPT = "check:p1407-backup-recovery-dr-final-validation";
const EXPECTED_BASE_COMMIT = "2741f6cc";
const PRIOR_REPORTS = [
  "reports/p1401-backup-recovery-dr-retention-report.md",
  "reports/p1402-backup-recovery-dr-retention-report.md",
  "reports/p1403-backup-recovery-dr-restore-preview-report.md",
  "reports/p1404-backup-recovery-dr-command-center-ux-report.md",
  "reports/p1405-backup-recovery-dr-tests-checkers-report.md",
  "reports/p1406-backup-recovery-dr-docs-roadmap-report.md",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1407-backup-recovery-dr-final-validation",
  "npm run check:p1406-backup-recovery-dr-docs-roadmap",
  "npm run check:p1405-backup-recovery-dr-tests-checkers",
  "npm run check:p1404-backup-recovery-dr-command-center-ux",
  "npm run check:p1403-backup-recovery-dr-restore-preview",
  "npm run check:p1402-backup-recovery-dr-retention",
  "npm run check:p1401-backup-recovery-dr-retention",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P140.6\"",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Backup DR\"",
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
  return /## Result[\s\S]*PASS|Result:\s+PASS/i.test(readText(relativePath));
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
    if (/^\s*-\s+`[^`]+`\s*$/.test(line)) return false;
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|coverage|tests?|ux|closure|final validation)\b/i.test(context);
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
const p1407 = subphaseById.get("P140.7") || {};
const checkerSource = readText("scripts/check-p1407-backup-recovery-dr-final-validation.js");
const priorCheckers = [
  "scripts/check-p1401-backup-recovery-dr-retention.js",
  "scripts/check-p1402-backup-recovery-dr-retention.js",
  "scripts/check-p1403-backup-recovery-dr-restore-preview.js",
  "scripts/check-p1404-backup-recovery-dr-command-center-ux.js",
  "scripts/check-p1405-backup-recovery-dr-tests-checkers.js",
  "scripts/check-p1406-backup-recovery-dr-docs-roadmap.js",
].map(readText);
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P140.7";
const allowedFiles = new Set(p1407.allowedFiles || []);
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
const allowedRouteTestMaintenance = "dashboard/tests/routes.spec.js";
const forbiddenPathUnchanged = changed.every((file) => {
  if (file === allowedRouteTestMaintenance) return true;
  return !forbiddenPrefixes.some((prefix) => file.startsWith(prefix));
});
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const p1407FinalState =
  status.currentPhase === "P140.7"
  && status.previousPhase === "P140.6"
  && status.nextPhase === "P141"
  && roadmap.currentPhase === "P140.7"
  && roadmap.previousPhase === "P140.6"
  && roadmap.nextPhase === "P141"
  && status.current?.phaseId === "P140.7"
  && status.previous?.phaseId === "P140.6"
  && status.next?.phaseId === "P141"
  && roadmap.current?.phaseId === "P140.7"
  && roadmap.previous?.phaseId === "P140.6"
  && roadmap.next?.phaseId === "P141"
  && statusById.get("P140")?.status === "complete"
  && roadmapById.get("P140")?.status === "complete"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6", "P140.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P141")?.status === "planned"
  && roadmapById.get("P141")?.status === "planned";
const p1411StartedState =
  status.currentPhase === "P141.1"
  && status.previousPhase === "P140.7"
  && status.nextPhase === "P141.2"
  && roadmap.currentPhase === "P141.1"
  && roadmap.previousPhase === "P140.7"
  && roadmap.nextPhase === "P141.2"
  && status.current?.phaseId === "P141.1"
  && status.previous?.phaseId === "P140.7"
  && status.next?.phaseId === "P141.2"
  && roadmap.current?.phaseId === "P141.1"
  && roadmap.previous?.phaseId === "P140.7"
  && roadmap.next?.phaseId === "P141.2"
  && statusById.get("P140")?.status === "complete"
  && roadmapById.get("P140")?.status === "complete"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6", "P140.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P141")?.status === "in_progress"
  && roadmapById.get("P141")?.status === "in_progress"
  && statusById.get("P141.1")?.status === "complete"
  && roadmapById.get("P141.1")?.status === "complete"
  && statusById.get("P141.2")?.status === "planned"
  && roadmapById.get("P141.2")?.status === "planned";
const p1412CurrentState =
  status.currentPhase === "P141.2"
  && status.previousPhase === "P141.1"
  && status.nextPhase === "P141.3"
  && roadmap.currentPhase === "P141.2"
  && roadmap.previousPhase === "P141.1"
  && roadmap.nextPhase === "P141.3"
  && status.current?.phaseId === "P141.2"
  && status.previous?.phaseId === "P141.1"
  && status.next?.phaseId === "P141.3"
  && roadmap.current?.phaseId === "P141.2"
  && roadmap.previous?.phaseId === "P141.1"
  && roadmap.next?.phaseId === "P141.3"
  && statusById.get("P140")?.status === "complete"
  && roadmapById.get("P140")?.status === "complete"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6", "P140.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P141")?.status === "in_progress"
  && roadmapById.get("P141")?.status === "in_progress"
  && statusById.get("P141.1")?.status === "complete"
  && roadmapById.get("P141.1")?.status === "complete"
  && statusById.get("P141.2")?.status === "complete"
  && roadmapById.get("P141.2")?.status === "complete"
  && statusById.get("P141.3")?.status === "planned"
  && roadmapById.get("P141.3")?.status === "planned";
const p1413CurrentState =
  status.currentPhase === "P141.3"
  && status.previousPhase === "P141.2"
  && status.nextPhase === "P141.4"
  && roadmap.currentPhase === "P141.3"
  && roadmap.previousPhase === "P141.2"
  && roadmap.nextPhase === "P141.4"
  && status.current?.phaseId === "P141.3"
  && status.previous?.phaseId === "P141.2"
  && status.next?.phaseId === "P141.4"
  && roadmap.current?.phaseId === "P141.3"
  && roadmap.previous?.phaseId === "P141.2"
  && roadmap.next?.phaseId === "P141.4"
  && statusById.get("P140")?.status === "complete"
  && roadmapById.get("P140")?.status === "complete"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6", "P140.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P141")?.status === "in_progress"
  && roadmapById.get("P141")?.status === "in_progress"
  && statusById.get("P141.1")?.status === "complete"
  && roadmapById.get("P141.1")?.status === "complete"
  && statusById.get("P141.2")?.status === "complete"
  && roadmapById.get("P141.2")?.status === "complete"
  && statusById.get("P141.3")?.status === "complete"
  && roadmapById.get("P141.3")?.status === "complete"
  && statusById.get("P141.4")?.status === "planned"
  && roadmapById.get("P141.4")?.status === "planned";
const p1414CurrentState =
  status.currentPhase === "P141.4"
  && status.previousPhase === "P141.3"
  && status.nextPhase === "P141.5"
  && roadmap.currentPhase === "P141.4"
  && roadmap.previousPhase === "P141.3"
  && roadmap.nextPhase === "P141.5"
  && status.current?.phaseId === "P141.4"
  && status.previous?.phaseId === "P141.3"
  && status.next?.phaseId === "P141.5"
  && roadmap.current?.phaseId === "P141.4"
  && roadmap.previous?.phaseId === "P141.3"
  && roadmap.next?.phaseId === "P141.5"
  && statusById.get("P140")?.status === "complete"
  && roadmapById.get("P140")?.status === "complete"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6", "P140.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P141")?.status === "in_progress"
  && roadmapById.get("P141")?.status === "in_progress"
  && statusById.get("P141.1")?.status === "complete"
  && roadmapById.get("P141.1")?.status === "complete"
  && statusById.get("P141.2")?.status === "complete"
  && roadmapById.get("P141.2")?.status === "complete"
  && statusById.get("P141.3")?.status === "complete"
  && roadmapById.get("P141.3")?.status === "complete"
  && statusById.get("P141.4")?.status === "complete"
  && roadmapById.get("P141.4")?.status === "complete"
  && statusById.get("P141.5")?.status === "planned"
  && roadmapById.get("P141.5")?.status === "planned";
const p1415CurrentState =
  status.currentPhase === "P141.5"
  && status.previousPhase === "P141.4"
  && status.nextPhase === "P141.6"
  && roadmap.currentPhase === "P141.5"
  && roadmap.previousPhase === "P141.4"
  && roadmap.nextPhase === "P141.6"
  && status.current?.phaseId === "P141.5"
  && status.previous?.phaseId === "P141.4"
  && status.next?.phaseId === "P141.6"
  && roadmap.current?.phaseId === "P141.5"
  && roadmap.previous?.phaseId === "P141.4"
  && roadmap.next?.phaseId === "P141.6"
  && statusById.get("P140")?.status === "complete"
  && roadmapById.get("P140")?.status === "complete"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6", "P140.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P141")?.status === "in_progress"
  && roadmapById.get("P141")?.status === "in_progress"
  && ["P141.1", "P141.2", "P141.3", "P141.4", "P141.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P141.6")?.status === "planned"
  && roadmapById.get("P141.6")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1407-backup-recovery-dr-final-validation.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("P140.1-P140.7 package scripts registered", ["p1401-backup-recovery-dr-retention", "p1402-backup-recovery-dr-retention", "p1403-backup-recovery-dr-restore-preview", "p1404-backup-recovery-dr-command-center-ux", "p1405-backup-recovery-dr-tests-checkers", "p1406-backup-recovery-dr-docs-roadmap", "p1407-backup-recovery-dr-final-validation"].every((suffix) => Boolean(packageJson.scripts?.[`check:${suffix}`])));
addCheck("P140.1-P140.6 reports pass", PRIOR_REPORTS.every(reportPassed));
addCheck("prior P140 checkers accept P140.7", priorCheckers.every((source) => source.includes("p1407FinalState") && source.includes('status.currentPhase === "P140.7"')));
addCheck("enterprise checker accepts P140.7", enterpriseChecker.includes("p1407FinalState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P141 handoff", osStatusChecker.includes('"P141"'));
addCheck("contract closes P140.7", contract.phaseId === "P140" && contract.status === "complete" && contract.currentSubphase === "P140.7" && contract.previousSubphase === "P140.6" && contract.nextSubphase === "P141" && p1407.status === "complete");
addCheck("contract records expected base commit", p1407.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records final validation commands", VALIDATION_COMMANDS.every((command) => p1407.validationCommands?.includes(command)));
addCheck("contract scope stays final-validation-only", /Final validation only/i.test(p1407.dataShape || "") && p1407.expectedExports?.length === 0 && p1407.forbiddenFiles?.includes("dashboard/src/**") && p1407.forbiddenFiles?.includes("projects/**"));
addCheck("P140 plan records P140.7", /## P140\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan) && /P141 remains planned-only next/i.test(plan));
addCheck("README records P140.7", /P140\.7 final validation/i.test(readme) && /P141 is planned-only next/i.test(readme));
addCheck("platform roadmap records P140.7", /P140\.7 final validation is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P140.7", /P140\.7 is now complete/i.test(enterpriseRoadmap) && (/P141 is the next executable phase/i.test(enterpriseRoadmap) || /P141\.1 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status closes P140.7", p1407FinalState || p1411StartedState || p1412CurrentState || p1413CurrentState || p1414CurrentState || p1415CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P140.7 entries have required fields", [statusById.get("P140"), statusById.get("P140.7"), roadmapById.get("P140"), roadmapById.get("P140.7")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P141 handoff remains valid", (statusById.get("P141")?.status === "planned" && roadmapById.get("P141")?.status === "planned" && !(statusById.get("P141")?.checksRun || []).length && !(roadmapById.get("P141")?.checksRun || []).length) || p1411StartedState || p1412CurrentState || p1413CurrentState || p1414CurrentState || p1415CurrentState);
addCheck("changed files stay in P140.7 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || forbiddenPathUnchanged, enforceCurrentDiffScope ? changed.join(", ") : `P140.7 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("Backup DR Playwright coverage retained", routeTests.includes("Backup DR route renders readiness without runnable recovery actions") && routeTests.includes("P140.5 Backup DR aggregate coverage remains display-only") && routeTests.includes("P140.6 Backup DR docs status closure stays display-only"));
addCheck("route-wide safety coverage retained", ["Command Center route-wide UX", "DemoApp", "raw JSON", "private-project", "dispatch agent now", "Use system theme", "Use dark theme", "Use light theme"].every((text) => routeTests.includes(text)));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid raw storage URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(backup|restore|storage|failover|runbook)/i.test(docsBundle));
addCheck("docs avoid fake runnable actions", !/backup now|create backup now|run backup now|restore now|execute restore now|failover now|overwrite now|delete now|prune now|write sqlite now|call provider now|dispatch agent now|mutate project now|deploy now|release now|export now|package now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /\b(backup creation is enabled|restore execution is enabled|failover is enabled|overwrite is enabled|delete is enabled|prune is enabled|DB writes are enabled|runtime writes are enabled|provider calls are enabled|model calls are enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|spend is enabled)\b/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /\b(raw JSON|raw logs?|raw policy dumps?|raw backup payloads?|raw restore payloads?|raw storage locations?)\b/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Finalizes P140 with prior report verification, checker compatibility, docs/status closure, Backup / DR Playwright coverage, route-wide Command Center safety, and P141 handoff compatibility.",
        "- Confirms P140.1-P140.6 reports remain PASS and that prior P140 checkers accept the P140.7 final state.",
        "- Does not create backups, execute restores, perform failover, overwrite/delete/prune data, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Final Validation Summary",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next phase: ${status.nextPhase}`,
        `- Prior P140 reports passing: ${PRIOR_REPORTS.filter(reportPassed).length}/${PRIOR_REPORTS.length}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P140.7 is final validation only. It does not enable backup creation, restore execution, failover, overwrite, delete, prune, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. P141 may advance only through its own implementation-grade subphase contracts.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P140.7 Backup Recovery DR Final Validation Report", phase: "P140.7" },
);

printCheckReport("P140.7 Backup Recovery DR Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
