import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { authGovernanceReadinessViewModel } from "../dashboard/src/data/authGovernanceReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p737-final-validation-report.md";

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
const statusChecker = readText("scripts/check-os-phase-status.js");
const runtimeSources = [
  "auth-governance/p73-2-placeholder.js",
  "auth-governance/p73-3-placeholder.js",
  "auth-governance/p73-4-placeholder.js",
  "dashboard/src/data/authGovernanceReadiness.js",
].map(readText).join("\n");

const requiredScripts = [
  "check:p73-execution-plan",
  "check:p732",
  "check:p733",
  "check:p734",
  "check:p735-command-center-auth-governance-ux",
  "check:p736-tests-checkers-docs",
  "check:p737-final-validation",
];

const requiredReports = [
  "reports/p73-execution-plan-report.md",
  "reports/p732-report.md",
  "reports/p733-report.md",
  "reports/p734-report.md",
  "reports/command-center-auth-governance-ux-report.md",
  "reports/p736-tests-checkers-docs-report.md",
];

const completedPhaseIds = ["P73", "P73.1", "P73.2", "P73.3", "P73.4", "P73.5", "P73.6", "P73.7"];
const priorCompletedPhaseIds = ["P73.1", "P73.2", "P73.3", "P73.4", "P73.5", "P73.6"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const serializedReadiness = JSON.stringify(authGovernanceReadinessViewModel);

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("P73 phases complete in roadmap", completedPhaseIds.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("P73 phases complete in phase status", completedPhaseIds.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("prior completed P73 entries have commits", priorCompletedPhaseIds.every((phaseId) => Boolean(statusById.get(phaseId)?.commit) && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("final P73 entries are stampable", ["P73", "P73.7"].every((phaseId) => Boolean(statusById.get(phaseId)?.commit)));
addCheck("handoff to P74", status.currentPhase === "P74" && status.previousPhase === "P73" && status.nextPhase === "P74", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P74 remains next planned phase", phaseById.get("P74")?.status !== "complete" && statusById.get("P74")?.status === "planned");
addCheck("status checker accepts P74 through P78", ["\"P74\"", "\"P75\"", "\"P76\"", "\"P77\"", "\"P78\""].every((token) => statusChecker.includes(token)));
addCheck("docs close P73", docs.includes("Status: complete") && /P73\s+is complete/.test(docs));
addCheck("Command Center route preserved", routeSource.includes('key: "authGovernance"') && routeSource.includes("/command-center/auth-governance"));
addCheck("Command Center tabs preserved", tabsSource.includes("AUTH_GOVERNANCE_TABS") && tabsSource.includes("Disabled Actions"));
addCheck("Command Center renderer preserved", pageSource.includes("AuthGovernancePage") && pageSource.includes("Auth Governance"));
addCheck("Command Center test preserved", routeTests.includes("Auth Governance route renders readiness without runnable auth actions"));
addCheck("Command Center theme coverage preserved", routeTests.includes("pickTheme(page, \"dark\")") && routeTests.includes("pickTheme(page, \"light\")") && routeTests.includes("pickTheme(page, \"system\")"));
addCheck("Auth UX omits DemoApp/private ids/tokens", !serializedReadiness.includes("DemoApp") && !/(?:project|private|user|session|tenant|workspace)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedReadiness) && !/Bearer\s+|jwt|id_token|access_token/i.test(serializedReadiness));
addCheck("Auth UX omits phase labels", !serializedReadiness.includes("P73"));
addCheck("login/provider/token/session disabled", !runtimeSources.includes("loginAllowed: true") && !runtimeSources.includes("identityProviderCallsAllowed: true") && !runtimeSources.includes("tokenExchangeAllowed: true") && !runtimeSources.includes("sessionMutationAllowed: true"));
addCheck("user/role/permission/tenant/workspace mutation disabled", !runtimeSources.includes("userMutationAllowed: true") && !runtimeSources.includes("roleMutationAllowed: true") && !runtimeSources.includes("permissionMutationAllowed: true") && !runtimeSources.includes("tenantMutationAllowed: true") && !runtimeSources.includes("workspaceMutationAllowed: true"));
addCheck("DB and project mutation disabled", !runtimeSources.includes("dbWritesAllowed: true") && !runtimeSources.includes("projectMutationAllowed: true"));
addCheck("provider/tool/worker disabled", !runtimeSources.includes("providerDispatchAllowed: true") && !runtimeSources.includes("toolExecutionAllowed: true") && !runtimeSources.includes("workerExecutionAllowed: true"));
addCheck("network/spend disabled", !runtimeSources.includes("networkCallsAllowed: true") && !runtimeSources.includes("providerSpendAllowed: true"));
addCheck("deploy/release/export/package disabled", !runtimeSources.includes("deployExecutionAllowed: true") && !runtimeSources.includes("releaseExecutionAllowed: true") && !runtimeSources.includes("exportExecutionAllowed: true") && !runtimeSources.includes("packageCreationAllowed: true"));
addCheck("auth and project paths remain forbidden", runtimeSources.includes("projects/**") && runtimeSources.includes("auth/**") && runtimeSources.includes("users/**") && runtimeSources.includes("rbac/**"));
addCheck("final report path is distinct", REPORT_PATH.endsWith("p737-final-validation-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P73 Auth, RBAC, Multi-user Governance for NEXUS OS.",
        "- Validates completed subphases, Command Center Auth Governance UX, dashboard validation, reports, docs, roadmap, phase status, and P74 handoff.",
        "- Does not enable login, identity provider integration, token exchange, user/session/role/permission/tenant/workspace mutation, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, package, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p737-final-validation",
        "- npm run check:p736-tests-checkers-docs",
        "- npm run check:p735-command-center-auth-governance-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Auth Governance route\"",
        "- cd dashboard && npm run test:unit",
        "- cd dashboard && npm run build",
        "- npm run check:p73-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P73 closes auth governance readiness only.",
        "- Login, identity provider integration, token exchange, user/session/role/permission/tenant/workspace mutation, DB writes, project mutation, provider/tool/worker execution, network calls, deploy/release/export execution, package creation, and provider spend remain disabled.",
        "- P74 is the observability, telemetry, and SLO handoff and does not enable auth mutation by itself.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P73.7 Final Validation Report", phase: "P73.7" },
);

printCheckReport("P73.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
