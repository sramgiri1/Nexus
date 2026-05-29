import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1151-founder-live-runtime-admission-contract-report.md";

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

function hasPositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 1] || ""} ${line}`;
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p115-founder-live-runtime-admission-readiness-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = existsSync(join(ROOT, "docs/architecture/P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PLAN.md"))
  ? readText("docs/architecture/P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PLAN.md")
  : "";
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1147Checker = readText("scripts/check-p1147-founder-live-agent-dispatch-readiness.js");
const changed = changedFiles();
const p1151 = subphaseById.get("P115.1") || {};
const p1152 = subphaseById.get("P115.2") || {};
const allowedFiles = new Set(p1151.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P115.1";
const expectedSubphases = ["P115.1", "P115.2", "P115.3", "P115.4", "P115.5", "P115.6", "P115.7"];
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
  "npm run check:p1151-founder-live-runtime-admission-contract",
  "npm run check:p1147-founder-live-agent-dispatch-readiness",
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1151-founder-live-runtime-admission-contract"]));
addCheck("contract identifies P115", contract.phaseId === "P115" && contract.title === "Founder Live Runtime Admission Readiness");
addCheck(
  "contract status and handoff",
  contract.status === "in_progress"
    && (
      (contract.currentSubphase === "P115.1" && contract.previousSubphase === "P114.7" && contract.nextSubphase === "P115.2")
      || (contract.currentSubphase === "P115.2" && contract.previousSubphase === "P115.1" && contract.nextSubphase === "P115.3")
      || (contract.currentSubphase === "P115.3" && contract.previousSubphase === "P115.2" && contract.nextSubphase === "P115.4")
    ),
);
addCheck("contract splits seven subphases", expectedSubphases.every((phaseId) => subphaseById.has(phaseId)) && (contract.subphases || []).length === 7);
addCheck("P115.1 complete and P115.2 planned or complete", p1151.status === "complete" && ["planned", "complete"].includes(p1152.status));
addCheck("all subphases scoped to NEXUS OS", (contract.subphases || []).every((entry) => entry.scopeClassification === "NEXUS_OS_CHANGE"));
addCheck("P115.1 allowed files exact", p1151.allowedFiles?.length === p1151.exactFiles?.length && p1151.allowedFiles?.every((file) => p1151.exactFiles.includes(file)));
addCheck("P115.1 avoids forbidden file scope", !(p1151.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("reuse requirements recorded", requiredReuse.every((helper) => contract.reuseRequirements?.includes(helper)));
addCheck("safety rules block runtime admission", contract.safetyRules?.some((rule) => /runtime admission/i.test(rule) && /Do not enable/i.test(rule)));
addCheck("validation commands recorded", validationCommands.every((command) => p1151.validationCommands?.includes(command)));
addCheck(
  "changed files stay in P115.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "changed files avoid forbidden paths",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P115.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P114.7 checker accepts P115 start", p1147Checker.includes("p115StartedState") && p1147Checker.includes("P115.1") && p1147Checker.includes("P115.2"));
addCheck("OS status checker accepts P115 subphases", ["P115", ...expectedSubphases, "P116"].every((phaseId) => osStatusChecker.includes(`\"${phaseId}\"`)));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P115.1"
      && status.previousPhase === "P114.7"
      && status.nextPhase === "P115.2"
      && roadmap.currentPhase === "P115.1"
      && roadmap.previousPhase === "P114.7"
      && roadmap.nextPhase === "P115.2")
    || (status.currentPhase === "P115.2"
      && status.previousPhase === "P115.1"
      && status.nextPhase === "P115.3"
      && roadmap.currentPhase === "P115.2"
      && roadmap.previousPhase === "P115.1"
      && roadmap.nextPhase === "P115.3")
    || (status.currentPhase === "P115.3"
      && status.previousPhase === "P115.2"
      && status.nextPhase === "P115.4"
      && roadmap.currentPhase === "P115.3"
      && roadmap.previousPhase === "P115.2"
      && roadmap.nextPhase === "P115.4"))
    && statusById.get("P115")?.status === "in_progress"
    && statusById.get("P115.1")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P115.2")?.status)
    && roadmapById.get("P115")?.status === "in_progress"
    && roadmapById.get("P115.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("docs plan records P115.1", /P115\.1 Runtime Admission Contract \/ Policy[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P115.1", /P115\.1 runtime admission contract/i.test(readme) && /P115\.2 is next/i.test(readme));
addCheck("platform roadmap records P115.1", /P115\.1 is complete/.test(platformRoadmap) && /P115\.2\s+is\s+next/.test(platformRoadmap));
addCheck(
  "no runtime admission implementation files changed",
  !enforceCurrentDiffScope || !changed.some((file) => ["db/", "live-ready/", "dashboard/src/", "dashboard/tests/", "local-state/runtime/", "worker-runtime/", "providers/", "tools/"].some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P115.1 implementation path check relaxed for ${status.currentPhase}`,
);
addCheck("docs avoid raw runtime admission keys", !/(runtimeAdmissionId|dispatchId|assignmentId|queueItemId|workOrderId|sqliteEntity|recordRef|requestKey|founder_runtime_admission_|founder_agent_dispatch_readiness_)/.test(docsBundle));
addCheck("docs avoid fake runnable actions", !/run now|execute now|deploy now|apply now|approve now|admit now|call provider now|create project now|dispatch agent now|write sqlite now|write runtime now/i.test(docsBundle));
addCheck(
  "docs do not claim unsafe authority live",
  !hasPositiveClaim(
    docsBundle,
    /runtime admission is enabled|execution unlock is enabled|execution is live|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i,
  ),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P115.1 runtime admission readiness contract and handoff from P114.",
        "- Confirms P115 is split into implementation-grade subphases before any runtime admission work begins.",
        "- Does not enable runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P115.1 is contract, docs, checker, and status only. P115.2 must add local schema metadata in its own subphase before any CRUD, preview, UX, or final validation work proceeds.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P115.1 Founder Live Runtime Admission Contract Report", phase: "P115.1" },
);

printCheckReport("P115.1 Founder Live Runtime Admission Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
