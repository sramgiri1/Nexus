import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { isolationReadinessViewModel } from "../dashboard/src/data/isolationReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p766-tests-checkers-docs-report.md";

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
const docs = readText("docs/architecture/P76_TENANT_PROJECT_ISOLATION_PLAN.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeSource = readText("dashboard/src/data/commandCenterRoutes.js");
const uxReport = readText("reports/command-center-isolation-ux-report.md");
const runtimeSources = [
  "isolation/p76-2-placeholder.js",
  "isolation/p76-3-placeholder.js",
  "isolation/p76-4-placeholder.js",
  "dashboard/src/data/isolationReadiness.js",
].map(readText).join("\n");
const serializedUx = JSON.stringify(isolationReadinessViewModel);

const requiredScripts = [
  "check:p76-execution-plan",
  "check:p762",
  "check:p763",
  "check:p764",
  "check:p765-command-center-isolation-ux",
  "check:p766-tests-checkers-docs",
];

const requiredCheckerFiles = [
  "scripts/check-p76-execution-plan.js",
  "scripts/check-p762.js",
  "scripts/check-p763.js",
  "scripts/check-p764.js",
  "scripts/check-p765-command-center-isolation-ux.js",
  "scripts/check-p766-tests-checkers-docs.js",
];

const requiredReports = [
  "reports/p76-execution-plan-report.md",
  "reports/p762-report.md",
  "reports/p763-report.md",
  "reports/p764-report.md",
  "reports/command-center-isolation-ux-report.md",
];

const completedSubphases = ["P76.1", "P76.2", "P76.3", "P76.4", "P76.5", "P76.6"];
const statusCommitSubphases = ["P76.1", "P76.2", "P76.3", "P76.4", "P76.5"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const preFinalHandoff = status.currentPhase === "P76" && status.nextPhase === "P76.7" && phaseById.get("P76")?.nextPhase === "P76.7";
const finalHandoff = status.currentPhase === "P77" && status.previousPhase === "P76" && status.nextPhase === "P77" && statusById.get("P76.7")?.status === "complete";

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("checker files exist", requiredCheckerFiles.every(fileExists));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("docs cover subphases", completedSubphases.every((phaseId) => docs.includes(`### ${phaseId}`) && docs.includes("Status: complete")), completedSubphases.join(", "));
addCheck("roadmap statuses complete", completedSubphases.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("phase status entries complete", completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("P76 handoff is valid", preFinalHandoff || finalHandoff, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P76.7 remains planned or complete", ["planned", "complete"].includes(phaseById.get("P76.7")?.status) && ["planned", "complete"].includes(statusById.get("P76.7")?.status));
addCheck("completed status commits stamped", statusCommitSubphases.every((phaseId) => statusById.get(phaseId)?.commit && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("Command Center route registered", routeSource.includes('key: "isolation"') && routeSource.includes("/command-center/isolation"));
addCheck("Command Center tabs registered", tabsSource.includes("ISOLATION_TABS") && tabsSource.includes("Disabled Actions"));
addCheck("Command Center renderer registered", pageSource.includes("IsolationPage") && pageSource.includes("buildIsolationReadinessViewModel"));
addCheck("Command Center test registered", routeTests.includes("Isolation route renders readiness without runnable access actions"));
addCheck("Command Center themes covered", routeTests.includes('["dark", "light", "system"]') && routeTests.includes("pickTheme(page, theme)"));
addCheck("Isolation UX hides phase labels", !serializedUx.includes("P76"));
addCheck("Isolation UX hides DemoApp/private ids/tokens", !serializedUx.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|access)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedUx) && !/Bearer\s+|jwt|id_token|access_token/i.test(serializedUx));
addCheck("tenant project access disabled", !runtimeSources.includes("tenantMutationAllowed: true") && !runtimeSources.includes("projectMutationAllowed: true") && !runtimeSources.includes("accessGrantAllowed: true"));
addCheck("role permission membership disabled", !runtimeSources.includes("roleMutationAllowed: true") && !runtimeSources.includes("permissionMutationAllowed: true") && !runtimeSources.includes("membershipMutationAllowed: true"));
addCheck("DB/provider/tool/worker disabled", !runtimeSources.includes("dbWritesAllowed: true") && !runtimeSources.includes("providerDispatchAllowed: true") && !runtimeSources.includes("toolExecutionAllowed: true") && !runtimeSources.includes("workerExecutionAllowed: true"));
addCheck("network/spend disabled", !runtimeSources.includes("networkCallsAllowed: true") && !runtimeSources.includes("providerSpendAllowed: true"));
addCheck("deploy/release/export/package/auth disabled", !runtimeSources.includes("deployExecutionAllowed: true") && !runtimeSources.includes("releaseExecutionAllowed: true") && !runtimeSources.includes("exportExecutionAllowed: true") && !runtimeSources.includes("packageCreationAllowed: true") && !runtimeSources.includes("authMutationAllowed: true"));
addCheck("forbidden paths remain visible", runtimeSources.includes("projects/**") && runtimeSources.includes("db/**") && runtimeSources.includes("providers/**") && runtimeSources.includes("tools/**"));
addCheck("docs state disabled posture", /tenant[\s\S]+mutation[\s\S]+remain disabled/i.test(docs) && /project[\s\S]+mutation[\s\S]+disabled/i.test(docs) && /access grants[\s\S]+disabled/i.test(docs));
addCheck("reports mention PASS", requiredReports.every((file) => readText(file).includes("PASS")) && uxReport.includes("Command Center Isolation UX Report"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    { title: "Scope", body: "- Validates P76 tests, checkers, docs, reports, roadmap, phase status, and Command Center Isolation coverage.\n- Does not enable tenant mutation, project mutation, access grants, role mutation, permission mutation, DB writes, provider/tool/worker execution, network calls, deploy, release, export, package, auth/session/user/workspace mutation, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P76.6 Tests Checkers Docs Report", phase: "P76.6" },
);

printCheckReport("P76.6 Tests Checkers Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
