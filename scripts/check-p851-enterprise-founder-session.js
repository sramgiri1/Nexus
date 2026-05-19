import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildEnterpriseFounderBusinessRuntime,
  validateEnterpriseFounderBusinessRuntime,
} from "../live-ready/enterpriseFounderBusinessRuntime.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p851-enterprise-founder-session-report.md";

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

const runtime = buildEnterpriseFounderBusinessRuntime({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const validation = validateEnterpriseFounderBusinessRuntime(runtime);
const runtimeText = JSON.stringify(runtime);
const moduleSource = readText("live-ready/enterpriseFounderBusinessRuntime.js");
const liveReadyData = readText("dashboard/src/data/liveReadyActivation.js");
const tests = readText("dashboard/tests/routes.spec.js");
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const docs = readText("docs/architecture/P85_ENTERPRISE_FOUNDER_BUSINESS_RUNTIME_PLAN.md");
const contract = readText("contracts/os-roadmap/p85-execution-contracts.json");

const blockedFlags = [
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "authSessionUserWorkspaceMutationAllowed",
  "providerSpendAllowed",
];

addCheck("runtime envelope passes", runtime.ok === true && runtime.status === "PASS");
addCheck("runtime validation passes", validation.valid, validation.errors.join("; "));
addCheck("session is display-safe", runtime.data.session.publicLabel === "Founder business session" && !/private-project|project_[A-Za-z0-9_-]*\d/i.test(runtimeText));
addCheck("PRD and agent plan are present", runtime.data.prdDraft.readyForWorkstreams === true && runtime.data.agentPlan.length === 8);
addCheck("required gates are ready", runtime.data.requiredGates.length >= 9 && Object.values(runtime.data.gateState).every(Boolean));
addCheck("unsafe execution remains false", blockedFlags.every((flag) => runtime.data[flag] === false));
addCheck("agent lanes remain non-dispatching", runtime.data.agentPlan.every((lane) => lane.dispatchAllowed === false && lane.workerExecutionAllowed === false && lane.projectMutationAllowed === false));
addCheck("P84 helper reused", moduleSource.includes("buildFounderRuntimeEnvelope") && moduleSource.includes("envelope.agentFlow"));
addCheck("shared helpers reused", moduleSource.includes("createPassResult") && moduleSource.includes("summarizeRedaction"));
addCheck("no provider/tool/project imports", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/"));
addCheck("Command Center row added", liveReadyData.includes("Enterprise Founder Business Runtime") && liveReadyData.includes("buildEnterpriseFounderBusinessRuntime"));
addCheck(
  "Playwright coverage added",
  tests.includes("Enterprise Founder Business Runtime") &&
    tests.includes("P85.1 creates a governed local founder business runtime session only.") &&
    tests.includes('not.toContainText("enterprise_founder_business_session_ready")'),
);
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p851-enterprise-founder-session"]));
addCheck("contract references P85.1 files", contract.includes("live-ready/enterpriseFounderBusinessRuntime.js") && contract.includes("check:p851-enterprise-founder-session"));
addCheck("docs mention P85.1 validation", docs.includes("P85.1 Runtime Session Contract") && docs.includes("npm run check:p851-enterprise-founder-session"));
addCheck(
  "phase status advanced",
  statusById.get("P85.1")?.status === "complete" &&
    ["P85.1", "P85.2", "P85.3", "P85.4", "P85.5", "P85.6", "P85.7"].includes(status.currentPhase) &&
    ["P85.2", "P85.3", "P85.4", "P85.5", "P85.6", "P85.7", "P86"].includes(status.nextPhase),
);
addCheck("report prerequisites exist", fileExists("reports/p847-final-validation-report.md"));
addCheck("no fake unsafe runnable actions", !/call provider now|dispatch agent now|write project now|deploy now|spend now|create project now/i.test(runtimeText));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P85.1 enterprise founder business runtime session.",
        "- Creates a governed local session record from the submitted founder idea, PRD draft, and admitted local agent plan.",
        "- Does not call providers/models, dispatch agents, execute tools/workers, mutate projects, write DB state, deploy, release, package, call networks, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Runtime Session",
      body: [
        `- Current state: ${runtime.data.currentState}`,
        `- Session label: ${runtime.data.session.publicLabel}`,
        `- PRD readiness: ${runtime.data.prdDraft.readinessPercent}%`,
        `- Agent lanes: ${runtime.data.agentPlan.length}`,
        `- Next action: ${runtime.data.nextAction}`,
      ].join("\n"),
    },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p851-enterprise-founder-session",
        "- npm run check:p85-execution-plan",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live Ready route renders evidence-backed activation labels without runnable actions\"",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P85.1 creates a local runtime session contract only. Provider/model calls, agent dispatch, project mutation, DB writes, workers, deploy, package, and spend remain disabled.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P85.1 Enterprise Founder Session Report", phase: "P85.1" },
);

printCheckReport("P85.1 Enterprise Founder Session Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
