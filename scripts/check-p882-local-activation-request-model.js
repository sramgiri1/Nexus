import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildLocalActivationRequestModel,
  validateLocalActivationRequestModel,
} from "../live-ready/localActivationRequestModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p882-local-activation-request-model-report.md";

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

const envelope = buildLocalActivationRequestModel();
const validation = validateLocalActivationRequestModel(envelope);
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
const moduleSource = readText("live-ready/localActivationRequestModel.js");

const runtimeFlags = [
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
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
  "requestCanExecute",
  "activationAllowed",
  "executionAllowed",
];

addCheck("local activation request envelope passes", envelope.ok === true && envelope.status === "PASS");
addCheck("validation passes", validation.valid, validation.errors.join("; "));
addCheck("request mode local-only review", data.requestMode === "local-only-review");
addCheck("requests cover P88.1 lanes", data.requests?.length === 3 && data.requestCount === 3);
addCheck("approval and profile helpers reused", moduleSource.includes("buildScopedExecutionActivationProfile") && moduleSource.includes("buildGovernedLiveOperatorApprovalQueue"));
addCheck("requests cannot execute", data.requests?.every((request) => request.requestCanExecute === false && request.activationAllowed === false && request.executionAllowed === false));
addCheck("all runtime flags blocked", runtimeFlags.every((flag) => data[flag] === false && data.requests?.every((request) => request[flag] === false)));
addCheck("operator evidence required", data.requests?.every((request) => request.requiredEvidence?.includes("operatorApproval") && request.requiredEvidence?.includes("validationCommands") && request.missingEvidence?.includes("executorAdmission")));
addCheck("primary UX fields present", ["currentState", "readinessLabel", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"].every((field) => serialized.includes(field)));
addCheck("does not import forbidden runtime roots", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/") && !moduleSource.includes("../db/") && !moduleSource.includes("../worker-runtime/"));
addCheck("no raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p882-local-activation-request-model"]));
addCheck("contract references P88.2 files", contract.includes("live-ready/localActivationRequestModel.js") && contract.includes("check:p882-local-activation-request-model"));
addCheck("docs mention P88.2 validation", docs.includes("P88.2 Local Activation Request Model") && docs.includes("npm run check:p882-local-activation-request-model"));
addCheck(
  "platform roadmap records P88.2",
  platformRoadmap.includes("P88.2 is complete")
    && (platformRoadmap.includes("P88.3 is next") || platformRoadmap.includes("P88.3 is complete")),
);
addCheck(
  "phase status advanced",
  statusById.get("P88")?.status === "in_progress"
    && statusById.get("P88.2")?.status === "complete"
    && ["P88.2", "P88.3", "P88.4"].includes(status.currentPhase)
    && ["P88.1", "P88.2", "P88.3"].includes(status.previousPhase)
    && ["P88.3", "P88.4", "P88.5"].includes(status.nextPhase),
);
addCheck("roadmap tracks P88.2", roadmapById.get("P88.2")?.track === "NEXUS_OS" && roadmapById.get("P88.2")?.status === "complete");
addCheck("report prerequisites exist", fileExists("reports/p881-scoped-execution-activation-profile-report.md") && fileExists("reports/p863-operator-approval-queue-report.md") && fileExists("reports/os-phase-status-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P88.2 local activation request records.",
        "- Reuses P88.1 scoped activation profile and P86 operator approval queue helpers.",
        "- Confirms local activation requests cannot execute or unlock runtime actions.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Request Count", body: `- ${data.requestCount || 0} local activation request records` },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p882-local-activation-request-model",
        "- npm run check:p881-scoped-execution-activation-profile",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P88.2 is request-model only. It does not run an executor, dispatch agents, execute tools/workers, mutate projects, call providers/models, write DB state, use network calls, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P88.2 Local Activation Request Model Report", phase: "P88.2" },
);

printCheckReport("P88.2 Local Activation Request Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
