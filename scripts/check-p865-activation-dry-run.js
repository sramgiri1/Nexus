import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildGovernedLiveActivationDryRun,
  validateGovernedLiveActivationDryRun,
} from "../live-ready/governedLiveActivationDryRun.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p865-activation-dry-run-report.md";

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

const dryRun = buildGovernedLiveActivationDryRun();
const validation = validateGovernedLiveActivationDryRun(dryRun);
const data = dryRun.data || {};
const serialized = JSON.stringify(dryRun);
const packageJson = readJson("package.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readText("contracts/os-roadmap/p86-execution-contracts.json");
const docs = readText("docs/architecture/P86_GOVERNED_LIVE_CAPABILITY_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const moduleSource = readText("live-ready/governedLiveActivationDryRun.js");

addCheck("dry-run envelope passes", dryRun.ok === true && dryRun.status === "PASS");
addCheck("validation passes", validation.valid, validation.errors.join("; "));
addCheck("intents cover queue items", Array.isArray(data.intents) && data.intents.length >= 8);
addCheck("activation remains blocked", data.activationAllowed === false && data.executionAllowed === false && data.intents?.every((intent) => intent.activationAllowed === false && intent.executionAllowed === false));
addCheck("rollback and validation required", data.intents?.every((intent) => intent.rollbackRequired === true && Array.isArray(intent.validationCommands) && intent.validationCommands.length > 0));
addCheck("reuses P86.3 queue", moduleSource.includes("buildGovernedLiveOperatorApprovalQueue") && !moduleSource.includes("../providers/") && !moduleSource.includes("../tools/") && !moduleSource.includes("../projects/"));
addCheck("no raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized));
addCheck("no fake unsafe runnable actions", !/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p865-activation-dry-run"]));
addCheck("contract references P86.5 files", contract.includes("live-ready/governedLiveActivationDryRun.js") && contract.includes("check:p865-activation-dry-run"));
addCheck("docs mention P86.5 validation", docs.includes("P86.5 Activation Dry Run") && docs.includes("npm run check:p865-activation-dry-run"));
addCheck("platform roadmap records P86.5", platformRoadmap.includes("P86.5 is complete") && platformRoadmap.includes("P86.6 is next"));
addCheck("phase status advanced", statusById.get("P86.5")?.status === "complete" && status.currentPhase === "P86.5" && status.nextPhase === "P86.6");
addCheck("roadmap tracks P86.5", roadmapById.get("P86.5")?.track === "NEXUS_OS" && roadmapById.get("P86.5")?.status === "complete");
addCheck("report prerequisites exist", fileExists("reports/p864-command-center-live-admission-ux-report.md") && fileExists("reports/os-phase-status-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P86.5 activation dry-run records.",
        "- Confirms activation and execution remain blocked.",
        "- Reuses P86.3 approval queue records instead of duplicating approval logic.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p865-activation-dry-run",
        "- npm run check:p864-command-center-live-admission-ux",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P86.5 creates activation dry-run records only. Runtime execution, provider/model calls, agent dispatch, project mutation, DB writes, deploy, package, and spend remain disabled.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P86.5 Activation Dry Run Report", phase: "P86.5" },
);

printCheckReport("P86.5 Activation Dry Run Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
