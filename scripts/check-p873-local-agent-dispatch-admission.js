import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildLocalAgentDispatchAdmission,
  validateLocalAgentDispatchAdmission,
} from "../live-ready/localAgentDispatchAdmission.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p873-local-agent-dispatch-admission-report.md";

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

const envelope = buildLocalAgentDispatchAdmission();
const validation = validateLocalAgentDispatchAdmission(envelope);
const data = envelope.data || {};
const serialized = JSON.stringify(envelope);
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readText("contracts/os-roadmap/p87-execution-contracts.json");
const docs = readText("docs/architecture/P87_EXPLICIT_LIVE_ACTIVATION_UNLOCKS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const moduleSource = readText("live-ready/localAgentDispatchAdmission.js");

const blockedFlags = [
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
  "activationAllowed",
  "executionAllowed",
];

addCheck("local dispatch envelope passes", envelope.ok === true && envelope.status === "PASS");
addCheck("validation passes", validation.valid, validation.errors.join("; "));
addCheck("all workstream lanes present", data.lanes?.length === 8 && data.dispatchLaneCount === 8);
addCheck("scoped context packet shape present", ["taskContract", "selectedProjectProfile", "scopedMemoryPacket", "trustedContextPacket", "selectedSkillOrToolContract", "budgetPolicyLimits"].every((field) => data.contextPacketShape?.includes(field)));
addCheck("admission helpers reused", moduleSource.includes("buildFounderAgentPlanAdmission") && moduleSource.includes("buildFounderTaskBoardAdmission") && moduleSource.includes("buildSecretProviderReadiness"));
addCheck("all runtime flags blocked", blockedFlags.every((flag) => data[flag] === false && data.lanes?.every((lane) => lane[flag] === false)));
addCheck("dispatch remains disabled", data.lanes?.every((lane) => lane.dispatchAllowed === false));
addCheck("primary UX fields present", ["currentState", "readinessLabel", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"].every((field) => serialized.includes(field)));
addCheck("does not import forbidden runtime roots", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/") && !moduleSource.includes("../db/") && !moduleSource.includes("../worker-runtime/"));
addCheck("no raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p873-local-agent-dispatch-admission"]));
addCheck("contract references P87.3 files", contract.includes("live-ready/localAgentDispatchAdmission.js") && contract.includes("check:p873-local-agent-dispatch-admission"));
addCheck("docs mention P87.3 validation", docs.includes("P87.3 Local Agent Dispatch Admission") && docs.includes("npm run check:p873-local-agent-dispatch-admission"));
addCheck("platform roadmap records P87.3", platformRoadmap.includes("P87.3 is complete") && platformRoadmap.includes("P87.4 is next"));
addCheck(
  "phase status advanced",
  statusById.get("P87")?.status === "in_progress"
    && statusById.get("P87.3")?.status === "complete"
    && status.currentPhase === "P87.3"
    && status.nextPhase === "P87.4",
);
addCheck("roadmap tracks P87.3", roadmapById.get("P87.3")?.track === "NEXUS_OS" && roadmapById.get("P87.3")?.status === "complete");
addCheck("report prerequisites exist", fileExists("reports/p872-secret-provider-readiness-report.md") && fileExists("reports/os-phase-status-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P87.3 local agent dispatch admission metadata.",
        "- Reuses founder agent plan, task-board admission, and secret/provider readiness helpers.",
        "- Confirms no agent dispatch, worker execution, project mutation, provider call, network call, deploy, package, or spend is enabled.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Dispatch Lane Count", body: `- ${data.dispatchLaneCount || 0} local agent dispatch admission lanes` },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p873-local-agent-dispatch-admission",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P87.3 is admission metadata only. It does not dispatch agents, run workers, execute tools, mutate projects, call providers, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P87.3 Local Agent Dispatch Admission Report", phase: "P87.3" },
);

printCheckReport("P87.3 Local Agent Dispatch Admission Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
