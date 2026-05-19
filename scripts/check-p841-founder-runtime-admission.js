import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildFounderRuntimeAdmission,
  validateFounderRuntimeAdmission,
} from "../live-ready/founderRuntimeAdmission.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p841-founder-runtime-admission-report.md";

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

const approval = {
  operatorApproval: true,
  scopeBoundary: true,
  redactionCheck: true,
  activityEvidence: true,
  costEvidence: true,
  rollbackPlan: true,
  validationCommands: true,
};
const admitted = buildFounderRuntimeAdmission({ approval });
const blocked = buildFounderRuntimeAdmission({ approval: {} });
const admittedValidation = validateFounderRuntimeAdmission(admitted);
const blockedValidation = validateFounderRuntimeAdmission(blocked);
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const docs = readText("docs/architecture/P84_GOVERNED_FOUNDER_RUNTIME_ADMISSION_PLAN.md");
const contract = readText("contracts/os-roadmap/p84-execution-contracts.json");
const moduleSource = readText("live-ready/founderRuntimeAdmission.js");
const admittedText = JSON.stringify(admitted);

const dangerousFlags = [
  "providerCallsAllowed",
  "modelCallsAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "agentDispatchAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
];

addCheck("admitted envelope passes", admitted.ok === true && admitted.status === "PASS");
addCheck("admitted validation passes", admittedValidation.valid, admittedValidation.errors.join("; "));
addCheck("blocked validation passes as needs setup", blockedValidation.valid && blocked.data.readinessLabel === "Needs setup");
addCheck("local runtime gates are admitted", admitted.data.localRuntime.founderIntakeAllowed === true && admitted.data.localRuntime.localPrdDraftAllowed === true && admitted.data.localRuntime.localWorkstreamPlanningAllowed === true);
addCheck("unsafe execution remains false", dangerousFlags.every((flag) => admitted.data[flag] === false) && admitted.data.localRuntime.unsafeExecutionAllowed === false);
addCheck("primary UX fields present", ["currentState", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"].every((field) => admittedText.includes(field)));
addCheck("P80/P81 helpers reused", moduleSource.includes("createFounderIntakeSessionEnvelope") && moduleSource.includes("createBusinessBuildPrdDraft") && moduleSource.includes("buildBusinessBuildWorkstreams"));
addCheck("no provider/tool/project imports", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/"));
addCheck("no fake unsafe runnable actions", !/call provider now|dispatch agent now|write project now|deploy now|spend now/i.test(admittedText));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p841-founder-runtime-admission"]));
addCheck("contract references P84.1 files", contract.includes("live-ready/founderRuntimeAdmission.js") && contract.includes("check:p841-founder-runtime-admission"));
addCheck("docs mention P84.1 validation", docs.includes("P84.1 Founder Runtime Admission Contract") && docs.includes("npm run check:p841-founder-runtime-admission"));
addCheck("phase status advanced", statusById.get("P84.1")?.status === "complete" && status.currentPhase === "P84.1" && status.nextPhase === "P84.2");
addCheck("report prerequisites exist", fileExists("reports/p837-final-validation-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P84.1 founder runtime admission.",
        "- Admits local deterministic founder intake, Q&A, PRD draft, and workstream planning after gates are present.",
        "- Does not call providers/models, dispatch agents, execute tools/workers, mutate projects, write DB state, deploy, release, package, call networks, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Admission",
      body: [
        `- Readiness: ${admitted.data.readinessLabel}`,
        `- Local PRD draft allowed: ${admitted.data.localRuntime.localPrdDraftAllowed ? "yes" : "no"}`,
        `- Agent dispatch allowed: ${admitted.data.agentDispatchAllowed ? "yes" : "no"}`,
        `- Next action: ${admitted.data.nextAction}`,
      ].join("\n"),
    },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p841-founder-runtime-admission",
        "- npm run check:p84-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    { title: "Known Limitations", body: "- P84.1 does not call providers/models, dispatch agents, write projects, write DB state, deploy, package, or spend. P84.2 creates the local runtime envelope." },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P84.1 Founder Runtime Admission Report", phase: "P84.1" },
);

printCheckReport("P84.1 Founder Runtime Admission Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
