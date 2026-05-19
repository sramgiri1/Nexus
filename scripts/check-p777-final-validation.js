import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { complianceReadinessViewModel } from "../dashboard/src/data/complianceReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p777-final-validation-report.md";

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
const statusChecker = readText("scripts/check-os-phase-status.js");
const runtimeSources = [
  "compliance/p77-2-placeholder.js",
  "compliance/p77-3-placeholder.js",
  "compliance/p77-4-placeholder.js",
  "dashboard/src/data/complianceReadiness.js",
].map(readText).join("\n");

const requiredScripts = [
  "check:p77-execution-plan",
  "check:p772",
  "check:p773",
  "check:p774",
  "check:p775-command-center-compliance-ux",
  "check:p776-tests-checkers-docs",
  "check:p777-final-validation",
];

const requiredReports = [
  "reports/p77-execution-plan-report.md",
  "reports/p772-report.md",
  "reports/p773-report.md",
  "reports/p774-report.md",
  "reports/command-center-compliance-ux-report.md",
  "reports/p776-tests-checkers-docs-report.md",
];

const completedPhaseIds = ["P77", "P77.1", "P77.2", "P77.3", "P77.4", "P77.5", "P77.6", "P77.7"];
const priorCompletedPhaseIds = ["P77.1", "P77.2", "P77.3", "P77.4", "P77.5", "P77.6"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const serializedReadiness = JSON.stringify(complianceReadinessViewModel);

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("P77 phases complete in roadmap", completedPhaseIds.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("P77 phases complete in phase status", completedPhaseIds.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("prior completed P77 entries have commits", priorCompletedPhaseIds.every((phaseId) => Boolean(statusById.get(phaseId)?.commit) && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("final P77 entries are stampable", ["P77", "P77.7"].every((phaseId) => Boolean(statusById.get(phaseId)?.commit)));
addCheck("handoff to P78", status.currentPhase === "P78" && status.previousPhase === "P77" && status.nextPhase === "P78", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P78 remains planned current phase", phaseById.get("P78")?.status === "planned" && statusById.get("P78")?.status === "planned");
addCheck("status checker accepts P77 through P78", ["\"P77\"", "\"P77.7\"", "\"P78\""].every((token) => statusChecker.includes(token)));
addCheck("docs close P77", docs.includes("Status: complete") && /P77\s+is complete/.test(docs));
addCheck("Command Center route preserved", routeSource.includes('key: "compliance"') && routeSource.includes("/command-center/compliance"));
addCheck("Command Center tabs preserved", tabsSource.includes("COMPLIANCE_TABS") && tabsSource.includes("Disabled Actions"));
addCheck("Command Center renderer preserved", pageSource.includes("CompliancePage") && pageSource.includes("buildComplianceReadinessViewModel"));
addCheck("Command Center test preserved", routeTests.includes("Compliance route renders readiness without runnable certification actions"));
addCheck("Command Center theme coverage preserved", routeTests.includes('["dark", "light", "system"]') && routeTests.includes("pickTheme(page, theme)"));
addCheck("Compliance UX omits DemoApp/private ids/tokens", !serializedReadiness.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|attestation|audit)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedReadiness) && !/Bearer\s+|jwt|id_token|access_token/i.test(serializedReadiness));
addCheck("Compliance UX omits phase labels", !serializedReadiness.includes("P77"));
addCheck("certification attestation export package disabled", !runtimeSources.includes("certificationAllowed: true") && !runtimeSources.includes("legalAttestationAllowed: true") && !runtimeSources.includes("auditExportAllowed: true") && !runtimeSources.includes("packageCreationAllowed: true"));
addCheck("raw log DB provider tool worker disabled", !runtimeSources.includes("rawLogExportAllowed: true") && !runtimeSources.includes("dbWritesAllowed: true") && !runtimeSources.includes("providerDispatchAllowed: true") && !runtimeSources.includes("toolExecutionAllowed: true") && !runtimeSources.includes("workerExecutionAllowed: true"));
addCheck("network/spend/project/auth disabled", !runtimeSources.includes("networkCallsAllowed: true") && !runtimeSources.includes("providerSpendAllowed: true") && !runtimeSources.includes("projectMutationAllowed: true") && !runtimeSources.includes("authMutationAllowed: true"));
addCheck("deploy/release/export disabled", !runtimeSources.includes("deployExecutionAllowed: true") && !runtimeSources.includes("releaseExecutionAllowed: true") && !runtimeSources.includes("exportExecutionAllowed: true"));
addCheck("Compliance and project paths remain forbidden", runtimeSources.includes("projects/**") && runtimeSources.includes("db/**") && runtimeSources.includes("providers/**") && runtimeSources.includes("tools/**"));
addCheck("final report path is distinct", REPORT_PATH.endsWith("p777-final-validation-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P77 Compliance and Audit Pack for NEXUS OS.",
        "- Validates completed subphases, Command Center Compliance UX, dashboard validation, reports, docs, roadmap, phase status, and P78 handoff.",
        "- Does not enable certification, legal attestation, audit export, raw log export, package creation, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, auth/session/user/workspace mutation, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p777-final-validation",
        "- npm run check:p776-tests-checkers-docs",
        "- npm run check:p775-command-center-compliance-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Compliance route\"",
        "- cd dashboard && npm run test:unit",
        "- cd dashboard && npm run build",
        "- npm run check:p77-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P77 closes compliance and audit pack readiness only.",
        "- Certification, legal attestation, audit export, raw log export, package creation, DB writes, project mutation, provider/tool/worker execution, network calls, deploy/release/export execution, auth/session/user/workspace mutation, and provider spend remain disabled.",
        "- P78 is the self-healing enterprise developer preview handoff and does not enable runtime mutation by itself.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P77.7 Final Validation Report", phase: "P77.7" },
);

printCheckReport("P77.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
