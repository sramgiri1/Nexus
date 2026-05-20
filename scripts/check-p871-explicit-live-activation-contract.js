import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildExplicitLiveActivationContract,
  LIVE_ACTIVATION_CONTRACT_GATES,
  validateExplicitLiveActivationContract,
} from "../live-ready/explicitLiveActivationContract.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p871-explicit-live-activation-contract-report.md";

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

const envelope = buildExplicitLiveActivationContract();
const validation = validateExplicitLiveActivationContract(envelope);
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
const moduleSource = readText("live-ready/explicitLiveActivationContract.js");

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

addCheck("activation contract envelope passes", envelope.ok === true && envelope.status === "PASS");
addCheck("validation passes", validation.valid, validation.errors.join("; "));
addCheck("lanes generated from P86 dry-run", data.lanes?.length >= 8 && moduleSource.includes("buildGovernedLiveActivationDryRun"));
addCheck("all runtime flags blocked", blockedFlags.every((flag) => data[flag] === false && data.lanes?.every((lane) => lane[flag] === false)));
addCheck("allowed operations remain empty", data.lanes?.every((lane) => Array.isArray(lane.allowedOperations) && lane.allowedOperations.length === 0));
addCheck("required gates are explicit", LIVE_ACTIVATION_CONTRACT_GATES.every((gate) => data.lanes?.every((lane) => lane.requiredGates?.includes(gate))));
addCheck("primary UX fields present", ["currentState", "readinessLabel", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"].every((field) => serialized.includes(field)));
addCheck("does not import forbidden runtime roots", !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/") && !moduleSource.includes("../db/"));
addCheck("no raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p871-explicit-live-activation-contract"]));
addCheck("contract references P87.1 files", contract.includes("live-ready/explicitLiveActivationContract.js") && contract.includes("check:p871-explicit-live-activation-contract"));
addCheck("docs mention P87.1 validation", docs.includes("P87.1 Explicit Activation Contract") && docs.includes("npm run check:p871-explicit-live-activation-contract"));
addCheck("platform roadmap records P87", platformRoadmap.includes("## P87 - Explicit Live Activation Unlocks") && platformRoadmap.includes("P87.1 is complete"));
addCheck(
  "phase status advanced",
  statusById.get("P87")?.status === "in_progress"
    && statusById.get("P87.1")?.status === "complete"
    && status.currentPhase === "P87.1"
    && status.nextPhase === "P87.2",
);
addCheck("roadmap tracks P87.1", roadmapById.get("P87.1")?.track === "NEXUS_OS" && roadmapById.get("P87.1")?.status === "complete");
addCheck("report prerequisites exist", fileExists("reports/p867-final-validation-report.md") && fileExists("reports/os-phase-status-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P87.1 explicit live activation contract lanes.",
        "- Reuses P86 activation dry-run records instead of duplicating activation inventory helpers.",
        "- Confirms no runtime execution surface is enabled by the contract.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Lane Count", body: `- ${data.lanes?.length || 0} explicit activation contract lanes` },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p871-explicit-live-activation-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P87.1 is contract-only. Provider/model calls, agent dispatch, tool/worker execution, project/DB mutation, deploy, package, network calls, and spend remain disabled.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P87.1 Explicit Live Activation Contract Report", phase: "P87.1" },
);

printCheckReport("P87.1 Explicit Live Activation Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
