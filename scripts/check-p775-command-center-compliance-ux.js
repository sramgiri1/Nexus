import { readFileSync } from "node:fs";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { complianceReadinessViewModel } from "../dashboard/src/data/complianceReadiness.js";

const REPORT_PATH = "reports/command-center-compliance-ux-report.md";
const page = readFileSync("dashboard/src/pages/CommandCenterV2.jsx", "utf8");
const routes = readFileSync("dashboard/src/data/commandCenterRoutes.js", "utf8");
const tabs = readFileSync("dashboard/src/data/commandCenterTabs.js", "utf8");
const tests = readFileSync("dashboard/tests/routes.spec.js", "utf8");
const data = readFileSync("dashboard/src/data/complianceReadiness.js", "utf8");
const packageJson = readFileSync("package.json", "utf8");
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const vm = complianceReadinessViewModel;
const serialized = JSON.stringify(vm);
const combined = `${page}\n${routes}\n${tabs}\n${data}`;

addCheck("route registered", routes.includes('key: "compliance"') && routes.includes("/command-center/compliance"));
addCheck("tabs registered", tabs.includes("COMPLIANCE_TABS") && tabs.includes("Control Mapping"));
addCheck("page renderer registered", page.includes("function CompliancePage") && page.includes("buildComplianceReadinessViewModel"));
addCheck("required UX fields present", ["What changed", "Current state", "Next action", "Owner", "Evidence", "Activity", "Cost impact"].every((label) => page.includes(label)));
addCheck("compliance audit control visible", ["Compliance posture", "Audit posture", "Control mapping"].every((label) => serialized.includes(label)));
addCheck("disabled reason visible", serialized.includes("Compliance readiness is display-only"));
addCheck("blockers visible", Array.isArray(vm.blockers) && vm.blockers.length >= 6);
addCheck("control rows visible", Array.isArray(vm.controlRows) && vm.controlRows.length >= 4);
addCheck("disabled actions visible", Array.isArray(vm.disabledActions) && vm.disabledActions.length >= 4);
addCheck("certification attestation export package disabled", vm.safety.certificationAllowed === false && vm.safety.legalAttestationAllowed === false && vm.safety.auditExportAllowed === false && vm.safety.packageCreationAllowed === false);
addCheck("DB project provider tool worker disabled", vm.safety.dbWritesAllowed === false && vm.safety.projectMutationAllowed === false && vm.safety.providerDispatchAllowed === false && vm.safety.toolExecutionAllowed === false && vm.safety.workerExecutionAllowed === false);
addCheck("raw log network spend disabled", vm.safety.rawLogExportAllowed === false && vm.safety.networkCallsAllowed === false && vm.safety.providerSpendAllowed === false);
addCheck("no fake runnable compliance action", !/certify now|sign attestation|legal sign|export audit|download package|create package|execute now/i.test(serialized));
addCheck("no raw private IDs tokens URLs or dumps", !/(?:project|private|token|tenant|workspace|attestation|audit)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\/|raw JSON|raw log dump/i.test(data));
addCheck("no DemoApp leakage", !combined.includes("DEMOAPP ACTIVE") && !data.includes("DemoApp"));
addCheck("no internal phase label in primary UX data", !/P77\./.test(serialized));
addCheck("Playwright route test added", tests.includes('test("Compliance route renders readiness without runnable certification actions"'));
addCheck("Playwright theme coverage added", tests.includes('pickTheme(page, theme)') && tests.includes('["dark", "light", "system"]'));
addCheck("package script registered", packageJson.includes('"check:p775-command-center-compliance-ux": "node scripts/check-p775-command-center-compliance-ux.js"'));

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Scope", body: "- Validates P77.5 display-only Command Center Compliance readiness UX.\n- Does not enable certification, legal attestation, audit export, raw log export, package creation, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, auth/session/user/workspace mutation, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Command Center UX", body: "- Compliance route shows compliance posture, audit posture, control mapping posture, next action, blockers, disabled reason, owner capability, evidence/activity location, safety posture, and cost impact.\n- Primary UX avoids raw output dumps, raw logs, raw policy dumps, raw tokens, raw private IDs, DemoApp leakage, internal phase labels, and runnable certification, attestation, audit export, or package actions." },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P77.5 Command Center Compliance UX Report", phase: "P77.5" },
);

printCheckReport("P77.5 Command Center Compliance UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
