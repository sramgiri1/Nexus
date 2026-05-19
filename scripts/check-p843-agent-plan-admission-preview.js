import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildFounderAgentPlanAdmission,
  validateFounderAgentPlanAdmission,
} from "../live-ready/founderAgentPlanAdmission.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p843-agent-plan-admission-preview-report.md";

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

const envelope = buildFounderAgentPlanAdmission();
const validation = validateFounderAgentPlanAdmission(envelope);
const envelopeText = JSON.stringify(envelope);
const moduleSource = readText("live-ready/founderAgentPlanAdmission.js");
const contract = readText("contracts/os-roadmap/p84-execution-contracts.json");
const docs = readText("docs/architecture/P84_GOVERNED_FOUNDER_RUNTIME_ADMISSION_PLAN.md");
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));

const unsafeFlags = [
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
  "providerSpendAllowed",
];

const expectedCapabilities = [
  "ATLAS.productArchitecture",
  "ORION.experienceDesign",
  "FORGE.implementationPlanning",
  "BEACON.marketStrategy",
  "LEDGER.businessModeling",
  "WARDEN.operatingSystem",
  "COUNSEL.riskReview",
  "HARBOR.customerSuccess",
];

addCheck("agent plan envelope validates", validation.valid, validation.errors.join("; "));
addCheck("8 founder business lanes admitted", envelope.data.agentPlan.length === 8 && envelope.data.workstreamCount === 8);
addCheck(
  "owner capabilities mapped",
  expectedCapabilities.every((capability) => envelope.data.ownerCapabilities.includes(capability)),
);
addCheck("P81 workstream helper reused", moduleSource.includes("buildBusinessBuildWorkstreams"));
addCheck("P82 worker gate reused", moduleSource.includes("buildWorkerExecutionGate"));
addCheck(
  "unsafe execution remains false",
  unsafeFlags.every((flag) => envelope.data[flag] === false && envelope.data.agentPlan.every((row) => row[flag] === false)),
);
addCheck("worker gate remains disabled", envelope.data.workerGateSummary.executionEnabled === false && envelope.data.workerGateSummary.workerExecutionAllowed === false);
addCheck("no fake runnable actions", !/dispatch now|run agent|execute worker|call provider now|write project now|deploy now|spend now|generate prd now/i.test(envelopeText));
addCheck("no raw project/private ids in primary data", !/"projectId"|"rawId"|"privateId"|"databaseId"/i.test(envelopeText));
addCheck("no provider/tool/project runtime imports", !/from "\.\.\/providers|from "\.\.\/tools|from "\.\.\/worker-runtime\/execute|from "\.\.\/db|from "\.\.\/deploy|from "\.\.\/release/.test(moduleSource));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p843-agent-plan-admission-preview"]));
addCheck("contract references P84.3 files", contract.includes("live-ready/founderAgentPlanAdmission.js") && contract.includes("check:p843-agent-plan-admission-preview"));
addCheck("docs mention P84.3 validation", docs.includes("P84.3 Agent Plan Admission Preview") && docs.includes("npm run check:p843-agent-plan-admission-preview"));
addCheck(
  "phase status advanced",
  statusById.get("P84.3")?.status === "complete" &&
    ["P84.3", "P84.4", "P84.5", "P84.6", "P84.7"].includes(status.currentPhase),
);
addCheck("report prerequisites exist", fileExists("reports/p842-command-center-lite-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P84.3 local founder agent plan admission.",
        "- Reuses the P81 business build workstream planner and P82 worker execution gate.",
        "- Confirms agent dispatch, worker execution, provider calls, project mutation, DB writes, deploy, release, export, package creation, and spend remain disabled.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Agent Plan",
      body: [
        `- Current state: ${envelope.data.currentState}`,
        `- Readiness: ${envelope.data.readinessLabel}`,
        `- Owner capability: ${envelope.data.ownerCapability}`,
        `- Workstreams admitted: ${envelope.data.workstreamCount}`,
        `- Next action: ${envelope.data.nextAction}`,
        `- Cost impact: ${envelope.data.costImpact}`,
      ].join("\n"),
    },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p843-agent-plan-admission-preview",
        "- npm run check:p842-command-center-lite",
        "- npm run check:p84-execution-plan",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P84.3 admits local planning records only. It does not dispatch agents, execute workers, call providers, mutate projects, write DB state, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P84.3 Agent Plan Admission Preview Report", phase: "P84.3" },
);

printCheckReport("P84.3 Agent Plan Admission Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
