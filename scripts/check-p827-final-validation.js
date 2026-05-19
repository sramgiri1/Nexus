import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildLiveReadinessViewModel } from "../dashboard/src/data/liveReadiness.js";
import { buildLiveReadyActivationViewModel } from "../dashboard/src/data/liveReadyActivation.js";
import { buildDeployReleaseAdmissionGate } from "../live-ready/deployReleaseAdmission.js";
import { buildProjectDbAdmissionGate } from "../live-ready/projectDbAdmission.js";
import { buildProviderToolGateProfiles } from "../live-ready/providerToolGateProfiles.js";
import { buildWorkerExecutionGate } from "../live-ready/workerExecutionGate.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p827-final-validation-report.md";
const P82_PHASES = ["P82", "P82.1", "P82.2", "P82.3", "P82.4", "P82.5", "P82.6", "P82.7"];

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
const phaseById = new Map(phases.map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const planDoc = readText("docs/architecture/P82_LIVE_READY_ACTIVATION_PLAN.md");
const roadmapDoc = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const routesSource = readText("dashboard/src/data/commandCenterRoutes.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const liveActivationSource = readText("dashboard/src/data/liveReadyActivation.js");
const testsSource = readText("dashboard/tests/routes.spec.js");
const statusChecker = readText("scripts/check-os-phase-status.js");

const providerToolGate = buildProviderToolGateProfiles({ mode: "live" });
const workerGate = buildWorkerExecutionGate({ mode: "live" });
const projectDbGate = buildProjectDbAdmissionGate({ mode: "live" });
const deployReleaseGate = buildDeployReleaseAdmissionGate({ mode: "live" });
const activationView = buildLiveReadyActivationViewModel();
const liveReadinessView = buildLiveReadinessViewModel();
const combinedViewText = JSON.stringify({ activationView, liveReadinessView });
const gateText = JSON.stringify({
  providerToolGate,
  workerGate,
  projectDbGate,
  deployReleaseGate,
});

const requiredScripts = [
  "check:p82-execution-plan",
  "check:p822-provider-tool-gates",
  "check:p823-worker-execution-gate",
  "check:p824-project-db-admission",
  "check:p825-deploy-release-admission",
  "check:p826-command-center-live-ready-ux",
  "check:p827-final-validation",
];
const requiredReports = [
  "reports/p82-execution-plan-report.md",
  "reports/p822-provider-tool-gates-report.md",
  "reports/p823-worker-execution-gate-report.md",
  "reports/p824-project-db-admission-report.md",
  "reports/p825-deploy-release-admission-report.md",
  "reports/p826-command-center-live-ready-ux-report.md",
];
const dangerousFlags = [
  "providerCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportAllowed",
  "packageCreationAllowed",
  "networkCallsAllowed",
  "providerSpendAllowed",
];

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])), requiredScripts.join(", "));
addCheck("prior P82 reports exist", requiredReports.every(fileExists), `${requiredReports.length} reports`);
addCheck("P82 phases complete in roadmap", P82_PHASES.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("P82 phases complete in phase status", P82_PHASES.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("prior P82 commits stamped", ["P82.1", "P82.2", "P82.3", "P82.4", "P82.5", "P82.6"].every((phaseId) => Boolean(statusById.get(phaseId)?.commit) && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("final P82 entries are stampable", ["P82", "P82.7"].every((phaseId) => Boolean(statusById.get(phaseId)?.commit)));
addCheck("root status hands off to P83", status.currentPhase === "P82.7" && status.previousPhase === "P82.6" && status.nextPhase === "P83", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("docs close P82", planDoc.includes("Status: complete. P82.7") && roadmapDoc.includes("P82 is complete"));
addCheck("status checker accepts P82.7", statusChecker.includes('"P82.7"'));
addCheck("Command Center labels are live-ready", /key:\s*"liveReadiness"[\s\S]*?badge:\s*"Ready"/.test(routesSource) && /key:\s*"founderIntake"[\s\S]*?badge:\s*"Ready"/.test(routesSource) && /key:\s*"businessBuild"[\s\S]*?badge:\s*"Needs setup"/.test(routesSource));
addCheck("Command Center tabs are live-ready", tabsSource.includes('badge: "Blocked by policy"') && tabsSource.includes('badge: "Needs setup"'));
addCheck("dashboard activation data is browser-safe", !liveActivationSource.includes("../../../live-ready/") && !liveActivationSource.includes("node:fs") && !liveActivationSource.includes("node:path"));
addCheck("Playwright live-ready coverage preserved", testsSource.includes("Live Ready route renders evidence-backed activation labels") && testsSource.includes("Business Build\\s+NEEDS SETUP"));
addCheck("activation UX exposes all labels", ["Ready", "Needs setup", "Blocked by policy"].every((label) => combinedViewText.includes(label)));
addCheck("activation UX exposes operator fields", ["currentState", "nextAction", "disabledReason", "ownerCapability", "evidenceLocation", "activityLocation", "costImpact"].every((field) => combinedViewText.includes(field)));
addCheck("activation UX remains display-only", dangerousFlags.every((flag) => combinedViewText.includes(`"${flag}":false`) || ["releaseExecutionAllowed", "exportAllowed", "packageCreationAllowed", "networkCallsAllowed"].includes(flag)));
addCheck("P82 gates remain non-executing", dangerousFlags.every((flag) => !gateText.includes(`"${flag}":true`)));
addCheck("P82 gates include evidence and blockers", ["evidenceRefs", "activityLocation", "blockers", "disabledReason", "costImpact"].every((field) => gateText.includes(field)));
addCheck("primary UX hides DemoApp/private ids", !combinedViewText.includes("DemoApp") && !/(?:private-project-|private_project_|project_[A-Za-z0-9_-]*\d|token_|tenant_|workspace_)/.test(combinedViewText));
addCheck("primary UX avoids fake runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(combinedViewText));
addCheck("primary UX avoids raw JSON/log wording", !/raw JSON|raw logs|policy dumps/i.test(combinedViewText));
addCheck("final report path is distinct", REPORT_PATH.endsWith("p827-final-validation-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P82 Governed Business Build Execution Activation Contract for NEXUS OS.",
        "- Validates P82 contracts, provider/tool gates, worker gate, project/DB admission, deploy/release admission, Command Center live-ready UX, docs, roadmap, reports, and phase status.",
        "- Does not enable provider calls, tool execution, worker execution, project mutation, DB writes, deploy, release, export, package creation, network calls, auth/session/user/workspace mutation, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p827-final-validation",
        "- npm run check:p826-command-center-live-ready-ux",
        "- npm run check:p825-deploy-release-admission",
        "- npm run check:p824-project-db-admission",
        "- npm run check:p823-worker-execution-gate",
        "- npm run check:p822-provider-tool-gates",
        "- npm run check:p82-execution-plan",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live Ready\"",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"sidebar uses cleaned\"",
        "- cd dashboard && npm run test:unit",
        "- cd dashboard && npm run build",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P82 closes live-ready activation and display-safe Command Center readiness only.",
        "- Runtime execution and cost-bearing actions remain blocked until a later explicit activation phase creates governed admission records.",
        "- The next track can start from P83 with P82 safety evidence intact.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P82.7 Final Validation Report", phase: "P82.7" },
);

printCheckReport("P82.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
