import { readFileSync } from "node:fs";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { authGovernanceReadinessViewModel } from "../dashboard/src/data/authGovernanceReadiness.js";

const REPORT_PATH = "reports/command-center-auth-governance-ux-report.md";
const page = readFileSync("dashboard/src/pages/CommandCenterV2.jsx", "utf8");
const routes = readFileSync("dashboard/src/data/commandCenterRoutes.js", "utf8");
const tabs = readFileSync("dashboard/src/data/commandCenterTabs.js", "utf8");
const tests = readFileSync("dashboard/tests/routes.spec.js", "utf8");
const data = readFileSync("dashboard/src/data/authGovernanceReadiness.js", "utf8");
const packageJson = readFileSync("package.json", "utf8");
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const vm = authGovernanceReadinessViewModel;
const serialized = JSON.stringify(vm);
const combined = `${page}\n${routes}\n${tabs}\n${data}`;

addCheck("route registered", routes.includes('key: "authGovernance"') && routes.includes("/command-center/auth-governance"));
addCheck("tabs registered", tabs.includes("AUTH_GOVERNANCE_TABS") && tabs.includes("Disabled Actions"));
addCheck("page renderer registered", page.includes("function AuthGovernancePage") && page.includes("Auth Governance"));
addCheck("required UX fields present", ["What changed", "Current state", "Next action", "Owner", "Evidence", "Activity", "Cost impact"].every((label) => page.includes(label)));
addCheck("identity role workspace visible", ["Identity mode", "Role posture", "Workspace boundary"].every((label) => serialized.includes(label)));
addCheck("disabled reason visible", serialized.includes("Auth governance is display-only"));
addCheck("blockers visible", Array.isArray(vm.blockers) && vm.blockers.length >= 5);
addCheck("disabled actions visible", Array.isArray(vm.disabledActions) && vm.disabledActions.length >= 4);
addCheck("auth mutation disabled", vm.safety.loginAllowed === false && vm.safety.roleMutationAllowed === false && vm.safety.workspaceMutationAllowed === false && vm.safety.tenantMutationAllowed === false);
addCheck("DB/spend disabled", vm.safety.dbWritesAllowed === false && vm.safety.providerSpendAllowed === false);
addCheck("no fake runnable auth action", !/sign in now|log in now|assign role now|create workspace|invite user now|execute now/i.test(serialized));
addCheck("no raw private IDs tokens or auth URLs", !/(?:project|private|user|session|tenant|workspace)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/[^"]*auth/i.test(combined));
addCheck("no DemoApp leakage", !combined.includes("DEMOAPP ACTIVE") && !data.includes("DemoApp"));
addCheck("no internal phase label in primary UX data", !/P73\./.test(serialized));
addCheck("Playwright route test added", tests.includes('test("Auth Governance route renders readiness without runnable auth actions"'));
addCheck("package script registered", packageJson.includes('"check:p735-command-center-auth-governance-ux": "node scripts/check-p735-command-center-auth-governance-ux.js"'));

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P73.5 display-only Command Center auth governance UX.\n- Does not enable login, role assignment, identity provider calls, token exchange, user/session/tenant/workspace mutation, DB writes, project mutation, providers/tools/workers, network calls, deploy, release, export, package, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Command Center UX", body: "- Auth Governance route shows identity mode, role posture, workspace boundary, next action, blockers, disabled reason, owner capability, evidence/activity location, safety posture, and cost impact.\n- Primary UX avoids raw JSON, raw logs, raw policy dumps, raw tokens, raw user IDs, raw private IDs, DemoApp leakage, internal phase labels, and runnable auth actions." },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P73.5 Command Center Auth Governance UX Report", phase: "P73.5" },
);

printCheckReport("P73.5 Command Center Auth Governance UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
