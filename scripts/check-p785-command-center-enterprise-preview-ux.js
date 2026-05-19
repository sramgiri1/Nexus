import { readFileSync } from "node:fs";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { enterprisePreviewReadinessViewModel } from "../dashboard/src/data/enterprisePreviewReadiness.js";

const REPORT_PATH = "reports/command-center-enterprise-preview-ux-report.md";
const page = readFileSync("dashboard/src/pages/CommandCenterV2.jsx", "utf8");
const routes = readFileSync("dashboard/src/data/commandCenterRoutes.js", "utf8");
const tabs = readFileSync("dashboard/src/data/commandCenterTabs.js", "utf8");
const tests = readFileSync("dashboard/tests/routes.spec.js", "utf8");
const data = readFileSync("dashboard/src/data/enterprisePreviewReadiness.js", "utf8");
const packageJson = readFileSync("package.json", "utf8");
const checks = [];

function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const vm = enterprisePreviewReadinessViewModel;
const serialized = JSON.stringify(vm);
const combined = `${page}\n${routes}\n${tabs}\n${data}`;

addCheck("route registered", routes.includes('key: "enterprisePreview"') && routes.includes("/command-center/enterprise-preview"));
addCheck("tabs registered", tabs.includes("ENTERPRISE_PREVIEW_TABS") && tabs.includes("PRD Preview") && tabs.includes("Agent Workplan"));
addCheck("page renderer registered", page.includes("function EnterprisePreviewPage") && page.includes("buildEnterprisePreviewReadinessViewModel"));
addCheck("required UX fields present", ["What changed", "Current state", "Next action", "Owner", "Evidence", "Activity", "Cost impact"].every((label) => page.includes(label)));
addCheck("founder PRD agent healing visible", ["Founder intake", "Q&A readiness", "PRD preview", "Agent workplan", "Self-healing"].every((label) => serialized.includes(label)));
addCheck("disabled reason visible", serialized.includes("Enterprise Preview is display-only"));
addCheck("blockers visible", Array.isArray(vm.blockers) && vm.blockers.length >= 6);
addCheck("founder rows visible", Array.isArray(vm.founderRows) && vm.founderRows.length >= 4);
addCheck("founder to business path visible", Array.isArray(vm.journeyRows) && vm.journeyRows.length >= 6 && serialized.includes("Business build"));
addCheck("PRD rows visible", Array.isArray(vm.prdRows) && vm.prdRows.length >= 5);
addCheck("workplan gates healing visible", vm.workplanRows.length >= 4 && vm.validationRows.length >= 4 && vm.healingRows.length >= 3);
addCheck("disabled actions visible", Array.isArray(vm.disabledActions) && vm.disabledActions.length >= 5);
addCheck("founder PRD agent healing disabled", vm.safety.founderIntakeExecutionAllowed === false && vm.safety.autonomousQnaAllowed === false && vm.safety.prdGenerationAllowed === false && vm.safety.agentDispatchAllowed === false && vm.safety.selfHealingApplyAllowed === false);
addCheck("project DB provider tool worker disabled", vm.safety.projectMutationAllowed === false && vm.safety.dbWritesAllowed === false && vm.safety.providerDispatchAllowed === false && vm.safety.toolExecutionAllowed === false && vm.safety.workerExecutionAllowed === false);
addCheck("network deploy release export package spend disabled", vm.safety.networkCallsAllowed === false && vm.safety.deployExecutionAllowed === false && vm.safety.releaseExecutionAllowed === false && vm.safety.exportExecutionAllowed === false && vm.safety.packageCreationAllowed === false && vm.safety.providerSpendAllowed === false);
addCheck("no fake runnable founder action", !/ask founder now|generate prd now|write project now|dispatch agents now|run agents now|apply healing now|execute tools now|start workers now|create project now|execute now/i.test(serialized));
addCheck("no raw private IDs tokens URLs or dumps", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized) && !/Bearer\s+|jwt|id_token|access_token|https:\/\/|postgres(?:ql)?:\/\/|raw JSON|raw log dump/i.test(data));
addCheck("no DemoApp leakage", !combined.includes("DEMOAPP ACTIVE") && !data.includes("DemoApp"));
addCheck("no internal phase label in primary UX data", !/P78\./.test(serialized));
addCheck("Playwright route test added", tests.includes('test("Enterprise Preview route renders readiness without runnable founder actions"'));
addCheck("Playwright theme coverage added", tests.includes('pickTheme(page, theme)') && tests.includes('["dark", "light", "system"]'));
addCheck("package script registered", packageJson.includes('"check:p785-command-center-enterprise-preview-ux": "node scripts/check-p785-command-center-enterprise-preview-ux.js"'));

const failed = checks.filter((check) => check.status === "FAIL");
writeMarkdownReport(
  REPORT_PATH,
  [
    {
      title: "Scope",
      body:
        "- Validates P78.5 display-only Command Center Enterprise Preview UX.\n" +
        "- Does not enable founder Q&A automation, PRD generation, agent dispatch, self-healing apply, project mutation, DB writes, provider/tool/worker execution, network calls, deploy, release, export, package, auth/session/user/workspace mutation, certification, attestation, or provider spend.",
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Command Center UX",
      body:
        "- Enterprise Preview route shows founder intake, Q&A readiness, PRD preview, agent workplan, business build lanes, self-healing readiness, next action, blockers, disabled reason, owner capability, evidence/activity location, safety posture, and cost impact.\n" +
        "- Primary UX avoids raw output dumps, raw logs, raw policy dumps, raw tokens, raw private IDs, DemoApp leakage, internal phase labels, and runnable founder, PRD, agent, self-healing, or runtime actions.",
    },
    { title: "Result", body: failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)` },
  ],
  { title: "P78.5 Command Center Enterprise Preview UX Report", phase: "P78.5" },
);

printCheckReport("P78.5 Command Center Enterprise Preview UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
