import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUSINESS_BUILD_DISABLED_ACTIONS,
  BUSINESS_BUILD_MILESTONES,
  buildBusinessBuildPlan,
  validateBusinessBuildPlan,
} from "../business-build/businessBuildPlan.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p814-business-build-plan-report.md";

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
const source = readText("business-build/businessBuildPlan.js");

const completeInput = {
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
};
const partialInput = {
  founderIdeaSummary: "Founder wants to build an operations automation company.",
  answers: {
    targetCustomer: "operations leaders",
    problem: "manual handoffs delay launches",
    proposedSolution: "guided automation workspace",
  },
};

const completePlan = buildBusinessBuildPlan(completeInput);
const partialPlan = buildBusinessBuildPlan(partialInput);
const completeValidation = validateBusinessBuildPlan(completePlan);
const partialValidation = validateBusinessBuildPlan(partialPlan);
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
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
];

function flagsStayFalse(plan) {
  return dangerousFlags.every((flag) => plan.data[flag] === false);
}

addCheck("module exists", fileExists("business-build/businessBuildPlan.js"));
addCheck("disabled actions cover execution surfaces", BUSINESS_BUILD_DISABLED_ACTIONS.includes("provider_spend") && BUSINESS_BUILD_DISABLED_ACTIONS.includes("project_mutation"));
addCheck("milestone count is stable", BUSINESS_BUILD_MILESTONES.length === 5);
addCheck("complete plan reaches dry-run readiness", completePlan.data.currentState === "dry_run_business_build_plan_ready");
addCheck("complete plan has no blockers", completePlan.data.blockers.length === 0);
addCheck("partial plan blocks on PRD", partialPlan.data.currentState === "dry_run_business_build_plan_blocked" && partialPlan.data.blockers.length > 0);
addCheck("workstreams are embedded", completePlan.data.workstreams.length === 8);
addCheck("milestones expose display fields", completePlan.data.milestones.every((entry) => entry.ownerCapability && entry.inputs.length > 0 && entry.disabledReason));
addCheck("complete plan validates", completeValidation.valid, completeValidation.errors.join("; "));
addCheck("partial plan validates", partialValidation.valid, partialValidation.errors.join("; "));
addCheck("dangerous runtime flags false", flagsStayFalse(completePlan) && flagsStayFalse(partialPlan));
addCheck("disabled action list is exposed", completePlan.data.disabledActions.length === BUSINESS_BUILD_DISABLED_ACTIONS.length);
addCheck("no fake runnable action", !/run now|create project|dispatch agent|deploy now|execute now/i.test(JSON.stringify(completePlan.data)));
addCheck("source has no provider/tool/project imports", !source.includes("../providers") && !source.includes("../tools") && !source.includes("../projects"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p814-business-build-plan"]));
addCheck("contract references exact module", contract.includes("business-build/businessBuildPlan.js") && contract.includes("check:p814-business-build-plan"));
addCheck("docs mention P81.4 validation", docs.includes("P81.4 Safe Dry-Run Business Build Plan") && docs.includes("npm run check:p814-business-build-plan"));
addCheck("phase status advanced", phaseById.get("P81.4")?.status === "complete" && ["P81.4", "P81.5", "P81.6", "P81.7"].includes(status.currentPhase));
addCheck("P81 remains in progress", phaseById.get("P81")?.status === "in_progress" && ["P81.5", "P81.6", "P81.7"].includes(phaseById.get("P81")?.nextPhase));
addCheck("roadmap P81.4 complete", roadmapById.get("P81.4")?.status === "complete");
addCheck("report path is distinct", REPORT_PATH.endsWith("p814-business-build-plan-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P81.4 local dry-run business build plan records.",
        "- Does not call providers, dispatch agents, execute tools or workers, mutate projects, write DB state, deploy, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p814-business-build-plan",
        "- npm run check:p813-agent-workstreams",
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
      body: "- P81.4 creates a dry-run plan only. Runtime business build execution remains blocked.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P81.4 Business Build Plan Report", phase: "P81.4" },
);

printCheckReport("P81.4 Business Build Plan Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
