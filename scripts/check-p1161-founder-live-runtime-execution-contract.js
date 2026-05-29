import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1161-founder-live-runtime-execution-contract-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function changedFiles() {
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]{1,2}\s+/, ""))
    .map((line) => (line.includes(" -> ") ? line.split(" -> ").pop() : line));
}

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 1] || ""} ${line}`;
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|contract-only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p116-founder-live-runtime-execution-readiness-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P116_FOUNDER_LIVE_RUNTIME_EXECUTION_READINESS_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1157Checker = readText("scripts/check-p1157-founder-live-runtime-admission-readiness.js");
const changed = changedFiles();
const p1161 = subphaseById.get("P116.1") || {};
const p1162 = subphaseById.get("P116.2") || {};
const allowedFiles = new Set(p1161.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P116.1";
const expectedSubphases = ["P116.1", "P116.2", "P116.3", "P116.4", "P116.5", "P116.6", "P116.7"];
const requiredReuse = [
  "shared/reportWriter.js",
  "shared/reportMetadata.js",
  "shared/resultEnvelope.js",
  "shared/modeGuard.js",
  "shared/redaction.js",
  "shared/checkResultFormatter.js",
  "os-roadmap/updatePhaseStatus.js",
];
const validationCommands = [
  "npm run check:p1161-founder-live-runtime-execution-contract",
  "npm run check:p1157-founder-live-runtime-admission-readiness",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "db/",
  "live-ready/",
  "dashboard/src/",
  "dashboard/tests/",
  "local-state/runtime/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
  ".env",
];
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1161-founder-live-runtime-execution-contract"]));
addCheck("contract identifies P116", contract.phaseId === "P116" && contract.title === "Founder Live Runtime Execution Readiness");
addCheck("contract status and handoff", contract.status === "in_progress" && contract.currentSubphase === "P116.1" && contract.previousSubphase === "P115.7" && contract.nextSubphase === "P116.2");
addCheck("contract splits seven subphases", expectedSubphases.every((phaseId) => subphaseById.has(phaseId)) && (contract.subphases || []).length === 7);
addCheck("P116.1 complete and P116.2 planned", p1161.status === "complete" && p1162.status === "planned");
addCheck("all subphases scoped to NEXUS OS", (contract.subphases || []).every((entry) => entry.scopeClassification === "NEXUS_OS_CHANGE"));
addCheck("P116.1 allowed files exact", p1161.allowedFiles?.length === p1161.exactFiles?.length && p1161.allowedFiles?.every((file) => p1161.exactFiles.includes(file)));
addCheck("P116.1 avoids forbidden file scope", !(p1161.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("reuse requirements recorded", requiredReuse.every((helper) => contract.reuseRequirements?.includes(helper)));
addCheck("safety rules block runtime execution", contract.safetyRules?.some((rule) => /runtime execution/i.test(rule) && /Do not enable/i.test(rule)));
addCheck("validation commands recorded", validationCommands.every((command) => p1161.validationCommands?.includes(command)));
addCheck(
  "changed files stay in P116.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "changed files avoid forbidden paths",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P116.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P115.7 checker accepts P116 start", p1157Checker.includes("p116StartedState") && p1157Checker.includes("P116.1") && p1157Checker.includes("P116.2"));
addCheck("OS status checker accepts P116 subphases", ["P116", ...expectedSubphases].every((phaseId) => osStatusChecker.includes(`\"${phaseId}\"`)));
addCheck(
  "phase status advanced",
  status.currentPhase === "P116.1"
    && status.previousPhase === "P115.7"
    && status.nextPhase === "P116.2"
    && roadmap.currentPhase === "P116.1"
    && roadmap.previousPhase === "P115.7"
    && roadmap.nextPhase === "P116.2"
    && statusById.get("P116")?.status === "in_progress"
    && statusById.get("P116.1")?.status === "complete"
    && statusById.get("P116.2")?.status === "planned"
    && roadmapById.get("P116")?.status === "in_progress"
    && roadmapById.get("P116.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P115 remains complete", statusById.get("P115")?.status === "complete" && roadmapById.get("P115")?.status === "complete");
addCheck("docs plan records P116.1", /P116\.1 Runtime Execution Contract \/ Policy[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P116.1", /P116\.1 runtime execution contract/i.test(readme) && /P116\.2 is next/i.test(readme));
addCheck("platform roadmap records P116.1", /P116\.1 is complete/.test(platformRoadmap) && /P116\.2\s+is\s+next/.test(platformRoadmap));
addCheck(
  "no runtime execution implementation files changed",
  !enforceCurrentDiffScope || !changed.some((file) => ["db/", "live-ready/", "dashboard/src/", "dashboard/tests/", "local-state/runtime/", "worker-runtime/", "providers/", "tools/"].some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P116.1 implementation path check relaxed for ${status.currentPhase}`,
);
addCheck("docs avoid raw runtime execution keys", !/(runtimeExecutionId|runtimeAdmissionId|dispatchId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_runtime_execution_|founder_runtime_admission_)/.test(docsBundle));
addCheck("docs avoid fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|admit now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now|unlock execution now/i.test(docsBundle));
addCheck(
  "docs do not claim unsafe authority live",
  !hasUnsafePositiveClaim(
    docsBundle,
    /runtime execution is enabled|execution unlock is enabled|execution is live|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled/i,
  ),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P116.1 runtime execution readiness contract and handoff from P115.",
        "- Confirms P116 is split into seven implementation-grade subphases before any execution-readiness implementation starts.",
        "- Confirms runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, and provider spend remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P116.1 is contract/docs/checker/status only. It does not add runtime execution schema, local CRUD, preview execution, Command Center execution controls, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P116.1 Founder Live Runtime Execution Readiness Contract Report", phase: "P116.1" },
);

printCheckReport("P116.1 Founder Live Runtime Execution Readiness Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
