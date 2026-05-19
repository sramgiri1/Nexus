import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { complianceReadinessViewModel } from "../dashboard/src/data/complianceReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p776-tests-checkers-docs-report.md";

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
const docs = readText("docs/architecture/P77_COMPLIANCE_AUDIT_PACK_PLAN.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeSource = readText("dashboard/src/data/commandCenterRoutes.js");
const uxReport = readText("reports/command-center-compliance-ux-report.md");
const runtimeSources = [
  "compliance/p77-2-placeholder.js",
  "compliance/p77-3-placeholder.js",
  "compliance/p77-4-placeholder.js",
  "dashboard/src/data/complianceReadiness.js",
].map(readText).join("\n");
const serializedUx = JSON.stringify(complianceReadinessViewModel);

const requiredScripts = [
  "check:p77-execution-plan",
  "check:p772",
  "check:p773",
  "check:p774",
  "check:p775-command-center-compliance-ux",
  "check:p776-tests-checkers-docs",
];

const requiredCheckerFiles = [
  "scripts/check-p77-execution-plan.js",
  "scripts/check-p772.js",
  "scripts/check-p773.js",
  "scripts/check-p774.js",
  "scripts/check-p775-command-center-compliance-ux.js",
  "scripts/check-p776-tests-checkers-docs.js",
];

const requiredReports = [
  "reports/p77-execution-plan-report.md",
  "reports/p772-report.md",
  "reports/p773-report.md",
  "reports/p774-report.md",
  "reports/command-center-compliance-ux-report.md",
];

const completedSubphases = ["P77.1", "P77.2", "P77.3", "P77.4", "P77.5", "P77.6"];
const statusCommitSubphases = ["P77.1", "P77.2", "P77.3", "P77.4", "P77.5"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const preFinalHandoff = status.currentPhase === "P77" && status.nextPhase === "P77.7" && phaseById.get("P77")?.nextPhase === "P77.7";
const finalHandoff = status.currentPhase === "P78" && status.previousPhase === "P77" && status.nextPhase === "P78" && statusById.get("P77.7")?.status === "complete";

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("checker files exist", requiredCheckerFiles.every(fileExists));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("docs cover subphases", completedSubphases.every((phaseId) => docs.includes(`### ${phaseId}`) && docs.includes("Status: complete")), completedSubphases.join(", "));
addCheck("roadmap statuses complete", completedSubphases.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("phase status entries complete", completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("P77 handoff is valid", preFinalHandoff || finalHandoff, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P77.7 remains planned or complete", ["planned", "complete"].includes(phaseById.get("P77.7")?.status) && ["planned", "complete"].includes(statusById.get("P77.7")?.status));
addCheck("completed status commits stamped", statusCommitSubphases.every((phaseId) => statusById.get(phaseId)?.commit && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("Command Center route registered", routeSource.includes('key: "compliance"') && routeSource.includes("/command-center/compliance"));
addCheck("Command Center tabs registered", tabsSource.includes("COMPLIANCE_TABS") && tabsSource.includes("Disabled Actions"));
addCheck("Command Center renderer registered", pageSource.includes("CompliancePage") && pageSource.includes("buildComplianceReadinessViewModel"));
addCheck("Command Center test registered", routeTests.includes("Compliance route renders readiness without runnable certification actions"));
addCheck("Command Center themes covered", routeTests.includes('["dark", "light", "system"]') && routeTests.includes("pickTheme(page, theme)"));
addCheck("Compliance UX hides phase labels", !serializedUx.includes("P77"));
addCheck("Compliance UX hides DemoApp/private ids/tokens", !serializedUx.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|attestation|audit)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedUx) && !/Bearer\s+|jwt|id_token|access_token/i.test(serializedUx));
addCheck("certification attestation export package disabled", !runtimeSources.includes("certificationAllowed: true") && !runtimeSources.includes("legalAttestationAllowed: true") && !runtimeSources.includes("auditExportAllowed: true") && !runtimeSources.includes("packageCreationAllowed: true"));
addCheck("DB/provider/tool/worker disabled", !runtimeSources.includes("dbWritesAllowed: true") && !runtimeSources.includes("providerDispatchAllowed: true") && !runtimeSources.includes("toolExecutionAllowed: true") && !runtimeSources.includes("workerExecutionAllowed: true"));
addCheck("network/spend disabled", !runtimeSources.includes("networkCallsAllowed: true") && !runtimeSources.includes("providerSpendAllowed: true"));
addCheck("project tenant auth export disabled", !runtimeSources.includes("projectMutationAllowed: true") && !runtimeSources.includes("tenantMutationAllowed: true") && !runtimeSources.includes("authMutationAllowed: true") && !runtimeSources.includes("exportExecutionAllowed: true"));
addCheck("forbidden paths remain visible", runtimeSources.includes("projects/**") && runtimeSources.includes("db/**") && runtimeSources.includes("providers/**") && runtimeSources.includes("tools/**"));
addCheck("docs state disabled posture", /certification[\s\S]+disabled/i.test(docs) && /legal attestation[\s\S]+disabled/i.test(docs) && /audit export[\s\S]+disabled/i.test(docs) && /package creation[\s\S]+disabled/i.test(docs));
addCheck("reports mention PASS", requiredReports.every((file) => readText(file).includes("PASS")) && uxReport.includes("Command Center Compliance UX Report"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    { title: "Scope", body: "- Validates P77 tests, checkers, docs, reports, roadmap, phase status, and Command Center Compliance coverage.\n- Does not enable certification, legal attestation, audit export, raw log export, package creation, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, auth/session/user/workspace mutation, or provider spend." },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P77.6 Tests Checkers Docs Report", phase: "P77.6" },
);

printCheckReport("P77.6 Tests Checkers Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
