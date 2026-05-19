import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildLiveReadinessViewModel } from "../dashboard/src/data/liveReadiness.js";
import { buildLiveReadyActivationViewModel } from "../dashboard/src/data/liveReadyActivation.js";
import { buildDeployReleaseAdmissionGate } from "../live-ready/deployReleaseAdmission.js";
import { buildProjectDbAdmissionGate } from "../live-ready/projectDbAdmission.js";
import { buildProviderToolGateProfiles } from "../live-ready/providerToolGateProfiles.js";
import { buildWorkerExecutionGate } from "../live-ready/workerExecutionGate.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p826-command-center-live-ready-ux-report.md";

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

const activation = buildLiveReadyActivationViewModel();
const readiness = buildLiveReadinessViewModel();
const providerToolGate = buildProviderToolGateProfiles({ mode: "live" });
const workerGate = buildWorkerExecutionGate({ mode: "live" });
const projectDbGate = buildProjectDbAdmissionGate({ mode: "live" });
const deployReleaseGate = buildDeployReleaseAdmissionGate({ mode: "live" });
const activationText = JSON.stringify(activation);
const readinessText = JSON.stringify(readiness);
const routesSource = readText("dashboard/src/data/commandCenterRoutes.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const testsSource = readText("dashboard/tests/routes.spec.js");
const packageJson = readJson("package.json");
const phaseStatus = readJson("os-roadmap/phase-status.json");
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const docs = readText("docs/architecture/P82_LIVE_READY_ACTIVATION_PLAN.md");

const requiredLabels = ["Ready", "Needs setup", "Blocked by policy"];
const forbiddenRuntimeFlags = [
  "executionEnabled",
  "providerCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "deployExecutionAllowed",
  "providerSpendAllowed",
];

addCheck("activation view model has rows", Array.isArray(activation.readinessRows) && activation.readinessRows.length >= 10);
addCheck("activation labels are evidence-backed", requiredLabels.every((label) => activation.labelSummary?.[label] >= 1));
addCheck(
  "activation rows match P82 gate outputs",
  [
    ...(providerToolGate.data?.profiles || []).map((row) => row.label),
    "Worker Execution",
    ...(projectDbGate.data?.admissionRows || []).map((row) => row.label),
    ...(deployReleaseGate.data?.admissionRows || []).map((row) => row.label),
  ].every((label) => activation.readinessRows.some((row) => row.label === label)),
);
addCheck("readiness view model exposes activation rows", Array.isArray(readiness.activationRows) && readiness.activationRows.length === activation.readinessRows.length);
addCheck("primary UX fields are present", ["currentState", "nextAction", "disabledReason", "ownerCapability", "evidenceLocation", "activityLocation", "costImpact"].every((field) => activationText.includes(field) && readinessText.includes(field)));
addCheck("runtime flags remain disabled", forbiddenRuntimeFlags.every((flag) => activation.safety?.[flag] === false && readiness.safety?.[flag] === false));
addCheck("live readiness sidebar badge is ready", /key:\s*"liveReadiness"[\s\S]*?badge:\s*"Ready"/.test(routesSource));
addCheck("founder intake sidebar badge is ready", /key:\s*"founderIntake"[\s\S]*?badge:\s*"Ready"/.test(routesSource));
addCheck("business build sidebar badge is needs setup", /key:\s*"businessBuild"[\s\S]*?badge:\s*"Needs setup"/.test(routesSource));
addCheck("live readiness tabs use governed labels", /LIVE_READINESS_TABS[\s\S]*badge:\s*"Ready"[\s\S]*badge:\s*"Needs setup"[\s\S]*badge:\s*"Blocked by policy"/.test(tabsSource));
addCheck("founder and business tabs use governed labels", /FOUNDER_INTAKE_TABS[\s\S]*badge:\s*"Ready"[\s\S]*BUSINESS_BUILD_TABS[\s\S]*badge:\s*"Needs setup"/.test(tabsSource));
addCheck("Command Center renders activation rows", pageSource.includes("readiness.activationRows") && pageSource.includes("gate.readinessLabel"));
addCheck("Playwright coverage updated", testsSource.includes("Live Ready route renders evidence-backed activation labels") && testsSource.includes("Business Build\\s+NEEDS SETUP"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p826-command-center-live-ready-ux"]));
addCheck("docs mention P82.6 completion", docs.includes("Status: complete. P82.6"));
addCheck("phase status advanced", statusById.get("P82.6")?.status === "complete" && phaseStatus.currentPhase === "P82.6" && phaseStatus.nextPhase === "P82.7");
addCheck("report prerequisites exist", fileExists("reports/p825-deploy-release-admission-report.md") && fileExists("reports/p824-project-db-admission-report.md") && fileExists("reports/p823-worker-execution-gate-report.md") && fileExists("reports/p822-provider-tool-gates-report.md"));
addCheck("no fake runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(`${activationText}\n${readinessText}\n${pageSource}`));
addCheck("no DemoApp or raw private IDs", !`${activationText}\n${readinessText}`.includes("DemoApp") && !/(?:private-project-|private_project_|project_[A-Za-z0-9_-]*\d|token_|tenant_|workspace_)/.test(`${activationText}\n${readinessText}`));
addCheck("no raw JSON or logs in primary UX", !/raw JSON|raw logs|policy dumps/i.test(`${activationText}\n${readinessText}`));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P82.6 Command Center live-ready label cleanup.",
        "- Reuses P82.2 provider/tool gates, P82.3 worker gate, P82.4 project/DB admission, and P82.5 deploy/release admission.",
        "- Keeps provider calls, tool execution, worker execution, project mutation, DB writes, deploy, release, export, package creation, network calls, auth/session/user/workspace mutation, and provider spend disabled.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p826-command-center-live-ready-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live Ready\"",
        "- cd dashboard && npm run test:unit",
        "- cd dashboard && npm run build",
        "- npm run check:p825-deploy-release-admission",
        "- npm run check:p824-project-db-admission",
        "- npm run check:p823-worker-execution-gate",
        "- npm run check:p822-provider-tool-gates",
        "- npm run check:p82-execution-plan",
        "- npm run check:p817-final-validation",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P82.6 updates display-safe Command Center readiness only.",
        "- Runtime execution and cost-bearing actions remain blocked until a later explicit activation phase.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P82.6 Command Center Live Ready UX Report", phase: "P82.6" },
);

printCheckReport("P82.6 Command Center Live Ready UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
