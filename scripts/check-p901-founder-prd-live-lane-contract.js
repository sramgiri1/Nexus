import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p901-founder-prd-live-lane-contract-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p90-execution-contracts.json");
const contractText = readText("contracts/os-roadmap/p90-execution-contracts.json");
const docs = readText("docs/architecture/P90_GOVERNED_FOUNDER_PRD_LIVE_AUTHORING_LANE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const statusChecker = readText("scripts/check-os-phase-status.js");

const p90Subphases = ["P90.1", "P90.2", "P90.3", "P90.4", "P90.5", "P90.6", "P90.7"];
const p901 = contract.subphases?.find((entry) => entry.phaseId === "P90.1") || {};
const serialized = JSON.stringify(contract);

addCheck("contract file exists", existsSync(join(ROOT, "contracts/os-roadmap/p90-execution-contracts.json")));
addCheck("contract identifies P90", contract.phase === "P90" && contract.title === "Governed Founder PRD Live Authoring Lane");
addCheck("contract is NEXUS OS scoped", contract.classification === "NEXUS_OS_CHANGE" && p901.classification === "NEXUS_OS_CHANGE");
addCheck("contract splits P90.1-P90.7", p90Subphases.every((phaseId) => contract.subphases?.some((entry) => entry.phaseId === phaseId)));
addCheck("P90.1 allowed files narrow", Array.isArray(p901.allowedFiles) && p901.allowedFiles.length <= 12 && p901.allowedFiles.includes("contracts/os-roadmap/p90-execution-contracts.json"));
addCheck("P90.1 forbidden project paths", ["projects/**", "careloop/**", "providers/**", "tools/**", "worker-runtime/**", "db/**", "deploy/**", "packages/**", ".env*"].every((path) => p901.forbiddenFiles?.includes(path)));
addCheck("future exports defined", p901.expectedExportsSchemasDataShapes?.futureExports?.includes("buildFounderPrdLiveAuthoringLane") && p901.expectedExportsSchemasDataShapes?.dataShape?.includes("runtimeFlags"));
addCheck("UX requirements are display-safe", p901.commandCenterUxRequirements?.includes("without showing runnable") && p901.commandCenterUxRequirements?.includes("raw private IDs"));
addCheck("theme requirements preserved", ["System theme", "Dark theme", "Light theme"].every((label) => p901.themeRequirements?.some((entry) => entry.includes(label))));
addCheck("Playwright requirement deferred to UX subphase", p901.playwrightTests?.some((entry) => entry.includes("no UI file changes")) && p901.playwrightTests?.some((entry) => entry.includes("focused coverage")));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p901-founder-prd-live-lane-contract"]));
addCheck("docs record P90.1 complete", docs.includes("P90.1 is complete") && docs.includes("local founder PRD authoring lane"));
addCheck("platform roadmap records P90", platformRoadmap.includes("P90 - Governed Founder PRD Live Authoring Lane") && platformRoadmap.includes("P90.1 is complete"));
addCheck(
  "phase status advanced",
  statusById.get("P90")?.status === "in_progress"
    && statusById.get("P90.1")?.status === "complete"
    && status.currentPhase === "P90.1"
    && status.previousPhase === "P89.7"
    && status.nextPhase === "P90.2",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P90.1", roadmapById.get("P90.1")?.track === "NEXUS_OS" && roadmapById.get("P90.1")?.status === "complete");
addCheck("status checker accepts P90.1/P90.2", statusChecker.includes("\"P90.1\"") && statusChecker.includes("\"P90.2\""));
addCheck("no unsafe enabled language", !/providerCallsAllowed["']?:\s*true|agentDispatchAllowed["']?:\s*true|projectMutationAllowed["']?:\s*true|dbWritesAllowed["']?:\s*true|deployExecutionAllowed["']?:\s*true|providerSpendAllowed["']?:\s*true/i.test(contractText));
addCheck("no fake runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(serialized));
addCheck("no raw private IDs", !/private-project-01|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(serialized));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P90.1 governed founder PRD live authoring lane contract.",
        "- Confirms P90 is split into implementation-grade subphases.",
        "- Confirms P90.1 does not enable provider/model calls, agent dispatch, project mutation, DB writes, deploy, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p901-founder-prd-live-lane-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P90.1 is contract-only. It does not run an executor, dispatch agents, execute tools/workers, mutate projects, call providers/models, write DB state, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P90.1 Founder PRD Live Lane Contract Report", phase: "P90.1" },
);

printCheckReport("P90.1 Founder PRD Live Lane Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
