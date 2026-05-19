import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createFounderIntakeSessionEnvelope, FOUNDER_INTAKE_REQUIRED_FIELDS, validateFounderIntakeSession } from "../founder-intake/founderIntakeSchema.js";
import { validateResultEnvelope } from "../shared/resultEnvelope.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p801-founder-intake-schema-report.md";

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
const source = readText("founder-intake/founderIntakeSchema.js");
const status = readJson("os-roadmap/phase-status.json");
const phaseById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const envelope = createFounderIntakeSessionEnvelope({
  founderIdeaSummary: "Founder wants to validate a B2B workflow product.",
  founderNotes: "apiKey",
  answers: {
    targetCustomer: "operations leaders",
    problem: "manual handoffs",
  },
  approval: {
    operatorApproval: true,
    scopeBoundary: true,
    budgetLimit: true,
    rollbackPlan: true,
    activityLedger: true,
    costLedger: true,
    redactionCheck: true,
  },
});
const fullEnvelope = createFounderIntakeSessionEnvelope({
  answers: Object.fromEntries(FOUNDER_INTAKE_REQUIRED_FIELDS.map((field) => [field, `${field} answer`])),
});
const validation = validateFounderIntakeSession(envelope);
const envelopeValidation = validateResultEnvelope(envelope);
const fullValidation = validateFounderIntakeSession(fullEnvelope);
const dangerousFlags = [
  "providerCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "providerSpendAllowed",
];

addCheck("module exists", fileExists("founder-intake/founderIntakeSchema.js"));
addCheck("required fields represented", FOUNDER_INTAKE_REQUIRED_FIELDS.length >= 8 && FOUNDER_INTAKE_REQUIRED_FIELDS.includes("businessModel"));
addCheck("partial envelope validates", validation.valid, validation.errors.join("; "));
addCheck("result envelope validates", envelopeValidation.valid, envelopeValidation.errors.join("; "));
addCheck("full answer state reaches readiness", fullValidation.valid && fullEnvelope.data.answerState.readyForComprehension === true && fullEnvelope.data.comprehensionScore.ready === true);
addCheck("missing fields are explicit", envelope.data.answerState.missingFields.includes("businessModel"));
addCheck("dangerous runtime flags false", dangerousFlags.every((flag) => envelope.data[flag] === false));
addCheck("approval state represented", Object.values(envelope.data.approvalState).every((value) => value === true));
addCheck("evidence and activity visible", envelope.data.evidenceRefs.length > 0 && envelope.data.activityRefs.length > 0);
addCheck("cost impact visible", envelope.data.costImpact.includes("No model calls") && envelope.data.costImpact.includes("provider spend"));
addCheck("forbidden paths represented", envelope.data.forbiddenFiles.includes("projects/**") && envelope.data.forbiddenFiles.includes("providers/**") && envelope.data.forbiddenFiles.includes("careloop/**"));
addCheck("source has no provider/tool/project imports", !source.includes("../providers") && !source.includes("../tools") && !source.includes("../projects"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p801-founder-intake-schema"]));
addCheck("contract references exact module", contract.includes("founder-intake/founderIntakeSchema.js") && contract.includes("check:p801-founder-intake-schema"));
addCheck("docs mention P80.1 validation", docs.includes("P80.1 Schema / Policy / Contract") && docs.includes("npm run check:p801-founder-intake-schema"));
addCheck("phase status advanced", phaseById.get("P80")?.status === "in_progress" && phaseById.get("P80.1")?.status === "complete" && ["P80.1", "P80.2", "P80.3", "P80.4", "P80.5", "P80.6", "P80.7"].includes(status.currentPhase));
addCheck("report path is distinct", REPORT_PATH.endsWith("p801-founder-intake-schema-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P80.1 founder intake schemas and blocked runtime policy.",
        "- Does not ask founder questions, call providers, execute tools/workers, mutate projects, write DB rows, deploy, or spend budget.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
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
      body: "- P80.1 is schema/policy only. Local intake session transitions begin in P80.2.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P80.1 Founder Intake Schema Report", phase: "P80.1" },
);

printCheckReport("P80.1 Founder Intake Schema Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
