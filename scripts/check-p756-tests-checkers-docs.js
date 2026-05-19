import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { backupDrReadinessViewModel } from "../dashboard/src/data/backupDrReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p756-tests-checkers-docs-report.md";

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
const phases = readJson("os-roadmap/nexus-phases.json").phases || [];
const status = readJson("os-roadmap/phase-status.json");
const entries = status.phases || [];
const docs = readText("docs/architecture/P75_BACKUP_RESTORE_DR_PLAN.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeSource = readText("dashboard/src/data/commandCenterRoutes.js");
const uxReport = readText("reports/command-center-backup-dr-ux-report.md");
const runtimeSources = [
  "backup-dr/p75-2-placeholder.js",
  "backup-dr/p75-3-placeholder.js",
  "backup-dr/p75-4-placeholder.js",
  "dashboard/src/data/backupDrReadiness.js",
].map(readText).join("\n");
const serializedUx = JSON.stringify(backupDrReadinessViewModel);

const requiredScripts = [
  "check:p75-execution-plan",
  "check:p752",
  "check:p753",
  "check:p754",
  "check:p755-command-center-backup-dr-ux",
  "check:p756-tests-checkers-docs",
];

const requiredCheckerFiles = [
  "scripts/check-p75-execution-plan.js",
  "scripts/check-p752.js",
  "scripts/check-p753.js",
  "scripts/check-p754.js",
  "scripts/check-p755-command-center-backup-dr-ux.js",
  "scripts/check-p756-tests-checkers-docs.js",
];

const requiredReports = [
  "reports/p75-execution-plan-report.md",
  "reports/p752-report.md",
  "reports/p753-report.md",
  "reports/p754-report.md",
  "reports/command-center-backup-dr-ux-report.md",
];

const completedSubphases = ["P75.1", "P75.2", "P75.3", "P75.4", "P75.5", "P75.6"];
const statusCommitSubphases = ["P75.1", "P75.2", "P75.3", "P75.4", "P75.5"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const preFinalHandoff = status.currentPhase === "P75" && status.nextPhase === "P75.7" && phaseById.get("P75")?.nextPhase === "P75.7";
const finalHandoff = status.currentPhase === "P76" && status.previousPhase === "P75" && status.nextPhase === "P76" && statusById.get("P75.7")?.status === "complete";

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("checker files exist", requiredCheckerFiles.every(fileExists));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("docs cover subphases", completedSubphases.every((phaseId) => docs.includes(`### ${phaseId}`) && docs.includes("Status: complete")), completedSubphases.join(", "));
addCheck("roadmap statuses complete", completedSubphases.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("phase status entries complete", completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("P75 handoff is valid", preFinalHandoff || finalHandoff, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P75.7 remains planned or complete", ["planned", "complete"].includes(phaseById.get("P75.7")?.status) && ["planned", "complete"].includes(statusById.get("P75.7")?.status));
addCheck("completed status commits stamped", statusCommitSubphases.every((phaseId) => statusById.get(phaseId)?.commit && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("Command Center route registered", routeSource.includes('key: "backupDr"') && routeSource.includes("/command-center/backup-dr"));
addCheck("Command Center tabs registered", tabsSource.includes("BACKUP_DR_TABS") && tabsSource.includes("Disabled Actions"));
addCheck("Command Center renderer registered", pageSource.includes("BackupDrPage") && pageSource.includes("buildBackupDrReadinessViewModel"));
addCheck("Command Center test registered", routeTests.includes("Backup DR route renders readiness without runnable recovery actions"));
addCheck("Command Center themes covered", routeTests.includes('["dark", "light", "system"]') && routeTests.includes("pickTheme(page, theme)"));
addCheck("Backup DR UX hides phase labels", !serializedUx.includes("P75"));
addCheck("Backup DR UX hides DemoApp/private ids/tokens", !serializedUx.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|runbook)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedUx) && !/Bearer\s+|jwt|id_token|access_token/i.test(serializedUx));
addCheck("backup restore failover disabled", !runtimeSources.includes("backupCreationAllowed: true") && !runtimeSources.includes("restoreExecutionAllowed: true") && !runtimeSources.includes("failoverAllowed: true"));
addCheck("overwrite delete disabled", !runtimeSources.includes("overwriteAllowed: true") && !runtimeSources.includes("deleteAllowed: true"));
addCheck("DB/project mutation disabled", !runtimeSources.includes("dbWritesAllowed: true") && !runtimeSources.includes("projectMutationAllowed: true"));
addCheck("provider/tool/worker disabled", !runtimeSources.includes("providerDispatchAllowed: true") && !runtimeSources.includes("toolExecutionAllowed: true") && !runtimeSources.includes("workerExecutionAllowed: true"));
addCheck("network/spend disabled", !runtimeSources.includes("networkCallsAllowed: true") && !runtimeSources.includes("providerSpendAllowed: true"));
addCheck("deploy/release/export/package/auth disabled", !runtimeSources.includes("deployExecutionAllowed: true") && !runtimeSources.includes("releaseExecutionAllowed: true") && !runtimeSources.includes("exportExecutionAllowed: true") && !runtimeSources.includes("packageCreationAllowed: true") && !runtimeSources.includes("authMutationAllowed: true"));
addCheck("forbidden paths remain visible", runtimeSources.includes("projects/**") && runtimeSources.includes("db/**") && runtimeSources.includes("providers/**") && runtimeSources.includes("tools/**"));
addCheck("docs state disabled posture", /backup[\s\S]+remain disabled/i.test(docs) && /restore execution[\s\S]+disabled/i.test(docs) && /failover[\s\S]+disabled/i.test(docs));
addCheck("reports mention PASS", requiredReports.every((file) => readText(file).includes("PASS")) && uxReport.includes("Command Center Backup DR UX Report"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    { title: "Scope", body: "- Validates P75 tests, checkers, docs, reports, roadmap, phase status, and Command Center Backup/DR coverage.\n- Does not enable backup creation, restore execution, failover, overwrite, delete, DB writes, project mutation, providers/tools/workers, network calls, deploy, release, export, package, auth mutation, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P75.6 Tests Checkers Docs Report", phase: "P75.6" },
);

printCheckReport("P75.6 Tests Checkers Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
