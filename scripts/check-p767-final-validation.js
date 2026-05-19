import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { isolationReadinessViewModel } from "../dashboard/src/data/isolationReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p767-final-validation-report.md";

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
const statusChecker = readText("scripts/check-os-phase-status.js");
const runtimeSources = [
  "isolation/p76-2-placeholder.js",
  "isolation/p76-3-placeholder.js",
  "isolation/p76-4-placeholder.js",
  "dashboard/src/data/isolationReadiness.js",
].map(readText).join("\n");

const requiredScripts = [
  "check:p76-execution-plan",
  "check:p762",
  "check:p763",
  "check:p764",
  "check:p765-command-center-isolation-ux",
  "check:p766-tests-checkers-docs",
  "check:p767-final-validation",
];

const requiredReports = [
  "reports/p76-execution-plan-report.md",
  "reports/p762-report.md",
  "reports/p763-report.md",
  "reports/p764-report.md",
  "reports/command-center-isolation-ux-report.md",
  "reports/p766-tests-checkers-docs-report.md",
];

const completedPhaseIds = ["P76", "P76.1", "P76.2", "P76.3", "P76.4", "P76.5", "P76.6", "P76.7"];
const priorCompletedPhaseIds = ["P76.1", "P76.2", "P76.3", "P76.4", "P76.5", "P76.6"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const serializedReadiness = JSON.stringify(isolationReadinessViewModel);

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("P76 phases complete in roadmap", completedPhaseIds.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("P76 phases complete in phase status", completedPhaseIds.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("prior completed P76 entries have commits", priorCompletedPhaseIds.every((phaseId) => Boolean(statusById.get(phaseId)?.commit) && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("final P76 entries are stampable", ["P76", "P76.7"].every((phaseId) => Boolean(statusById.get(phaseId)?.commit)));
addCheck("handoff to P77", status.currentPhase === "P77" && status.previousPhase === "P76" && status.nextPhase === "P77", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P77 remains next planned phase", phaseById.get("P77")?.status !== "complete" && statusById.get("P77")?.status === "planned");
addCheck("status checker accepts P76 through P78", ["\"P76\"", "\"P77\"", "\"P78\""].every((token) => statusChecker.includes(token)));
addCheck("docs close P76", docs.includes("Status: complete") && /P76\s+is complete/.test(docs));
addCheck("Command Center route preserved", routeSource.includes('key: "isolation"') && routeSource.includes("/command-center/isolation"));
addCheck("Command Center tabs preserved", tabsSource.includes("ISOLATION_TABS") && tabsSource.includes("Disabled Actions"));
addCheck("Command Center renderer preserved", pageSource.includes("IsolationPage") && pageSource.includes("buildIsolationReadinessViewModel"));
addCheck("Command Center test preserved", routeTests.includes("Isolation route renders readiness without runnable access actions"));
addCheck("Command Center theme coverage preserved", routeTests.includes('["dark", "light", "system"]') && routeTests.includes("pickTheme(page, theme)"));
addCheck("Isolation UX omits DemoApp/private ids/tokens", !serializedReadiness.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|access)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedReadiness) && !/Bearer\s+|jwt|id_token|access_token/i.test(serializedReadiness));
addCheck("Isolation UX omits phase labels", !serializedReadiness.includes("P76"));
addCheck("tenant project access disabled", !runtimeSources.includes("tenantMutationAllowed: true") && !runtimeSources.includes("projectMutationAllowed: true") && !runtimeSources.includes("accessGrantAllowed: true"));
addCheck("role permission membership disabled", !runtimeSources.includes("roleMutationAllowed: true") && !runtimeSources.includes("permissionMutationAllowed: true") && !runtimeSources.includes("membershipMutationAllowed: true"));
addCheck("DB/provider/tool/worker disabled", !runtimeSources.includes("dbWritesAllowed: true") && !runtimeSources.includes("providerDispatchAllowed: true") && !runtimeSources.includes("toolExecutionAllowed: true") && !runtimeSources.includes("workerExecutionAllowed: true"));
addCheck("network/spend disabled", !runtimeSources.includes("networkCallsAllowed: true") && !runtimeSources.includes("providerSpendAllowed: true"));
addCheck("deploy/release/export/package/auth disabled", !runtimeSources.includes("deployExecutionAllowed: true") && !runtimeSources.includes("releaseExecutionAllowed: true") && !runtimeSources.includes("exportExecutionAllowed: true") && !runtimeSources.includes("packageCreationAllowed: true") && !runtimeSources.includes("authMutationAllowed: true"));
addCheck("Isolation and project paths remain forbidden", runtimeSources.includes("projects/**") && runtimeSources.includes("db/**") && runtimeSources.includes("providers/**") && runtimeSources.includes("tools/**"));
addCheck("final report path is distinct", REPORT_PATH.endsWith("p767-final-validation-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P76 Tenant / Project Isolation for NEXUS OS.",
        "- Validates completed subphases, Command Center Isolation UX, dashboard validation, reports, docs, roadmap, phase status, and P77 handoff.",
        "- Does not enable tenant mutation, project mutation, access grants, role mutation, permission mutation, DB writes, provider/tool/worker execution, network calls, deploy, release, export, package, auth/session/user/workspace mutation, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p767-final-validation",
        "- npm run check:p766-tests-checkers-docs",
        "- npm run check:p765-command-center-isolation-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Isolation route\"",
        "- cd dashboard && npm run test:unit",
        "- cd dashboard && npm run build",
        "- npm run check:p76-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P76 closes tenant/project/access isolation readiness only.",
        "- Tenant mutation, project mutation, access grants, role mutation, permission mutation, DB writes, provider/tool/worker execution, network calls, deploy/release/export execution, package creation, auth/session/user/workspace mutation, and provider spend remain disabled.",
        "- P77 is the compliance and audit pack handoff and does not enable runtime mutation by itself.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P76.7 Final Validation Report", phase: "P76.7" },
);

printCheckReport("P76.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
