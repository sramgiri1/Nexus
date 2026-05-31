import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBackupDrReadinessViewModel } from "../dashboard/src/data/backupDrReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1404-backup-recovery-dr-command-center-ux-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p140-backup-recovery-dr-retention-contracts.json";
const PLAN_PATH = "docs/architecture/P140_BACKUP_RECOVERY_DR_RETENTION_PLAN.md";
const REQUIRED_SCRIPT = "check:p1404-backup-recovery-dr-command-center-ux";
const EXPECTED_BASE_COMMIT = "acc5fda1";
const VALIDATION_COMMANDS = [
  "npm run check:p1404-backup-recovery-dr-command-center-ux",
  "npm run check:p1403-backup-recovery-dr-restore-preview",
  "npm run check:p1402-backup-recovery-dr-retention",
  "npm run check:p1401-backup-recovery-dr-retention",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|validation-only|display-only|zero-spend|closure)\b/i.test(context);
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
const p1404 = subphaseById.get("P140.4") || {};
const p1405 = subphaseById.get("P140.5") || {};
const p1406 = subphaseById.get("P140.6") || {};
const p1407 = subphaseById.get("P140.7") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1404-backup-recovery-dr-command-center-ux.js");
const dataSource = readText("dashboard/src/data/backupDrReadiness.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const readiness = buildBackupDrReadinessViewModel();
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P140.4";
const allowedFiles = new Set(p1404.allowedFiles || []);
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
const allowedDashboardFiles = new Set([
  "dashboard/src/data/backupDrReadiness.js",
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/src/data/commandCenterTabs.js",
  "dashboard/tests/routes.spec.js",
]);
const displayBundle = [
  readiness.pageTitle,
  readiness.whatChanged,
  readiness.currentState,
  readiness.nextAction,
  readiness.evidenceLocation,
  readiness.activityLocation,
  readiness.costImpact,
  readiness.readinessCards.map((card) => `${card.label} ${card.value} ${card.detail}`).join(" "),
  readiness.restorePreviewRows.map((row) => `${row.label} ${row.source} ${row.scope} ${row.approval} ${row.state} ${row.nextAction} ${row.blockedOperations.join(" ")}`).join(" "),
  readiness.restorePreviewSections.map((section) => `${section.label} ${section.nextAction}`).join(" "),
  readiness.disabledActions.map((action) => `${action.label} ${action.reason}`).join(" "),
].join("\n");
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const p1404CurrentState =
  status.currentPhase === "P140.4"
  && status.previousPhase === "P140.3"
  && status.nextPhase === "P140.5"
  && roadmap.currentPhase === "P140.4"
  && roadmap.previousPhase === "P140.3"
  && roadmap.nextPhase === "P140.5"
  && status.current?.phaseId === "P140.4"
  && status.previous?.phaseId === "P140.3"
  && status.next?.phaseId === "P140.5"
  && roadmap.current?.phaseId === "P140.4"
  && roadmap.previous?.phaseId === "P140.3"
  && roadmap.next?.phaseId === "P140.5"
  && statusById.get("P140")?.status === "in_progress"
  && roadmapById.get("P140")?.status === "in_progress"
  && statusById.get("P140.3")?.status === "complete"
  && roadmapById.get("P140.3")?.status === "complete"
  && statusById.get("P140.4")?.status === "complete"
  && roadmapById.get("P140.4")?.status === "complete"
  && statusById.get("P140.5")?.status === "planned"
  && roadmapById.get("P140.5")?.status === "planned";
const p1405CurrentState =
  status.currentPhase === "P140.5"
  && status.previousPhase === "P140.4"
  && status.nextPhase === "P140.6"
  && roadmap.currentPhase === "P140.5"
  && roadmap.previousPhase === "P140.4"
  && roadmap.nextPhase === "P140.6"
  && status.current?.phaseId === "P140.5"
  && status.previous?.phaseId === "P140.4"
  && status.next?.phaseId === "P140.6"
  && roadmap.current?.phaseId === "P140.5"
  && roadmap.previous?.phaseId === "P140.4"
  && roadmap.next?.phaseId === "P140.6"
  && statusById.get("P140")?.status === "in_progress"
  && roadmapById.get("P140")?.status === "in_progress"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P140.6")?.status === "planned"
  && roadmapById.get("P140.6")?.status === "planned";
const p1406CurrentState =
  status.currentPhase === "P140.6"
  && status.previousPhase === "P140.5"
  && status.nextPhase === "P140.7"
  && roadmap.currentPhase === "P140.6"
  && roadmap.previousPhase === "P140.5"
  && roadmap.nextPhase === "P140.7"
  && status.current?.phaseId === "P140.6"
  && status.previous?.phaseId === "P140.5"
  && status.next?.phaseId === "P140.7"
  && roadmap.current?.phaseId === "P140.6"
  && roadmap.previous?.phaseId === "P140.5"
  && roadmap.next?.phaseId === "P140.7"
  && statusById.get("P140")?.status === "in_progress"
  && roadmapById.get("P140")?.status === "in_progress"
  && ["P140.1", "P140.2", "P140.3", "P140.4", "P140.5", "P140.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P140.7")?.status === "planned"
  && roadmapById.get("P140.7")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1404-backup-recovery-dr-command-center-ux.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("Backup DR data reuses P140.3 restore preview", dataSource.includes("buildBackupRecoveryDrRestorePreview") && dataSource.includes("restorePreviewRows") && dataSource.includes("restorePreviewSections"));
addCheck("Backup DR tabs include Restore Preview", tabsSource.includes('id: "restore"') && tabsSource.includes('label: "Restore Preview"'));
addCheck("Command Center renders restore tab", /ariaLabel="Backup DR sections"[\s\S]*tabId="restore"[\s\S]*Restore Preview Summary/.test(pageSource) && pageSource.includes("Restore preview summary"));
addCheck("Playwright covers restore preview UX", routeTests.includes('commandTab(page, "Restore Preview")') && routeTests.includes("Restore Preview Summary") && routeTests.includes("restore-preview-row"));
addCheck("view model exposes useful restore preview data", readiness.restorePreviewRows.length >= 2 && readiness.restorePreviewSections.length >= 2 && readiness.restorePreviewSummary.runnableActionCount === 0);
addCheck("view model keeps actions disabled", readiness.disabledActions.some((action) => action.label === "Prune retention") && Object.values(readiness.safety || {}).every((value) => value === false));
addCheck("display bundle avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(displayBundle));
addCheck("display bundle avoids raw restore model IDs", !/restore-preview-row|restore-preview-plan|backup-record-\d+|P140\.|P75\./i.test(displayBundle));
addCheck("display bundle avoids raw dumps and storage URLs", !/raw JSON|raw logs?|raw policy|s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(backup|restore|storage|failover)/i.test(displayBundle));
addCheck("display bundle avoids fake runnable actions", !/backup now|create backup now|run backup now|restore now|execute restore now|failover now|delete backup now|prune now|write sqlite now|dispatch agent now|mutate project now|deploy now|release now|export now|package now|spend now/i.test(displayBundle));
addCheck("contract advances P140.4 safely", contract.phaseId === "P140" && contract.status === "in_progress" && ((contract.currentSubphase === "P140.4" && contract.previousSubphase === "P140.3" && contract.nextSubphase === "P140.5") || (contract.currentSubphase === "P140.5" && contract.previousSubphase === "P140.4" && contract.nextSubphase === "P140.6") || (contract.currentSubphase === "P140.6" && contract.previousSubphase === "P140.5" && contract.nextSubphase === "P140.7")));
addCheck("contract records expected base commit", p1404.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("P140.4 complete and P140.5 handoff known", p1404.status === "complete" && ((p1405.status === "planned" && p1404.nextPhase === "P140.5") || (p1405.status === "complete" && p1406.status === "planned" && p1405.nextPhase === "P140.6") || (p1405.status === "complete" && p1406.status === "complete" && p1407.status === "planned")));
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1404.validationCommands?.includes(command)));
addCheck("contract scope stays Backup DR UX only", p1404.allowedFiles?.includes("dashboard/src/data/backupDrReadiness.js") && p1404.allowedFiles?.includes("dashboard/tests/routes.spec.js") && p1404.forbiddenFiles?.includes("projects/**") && p1404.forbiddenFiles?.includes("db/**"));
addCheck("P140.3 report passes", reportPassed("reports/p1403-backup-recovery-dr-restore-preview-report.md"));
addCheck("enterprise checker accepts P140.4", enterpriseChecker.includes("p1404CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("P140.4 checker accepts P140.5 aggregate checker", checkerSource.includes("p1405CurrentState") && checkerSource.includes("check:p1405-backup-recovery-dr-tests-checkers"));
addCheck("OS checker recognizes P140.5 handoff", osStatusChecker.includes('"P140.5"') && osStatusChecker.includes('"P140.6"') && osStatusChecker.includes('"P140.7"'));
addCheck("P140 plan records P140.4", /## P140\.4 Recovery Command Center UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P140.4", /P140\.4 Backup \/ DR Command Center UX/i.test(readme));
addCheck("platform roadmap records P140.4", /P140\.4 Backup \/ DR Command Center UX is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P140.4", /P140\.4 is now complete/i.test(enterpriseRoadmap) && (/P140\.5 is the next executable subphase/i.test(enterpriseRoadmap) || (/P140\.5 is now complete/i.test(enterpriseRoadmap) && /P140\.6 is the next executable subphase/i.test(enterpriseRoadmap)) || (/P140\.5 is now complete/i.test(enterpriseRoadmap) && /P140\.6 is now complete/i.test(enterpriseRoadmap) && /P140\.7 is the next executable subphase/i.test(enterpriseRoadmap))));
addCheck("phase status keeps P140.4 complete", p1404CurrentState || p1405CurrentState || p1406CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P140.4 entries have required fields", [statusById.get("P140"), statusById.get("P140.4"), roadmapById.get("P140"), roadmapById.get("P140.4")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P140.5 handoff remains valid", (p1404CurrentState && statusById.get("P140.5")?.status === "planned" && roadmapById.get("P140.5")?.status === "planned" && !(statusById.get("P140.5")?.checksRun || []).length && !(roadmapById.get("P140.5")?.checksRun || []).length) || (p1405CurrentState && p1405.status === "complete" && p1406.status === "planned") || (p1406CurrentState && p1405.status === "complete" && p1406.status === "complete" && p1407.status === "planned"));
addCheck("changed files stay in P140.4 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", changed.every((file) => allowedDashboardFiles.has(file) || !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), changed.join(", "));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid raw storage URLs", !/s3:\/\/|gs:\/\/|az:\/\/|https:\/\/[^ \n]*(backup|restore|storage|failover|runbook)/i.test(docsBundle));
addCheck("docs avoid fake runnable actions", !/backup now|create backup now|run backup now|restore now|execute restore now|failover now|delete backup now|prune now|write sqlite now|dispatch agent now|mutate project now|deploy now|release now|export now|package now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /\b(backup creation is enabled|restore execution is enabled|failover is enabled|overwrite is enabled|delete is enabled|prune is enabled|DB writes are enabled|runtime writes are enabled|CRUD is live|provider calls are enabled|model calls are enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|spend is enabled)\b/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /\b(raw JSON|raw logs?|raw policy dumps?|raw backup payloads?|raw restore payloads?|raw storage locations?|raw registry dumps?)\b/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds P140.4 Backup / DR Command Center UX for the display-safe restore preview.",
        "- Reuses P140.3 restore preview output through the existing Backup / DR data model and Command Center tab shell.",
        "- Does not execute restores, perform failover, overwrite/delete/prune data, write DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "UX Summary",
      body: [
        `- Restore preview rows: ${readiness.restorePreviewRows.length}`,
        `- Restore preview sections: ${readiness.restorePreviewSections.length}`,
        `- Runnable actions: ${readiness.restorePreviewSummary.runnableActionCount}`,
        `- Disabled actions: ${readiness.disabledActions.length}`,
        `- Cost impact: ${readiness.costImpact}`,
      ].join("\n"),
    },
    {
      title: "Phase Status",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        p1406CurrentState ? "- P140.6 is complete; P140.7 remains planned-only." : p1405CurrentState ? "- P140.5 is complete; P140.6 remains planned-only." : "- P140.5 remains planned-only.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P140.4 is display-safe Command Center UX work only. It does not enable backup creation, restore execution, failover, overwrite, delete, prune, DB/runtime writes, live CRUD, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P140.4 Backup Recovery DR Command Center UX Report", phase: "P140.4" },
);

printCheckReport("P140.4 Backup Recovery DR Command Center UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
