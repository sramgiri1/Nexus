import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUSINESS_BUILD_PRD_REQUIRED_FIELDS,
  createBusinessBuildPrdDraft,
  validateBusinessBuildPrdDraft,
} from "../business-build/businessBuildPrdSchema.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p812-prd-schema-report.md";

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
const status = readJson("os-roadmap/phase-status.json");
const phases = readJson("os-roadmap/nexus-phases.json").phases || [];
const phaseById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map(phases.map((entry) => [entry.phaseId, entry]));
const docs = readText("docs/architecture/P81_BUSINESS_BUILD_ORCHESTRATION_PLAN.md");
const contract = readText("contracts/os-roadmap/p81-execution-contracts.json");
const source = readText("business-build/businessBuildPrdSchema.js");

const partialDraft = createBusinessBuildPrdDraft({
  founderIdeaSummary: "Founder wants to build an operations automation company.",
  answers: {
    targetCustomer: "operations leaders",
    problem: "manual handoffs delay launches",
    proposedSolution: "guided automation workspace",
  },
});
const completeDraft = createBusinessBuildPrdDraft({
  founderIdeaSummary: "Founder wants to build an operations automation company.",
  answers: {
    targetCustomer: "operations leaders",
    problem: "manual handoffs delay launches",
    currentAlternatives: "spreadsheets and status meetings",
    proposedSolution: "guided automation workspace",
    businessModel: "seat-based SaaS",
    goToMarket: "founder-led sales to operations teams",
    constraints: "small founding team and limited budget",
    successCriteria: "reduce launch handoff time by 30 percent",
  },
});
const partialValidation = validateBusinessBuildPrdDraft(partialDraft);
const completeValidation = validateBusinessBuildPrdDraft(completeDraft);
const dangerousFlags = [
  "providerCallsAllowed",
  "prdGenerationAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "providerSpendAllowed",
];

addCheck("module exists", fileExists("business-build/businessBuildPrdSchema.js"));
addCheck("required fields represented", BUSINESS_BUILD_PRD_REQUIRED_FIELDS.includes("businessModel") && BUSINESS_BUILD_PRD_REQUIRED_FIELDS.includes("risks"));
addCheck("partial draft validates", partialValidation.valid, partialValidation.errors.join("; "));
addCheck("complete draft validates", completeValidation.valid, completeValidation.errors.join("; "));
addCheck("partial draft reports missing fields", partialDraft.data.missingFields.includes("businessModel") && partialDraft.data.readyForWorkstreams === false);
addCheck("complete draft reaches workstream readiness", completeDraft.data.readyForWorkstreams === true && completeDraft.data.missingFields.length === 0);
addCheck("maps founder intake to PRD fields", completeDraft.data.prdFields.solution.includes("guided automation") && completeDraft.data.prdFields.targetCustomer.includes("operations"));
addCheck("dangerous runtime flags false", dangerousFlags.every((flag) => partialDraft.data[flag] === false && completeDraft.data[flag] === false));
addCheck("no fake runnable PRD action", !/generate now|create project|dispatch agent|deploy now|run now/i.test(JSON.stringify(completeDraft.data)));
addCheck("source has no provider/tool/project imports", !source.includes("../providers") && !source.includes("../tools") && !source.includes("../projects"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p812-prd-schema"]));
addCheck("contract references exact module", contract.includes("business-build/businessBuildPrdSchema.js") && contract.includes("check:p812-prd-schema"));
addCheck("docs mention P81.2 validation", docs.includes("P81.2 Founder Idea to PRD Schema") && docs.includes("npm run check:p812-prd-schema"));
addCheck("phase status advanced", phaseById.get("P81.2")?.status === "complete" && ["P81.2", "P81.3", "P81.4", "P81.5", "P81.6", "P81.7"].includes(status.currentPhase));
addCheck(
  "P81 remains active or complete",
  (phaseById.get("P81")?.status === "in_progress" && ["P81.3", "P81.4", "P81.5", "P81.6", "P81.7"].includes(phaseById.get("P81")?.nextPhase)) ||
    (phaseById.get("P81")?.status === "complete" && phaseById.get("P81")?.nextPhase === "P82"),
);
addCheck("roadmap P81.2 complete", roadmapById.get("P81.2")?.status === "complete");
addCheck("report path is distinct", REPORT_PATH.endsWith("p812-prd-schema-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P81.2 local founder idea to PRD draft schema.",
        "- Does not enable provider calls, PRD generation execution, agent dispatch, project creation, project mutation, DB writes, deploy, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p812-prd-schema",
        "- npm run check:p81-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P81.2 is a local PRD draft schema only. Workstream planning starts in P81.3.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P81.2 PRD Schema Report", phase: "P81.2" },
);

printCheckReport("P81.2 PRD Schema Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
