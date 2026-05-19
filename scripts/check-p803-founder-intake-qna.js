import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FOUNDER_INTAKE_REQUIRED_FIELDS } from "../founder-intake/founderIntakeSchema.js";
import { createFounderIntakeSession } from "../founder-intake/founderIntakeSession.js";
import { scoreFounderComprehension } from "../founder-intake/founderIntakeComprehension.js";
import { mergeFounderAnswer, selectNextFounderQuestion } from "../founder-intake/founderIntakeQuestions.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p803-founder-intake-qna-report.md";

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
const questionSource = readText("founder-intake/founderIntakeQuestions.js");
const comprehensionSource = readText("founder-intake/founderIntakeComprehension.js");
const status = readJson("os-roadmap/phase-status.json");
const phaseById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));

const session = createFounderIntakeSession({ answers: { targetCustomer: "independent clinics" } });
const firstQuestion = selectNextFounderQuestion(session);
const merged = mergeFounderAnswer(session, { question: firstQuestion, answer: "Scheduling work is manual and error-prone." });
const partialScore = scoreFounderComprehension(merged.session);
let complete = session;
for (const field of FOUNDER_INTAKE_REQUIRED_FIELDS) {
  complete = mergeFounderAnswer(complete, { field, answer: `${field} answer with enough detail` }).session;
}
const completeScore = scoreFounderComprehension(complete);
const blockedMerge = mergeFounderAnswer(session, { field: "privateProjectId", answer: "private-project-01" });
const dangerousFlags = ["providerCallsAllowed", "toolExecutionAllowed", "workerExecutionAllowed", "projectMutationAllowed", "dbWritesAllowed", "deployExecutionAllowed", "providerSpendAllowed"];

addCheck("question module exists", fileExists("founder-intake/founderIntakeQuestions.js"));
addCheck("comprehension module exists", fileExists("founder-intake/founderIntakeComprehension.js"));
addCheck("selects first missing field", firstQuestion.field === "problem" && firstQuestion.prompt.includes("workflow"));
addCheck("merge applies answer through session model", merged.session.answers.problem === "Scheduling work is manual and error-prone.");
addCheck("merge blocks unsupported fields", blockedMerge.session.lastTransition?.status === "blocked" && !JSON.stringify(blockedMerge).includes("private-project-01"));
addCheck("partial score reports missing fields", partialScore.ready === false && partialScore.missingFields.includes("businessModel"));
addCheck("complete score reaches readiness", completeScore.ready === true && completeScore.comprehensionScore === 1);
addCheck("next question shape is complete", ["questionId", "prompt", "answer", "missingFields", "confidence", "nextAction"].every((field) => field in firstQuestion));
addCheck("dangerous runtime flags false", dangerousFlags.every((flag) => firstQuestion[flag] === false || firstQuestion[flag] === undefined) && dangerousFlags.every((flag) => merged[flag] === false && partialScore[flag] === false));
addCheck("source has no provider/tool/project imports", !questionSource.includes("../providers") && !questionSource.includes("../tools") && !questionSource.includes("../projects") && !comprehensionSource.includes("../providers") && !comprehensionSource.includes("../tools") && !comprehensionSource.includes("../projects"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p803-founder-intake-qna"]));
addCheck("contract references exact modules", contract.includes("founder-intake/founderIntakeQuestions.js") && contract.includes("founder-intake/founderIntakeComprehension.js") && contract.includes("check:p803-founder-intake-qna"));
addCheck("docs mention P80.3 validation", docs.includes("P80.3 Guided Q&A Comprehension Loop") && docs.includes("npm run check:p803-founder-intake-qna"));
addCheck("phase status advanced", phaseById.get("P80.3")?.status === "complete" && ["P80.3", "P80.4", "P80.5", "P80.6", "P80.7"].includes(status.currentPhase));
addCheck("P80 remains in progress", phaseById.get("P80")?.status === "in_progress" && ["P80.4", "P80.5", "P80.6", "P80.7"].includes(phaseById.get("P80")?.nextPhase));
addCheck("report path is distinct", REPORT_PATH.endsWith("p803-founder-intake-qna-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P80.3 deterministic founder intake question selection, answer merge, and comprehension scoring.",
        "- Does not call providers, execute tools/workers, mutate projects, write DB rows, deploy, or spend budget.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p803-founder-intake-qna",
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
      body: "- P80.3 is deterministic local Q&A/comprehension only. Command Center founder intake UX starts in P80.4.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P80.3 Founder Intake Q&A Report", phase: "P80.3" },
);

printCheckReport("P80.3 Founder Intake Q&A Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
