import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { observabilityReadinessViewModel } from "../dashboard/src/data/observabilityReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p746-tests-checkers-docs-report.md";

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
const uxReport = readText("reports/command-center-observability-ux-report.md");
const runtimeSources = [
  "observability/p74-2-placeholder.js",
  "observability/p74-3-placeholder.js",
  "observability/p74-4-placeholder.js",
  "dashboard/src/data/observabilityReadiness.js",
].map(readText).join("\n");
const serializedUx = JSON.stringify(observabilityReadinessViewModel);

const requiredScripts = [
  "check:p74-execution-plan",
  "check:p742",
  "check:p743",
  "check:p744",
  "check:p745-command-center-observability-ux",
  "check:p746-tests-checkers-docs",
];

const requiredCheckerFiles = [
  "scripts/check-p74-execution-plan.js",
  "scripts/check-p742.js",
  "scripts/check-p743.js",
  "scripts/check-p744.js",
  "scripts/check-p745-command-center-observability-ux.js",
  "scripts/check-p746-tests-checkers-docs.js",
];

const requiredReports = [
  "reports/p74-execution-plan-report.md",
  "reports/p742-report.md",
  "reports/p743-report.md",
  "reports/p744-report.md",
  "reports/command-center-observability-ux-report.md",
];

const completedSubphases = ["P74.1", "P74.2", "P74.3", "P74.4", "P74.5", "P74.6"];
const statusCommitSubphases = ["P74.1", "P74.2", "P74.3", "P74.4", "P74.5"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const preFinalHandoff = status.currentPhase === "P74" && status.nextPhase === "P74.7" && phaseById.get("P74")?.nextPhase === "P74.7";
const finalHandoff = status.currentPhase === "P75" && status.previousPhase === "P74" && status.nextPhase === "P75" && statusById.get("P74.7")?.status === "complete";

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("checker files exist", requiredCheckerFiles.every(fileExists));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("docs cover subphases", completedSubphases.every((phaseId) => docs.includes(`### ${phaseId}`) && docs.includes("Status: complete")), completedSubphases.join(", "));
addCheck("roadmap statuses complete", completedSubphases.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("phase status entries complete", completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("P74 handoff is valid", preFinalHandoff || finalHandoff, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P74.7 remains planned or complete", ["planned", "complete"].includes(phaseById.get("P74.7")?.status) && ["planned", "complete"].includes(statusById.get("P74.7")?.status));
addCheck("completed status commits stamped", statusCommitSubphases.every((phaseId) => statusById.get(phaseId)?.commit && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("Command Center route registered", routeSource.includes('key: "observability"') && routeSource.includes("/command-center/observability"));
addCheck("Command Center tabs registered", tabsSource.includes("OBSERVABILITY_TABS") && tabsSource.includes("Disabled Actions"));
addCheck("Command Center renderer registered", pageSource.includes("ObservabilityPage") && pageSource.includes("buildObservabilityReadinessViewModel"));
addCheck("Command Center test registered", routeTests.includes("Observability route renders readiness without runnable telemetry actions"));
addCheck("Command Center themes covered", routeTests.includes('["dark", "light", "system"]') && routeTests.includes("pickTheme(page, theme)"));
addCheck("Observability UX hides phase labels", !serializedUx.includes("P74"));
addCheck("Observability UX hides DemoApp/private ids/tokens", !serializedUx.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|incident)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedUx) && !/Bearer\s+|jwt|id_token|access_token/i.test(serializedUx));
addCheck("telemetry/export/raw logs disabled", !runtimeSources.includes("telemetryExportAllowed: true") && !runtimeSources.includes("rawLogExposureAllowed: true") && !runtimeSources.includes("rawJsonDumpAllowed: true") && !runtimeSources.includes("rawPolicyDumpAllowed: true"));
addCheck("SLO/paging/remediation disabled", !runtimeSources.includes("enforcementAllowed: true") && !runtimeSources.includes("sloEnforcementAllowed: true") && !runtimeSources.includes("pagingAllowed: true") && !runtimeSources.includes("remediationAllowed: true"));
addCheck("DB/project mutation disabled", !runtimeSources.includes("dbWritesAllowed: true") && !runtimeSources.includes("projectMutationAllowed: true"));
addCheck("provider/tool/worker disabled", !runtimeSources.includes("providerDispatchAllowed: true") && !runtimeSources.includes("toolExecutionAllowed: true") && !runtimeSources.includes("workerExecutionAllowed: true"));
addCheck("network/spend disabled", !runtimeSources.includes("networkCallsAllowed: true") && !runtimeSources.includes("providerSpendAllowed: true"));
addCheck("deploy/release/export/package/auth disabled", !runtimeSources.includes("deployExecutionAllowed: true") && !runtimeSources.includes("releaseExecutionAllowed: true") && !runtimeSources.includes("exportExecutionAllowed: true") && !runtimeSources.includes("packageCreationAllowed: true") && !runtimeSources.includes("authMutationAllowed: true"));
addCheck("forbidden paths remain visible", runtimeSources.includes("projects/**") && runtimeSources.includes("db/**") && runtimeSources.includes("providers/**") && runtimeSources.includes("tools/**"));
addCheck("docs state disabled posture", /telemetry[\s\S]+remain disabled/i.test(docs) && /SLO[\s\S]+disabled/i.test(docs) && /remediation[\s\S]+disabled/i.test(docs));
addCheck("reports mention PASS", requiredReports.every((file) => readText(file).includes("PASS")) && uxReport.includes("Command Center Observability UX Report"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    { title: "Scope", body: "- Validates P74 tests, checkers, docs, reports, roadmap, phase status, and Command Center observability coverage.\n- Does not enable telemetry export, raw log exposure, SLO enforcement, paging, remediation, DB writes, project mutation, providers/tools/workers, network calls, deploy, release, export, package, auth mutation, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P74.6 Tests Checkers Docs Report", phase: "P74.6" },
);

printCheckReport("P74.6 Tests Checkers Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
