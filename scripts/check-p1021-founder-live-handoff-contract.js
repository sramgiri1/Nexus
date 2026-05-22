import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1021-founder-live-handoff-contract-report.md";

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
const contract = readJson("contracts/os-roadmap/p102-founder-live-handoff-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P102_FOUNDER_LIVE_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const phaseStatusSource = readText("scripts/check-os-phase-status.js");
const p102Subphases = ["P102.1", "P102.2", "P102.3", "P102.4", "P102.5", "P102.6", "P102.7"];
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const p1021 = subphaseById.get("P102.1") || {};

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1021-founder-live-handoff-contract"]));
addCheck("contract phase identity", contract.phaseId === "P102" && contract.title === "Founder Live Handoff");
addCheck("contract is NEXUS OS scoped", contract.scopeClassification === "NEXUS_OS_CHANGE");
addCheck("subphase split exists", p102Subphases.every((phaseId) => subphaseById.has(phaseId)));
addCheck("P102.1 complete and later subphases planned or complete", subphaseById.get("P102.1")?.status === "complete" && p102Subphases.slice(1).every((phaseId) => ["planned", "complete"].includes(subphaseById.get(phaseId)?.status)));
addCheck("safety rules block unsafe execution", ["No provider/model calls.", "No agent dispatch.", "No worker/tool execution.", "No project source mutation."].every((rule) => contract.safetyRules?.includes(rule)));
addCheck("reuse rules reference shared helpers", ["shared/reportWriter.js", "shared/resultEnvelope.js", "shared/redaction.js", "os-roadmap/updatePhaseStatus.js"].every((item) => contract.reuseRequired?.includes(item)));
addCheck("P102.1 expected future constants", ["P102_FOUNDER_LIVE_HANDOFF_PHASE", "P102_HANDOFF_STATES", "P102_HANDOFF_SAFETY_FLAGS"].every((name) => p1021.expectedExportsSchemasDataShapes?.futureConstants?.includes(name)));
addCheck("P102.1 validation commands", ["npm run check:p1021-founder-live-handoff-contract", "npm run check:os-phase-status", "npm run check:phase-validation-coverage", "git diff --check"].every((command) => p1021.validationCommands?.includes(command)));
addCheck("P102.1 avoids forbidden file scope", !(p1021.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("plan records P102.1 complete", /P102\.1 Contract \/ Scope \/ Safety Baseline[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P102.1", /P102 - Founder Live Handoff/.test(platformRoadmap) && /P102\.1 is\s+complete/.test(platformRoadmap) && /P102\.2 is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced to P102.1",
  ["P102.1", "P102.2"].includes(status.currentPhase)
    && ["P101.7", "P102.1"].includes(status.previousPhase)
    && ["P102.2", "P102.3"].includes(status.nextPhase)
    && statusById.get("P102")?.status === "in_progress"
    && statusById.get("P102.1")?.status === "complete"
    && roadmapById.get("P102.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P102.2 remains planned or complete", ["planned", "complete"].includes(statusById.get("P102.2")?.status) && ["planned", "complete"].includes(roadmapById.get("P102.2")?.status));
addCheck("P103 handoff exists", statusById.get("P103")?.status === "planned" && roadmapById.get("P103")?.status === "planned");
addCheck("phase status checker accepts P102 subphases", [...p102Subphases, "P103"].every((phaseId) => phaseStatusSource.includes(`"${phaseId}"`)));
addCheck("docs do not claim unsafe execution", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(plan + platformRoadmap));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P102.1 founder live handoff contract, safety baseline, docs, package script, and OS status handoff.",
        "- Confirms P102.2 through P102.7 remain planned and independently commit-ready.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1021-founder-live-handoff-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P102.1 is contract-only. It does not add handoff runtime models, Command Center UI, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or provider spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P102.1 Founder Live Handoff Contract Report", phase: "P102.1" },
);

printCheckReport("P102.1 Founder Live Handoff Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
