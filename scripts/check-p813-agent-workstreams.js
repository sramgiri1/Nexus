import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUSINESS_BUILD_WORKSTREAMS,
  buildBusinessBuildWorkstreams,
  validateBusinessBuildWorkstreams,
} from "../business-build/businessBuildWorkstreams.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p813-agent-workstreams-report.md";

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
const source = readText("business-build/businessBuildWorkstreams.js");

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

const completePlan = buildBusinessBuildWorkstreams(completeInput);
const partialPlan = buildBusinessBuildWorkstreams(partialInput);
const completeValidation = validateBusinessBuildWorkstreams(completePlan);
const partialValidation = validateBusinessBuildWorkstreams(partialPlan);
const expectedWorkstreams = [
  "product",
  "design",
  "engineering",
  "goToMarket",
  "finance",
  "operations",
  "legal",
  "support",
];
const dangerousFlags = [
  "agentDispatchAllowed",
  "providerCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "deployExecutionAllowed",
  "providerSpendAllowed",
];

function flagsStayFalse(plan) {
  return dangerousFlags.every((flag) => plan[flag] === false) &&
    plan.workstreams.every((entry) => dangerousFlags.every((flag) => entry[flag] === false));
}

addCheck("module exists", fileExists("business-build/businessBuildWorkstreams.js"));
addCheck("all workstream lanes represented", expectedWorkstreams.every((lane) => BUSINESS_BUILD_WORKSTREAMS.some((entry) => entry.workstream === lane)));
addCheck("workstream count is stable", BUSINESS_BUILD_WORKSTREAMS.length === expectedWorkstreams.length);
addCheck("complete PRD reaches dry-run readiness", completePlan.currentState === "workstreams_ready_for_dry_run");
addCheck("complete workstreams are ready", completePlan.workstreams.every((entry) => entry.status === "ready_for_dry_run"));
addCheck("partial PRD blocks workstreams", partialPlan.currentState === "workstreams_blocked_on_prd" && partialPlan.blockers.length > 0);
addCheck("partial workstreams expose blockers", partialPlan.workstreams.every((entry) => entry.status === "blocked_on_prd" && entry.blockers.length > 0));
addCheck("complete plan validates", completeValidation.valid, completeValidation.errors.join("; "));
addCheck("partial plan validates", partialValidation.valid, partialValidation.errors.join("; "));
addCheck("dangerous runtime flags false", flagsStayFalse(completePlan) && flagsStayFalse(partialPlan));
addCheck("workstreams expose owner and evidence fields", completePlan.workstreams.every((entry) => entry.ownerCapability && entry.evidenceRefs.length > 0 && entry.activityRefs.length > 0));
addCheck("no fake runnable action", !/dispatch now|run agent|execute now|create project|deploy now/i.test(JSON.stringify(completePlan)));
addCheck("source has no provider/tool/project imports", !source.includes("../providers") && !source.includes("../tools") && !source.includes("../projects"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p813-agent-workstreams"]));
addCheck("contract references exact module", contract.includes("business-build/businessBuildWorkstreams.js") && contract.includes("check:p813-agent-workstreams"));
addCheck("docs mention P81.3 validation", docs.includes("P81.3 Agent Role / Workstream Planner") && docs.includes("npm run check:p813-agent-workstreams"));
addCheck("phase status advanced", phaseById.get("P81.3")?.status === "complete" && ["P81.3", "P81.4", "P81.5", "P81.6", "P81.7"].includes(status.currentPhase));
addCheck("P81 remains in progress", phaseById.get("P81")?.status === "in_progress" && ["P81.4", "P81.5", "P81.6", "P81.7"].includes(phaseById.get("P81")?.nextPhase));
addCheck("roadmap P81.3 complete", roadmapById.get("P81.3")?.status === "complete");
addCheck("report path is distinct", REPORT_PATH.endsWith("p813-agent-workstreams-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P81.3 local business build workstream planning records.",
        "- Does not dispatch agents, call providers, execute tools or workers, mutate projects, write DB state, deploy, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
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
      body: "- P81.3 creates local workstream records only. Agent dispatch and execution start remain blocked.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P81.3 Agent Workstreams Report", phase: "P81.3" },
);

printCheckReport("P81.3 Agent Workstreams Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
