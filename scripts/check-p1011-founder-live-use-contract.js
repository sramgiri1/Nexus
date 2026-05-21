import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1011-founder-live-use-contract-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function exists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p101-execution-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const phaseStatusSource = readText("scripts/check-os-phase-status.js");
const planDoc = exists("docs/architecture/P101_FOUNDER_LIVE_USE_HARDENING_PLAN.md")
  ? readText("docs/architecture/P101_FOUNDER_LIVE_USE_HARDENING_PLAN.md")
  : "";
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p101Subphases = ["P101.1", "P101.2", "P101.3", "P101.4", "P101.5", "P101.6", "P101.7"];
const p1011AllowedFiles = [
  "contracts/os-roadmap/p101-execution-contracts.json",
  "docs/architecture/P101_FOUNDER_LIVE_USE_HARDENING_PLAN.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "scripts/check-p1011-founder-live-use-contract.js",
  "scripts/check-os-phase-status.js",
  "package.json",
  "os-roadmap/phase-status.json",
  "os-roadmap/nexus-phases.json",
  "reports/p1011-founder-live-use-contract-report.md",
  "reports/os-phase-status-report.md",
  "reports/phase-validation-coverage-report.md",
];
const forbiddenAllowedPatterns = [
  /^projects\//,
  /^careloop\//,
  /^providers\//,
  /^tools\//,
  /^worker-runtime\//,
  /^deploy\//,
  /^release\//,
  /^exports\//,
  /^packages\//,
  /^\.env/,
];
const unsafeActionPatterns = [
  /\brun now\b/i,
  /\bexecute now\b/i,
  /\bdeploy now\b/i,
  /\brelease now\b/i,
  /\bstart worker\b/i,
  /\bcall provider\b/i,
  /\bdispatch agent\b/i,
];
const p1011 = subphaseById.get("P101.1");

addCheck("P101 contract exists", exists("contracts/os-roadmap/p101-execution-contracts.json"));
addCheck("P101 contract identity", contract.phaseId === "P101" && contract.title === "Founder Live Use Hardening");
addCheck("P101 contract in progress", contract.status === "in_progress" && contract.scopeClassification === "NEXUS_OS_CHANGE");
addCheck("P101 has seven subphases", p101Subphases.every((phaseId) => subphaseById.has(phaseId)));
addCheck("P101.1 complete and P101.2 planned or complete", p1011?.status === "complete" && ["planned", "complete"].includes(subphaseById.get("P101.2")?.status));
addCheck(
  "P101.1 allowed files are exact",
  p1011AllowedFiles.every((file) => (p1011?.allowedFiles || []).includes(file)),
  `${(p1011?.allowedFiles || []).length} allowed files`,
);
addCheck("P101.1 forbids unsafe roots", (p1011?.allowedFiles || []).every((file) => !forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("P101.1 leaves UI files out of scope", !(p1011?.allowedFiles || []).includes("dashboard/src/pages/CommandCenterV2.jsx"));
addCheck("P101.1 package script registered", Boolean(packageJson.scripts?.["check:p1011-founder-live-use-contract"]));
addCheck("P101.1 plan doc exists", exists("docs/architecture/P101_FOUNDER_LIVE_USE_HARDENING_PLAN.md"));
addCheck("P101.1 plan records contract fields", /Narrow goal/i.test(planDoc) && /Allowed files/i.test(planDoc) && /Forbidden files/i.test(planDoc));
addCheck("platform roadmap records P101.1", /P101 - Founder Live Use Hardening/.test(platformRoadmap) && /P101\.1 is\s+complete/.test(platformRoadmap));
addCheck(
  "phase status is within P101 handoff",
  ["P101.1", "P101.2"].includes(status.currentPhase)
    && ["P100.7", "P101.1"].includes(status.previousPhase)
    && ["P101.2", "P101.3"].includes(status.nextPhase)
    && status.currentPhaseStatus === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("status tracks parent P101 in progress", statusById.get("P101")?.status === "in_progress" && roadmapById.get("P101")?.status === "in_progress");
addCheck("status tracks P101.1 complete", statusById.get("P101.1")?.status === "complete" && roadmapById.get("P101.1")?.status === "complete");
addCheck("status tracks P101.2 planned or complete", ["planned", "complete"].includes(statusById.get("P101.2")?.status) && ["planned", "complete"].includes(roadmapById.get("P101.2")?.status));
addCheck("status tracks P102 handoff", statusById.get("P102")?.status === "planned" && roadmapById.get("P102")?.status === "planned");
addCheck("phase status checker accepts P101 subphases", [...p101Subphases, "P102"].every((phaseId) => phaseStatusSource.includes(`"${phaseId}"`)));
addCheck(
  "future exports and data shapes are contracted",
  JSON.stringify(contract).includes("P101_FOUNDER_LIVE_USE_PHASE")
    && JSON.stringify(contract).includes("P101_LIVE_USE_HARDENING_STATES")
    && JSON.stringify(contract).includes("P101_LIVE_USE_SAFETY_FLAGS")
    && JSON.stringify(contract).includes("buildFounderLiveUseReadiness"),
);
addCheck("P101.1 has validation commands", (p1011?.validationCommands || []).includes("npm run check:p1011-founder-live-use-contract"));
addCheck("contract blocks unsafe runtime authority", (contract.safetyRules || []).some((rule) => /No provider\/model calls/.test(rule)) && (contract.safetyRules || []).some((rule) => /No agent dispatch/.test(rule)));
addCheck("contract and docs avoid fake runnable actions", !unsafeActionPatterns.some((pattern) => pattern.test(JSON.stringify(contract) + planDoc + platformRoadmap)));
addCheck("P101.1 does not touch project paths", (p1011?.forbiddenFiles || []).includes("projects/**"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P101.1 contract, scope, safety baseline, docs, checker registration, and OS phase status handoff.",
        "- Confirms P101.1 is NEXUS OS-only and does not change Command Center rendering or runtime authority.",
        "- Confirms P101.2 through P101.7 remain planned and split for independent implementation.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1011-founder-live-use-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P101.1 is contract, docs, roadmap, and phase-status validation only. It does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or provider spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P101.1 Founder Live Use Contract Report", phase: "P101.1" },
);

printCheckReport("P101.1 Founder Live Use Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
