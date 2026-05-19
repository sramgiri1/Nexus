import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { authGovernanceReadinessViewModel } from "../dashboard/src/data/authGovernanceReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p736-tests-checkers-docs-report.md";

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
const docs = readText("docs/architecture/P73_AUTH_RBAC_MULTI_USER_GOVERNANCE_PLAN.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeSource = readText("dashboard/src/data/commandCenterRoutes.js");
const uxReport = readText("reports/command-center-auth-governance-ux-report.md");
const runtimeSources = [
  "auth-governance/p73-2-placeholder.js",
  "auth-governance/p73-3-placeholder.js",
  "auth-governance/p73-4-placeholder.js",
  "dashboard/src/data/authGovernanceReadiness.js",
].map(readText).join("\n");
const serializedUx = JSON.stringify(authGovernanceReadinessViewModel);

const requiredScripts = [
  "check:p73-execution-plan",
  "check:p732",
  "check:p733",
  "check:p734",
  "check:p735-command-center-auth-governance-ux",
  "check:p736-tests-checkers-docs",
];

const requiredCheckerFiles = [
  "scripts/check-p73-execution-plan.js",
  "scripts/check-p732.js",
  "scripts/check-p733.js",
  "scripts/check-p734.js",
  "scripts/check-p735-command-center-auth-governance-ux.js",
  "scripts/check-p736-tests-checkers-docs.js",
];

const requiredReports = [
  "reports/p73-execution-plan-report.md",
  "reports/p732-report.md",
  "reports/p733-report.md",
  "reports/p734-report.md",
  "reports/command-center-auth-governance-ux-report.md",
];

const completedSubphases = ["P73.1", "P73.2", "P73.3", "P73.4", "P73.5", "P73.6"];
const statusCommitSubphases = ["P73.1", "P73.2", "P73.3", "P73.4", "P73.5"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const preFinalHandoff = status.currentPhase === "P73" && status.nextPhase === "P73.7" && phaseById.get("P73")?.nextPhase === "P73.7";
const finalHandoff = status.currentPhase === "P74" && status.previousPhase === "P73" && status.nextPhase === "P74" && statusById.get("P73.7")?.status === "complete";

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("checker files exist", requiredCheckerFiles.every(fileExists));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("docs cover subphases", completedSubphases.every((phaseId) => docs.includes(`### ${phaseId}`) && docs.includes("Status: complete")), completedSubphases.join(", "));
addCheck("roadmap statuses complete", completedSubphases.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("phase status entries complete", completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("P73 handoff is valid", preFinalHandoff || finalHandoff, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P73.7 remains planned or complete", ["planned", "complete"].includes(phaseById.get("P73.7")?.status) && ["planned", "complete"].includes(statusById.get("P73.7")?.status));
addCheck("completed status commits stamped", statusCommitSubphases.every((phaseId) => statusById.get(phaseId)?.commit && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("Command Center route registered", routeSource.includes('key: "authGovernance"') && routeSource.includes("/command-center/auth-governance"));
addCheck("Command Center tabs registered", tabsSource.includes("AUTH_GOVERNANCE_TABS") && tabsSource.includes("Disabled Actions"));
addCheck("Command Center renderer registered", pageSource.includes("AuthGovernancePage") && pageSource.includes("buildAuthGovernanceReadinessViewModel"));
addCheck("Command Center test registered", routeTests.includes("Auth Governance route renders readiness without runnable auth actions"));
addCheck("Command Center themes covered", routeTests.includes("pickTheme(page, \"dark\")") && routeTests.includes("pickTheme(page, \"light\")") && routeTests.includes("pickTheme(page, \"system\")"));
addCheck("Auth UX hides phase labels", !serializedUx.includes("P73"));
addCheck("Auth UX hides DemoApp/private ids/tokens", !serializedUx.includes("DemoApp") && !/(?:project|private|user|session|tenant|workspace)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedUx) && !/Bearer\s+|jwt|id_token|access_token/i.test(serializedUx));
addCheck("auth/user/role/workspace mutation disabled", !runtimeSources.includes("loginAllowed: true") && !runtimeSources.includes("userMutationAllowed: true") && !runtimeSources.includes("roleMutationAllowed: true") && !runtimeSources.includes("workspaceMutationAllowed: true") && !runtimeSources.includes("tenantMutationAllowed: true"));
addCheck("DB/project mutation disabled", !runtimeSources.includes("dbWritesAllowed: true") && !runtimeSources.includes("projectMutationAllowed: true"));
addCheck("provider/tool/worker disabled", !runtimeSources.includes("providerDispatchAllowed: true") && !runtimeSources.includes("toolExecutionAllowed: true") && !runtimeSources.includes("workerExecutionAllowed: true"));
addCheck("network/spend disabled", !runtimeSources.includes("networkCallsAllowed: true") && !runtimeSources.includes("providerSpendAllowed: true"));
addCheck("deploy/release/export/package disabled", !runtimeSources.includes("deployExecutionAllowed: true") && !runtimeSources.includes("releaseExecutionAllowed: true") && !runtimeSources.includes("exportExecutionAllowed: true") && !runtimeSources.includes("packageCreationAllowed: true"));
addCheck("forbidden paths remain visible", runtimeSources.includes("projects/**") && runtimeSources.includes("auth/**") && runtimeSources.includes("users/**") && runtimeSources.includes("rbac/**"));
addCheck("docs state disabled posture", /Login[\s\S]+remain disabled/i.test(docs) && /role[\s\S]+mutation[\s\S]+remain disabled/i.test(docs));
addCheck("reports mention PASS", requiredReports.every((file) => readText(file).includes("PASS")) && uxReport.includes("Command Center Auth Governance UX Report"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    { title: "Scope", body: "- Validates P73 tests, checkers, docs, reports, roadmap, phase status, and Command Center auth governance coverage.\n- Does not enable login, identity provider calls, token exchange, user/session/role/permission/tenant/workspace mutation, DB writes, project mutation, providers/tools/workers, network calls, deploy, release, export, package, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P73.6 Tests Checkers Docs Report", phase: "P73.6" },
);

printCheckReport("P73.6 Tests Checkers Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
