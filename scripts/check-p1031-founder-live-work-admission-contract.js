import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1031-founder-live-work-admission-contract-report.md";

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
const contract = readJson("contracts/os-roadmap/p103-founder-live-work-admission-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P103_FOUNDER_LIVE_WORK_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const phaseStatusSource = readText("scripts/check-os-phase-status.js");
const p103Subphases = ["P103.1", "P103.2", "P103.3", "P103.4", "P103.5", "P103.6", "P103.7"];
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const p1031 = subphaseById.get("P103.1") || {};

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1031-founder-live-work-admission-contract"]));
addCheck("contract phase identity", contract.phaseId === "P103" && contract.title === "Founder Live Work Admission");
addCheck("contract is NEXUS OS scoped", contract.scopeClassification === "NEXUS_OS_CHANGE");
addCheck("subphase split exists", p103Subphases.every((phaseId) => subphaseById.has(phaseId)));
addCheck("P103.1 complete and later subphases planned or complete", subphaseById.get("P103.1")?.status === "complete" && p103Subphases.slice(1).every((phaseId) => ["planned", "complete"].includes(subphaseById.get(phaseId)?.status)));
addCheck("safety rules block unsafe execution", ["No provider/model calls.", "No agent dispatch.", "No worker/tool execution.", "No project source mutation."].every((rule) => contract.safetyRules?.includes(rule)));
addCheck("reuse rules reference shared helpers", ["shared/reportWriter.js", "shared/resultEnvelope.js", "shared/redaction.js", "os-roadmap/updatePhaseStatus.js"].every((item) => contract.reuseRequired?.includes(item)));
addCheck("reuse rules reference P102 handoff helpers", ["live-ready/founderLiveHandoffManifest.js", "live-ready/founderLiveHandoffWorkOrders.js"].every((item) => contract.reuseRequired?.includes(item)));
addCheck("P103.1 expected future constants", ["P103_FOUNDER_LIVE_WORK_ADMISSION_PHASE", "P103_WORK_ADMISSION_STATES", "P103_WORK_ADMISSION_SAFETY_FLAGS"].every((name) => p1031.expectedExportsSchemasDataShapes?.futureConstants?.includes(name)));
addCheck("P103.1 future envelope defined", /workAdmissions\[\]/.test(p1031.expectedExportsSchemasDataShapes?.futureEnvelope || "") && /unsafe runtime flags false/.test(p1031.expectedExportsSchemasDataShapes?.futureEnvelope || ""));
addCheck("P103.1 validation commands", ["npm run check:p1031-founder-live-work-admission-contract", "npm run check:os-phase-status", "npm run check:phase-validation-coverage", "git diff --check"].every((command) => p1031.validationCommands?.includes(command)));
addCheck("P103.1 avoids forbidden file scope", !(p1031.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("plan records P103.1 complete", /P103\.1 Contract \/ Scope \/ Safety Baseline[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P103.1", /P103 - Founder Live Work Admission/.test(platformRoadmap) && /P103\.1 is\s+complete/.test(platformRoadmap) && /P103\.2 is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced to P103.1",
  ["P103.1", "P103.2", "P103.3", "P103.4", "P103.5"].includes(status.currentPhase)
    && ["P102.7", "P103.1", "P103.2", "P103.3", "P103.4"].includes(status.previousPhase)
    && ["P103.2", "P103.3", "P103.4", "P103.5", "P103.6"].includes(status.nextPhase)
    && statusById.get("P103")?.status === "in_progress"
    && statusById.get("P103.1")?.status === "complete"
    && roadmapById.get("P103.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P103.2 remains planned or complete", ["planned", "complete"].includes(statusById.get("P103.2")?.status) && ["planned", "complete"].includes(roadmapById.get("P103.2")?.status));
addCheck("P104 handoff exists", statusById.get("P104")?.status === "planned" && roadmapById.get("P104")?.status === "planned");
addCheck("phase status checker accepts P103 subphases", [...p103Subphases, "P104"].every((phaseId) => phaseStatusSource.includes(`"${phaseId}"`)));
addCheck("docs do not claim unsafe execution", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(plan + platformRoadmap));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P103.1 founder live work admission contract, safety baseline, docs, package script, and OS status handoff.",
        "- Confirms P103.2 through P103.7 remain planned and independently commit-ready.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1031-founder-live-work-admission-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P103.1 is contract-only. It does not add work admission models, Command Center UI, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or provider spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P103.1 Founder Live Work Admission Contract Report", phase: "P103.1" },
);

printCheckReport("P103.1 Founder Live Work Admission Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
