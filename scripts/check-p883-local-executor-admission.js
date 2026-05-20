import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildLocalExecutorAdmission,
  validateLocalExecutorAdmission,
} from "../live-ready/localExecutorAdmission.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p883-local-executor-admission-report.md";

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

const envelope = buildLocalExecutorAdmission();
const validation = validateLocalExecutorAdmission(envelope);
const data = envelope.data || {};
const serialized = JSON.stringify(envelope);
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readText("contracts/os-roadmap/p88-execution-contracts.json");
const docs = readText("docs/architecture/P88_SCOPED_EXECUTION_CAPABLE_ACTIVATION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const moduleSource = readText("live-ready/localExecutorAdmission.js");

const runtimeFlags = [
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "localExecutorRunAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "newWorkspaceFileWritesAllowed",
  "existingProjectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "providerSpendAllowed",
  "activationAllowed",
  "executionAllowed",
];

addCheck("local executor admission envelope passes", envelope.ok === true && envelope.status === "PASS");
addCheck("validation passes", validation.valid, validation.errors.join("; "));
addCheck("executor mode local-only admission", data.executorMode === "local-only-admission");
addCheck("admissions cover activation requests", data.admissions?.length === 3 && data.admissionCount === 3);
addCheck("activation request model reused", moduleSource.includes("buildLocalActivationRequestModel"));
addCheck("does not import executor runtime modules", !moduleSource.includes("../orchestrator/") && !moduleSource.includes("../worker-runtime/"));
addCheck("executor cannot run", data.admissions?.every((admission) => admission.executorCanRun === false && admission.localExecutorRunAllowed === false));
addCheck("all runtime flags blocked", runtimeFlags.every((flag) => data[flag] === false && data.admissions?.every((admission) => admission[flag] === false)));
addCheck("executor evidence required", data.admissions?.every((admission) => admission.requiredEvidence?.includes("controlledLocalExecutionPolicy") && admission.requiredEvidence?.includes("guardedTaskExecutionPolicy") && admission.rollbackRequired === true && admission.postRunReviewRequired === true));
addCheck("primary UX fields present", ["currentState", "readinessLabel", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"].every((field) => serialized.includes(field)));
addCheck("does not import forbidden runtime roots", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/") && !moduleSource.includes("../db/"));
addCheck("no raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p883-local-executor-admission"]));
addCheck("contract references P88.3 files", contract.includes("live-ready/localExecutorAdmission.js") && contract.includes("check:p883-local-executor-admission"));
addCheck("docs mention P88.3 validation", docs.includes("P88.3 Local Executor Admission") && docs.includes("npm run check:p883-local-executor-admission"));
addCheck(
  "platform roadmap records P88.3",
  platformRoadmap.includes("P88.3 is complete")
    && (platformRoadmap.includes("P88.4 is next") || platformRoadmap.includes("P88.4 is complete")),
);
addCheck(
  "phase status advanced",
  statusById.get("P88")?.status === "in_progress"
    && statusById.get("P88.3")?.status === "complete"
    && ["P88.3", "P88.4", "P88.5"].includes(status.currentPhase)
    && ["P88.2", "P88.3", "P88.4"].includes(status.previousPhase)
    && ["P88.4", "P88.5", "P88.6"].includes(status.nextPhase),
);
addCheck("roadmap tracks P88.3", roadmapById.get("P88.3")?.track === "NEXUS_OS" && roadmapById.get("P88.3")?.status === "complete");
addCheck("report prerequisites exist", fileExists("reports/p882-local-activation-request-model-report.md") && fileExists("reports/controlled-local-execution-report.md") && fileExists("reports/guarded-task-execution-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P88.3 local executor admission records.",
        "- Reuses P88.2 local activation request model.",
        "- Confirms no executor module is imported, wired, or run.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Admission Count", body: `- ${data.admissionCount || 0} local executor admission records` },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p883-local-executor-admission",
        "- npm run check:p882-local-activation-request-model",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P88.3 is executor admission only. It does not run an executor, dispatch agents, execute tools/workers, mutate projects, call providers/models, write DB state, use network calls, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P88.3 Local Executor Admission Report", phase: "P88.3" },
);

printCheckReport("P88.3 Local Executor Admission Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
