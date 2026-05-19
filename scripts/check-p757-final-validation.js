import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { backupDrReadinessViewModel } from "../dashboard/src/data/backupDrReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p757-final-validation-report.md";

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
const statusChecker = readText("scripts/check-os-phase-status.js");
const runtimeSources = [
  "backup-dr/p75-2-placeholder.js",
  "backup-dr/p75-3-placeholder.js",
  "backup-dr/p75-4-placeholder.js",
  "dashboard/src/data/backupDrReadiness.js",
].map(readText).join("\n");

const requiredScripts = [
  "check:p75-execution-plan",
  "check:p752",
  "check:p753",
  "check:p754",
  "check:p755-command-center-backup-dr-ux",
  "check:p756-tests-checkers-docs",
  "check:p757-final-validation",
];

const requiredReports = [
  "reports/p75-execution-plan-report.md",
  "reports/p752-report.md",
  "reports/p753-report.md",
  "reports/p754-report.md",
  "reports/command-center-backup-dr-ux-report.md",
  "reports/p756-tests-checkers-docs-report.md",
];

const completedPhaseIds = ["P75", "P75.1", "P75.2", "P75.3", "P75.4", "P75.5", "P75.6", "P75.7"];
const priorCompletedPhaseIds = ["P75.1", "P75.2", "P75.3", "P75.4", "P75.5", "P75.6"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const serializedReadiness = JSON.stringify(backupDrReadinessViewModel);

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("P75 phases complete in roadmap", completedPhaseIds.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("P75 phases complete in phase status", completedPhaseIds.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("prior completed P75 entries have commits", priorCompletedPhaseIds.every((phaseId) => Boolean(statusById.get(phaseId)?.commit) && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("final P75 entries are stampable", ["P75", "P75.7"].every((phaseId) => Boolean(statusById.get(phaseId)?.commit)));
addCheck("handoff to P76", status.currentPhase === "P76" && status.previousPhase === "P75" && status.nextPhase === "P76", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P76 remains next planned phase", phaseById.get("P76")?.status !== "complete" && statusById.get("P76")?.status === "planned");
addCheck("status checker accepts P75 through P78", ["\"P75\"", "\"P76\"", "\"P77\"", "\"P78\""].every((token) => statusChecker.includes(token)));
addCheck("docs close P75", docs.includes("Status: complete") && /P75\s+is complete/.test(docs));
addCheck("Command Center route preserved", routeSource.includes('key: "backupDr"') && routeSource.includes("/command-center/backup-dr"));
addCheck("Command Center tabs preserved", tabsSource.includes("BACKUP_DR_TABS") && tabsSource.includes("Disabled Actions"));
addCheck("Command Center renderer preserved", pageSource.includes("BackupDrPage") && pageSource.includes("buildBackupDrReadinessViewModel"));
addCheck("Command Center test preserved", routeTests.includes("Backup DR route renders readiness without runnable recovery actions"));
addCheck("Command Center theme coverage preserved", routeTests.includes('["dark", "light", "system"]') && routeTests.includes("pickTheme(page, theme)"));
addCheck("Backup DR UX omits DemoApp/private ids/tokens", !serializedReadiness.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|runbook)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedReadiness) && !/Bearer\s+|jwt|id_token|access_token/i.test(serializedReadiness));
addCheck("Backup DR UX omits phase labels", !serializedReadiness.includes("P75"));
addCheck("backup restore failover disabled", !runtimeSources.includes("backupCreationAllowed: true") && !runtimeSources.includes("restoreExecutionAllowed: true") && !runtimeSources.includes("failoverAllowed: true"));
addCheck("overwrite and delete disabled", !runtimeSources.includes("overwriteAllowed: true") && !runtimeSources.includes("deleteAllowed: true"));
addCheck("DB and project mutation disabled", !runtimeSources.includes("dbWritesAllowed: true") && !runtimeSources.includes("projectMutationAllowed: true"));
addCheck("provider/tool/worker disabled", !runtimeSources.includes("providerDispatchAllowed: true") && !runtimeSources.includes("toolExecutionAllowed: true") && !runtimeSources.includes("workerExecutionAllowed: true"));
addCheck("network/spend disabled", !runtimeSources.includes("networkCallsAllowed: true") && !runtimeSources.includes("providerSpendAllowed: true"));
addCheck("deploy/release/export/package/auth disabled", !runtimeSources.includes("deployExecutionAllowed: true") && !runtimeSources.includes("releaseExecutionAllowed: true") && !runtimeSources.includes("exportExecutionAllowed: true") && !runtimeSources.includes("packageCreationAllowed: true") && !runtimeSources.includes("authMutationAllowed: true"));
addCheck("Backup DR and project paths remain forbidden", runtimeSources.includes("projects/**") && runtimeSources.includes("db/**") && runtimeSources.includes("providers/**") && runtimeSources.includes("tools/**"));
addCheck("final report path is distinct", REPORT_PATH.endsWith("p757-final-validation-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P75 Backup, Restore, Disaster Recovery for NEXUS OS.",
        "- Validates completed subphases, Command Center Backup/DR UX, dashboard validation, reports, docs, roadmap, phase status, and P76 handoff.",
        "- Does not enable backup creation, restore execution, failover, overwrite, delete, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, package, auth mutation, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p757-final-validation",
        "- npm run check:p756-tests-checkers-docs",
        "- npm run check:p755-command-center-backup-dr-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Backup DR route\"",
        "- cd dashboard && npm run test:unit",
        "- cd dashboard && npm run build",
        "- npm run check:p75-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P75 closes Backup/DR readiness only.",
        "- Backup creation, restore execution, failover, overwrite, delete, DB writes, project mutation, provider/tool/worker execution, network calls, deploy/release/export execution, package creation, auth mutation, and provider spend remain disabled.",
        "- P76 is the tenant and project isolation handoff and does not enable runtime mutation by itself.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P75.7 Final Validation Report", phase: "P75.7" },
);

printCheckReport("P75.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
