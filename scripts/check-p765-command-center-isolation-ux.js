import { readFileSync } from "node:fs";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { isolationReadinessViewModel } from "../dashboard/src/data/isolationReadiness.js";

const REPORT_PATH = "reports/command-center-isolation-ux-report.md";
const page = readFileSync("dashboard/src/pages/CommandCenterV2.jsx", "utf8");
const routes = readFileSync("dashboard/src/data/commandCenterRoutes.js", "utf8");
const tabs = readFileSync("dashboard/src/data/commandCenterTabs.js", "utf8");
const tests = readFileSync("dashboard/tests/routes.spec.js", "utf8");
const data = readFileSync("dashboard/src/data/isolationReadiness.js", "utf8");
const packageJson = readFileSync("package.json", "utf8");
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const vm = isolationReadinessViewModel;
const serialized = JSON.stringify(vm);
const combined = `${page}\n${routes}\n${tabs}\n${data}`;

addCheck("route registered", routes.includes('key: "isolation"') && routes.includes("/command-center/isolation"));
addCheck("tabs registered", tabs.includes("ISOLATION_TABS") && tabs.includes("Access Context"));
addCheck("page renderer registered", page.includes("function IsolationPage") && page.includes("buildIsolationReadinessViewModel"));
addCheck("required UX fields present", ["What changed", "Current state", "Next action", "Owner", "Evidence", "Activity", "Cost impact"].every((label) => page.includes(label)));
addCheck("tenant project access visible", ["Tenant posture", "Project isolation", "Access context"].every((label) => serialized.includes(label)));
addCheck("disabled reason visible", serialized.includes("Isolation readiness is display-only"));
addCheck("blockers visible", Array.isArray(vm.blockers) && vm.blockers.length >= 6);
addCheck("access rows visible", Array.isArray(vm.accessRows) && vm.accessRows.length >= 4);
addCheck("disabled actions visible", Array.isArray(vm.disabledActions) && vm.disabledActions.length >= 4);
addCheck("tenant project access disabled", vm.safety.tenantMutationAllowed === false && vm.safety.projectMutationAllowed === false && vm.safety.accessGrantAllowed === false);
addCheck("role permission membership disabled", vm.safety.roleMutationAllowed === false && vm.safety.permissionMutationAllowed === false && vm.safety.membershipMutationAllowed === false);
addCheck("cross-project DB network spend disabled", vm.safety.crossProjectAccessAllowed === false && vm.safety.dbWritesAllowed === false && vm.safety.networkCallsAllowed === false && vm.safety.providerSpendAllowed === false);
addCheck("no fake runnable isolation action", !/create tenant|update tenant|delete tenant|create project|update project|delete project|grant access|assign role|change permission|execute now/i.test(serialized));
addCheck("no raw private IDs tokens or URLs", !/(?:project|private|token|tenant|workspace|access)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\//i.test(combined));
addCheck("no DemoApp leakage", !combined.includes("DEMOAPP ACTIVE") && !data.includes("DemoApp"));
addCheck("no internal phase label in primary UX data", !/P76\./.test(serialized));
addCheck("Playwright route test added", tests.includes('test("Isolation route renders readiness without runnable access actions"'));
addCheck("Playwright theme coverage added", tests.includes('pickTheme(page, theme)') && tests.includes('["dark", "light", "system"]'));
addCheck("package script registered", packageJson.includes('"check:p765-command-center-isolation-ux": "node scripts/check-p765-command-center-isolation-ux.js"'));

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P76.5 display-only Command Center Isolation readiness UX.\n- Does not enable tenant mutation, project mutation, access grants, role mutation, permission mutation, DB writes, provider/tool/worker execution, network calls, deploy, release, export, package, auth/session/user/workspace mutation, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Command Center UX", body: "- Isolation route shows tenant posture, project isolation posture, access context posture, next action, blockers, disabled reason, owner capability, evidence/activity location, safety posture, and cost impact.\n- Primary UX avoids raw JSON, raw logs, raw policy dumps, raw tokens, raw private IDs, DemoApp leakage, internal phase labels, and runnable tenant, project, or access actions." },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P76.5 Command Center Isolation UX Report", phase: "P76.5" },
);

printCheckReport("P76.5 Command Center Isolation UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
