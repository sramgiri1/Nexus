import { readFileSync } from "node:fs";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { observabilityReadinessViewModel } from "../dashboard/src/data/observabilityReadiness.js";

const REPORT_PATH = "reports/command-center-observability-ux-report.md";
const page = readFileSync("dashboard/src/pages/CommandCenterV2.jsx", "utf8");
const routes = readFileSync("dashboard/src/data/commandCenterRoutes.js", "utf8");
const tabs = readFileSync("dashboard/src/data/commandCenterTabs.js", "utf8");
const tests = readFileSync("dashboard/tests/routes.spec.js", "utf8");
const data = readFileSync("dashboard/src/data/observabilityReadiness.js", "utf8");
const packageJson = readFileSync("package.json", "utf8");
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const vm = observabilityReadinessViewModel;
const serialized = JSON.stringify(vm);
const combined = `${page}\n${routes}\n${tabs}\n${data}`;

addCheck("route registered", routes.includes('key: "observability"') && routes.includes("/command-center/observability"));
addCheck("tabs registered", tabs.includes("OBSERVABILITY_TABS") && tabs.includes("Disabled Actions"));
addCheck("page renderer registered", page.includes("function ObservabilityPage") && page.includes("buildObservabilityReadinessViewModel"));
addCheck("required UX fields present", ["What changed", "Current state", "Next action", "Owner", "Evidence", "Activity", "Cost impact"].every((label) => page.includes(label)));
addCheck("telemetry SLO health visible", ["Telemetry posture", "SLO posture", "Health state"].every((label) => serialized.includes(label)));
addCheck("disabled reason visible", serialized.includes("Observability readiness is display-only"));
addCheck("blockers visible", Array.isArray(vm.blockers) && vm.blockers.length >= 5);
addCheck("snapshot rows visible", Array.isArray(vm.snapshotRows) && vm.snapshotRows.length >= 3);
addCheck("disabled actions visible", Array.isArray(vm.disabledActions) && vm.disabledActions.length >= 4);
addCheck("observability automation disabled", vm.safety.telemetryExportAllowed === false && vm.safety.sloEnforcementAllowed === false && vm.safety.pagingAllowed === false && vm.safety.remediationAllowed === false);
addCheck("DB/network/spend disabled", vm.safety.dbWritesAllowed === false && vm.safety.networkCallsAllowed === false && vm.safety.providerSpendAllowed === false);
addCheck("no fake runnable observability action", !/export now|stream logs|send telemetry|enforce now|page now|remediate now|execute now/i.test(serialized));
addCheck("no raw private IDs tokens or telemetry URLs", !/(?:project|private|token|tenant|workspace|incident)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/[^"]*(telemetry|metrics|logs|pager)/i.test(combined));
addCheck("no DemoApp leakage", !combined.includes("DEMOAPP ACTIVE") && !data.includes("DemoApp"));
addCheck("no internal phase label in primary UX data", !/P74\./.test(serialized));
addCheck("Playwright route test added", tests.includes('test("Observability route renders readiness without runnable telemetry actions"'));
addCheck("Playwright theme coverage added", tests.includes('pickTheme(page, theme)') && tests.includes('["dark", "light", "system"]'));
addCheck("package script registered", packageJson.includes('"check:p745-command-center-observability-ux": "node scripts/check-p745-command-center-observability-ux.js"'));

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P74.5 display-only Command Center observability readiness UX.\n- Does not enable telemetry export, raw log exposure, SLO enforcement, paging, remediation, DB writes, project mutation, providers/tools/workers, network calls, deploy, release, export, package, auth mutation, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Command Center UX", body: "- Observability route shows telemetry posture, SLO posture, health state, next action, blockers, disabled reason, owner capability, evidence/activity location, safety posture, and cost impact.\n- Primary UX avoids raw JSON, raw logs, raw policy dumps, raw tokens, raw private IDs, DemoApp leakage, internal phase labels, and runnable telemetry, SLO, paging, or remediation actions." },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P74.5 Command Center Observability UX Report", phase: "P74.5" },
);

printCheckReport("P74.5 Command Center Observability UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
