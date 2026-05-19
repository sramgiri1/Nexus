import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  appendFounderQnaTurn,
  createFounderQnaTurnState,
  validateFounderQnaTurnState,
} from "../live-ready/enterpriseFounderQnaTurnState.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p852-founder-turn-state-report.md";

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

const starting = createFounderQnaTurnState({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const first = appendFounderQnaTurn(starting, "The first customers are casual iPhone players who want a clean arcade game.");
const second = appendFounderQnaTurn(first, "The problem is existing Snake games are cluttered with ads and weak touch controls.");
const validation = validateFounderQnaTurnState(second);
const stateText = JSON.stringify(second);
const moduleSource = readText("live-ready/enterpriseFounderQnaTurnState.js");
const dashboardSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
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

addCheck("initial state passes", starting.ok === true && validateFounderQnaTurnState(starting).valid);
addCheck("append creates chronological turns", second.data.turns.length === 6 && second.data.turns[2].speaker === "founder" && second.data.turns[3].speaker === "nexus");
addCheck("answers advance deterministically", second.data.answers.targetCustomer.includes("casual iPhone players") && second.data.answers.problem.includes("existing Snake games"));
addCheck("state validation passes", validation.valid, validation.errors.join("; "));
addCheck("PRD and agent flow update", second.data.prdDraft.readyForWorkstreams === false && Array.isArray(second.data.agentFlow) && second.data.agentFlow.length === 8);
addCheck("unsafe execution remains false", blockedFlags.every((flag) => second.data[flag] === false && second.data.safety?.[flag] === false));
addCheck("P80 helpers reused", moduleSource.includes("createFounderIntakeSession") && moduleSource.includes("mergeFounderAnswer") && moduleSource.includes("selectNextFounderQuestion"));
addCheck("P85.1 runtime reused", moduleSource.includes("buildEnterpriseFounderBusinessRuntime"));
addCheck("shared result envelope reused", moduleSource.includes("createPassResult"));
addCheck("no provider/tool/project imports", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/"));
addCheck("Command Center uses qna state", dashboardSource.includes("appendFounderQnaTurn") && dashboardSource.includes("nexus-lite-founder-qna-state") && dashboardSource.includes("Reset"));
addCheck("Playwright coverage added", tests.includes("Command Center Lite route renders interactive founder chat") && tests.includes("founder_qna_collecting_answers"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p852-founder-turn-state"]));
addCheck("contract references P85.2 files", contract.includes("live-ready/enterpriseFounderQnaTurnState.js") && contract.includes("check:p852-founder-turn-state"));
addCheck("docs mention P85.2 validation", docs.includes("P85.2 Q&A Turn State Machine") && docs.includes("npm run check:p852-founder-turn-state"));
addCheck("phase status advanced", statusById.get("P85.2")?.status === "complete" && status.currentPhase === "P85.2" && status.nextPhase === "P85.3");
addCheck("report prerequisites exist", fileExists("reports/p851-enterprise-founder-session-report.md"));
addCheck("display payload has no private ids", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(stateText));
addCheck("no fake unsafe runnable actions", !/call provider now|dispatch agent now|write project now|deploy now|spend now|create project now/i.test(stateText));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P85.2 governed multi-turn founder Q&A state.",
        "- Stores founder/NEXUS turns locally, maps answers into PRD readiness, and keeps agent lanes non-dispatching.",
        "- Does not call providers/models, dispatch agents, execute tools/workers, mutate projects, write DB state, deploy, release, package, call networks, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Turn State",
      body: [
        `- Turns: ${second.data.turns.length}`,
        `- Answered fields: ${second.data.answeredFields.join(", ")}`,
        `- Missing fields: ${second.data.missingFields.join(", ")}`,
        `- Next action: ${second.data.nextAction}`,
      ].join("\n"),
    },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p852-founder-turn-state",
        "- npm run check:p85-execution-plan",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Command Center Lite route renders interactive founder chat\"",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P85.2 uses deterministic local field extraction. It can guide intake and PRD readiness, but provider/model reasoning, real agent dispatch, project mutation, DB writes, deploy, package, and spend remain disabled.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P85.2 Founder Turn State Report", phase: "P85.2" },
);

printCheckReport("P85.2 Founder Turn State Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
