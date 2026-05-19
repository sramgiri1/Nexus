import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FOUNDER_INTAKE_REQUIRED_FIELDS } from "../founder-intake/founderIntakeSchema.js";
import { advanceFounderIntakeSession, createFounderIntakeSession, summarizeFounderIntakeSession } from "../founder-intake/founderIntakeSession.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p802-founder-intake-session-report.md";

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
const contract = readText("contracts/os-roadmap/p80-execution-contracts.json");
const docs = readText("docs/architecture/P80_FOUNDER_INTAKE_RUNTIME_PLAN.md");
const source = readText("founder-intake/founderIntakeSession.js");
const status = readJson("os-roadmap/phase-status.json");
const phaseById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));

const startingSession = createFounderIntakeSession({
  founderIdeaSummary: "B2B workflow automation for finance teams.",
  answers: { targetCustomer: "finance operators" },
});
const advanced = advanceFounderIntakeSession(startingSession, { field: "problem", answer: "month-end reconciliation is manual" });
const blocked = advanceFounderIntakeSession(startingSession, { field: "privateProjectId", answer: "private-project-01" });
let complete = startingSession;
for (const field of FOUNDER_INTAKE_REQUIRED_FIELDS) {
  complete = advanceFounderIntakeSession(complete, { field, answer: `${field} answer` });
}
const summary = summarizeFounderIntakeSession(advanced);
const completeSummary = summarizeFounderIntakeSession(complete);
const dangerousFlags = ["providerCallsAllowed", "toolExecutionAllowed", "workerExecutionAllowed", "projectMutationAllowed", "dbWritesAllowed", "deployExecutionAllowed", "providerSpendAllowed"];

addCheck("module exists", fileExists("founder-intake/founderIntakeSession.js"));
addCheck("create session initializes local state", startingSession.stage === "collecting_answers" && startingSession.missingFields.includes("problem"));
addCheck("advance applies supported field", advanced.answers.problem === "month-end reconciliation is manual" && advanced.lastTransition.status === "applied");
addCheck("advance is immutable", !("problem" in startingSession.answers));
addCheck("unsupported field is blocked", blocked.lastTransition.status === "blocked" && blocked.projectMutationAllowed === false);
addCheck("complete session reaches readiness", complete.stage === "ready_for_comprehension" && complete.readiness.readyForComprehension === true);
addCheck("summary has Command Center fields", ["currentState", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceLocation", "activityLocation", "costImpact"].every((field) => field in summary));
addCheck("summary avoids private raw ids", !JSON.stringify(summary).includes("private-project-01"));
addCheck("dangerous runtime flags false", dangerousFlags.every((flag) => advanced[flag] === false && summary[flag] === false && completeSummary[flag] === false));
addCheck("source has no provider/tool/project imports", !source.includes("../providers") && !source.includes("../tools") && !source.includes("../projects"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p802-founder-intake-session"]));
addCheck("contract references exact module", contract.includes("founder-intake/founderIntakeSession.js") && contract.includes("check:p802-founder-intake-session"));
addCheck("docs mention P80.2 validation", docs.includes("P80.2 Core Intake Session Model") && docs.includes("npm run check:p802-founder-intake-session"));
addCheck("phase status advanced", phaseById.get("P80.2")?.status === "complete" && ["P80.2", "P80.3", "P80.4", "P80.5", "P80.6", "P80.7"].includes(status.currentPhase));
addCheck("P80 remains in progress", phaseById.get("P80")?.status === "in_progress" && ["P80.3", "P80.4", "P80.5", "P80.6", "P80.7"].includes(phaseById.get("P80")?.nextPhase));
addCheck("report path is distinct", REPORT_PATH.endsWith("p802-founder-intake-session-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P80.2 local founder intake session state transitions.",
        "- Does not call providers, execute tools/workers, mutate projects, write DB rows, deploy, or spend budget.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p802-founder-intake-session",
        "- npm run check:p801-founder-intake-schema",
        "- npm run check:p80-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P80.2 is local session state only. Guided Q&A selection starts in P80.3.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P80.2 Founder Intake Session Report", phase: "P80.2" },
);

printCheckReport("P80.2 Founder Intake Session Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
