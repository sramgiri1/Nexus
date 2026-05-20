import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildGeneratedProjectWorkspaceAdmission,
  validateGeneratedProjectWorkspaceAdmission,
} from "../live-ready/generatedProjectWorkspaceAdmission.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p874-generated-project-workspace-admission-report.md";

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

const envelope = buildGeneratedProjectWorkspaceAdmission();
const validation = validateGeneratedProjectWorkspaceAdmission(envelope);
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
const moduleSource = readText("live-ready/generatedProjectWorkspaceAdmission.js");

const blockedFlags = [
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

addCheck("workspace admission envelope passes", envelope.ok === true && envelope.status === "PASS");
addCheck("validation passes", validation.valid, validation.errors.join("; "));
addCheck("generated root only", String(data.targetRoot || "").startsWith("generated-projects/") && data.allowedFutureRoots?.every((root) => root.startsWith("generated-projects/")));
addCheck("forbidden roots include project sources", ["projects/**", "careloop/**", "generated-projects/*/Sources/**", "generated-projects/*/Tests/**", "db/**", "providers/**", "tools/**", "worker-runtime/**"].every((root) => data.forbiddenRoots?.includes(root)));
addCheck("admission helpers reused", moduleSource.includes("buildLocalProjectCreationAdmission") && moduleSource.includes("buildLocalAgentDispatchAdmission"));
addCheck("all runtime flags blocked", blockedFlags.every((flag) => data[flag] === false));
addCheck("file writes remain disabled", data.projectCreationAllowed === false && data.newWorkspaceFileWritesAllowed === false && data.existingProjectMutationAllowed === false);
addCheck("primary UX fields present", ["currentState", "readinessLabel", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"].every((field) => serialized.includes(field)));
addCheck("does not import forbidden runtime roots", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/") && !moduleSource.includes("../db/") && !moduleSource.includes("../worker-runtime/"));
addCheck("no raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p874-generated-project-workspace-admission"]));
addCheck("contract references P87.4 files", contract.includes("live-ready/generatedProjectWorkspaceAdmission.js") && contract.includes("check:p874-generated-project-workspace-admission"));
addCheck("docs mention P87.4 validation", docs.includes("P87.4 Generated Project Workspace Admission") && docs.includes("npm run check:p874-generated-project-workspace-admission"));
addCheck("platform roadmap records P87.4", platformRoadmap.includes("P87.4 is complete") && platformRoadmap.includes("P87.5 is next"));
addCheck(
  "phase status advanced",
  statusById.get("P87")?.status === "in_progress"
    && statusById.get("P87.4")?.status === "complete"
    && status.currentPhase === "P87.4"
    && status.nextPhase === "P87.5",
);
addCheck("roadmap tracks P87.4", roadmapById.get("P87.4")?.track === "NEXUS_OS" && roadmapById.get("P87.4")?.status === "complete");
addCheck("report prerequisites exist", fileExists("reports/p873-local-agent-dispatch-admission-report.md") && fileExists("reports/os-phase-status-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P87.4 generated project workspace admission boundaries.",
        "- Reuses local project creation admission and local agent dispatch admission helpers.",
        "- Confirms no project file writes, generated app Sources/Tests changes, DB writes, deploy, package, provider calls, or spend are enabled.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Target Root", body: `- ${data.targetRoot || "missing"}` },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p874-generated-project-workspace-admission",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P87.4 is workspace boundary metadata only. It does not create directories, write project files, mutate generated app Sources/Tests, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P87.4 Generated Project Workspace Admission Report", phase: "P87.4" },
);

printCheckReport("P87.4 Generated Project Workspace Admission Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
