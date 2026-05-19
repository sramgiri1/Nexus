import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildGovernedLiveCapabilityStateResolver,
  validateGovernedLiveCapabilityStateResolver,
} from "../live-ready/governedLiveCapabilityStateResolver.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p862-capability-state-resolver-report.md";

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

const resolver = buildGovernedLiveCapabilityStateResolver();
const validation = validateGovernedLiveCapabilityStateResolver(resolver);
const data = resolver.data || {};
const serialized = JSON.stringify(resolver);
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readText("contracts/os-roadmap/p86-execution-contracts.json");
const docs = readText("docs/architecture/P86_GOVERNED_LIVE_CAPABILITY_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const moduleSource = readText("live-ready/governedLiveCapabilityStateResolver.js");

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
  "activationRequestAllowed",
  "executionAllowed",
];

addCheck("resolver envelope passes", resolver.ok === true && resolver.status === "PASS");
addCheck("validation passes", validation.valid, validation.errors.join("; "));
addCheck("resolves capability states", Array.isArray(data.capabilityStates) && data.capabilityStates.length >= 8);
addCheck("activation requests stay blocked", data.activationRequestAllowed === false && data.activationRequestCount === 0 && data.capabilityStates?.every((state) => state.canRequestActivation === false));
addCheck("all runtime flags blocked", blockedFlags.every((flag) => data[flag] === false && data.capabilityStates?.every((state) => state[flag] === false)));
addCheck("state reasons visible", data.capabilityStates?.every((state) => Array.isArray(state.stateReasons) && state.stateReasons.length > 0 && Array.isArray(state.requiredBeforeLive)));
addCheck("reuses P86.1 admission inventory", moduleSource.includes("buildGovernedLiveCapabilityAdmission") && !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/"));
addCheck("no raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p862-capability-state-resolver"]));
addCheck("contract references P86.2 files", contract.includes("live-ready/governedLiveCapabilityStateResolver.js") && contract.includes("check:p862-capability-state-resolver"));
addCheck("docs mention P86.2 validation", docs.includes("P86.2 Capability State Resolver") && docs.includes("npm run check:p862-capability-state-resolver"));
addCheck(
  "platform roadmap records P86.2",
  platformRoadmap.includes("P86.2 is complete")
    && (platformRoadmap.includes("P86.3 is next") || platformRoadmap.includes("P86.3 is complete")),
);
addCheck(
  "phase status advanced",
  statusById.get("P86.2")?.status === "complete"
    && ["P86.2", "P86.3"].includes(status.currentPhase)
    && ["P86.3", "P86.4"].includes(status.nextPhase),
);
addCheck("roadmap tracks P86.2", roadmapById.get("P86.2")?.track === "NEXUS_OS" && roadmapById.get("P86.2")?.status === "complete");
addCheck("report prerequisites exist", fileExists("reports/p861-live-capability-admission-report.md") && fileExists("reports/os-phase-status-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P86.2 governed live capability state resolver.",
        "- Confirms activation requests and runtime execution remain blocked.",
        "- Reuses P86.1 admission inventory instead of duplicating admission rows.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "State Summary",
      body: Object.entries(data.stateSummary || {}).map(([state, count]) => `- ${state}: ${count}`).join("\n") || "- None",
    },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p862-capability-state-resolver",
        "- npm run check:p861-live-capability-admission",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P86.2 resolves state only. Runtime execution, provider/model calls, agent dispatch, project mutation, DB writes, deploy, package, and spend remain disabled.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P86.2 Capability State Resolver Report", phase: "P86.2" },
);

printCheckReport("P86.2 Capability State Resolver Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
