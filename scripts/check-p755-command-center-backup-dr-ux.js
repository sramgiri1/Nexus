import { readFileSync } from "node:fs";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { backupDrReadinessViewModel } from "../dashboard/src/data/backupDrReadiness.js";

const REPORT_PATH = "reports/command-center-backup-dr-ux-report.md";
const page = readFileSync("dashboard/src/pages/CommandCenterV2.jsx", "utf8");
const routes = readFileSync("dashboard/src/data/commandCenterRoutes.js", "utf8");
const tabs = readFileSync("dashboard/src/data/commandCenterTabs.js", "utf8");
const tests = readFileSync("dashboard/tests/routes.spec.js", "utf8");
const data = readFileSync("dashboard/src/data/backupDrReadiness.js", "utf8");
const packageJson = readFileSync("package.json", "utf8");
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const vm = backupDrReadinessViewModel;
const serialized = JSON.stringify(vm);
const combined = `${page}\n${routes}\n${tabs}\n${data}`;

addCheck("route registered", routes.includes('key: "backupDr"') && routes.includes("/command-center/backup-dr"));
addCheck("tabs registered", tabs.includes("BACKUP_DR_TABS") && tabs.includes("Disabled Actions"));
addCheck("page renderer registered", page.includes("function BackupDrPage") && page.includes("buildBackupDrReadinessViewModel"));
addCheck("required UX fields present", ["What changed", "Current state", "Next action", "Owner", "Evidence", "Activity", "Cost impact"].every((label) => page.includes(label)));
addCheck("backup restore DR visible", ["Backup posture", "Restore posture", "DR posture"].every((label) => serialized.includes(label)));
addCheck("disabled reason visible", serialized.includes("Backup/DR readiness is display-only"));
addCheck("blockers visible", Array.isArray(vm.blockers) && vm.blockers.length >= 6);
addCheck("runbook rows visible", Array.isArray(vm.runbookRows) && vm.runbookRows.length >= 3);
addCheck("disabled actions visible", Array.isArray(vm.disabledActions) && vm.disabledActions.length >= 4);
addCheck("backup restore failover disabled", vm.safety.backupCreationAllowed === false && vm.safety.restoreExecutionAllowed === false && vm.safety.failoverAllowed === false);
addCheck("overwrite delete DB disabled", vm.safety.overwriteAllowed === false && vm.safety.deleteAllowed === false && vm.safety.dbWritesAllowed === false);
addCheck("network spend disabled", vm.safety.networkCallsAllowed === false && vm.safety.providerSpendAllowed === false);
addCheck("no fake runnable Backup DR action", !/backup now|create backup|restore now|execute restore|failover now|overwrite now|delete now|execute now/i.test(serialized));
addCheck("no raw private IDs tokens or storage URLs", !/(?:project|private|token|tenant|workspace|runbook)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|s3:\/\/|gs:\/\/|https:\/\/[^"]*(backup|restore|storage|failover|runbook)/i.test(combined));
addCheck("no DemoApp leakage", !combined.includes("DEMOAPP ACTIVE") && !data.includes("DemoApp"));
addCheck("no internal phase label in primary UX data", !/P75\./.test(serialized));
addCheck("Playwright route test added", tests.includes('test("Backup DR route renders readiness without runnable recovery actions"'));
addCheck("Playwright theme coverage added", tests.includes('pickTheme(page, theme)') && tests.includes('["dark", "light", "system"]'));
addCheck("package script registered", packageJson.includes('"check:p755-command-center-backup-dr-ux": "node scripts/check-p755-command-center-backup-dr-ux.js"'));

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P75.5 display-only Command Center Backup/DR readiness UX.\n- Does not enable backup creation, restore execution, failover, overwrite, delete, DB writes, project mutation, providers/tools/workers, network calls, deploy, release, export, package, auth mutation, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Command Center UX", body: "- Backup/DR route shows backup posture, restore posture, DR posture, next action, blockers, disabled reason, owner capability, evidence/activity location, safety posture, and cost impact.\n- Primary UX avoids raw JSON, raw logs, raw policy dumps, raw tokens, raw private IDs, DemoApp leakage, internal phase labels, and runnable backup, restore, failover, overwrite, or delete actions." },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P75.5 Command Center Backup DR UX Report", phase: "P75.5" },
);

printCheckReport("P75.5 Command Center Backup DR UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
