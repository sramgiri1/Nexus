import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p911-founder-workstream-activation-contract-report.md";

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
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readJson("contracts/os-roadmap/p91-execution-contracts.json");
const contractSource = readText("contracts/os-roadmap/p91-execution-contracts.json");
const docs = readText("docs/architecture/P91_GOVERNED_FOUNDER_WORKSTREAM_ACTIVATION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const statusChecker = readText("scripts/check-os-phase-status.js");

const p911 = contract.subphases?.find((entry) => entry.phaseId === "P91.1");
const p912 = contract.subphases?.find((entry) => entry.phaseId === "P91.2");
const forbiddenFiles = p911?.forbiddenFiles || [];
const validationCommands = p911?.validationCommands || [];
const safetyRules = contract.globalSafetyRules || [];

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p911-founder-workstream-activation-contract"]));
addCheck("contract phase is P91", contract.phase === "P91" && contract.classification === "NEXUS_OS_CHANGE");
addCheck("contract has seven subphases", Array.isArray(contract.subphases) && contract.subphases.length === 7);
addCheck("P91.1 complete and P91.2 handoff exists", p911?.status === "complete" && ["planned", "complete"].includes(p912?.status));
addCheck("P91.1 allowed files scoped", p911?.allowedFiles?.includes("contracts/os-roadmap/p91-execution-contracts.json") && p911.allowedFiles.includes("scripts/check-p911-founder-workstream-activation-contract.js"));
addCheck("forbidden paths listed", ["projects/**", "careloop/**", "providers/**", "tools/**", "worker-runtime/**", "db/**", "deploy/**", "packages/**", ".env*"].every((path) => forbiddenFiles.includes(path)));
addCheck("safety rules block unsafe operations", safetyRules.join(" ").includes("agent dispatch") && safetyRules.join(" ").includes("project mutation") && safetyRules.join(" ").includes("provider spend"));
addCheck("future exports defined", p911?.expectedExportsSchemasDataShapes?.futureExports?.includes("buildFounderWorkstreamActivationPlan"));
addCheck("validation commands defined", validationCommands.includes("npm run check:p911-founder-workstream-activation-contract") && validationCommands.includes("npm run check:os-phase-status"));
addCheck("Command Center UX requirements present", p911?.commandCenterUxRequirements?.includes("workstream activation planning state") && p911.commandCenterUxRequirements.includes("without showing runnable agent dispatch"));
addCheck("docs record P91.1", docs.includes("P91.1 is complete") && docs.includes("npm run check:p911-founder-workstream-activation-contract"));
addCheck(
  "platform roadmap records P91.1",
  platformRoadmap.includes("P91.1 is complete")
    && (platformRoadmap.includes("P91.2 is next") || platformRoadmap.includes("P91.2 is complete")),
);
addCheck(
  "phase status advanced",
  statusById.get("P91")?.status === "in_progress"
    && statusById.get("P91.1")?.status === "complete"
    && ["P91.1", "P91.2", "P91.3", "P91.4", "P91.5", "P91.6", "P91.7"].includes(status.currentPhase)
    && ["P90.7", "P91.1", "P91.2", "P91.3", "P91.4", "P91.5", "P91.6"].includes(status.previousPhase)
    && ["P91.2", "P91.3", "P91.4", "P91.5", "P91.6", "P91.7", "P92"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P91.1", roadmapById.get("P91.1")?.track === "NEXUS_OS" && roadmapById.get("P91.1")?.status === "complete");
addCheck(
  "P91.2 handoff exists",
  ["planned", "complete"].includes(statusById.get("P91.2")?.status)
    && ["planned", "complete"].includes(roadmapById.get("P91.2")?.status),
);
addCheck("status checker accepts P91.2", statusChecker.includes("\"P91.2\""));
addCheck("contract does not expose raw private IDs", !/private-project-01|private-project-governed-build-mission|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(contractSource));
addCheck("contract does not invent runnable actions", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now/i.test(contractSource));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P91.1 governed founder workstream activation planning contract.",
        "- Confirms P91 is split into implementation-grade subphases.",
        "- Confirms provider/model calls, agent dispatch, project mutation, DB writes, deploy, package, network calls, and spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p911-founder-workstream-activation-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P91.1 is contract-only. It does not run an executor, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, write DB state, use network calls, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P91.1 Founder Workstream Activation Contract Report", phase: "P91.1" },
);

printCheckReport("P91.1 Founder Workstream Activation Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
