import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildLiveReadyActivationViewModel } from "../dashboard/src/data/liveReadyActivation.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p844-command-center-runtime-ux-report.md";

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
const activationText = JSON.stringify(activation);
const dataSource = readText("dashboard/src/data/liveReadyActivation.js");
const tests = readText("dashboard/tests/routes.spec.js");
const docs = readText("docs/architecture/P84_GOVERNED_FOUNDER_RUNTIME_ADMISSION_PLAN.md");
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));

const founderRuntimeRow = activation.readinessRows.find((row) => row.label === "Founder Q&A to PRD Runtime");
const founderAgentRow = activation.readinessRows.find((row) => row.label === "Founder Agent Plan Admission");
const unsafeFlags = [
  "executionEnabled",
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

addCheck("founder runtime row visible", Boolean(founderRuntimeRow), "Founder Q&A to PRD Runtime");
addCheck("agent plan row visible", Boolean(founderAgentRow), "Founder Agent Plan Admission");
addCheck("founder rows are ready", founderRuntimeRow?.readinessLabel === "Ready" && founderAgentRow?.readinessLabel === "Ready");
addCheck("agent plan state surfaced", founderAgentRow?.currentState === "agent_plan_admitted_for_local_planning");
addCheck("owner capability surfaced", founderAgentRow?.ownerCapability === "NEXUS Founder Agent Plan Admission");
addCheck("evidence/activity/cost present", [founderRuntimeRow, founderAgentRow].every((row) => row?.evidenceLocation && row?.activityLocation && row?.costImpact));
addCheck("founder runtime helper reused", dataSource.includes("buildFounderRuntimeEnvelope"));
addCheck("agent admission evidence referenced", dataSource.includes("reports/p843-agent-plan-admission-preview-report.md"));
addCheck("unsafe runtime remains disabled", unsafeFlags.every((flag) => activation.safety?.[flag] === false));
addCheck("no fake runnable actions", !/dispatch now|run agent|execute now|call provider now|write project now|deploy now|spend now/i.test(activationText));
addCheck("no raw private ids", !/"projectId"|"rawId"|"privateId"|"databaseId"|private-project/i.test(activationText));
addCheck("Playwright coverage updated", tests.includes("Founder Q&A to PRD Runtime") && tests.includes("Founder Agent Plan Admission"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p844-command-center-runtime-ux"]));
addCheck("docs mention P84.4 validation", docs.includes("P84.4 Command Center Runtime UX") && docs.includes("npm run check:p844-command-center-runtime-ux"));
addCheck(
  "phase status advanced",
  statusById.get("P84.4")?.status === "complete" &&
    ["P84.4", "P84.5", "P84.6", "P84.7"].includes(status.currentPhase),
);
addCheck("report prerequisites exist", fileExists("reports/p843-agent-plan-admission-preview-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P84.4 Command Center Live Readiness runtime UX.",
        "- Confirms founder Q&A to PRD runtime and founder agent plan admission rows are visible through existing Live Readiness data.",
        "- Confirms the UX remains display-only and does not create runnable actions.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Command Center UX",
      body: [
        `- Current state: ${activation.currentState}`,
        `- Next action: ${activation.nextAction}`,
        `- Founder runtime row: ${founderRuntimeRow?.currentState || "missing"}`,
        `- Agent plan row: ${founderAgentRow?.currentState || "missing"}`,
        `- Cost impact: ${activation.costImpact}`,
      ].join("\n"),
    },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p844-command-center-runtime-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live Ready\"",
        "- npm run check:p843-agent-plan-admission-preview",
        "- npm run check:p84-execution-plan",
        "- npm run check:os-phase-status",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P84.4 updates Command Center runtime visibility only. It does not enable providers, agents, tools, workers, project mutation, DB writes, deploy, release, export, package creation, network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P84.4 Command Center Runtime UX Report", phase: "P84.4" },
);

printCheckReport("P84.4 Command Center Runtime UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
