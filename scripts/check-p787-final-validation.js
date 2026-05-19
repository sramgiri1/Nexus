import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { enterprisePreviewReadinessViewModel } from "../dashboard/src/data/enterprisePreviewReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p787-final-validation-report.md";

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
const docs = readText("docs/architecture/P78_SELF_HEALING_ENTERPRISE_PREVIEW_PLAN.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeSource = readText("dashboard/src/data/commandCenterRoutes.js");
const statusChecker = readText("scripts/check-os-phase-status.js");
const runtimeSources = [
  "enterprise-preview/p78-2-placeholder.js",
  "enterprise-preview/p78-3-placeholder.js",
  "enterprise-preview/p78-4-placeholder.js",
  "dashboard/src/data/enterprisePreviewReadiness.js",
].map(readText).join("\n");

const requiredScripts = [
  "check:p78-execution-plan",
  "check:p782",
  "check:p783",
  "check:p784",
  "check:p785-command-center-enterprise-preview-ux",
  "check:p786-tests-checkers-docs",
  "check:p787-final-validation",
];

const requiredReports = [
  "reports/p78-execution-plan-report.md",
  "reports/p782-report.md",
  "reports/p783-report.md",
  "reports/p784-report.md",
  "reports/command-center-enterprise-preview-ux-report.md",
  "reports/p786-tests-checkers-docs-report.md",
];

const completedPhaseIds = ["P78", "P78.1", "P78.2", "P78.3", "P78.4", "P78.5", "P78.6", "P78.7"];
const priorCompletedPhaseIds = ["P78.1", "P78.2", "P78.3", "P78.4", "P78.5", "P78.6"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const serializedReadiness = JSON.stringify(enterprisePreviewReadinessViewModel);

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("P78 phases complete in roadmap", completedPhaseIds.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("P78 phases complete in phase status", completedPhaseIds.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("prior completed P78 entries have commits", priorCompletedPhaseIds.every((phaseId) => Boolean(statusById.get(phaseId)?.commit) && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("final P78 entries are stampable", ["P78", "P78.7"].every((phaseId) => Boolean(statusById.get(phaseId)?.commit)));
addCheck("parent P78 closed", phaseById.get("P78")?.nextPhase === "complete" && statusById.get("P78")?.nextPhase === "complete");
addCheck("root status remains OS-checker compatible", status.currentPhase === "P78" && status.previousPhase === "P78" && status.nextPhase === "P78", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("status checker accepts P78", ["\"P78\"", "\"P78.7\""].every((token) => statusChecker.includes(token)));
addCheck("docs close P78", docs.includes("Status: complete") && /P78\s+is complete/.test(docs));
addCheck("Command Center route preserved", routeSource.includes('key: "enterprisePreview"') && routeSource.includes("/command-center/enterprise-preview"));
addCheck("Command Center tabs preserved", tabsSource.includes("ENTERPRISE_PREVIEW_TABS") && tabsSource.includes("Disabled Actions"));
addCheck("Command Center renderer preserved", pageSource.includes("EnterprisePreviewPage") && pageSource.includes("buildEnterprisePreviewReadinessViewModel"));
addCheck("Command Center test preserved", routeTests.includes("Enterprise Preview route renders readiness without runnable founder actions"));
addCheck("Command Center theme coverage preserved", routeTests.includes('["dark", "light", "system"]') && routeTests.includes("pickTheme(page, theme)"));
addCheck("founder to business path preserved", serializedReadiness.includes("Founder intake") && serializedReadiness.includes("Business build") && serializedReadiness.includes("Operating loop"));
addCheck("Enterprise UX omits DemoApp/private ids/tokens", !serializedReadiness.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedReadiness) && !/Bearer\s+|jwt|id_token|access_token/i.test(serializedReadiness));
addCheck("Enterprise UX omits phase labels", !serializedReadiness.includes("P78"));
addCheck("founder PRD agent healing disabled", !runtimeSources.includes("founderIntakeExecutionAllowed: true") && !runtimeSources.includes("autonomousQnaAllowed: true") && !runtimeSources.includes("prdGenerationAllowed: true") && !runtimeSources.includes("agentDispatchAllowed: true") && !runtimeSources.includes("selfHealingApplyAllowed: true"));
addCheck("DB/provider/tool/worker disabled", !runtimeSources.includes("dbWritesAllowed: true") && !runtimeSources.includes("providerDispatchAllowed: true") && !runtimeSources.includes("toolExecutionAllowed: true") && !runtimeSources.includes("workerExecutionAllowed: true"));
addCheck("network/spend/project/auth disabled", !runtimeSources.includes("networkCallsAllowed: true") && !runtimeSources.includes("providerSpendAllowed: true") && !runtimeSources.includes("projectMutationAllowed: true") && !runtimeSources.includes("authMutationAllowed: true"));
addCheck("deploy/release/export/package disabled", !runtimeSources.includes("deployExecutionAllowed: true") && !runtimeSources.includes("releaseExecutionAllowed: true") && !runtimeSources.includes("exportExecutionAllowed: true") && !runtimeSources.includes("packageCreationAllowed: true"));
addCheck("project and runtime paths remain forbidden", runtimeSources.includes("projects/**") && runtimeSources.includes("db/**") && runtimeSources.includes("providers/**") && runtimeSources.includes("tools/**") && runtimeSources.includes("worker-runtime/**"));
addCheck("final report path is distinct", REPORT_PATH.endsWith("p787-final-validation-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P78 Self-Healing Enterprise Developer Preview for NEXUS OS.",
        "- Validates completed subphases, Command Center Enterprise Preview UX, dashboard validation, reports, docs, roadmap, and phase status.",
        "- Does not enable founder intake execution, autonomous Q&A, PRD generation, agent dispatch, self-healing apply, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, package, auth/session/user/workspace mutation, certification, attestation, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p787-final-validation",
        "- npm run check:p786-tests-checkers-docs",
        "- npm run check:p785-command-center-enterprise-preview-ux",
        "- npm run check:p784",
        "- npm run check:p783",
        "- npm run check:p782",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Enterprise Preview route\"",
        "- cd dashboard && npm run test:unit",
        "- cd dashboard && npm run build",
        "- npm run check:p78-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P78 closes enterprise developer preview readiness only.",
        "- Founder intake execution, autonomous Q&A, PRD generation, agent dispatch, self-healing apply, DB writes, project mutation, provider/tool/worker execution, network calls, deploy/release/export/package execution, auth/session/user/workspace mutation, certification/attestation, and provider spend remain disabled.",
        "- Future governed runtime phases must explicitly authorize real execution before NEXUS can mutate project files, dispatch agents, call providers, or spend budget.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P78.7 Final Validation Report", phase: "P78.7" },
);

printCheckReport("P78.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
