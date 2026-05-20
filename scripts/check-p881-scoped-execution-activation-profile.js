import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildScopedExecutionActivationProfile,
  P88_REQUIRED_ACTIVATION_GATES,
  validateScopedExecutionActivationProfile,
} from "../live-ready/scopedExecutionActivationProfile.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p881-scoped-execution-activation-profile-report.md";

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

const envelope = buildScopedExecutionActivationProfile();
const validation = validateScopedExecutionActivationProfile(envelope);
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
const moduleSource = readText("live-ready/scopedExecutionActivationProfile.js");

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
  "activationAllowed",
  "executionAllowed",
];

addCheck("scoped activation profile envelope passes", envelope.ok === true && envelope.status === "PASS");
addCheck("validation passes", validation.valid, validation.errors.join("; "));
addCheck("activation mode local-only", data.activationMode === "local-only-profile");
addCheck("three scoped future lanes", data.allowedFutureLanes?.length === 3 && data.allowedFutureLaneCount === 3);
addCheck("P87 helpers reused", moduleSource.includes("buildExplicitLiveActivationContract") && moduleSource.includes("buildLocalAgentDispatchAdmission") && moduleSource.includes("buildGeneratedProjectWorkspaceAdmission"));
addCheck("required gates explicit", P88_REQUIRED_ACTIVATION_GATES.every((gate) => data.requiredGates?.includes(gate) && data.allowedFutureLanes?.every((lane) => lane.requiredGates?.includes(gate))));
addCheck("all runtime flags blocked", runtimeFlags.every((flag) => data[flag] === false && data.runtimeFlags?.[flag] === false && data.allowedFutureLanes?.every((lane) => lane[flag] === false)));
addCheck("forbidden operations cover unsafe surfaces", ["provider/model calls", "existing project mutation", "DB writes", "provider spend"].every((item) => data.forbiddenOperations?.includes(item)));
addCheck("primary UX fields present", ["currentState", "readinessLabel", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"].every((field) => serialized.includes(field)));
addCheck("does not import forbidden runtime roots", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/") && !moduleSource.includes("../db/") && !moduleSource.includes("../worker-runtime/"));
addCheck("no raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p881-scoped-execution-activation-profile"]));
addCheck("contract references P88.1 files", contract.includes("live-ready/scopedExecutionActivationProfile.js") && contract.includes("check:p881-scoped-execution-activation-profile"));
addCheck("docs mention P88.1 validation", docs.includes("P88.1 Scoped Activation Profile / Contract") && docs.includes("npm run check:p881-scoped-execution-activation-profile"));
addCheck("platform roadmap records P88", platformRoadmap.includes("## P88 - Scoped Execution-Capable Activation") && platformRoadmap.includes("P88.1 is complete"));
addCheck(
  "phase status advanced",
  statusById.get("P88")?.status === "in_progress"
    && statusById.get("P88.1")?.status === "complete"
    && status.currentPhase === "P88.1"
    && status.previousPhase === "P87.7"
    && status.nextPhase === "P88.2",
);
addCheck("roadmap tracks P88.1", roadmapById.get("P88.1")?.track === "NEXUS_OS" && roadmapById.get("P88.1")?.status === "complete");
addCheck("report prerequisites exist", fileExists("reports/p877-final-validation-report.md") && fileExists("reports/os-phase-status-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P88.1 scoped execution-capable activation profile.",
        "- Reuses P87 live activation, dispatch, and generated workspace admission helpers.",
        "- Confirms P88.1 defines profile gates only and does not wire any executor.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Allowed Future Lane Count", body: `- ${data.allowedFutureLaneCount || 0} scoped future lanes` },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p881-scoped-execution-activation-profile",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P88.1 is profile-only. Provider/model calls, agent dispatch, tool/worker execution, project/DB mutation, deploy, package, network calls, and spend remain disabled.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P88.1 Scoped Execution Activation Profile Report", phase: "P88.1" },
);

printCheckReport("P88.1 Scoped Execution Activation Profile Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
