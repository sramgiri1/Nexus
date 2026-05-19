import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { observabilityReadinessViewModel } from "../dashboard/src/data/observabilityReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p747-final-validation-report.md";

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
const docs = readText("docs/architecture/P74_OBSERVABILITY_TELEMETRY_SLOS_PLAN.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeSource = readText("dashboard/src/data/commandCenterRoutes.js");
const statusChecker = readText("scripts/check-os-phase-status.js");
const runtimeSources = [
  "observability/p74-2-placeholder.js",
  "observability/p74-3-placeholder.js",
  "observability/p74-4-placeholder.js",
  "dashboard/src/data/observabilityReadiness.js",
].map(readText).join("\n");

const requiredScripts = [
  "check:p74-execution-plan",
  "check:p742",
  "check:p743",
  "check:p744",
  "check:p745-command-center-observability-ux",
  "check:p746-tests-checkers-docs",
  "check:p747-final-validation",
];

const requiredReports = [
  "reports/p74-execution-plan-report.md",
  "reports/p742-report.md",
  "reports/p743-report.md",
  "reports/p744-report.md",
  "reports/command-center-observability-ux-report.md",
  "reports/p746-tests-checkers-docs-report.md",
];

const completedPhaseIds = ["P74", "P74.1", "P74.2", "P74.3", "P74.4", "P74.5", "P74.6", "P74.7"];
const priorCompletedPhaseIds = ["P74.1", "P74.2", "P74.3", "P74.4", "P74.5", "P74.6"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const serializedReadiness = JSON.stringify(observabilityReadinessViewModel);

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("P74 phases complete in roadmap", completedPhaseIds.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("P74 phases complete in phase status", completedPhaseIds.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("prior completed P74 entries have commits", priorCompletedPhaseIds.every((phaseId) => Boolean(statusById.get(phaseId)?.commit) && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("final P74 entries are stampable", ["P74", "P74.7"].every((phaseId) => Boolean(statusById.get(phaseId)?.commit)));
addCheck("handoff to P75", status.currentPhase === "P75" && status.previousPhase === "P74" && status.nextPhase === "P75", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P75 remains next planned phase", phaseById.get("P75")?.status !== "complete" && statusById.get("P75")?.status === "planned");
addCheck("status checker accepts P75 through P78", ["\"P75\"", "\"P76\"", "\"P77\"", "\"P78\""].every((token) => statusChecker.includes(token)));
addCheck("docs close P74", docs.includes("Status: complete") && /P74\s+is complete/.test(docs));
addCheck("Command Center route preserved", routeSource.includes('key: "observability"') && routeSource.includes("/command-center/observability"));
addCheck("Command Center tabs preserved", tabsSource.includes("OBSERVABILITY_TABS") && tabsSource.includes("Disabled Actions"));
addCheck("Command Center renderer preserved", pageSource.includes("ObservabilityPage") && pageSource.includes("buildObservabilityReadinessViewModel"));
addCheck("Command Center test preserved", routeTests.includes("Observability route renders readiness without runnable telemetry actions"));
addCheck("Command Center theme coverage preserved", routeTests.includes('["dark", "light", "system"]') && routeTests.includes("pickTheme(page, theme)"));
addCheck("Observability UX omits DemoApp/private ids/tokens", !serializedReadiness.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|incident)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedReadiness) && !/Bearer\s+|jwt|id_token|access_token/i.test(serializedReadiness));
addCheck("Observability UX omits phase labels", !serializedReadiness.includes("P74"));
addCheck("telemetry/raw logs disabled", !runtimeSources.includes("telemetryExportAllowed: true") && !runtimeSources.includes("rawLogExposureAllowed: true"));
addCheck("SLO/paging/remediation disabled", !runtimeSources.includes("enforcementAllowed: true") && !runtimeSources.includes("sloEnforcementAllowed: true") && !runtimeSources.includes("pagingAllowed: true") && !runtimeSources.includes("remediationAllowed: true"));
addCheck("DB and project mutation disabled", !runtimeSources.includes("dbWritesAllowed: true") && !runtimeSources.includes("projectMutationAllowed: true"));
addCheck("provider/tool/worker disabled", !runtimeSources.includes("providerDispatchAllowed: true") && !runtimeSources.includes("toolExecutionAllowed: true") && !runtimeSources.includes("workerExecutionAllowed: true"));
addCheck("network/spend disabled", !runtimeSources.includes("networkCallsAllowed: true") && !runtimeSources.includes("providerSpendAllowed: true"));
addCheck("deploy/release/export/package/auth disabled", !runtimeSources.includes("deployExecutionAllowed: true") && !runtimeSources.includes("releaseExecutionAllowed: true") && !runtimeSources.includes("exportExecutionAllowed: true") && !runtimeSources.includes("packageCreationAllowed: true") && !runtimeSources.includes("authMutationAllowed: true"));
addCheck("observability and project paths remain forbidden", runtimeSources.includes("projects/**") && runtimeSources.includes("db/**") && runtimeSources.includes("providers/**") && runtimeSources.includes("tools/**"));
addCheck("final report path is distinct", REPORT_PATH.endsWith("p747-final-validation-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P74 Observability, Telemetry, SLOs for NEXUS OS.",
        "- Validates completed subphases, Command Center Observability UX, dashboard validation, reports, docs, roadmap, phase status, and P75 handoff.",
        "- Does not enable telemetry export, raw log exposure, SLO enforcement, paging, remediation, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, package, auth mutation, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p747-final-validation",
        "- npm run check:p746-tests-checkers-docs",
        "- npm run check:p745-command-center-observability-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Observability route\"",
        "- cd dashboard && npm run test:unit",
        "- cd dashboard && npm run build",
        "- npm run check:p74-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P74 closes observability readiness only.",
        "- Telemetry export, raw log exposure, SLO enforcement, paging, remediation, DB writes, project mutation, provider/tool/worker execution, network calls, deploy/release/export execution, package creation, auth mutation, and provider spend remain disabled.",
        "- P75 is the backup, restore, and disaster recovery handoff and does not enable runtime mutation by itself.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P74.7 Final Validation Report", phase: "P74.7" },
);

printCheckReport("P74.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
