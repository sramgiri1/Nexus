import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildGovernedLiveCapabilityAdmission,
  validateGovernedLiveCapabilityAdmission,
} from "../live-ready/governedLiveCapabilityAdmission.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p861-live-capability-admission-report.md";

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

const admission = buildGovernedLiveCapabilityAdmission();
const validation = validateGovernedLiveCapabilityAdmission(admission);
const data = admission.data || {};
const serialized = JSON.stringify(admission);
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readText("contracts/os-roadmap/p86-execution-contracts.json");
const docs = readText("docs/architecture/P86_GOVERNED_LIVE_CAPABILITY_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const moduleSource = readText("live-ready/governedLiveCapabilityAdmission.js");

const expectedCapabilities = [
  "provider-calls",
  "provider-spend",
  "read-only-tool-contracts",
  "mutation-capable-tools",
  "agent-dispatch-worker-execution",
  "project-db-mutation",
  "generated-project-creation",
  "deploy-release-package",
  "founder-task-board-dispatch",
];
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
];

addCheck("admission envelope passes", admission.ok === true && admission.status === "PASS");
addCheck("validation passes", validation.valid, validation.errors.join("; "));
addCheck("capability inventory complete", expectedCapabilities.every((id) => data.capabilities?.some((row) => row.capabilityId === id)));
addCheck("all runtime flags blocked", blockedFlags.every((flag) => data[flag] === false && data.capabilities?.every((row) => row[flag] === false)));
addCheck("required gates are explicit", ["operatorApproval", "scopeBoundary", "policyProfile", "secretReference", "budgetLimit", "activityEvidence", "costEvidence", "redactionCheck", "rollbackPlan", "validationCommands"].every((gate) => data.requiredGates?.includes(gate)));
addCheck("primary UX fields present", ["currentState", "readinessLabel", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"].every((field) => serialized.includes(field)));
addCheck("reuses existing admission gates", ["buildProviderToolGateProfiles", "buildWorkerExecutionGate", "buildProjectDbAdmissionGate", "buildDeployReleaseAdmissionGate", "buildLocalProjectCreationAdmission", "buildFounderTaskBoardAdmission"].every((name) => moduleSource.includes(name)));
addCheck("does not import forbidden runtime roots", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/") && !moduleSource.includes("../db/"));
addCheck("no raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p861-live-capability-admission"]));
addCheck("contract references P86.1 files", contract.includes("live-ready/governedLiveCapabilityAdmission.js") && contract.includes("check:p861-live-capability-admission"));
addCheck("docs mention P86.1 validation", docs.includes("P86.1 Schema / Policy / Contract") && docs.includes("npm run check:p861-live-capability-admission"));
addCheck("platform roadmap records P86", platformRoadmap.includes("## P86 - Governed Live Capability Admission") && platformRoadmap.includes("P86.1 is complete"));
addCheck(
  "phase status advanced",
  statusById.get("P86")?.status === "in_progress"
    && statusById.get("P86.1")?.status === "complete"
    && ["P86.1", "P86.2"].includes(status.currentPhase)
    && ["P86.2", "P86.3"].includes(status.nextPhase),
);
addCheck("roadmap tracks P86.1", roadmapById.get("P86.1")?.track === "NEXUS_OS" && roadmapById.get("P86.1")?.status === "complete");
addCheck("report prerequisites exist", fileExists("reports/p857-final-validation-report.md") && fileExists("reports/os-phase-status-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P86.1 governed live capability admission inventory.",
        "- Confirms provider, tool, worker, agent dispatch, project, DB, deploy, package, and spend capabilities remain blocked.",
        "- Reuses existing live-ready admission gates instead of duplicating gate helpers.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Capability Count",
      body: `- ${data.capabilityCount || 0} live capability admission rows`,
    },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p861-live-capability-admission",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P86.1 is admission inventory only. Runtime execution, provider/model calls, agent dispatch, project mutation, DB writes, deploy, package, and spend remain disabled.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P86.1 Live Capability Admission Report", phase: "P86.1" },
);

printCheckReport("P86.1 Live Capability Admission Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
