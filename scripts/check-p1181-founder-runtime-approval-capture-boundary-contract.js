import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1181-founder-runtime-approval-capture-boundary-contract-report.md";

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
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|contract-only|planned-only|read-only|boundary|define|metadata|preview)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p118-founder-runtime-approval-capture-boundary-contracts.json");
const p117Contract = readJson("contracts/os-roadmap/p117-founder-runtime-execution-approval-gate-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P118_FOUNDER_RUNTIME_APPROVAL_CAPTURE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1177Checker = readText("scripts/check-p1177-founder-runtime-execution-approval-gate.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1181 = subphaseById.get("P118.1") || {};
const p1182 = subphaseById.get("P118.2") || {};
const changed = changedFiles();
const allowedFiles = new Set(p1181.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P118.1";
const expectedSubphases = ["P118.1", "P118.2", "P118.3", "P118.4", "P118.5", "P118.6", "P118.7"];
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
  "db/",
  "live-ready/",
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1181-founder-runtime-approval-capture-boundary-contract"]));
addCheck("contract identifies P118", contract.phaseId === "P118" && contract.title === "Founder Runtime Approval Capture Boundary");
addCheck(
  "contract status and handoff",
  contract.status === "in_progress"
    && (
      (contract.currentSubphase === "P118.1" && contract.previousSubphase === "P117.7" && contract.nextSubphase === "P118.2")
      || (contract.currentSubphase === "P118.2" && contract.previousSubphase === "P118.1" && contract.nextSubphase === "P118.3")
      || (contract.currentSubphase === "P118.3" && contract.previousSubphase === "P118.2" && contract.nextSubphase === "P118.4")
    ),
);
addCheck("subphase split complete", expectedSubphases.every((phaseId) => subphaseById.has(phaseId)) && (contract.subphases || []).length === 7);
addCheck("P118.1 complete and P118.2 planned or complete", p1181.status === "complete" && ["planned", "complete"].includes(p1182.status));
addCheck("P117 closed before P118 starts", p117Contract.status === "complete" && statusById.get("P117")?.status === "complete" && roadmapById.get("P117")?.status === "complete");
addCheck("safety rules block approval capture and execution", contract.safetyRules?.some((rule) => /Do not enable approval capture/i.test(rule)) && contract.safetyRules?.some((rule) => /runtime execution/i.test(rule) && /Do not enable/i.test(rule)));
addCheck("reuse requirements present", ["shared/reportWriter.js", "shared/checkResultFormatter.js", "os-roadmap/updatePhaseStatus.js", "existing dashboard tabs/cards/badges"].every((item) => contract.reuseRequirements?.includes(item)));
addCheck("P118.1 allowed files scoped", [
  "contracts/os-roadmap/p118-founder-runtime-approval-capture-boundary-contracts.json",
  "docs/architecture/P118_FOUNDER_RUNTIME_APPROVAL_CAPTURE_BOUNDARY_PLAN.md",
  "scripts/check-p1181-founder-runtime-approval-capture-boundary-contract.js",
  "scripts/check-p1177-founder-runtime-execution-approval-gate.js",
  "scripts/check-os-phase-status.js",
].every((file) => p1181.allowedFiles?.includes(file)));
addCheck("P118.1 avoids forbidden file scope", !(p1181.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("P118.1 records validation commands", [
  "npm run check:p1181-founder-runtime-approval-capture-boundary-contract",
  "npm run check:p1177-founder-runtime-execution-approval-gate",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
].every((command) => p1181.validationCommands?.includes(command)));
addCheck("P117.7 checker accepts P118.1 start", p1177Checker.includes("p1181StartedState") && p1177Checker.includes("P118.1") && p1177Checker.includes("P118.2"));
addCheck("OS phase status checker recognizes P118 subphases", expectedSubphases.every((phaseId) => osStatusChecker.includes(`\"${phaseId}\"`)));
addCheck("docs plan records P118.1", /P118\.1 Approval Capture Contract \/ Policy[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P118.1", /P118\.1 approval capture contract/i.test(readme) && /P118\.2 is next/i.test(readme));
addCheck("platform roadmap records P118.1", /P118\.1 is complete/.test(platformRoadmap) && /P118\.2 is next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P118.1"
      && status.previousPhase === "P117.7"
      && status.nextPhase === "P118.2"
      && roadmap.currentPhase === "P118.1"
      && roadmap.previousPhase === "P117.7"
      && roadmap.nextPhase === "P118.2")
    || (status.currentPhase === "P118.2"
      && status.previousPhase === "P118.1"
      && status.nextPhase === "P118.3"
      && roadmap.currentPhase === "P118.2"
      && roadmap.previousPhase === "P118.1"
      && roadmap.nextPhase === "P118.3")
    || (status.currentPhase === "P118.3"
      && status.previousPhase === "P118.2"
      && status.nextPhase === "P118.4"
      && roadmap.currentPhase === "P118.3"
      && roadmap.previousPhase === "P118.2"
      && roadmap.nextPhase === "P118.4"))
    && statusById.get("P118")?.status === "in_progress"
    && roadmapById.get("P118")?.status === "in_progress"
    && statusById.get("P118.1")?.status === "complete"
    && roadmapById.get("P118.1")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P118.2")?.status)
    && ["planned", "complete"].includes(roadmapById.get("P118.2")?.status),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P118.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P118.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("docs avoid raw approval keys", !/(runtimeApprovalId|approvalDecisionId|approvalGateId|approvalCaptureId|sqliteEntity|recordRef|requestKey|founder_runtime_approval_capture_)/.test(docsBundle));
addCheck(
  "docs avoid unsafe positive claims",
  !hasUnsafePositiveClaim(
    docsBundle,
    /approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|runtime approval is live|runtime execution is enabled|runtime execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i,
  ),
);
addCheck("docs avoid fake runnable actions", !/approve now|reject now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(docsBundle));
addCheck(
  "docs avoid raw dump exposure claims",
  !hasUnsafePositiveClaim(docsBundle, /exposes raw JSON|shows raw JSON|renders raw JSON|raw logs are visible|raw policy dumps are visible/i),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates the P118.1 founder runtime approval capture boundary contract and handoff from P117.",
        "- Confirms P118 is split into implementation-grade subphases before any approval capture implementation begins.",
        "- Does not enable approval capture, approval persistence, approve/reject decision recording, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: p1181.validationCommands.map((command) => `- ${command}`).join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P118.1 is contract-only. It does not capture approvals, persist approvals, record approve/reject decisions, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P118.1 Founder Runtime Approval Capture Boundary Contract Report", phase: "P118.1" },
);

printCheckReport("P118.1 Founder Runtime Approval Capture Boundary Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
