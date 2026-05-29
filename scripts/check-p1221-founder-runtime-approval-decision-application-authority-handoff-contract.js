import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1221-founder-runtime-approval-decision-application-authority-handoff-contract-report.md";

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
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|contract-only|planned-only|read-only|boundary|define|metadata|preview|future)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p122-founder-runtime-approval-decision-application-authority-handoff-contracts.json");
const p121Contract = readJson("contracts/os-roadmap/p121-founder-runtime-approval-decision-application-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P122_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1217Checker = readText("scripts/check-p1217-founder-runtime-approval-decision-application-boundary.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1221 = subphaseById.get("P122.1") || {};
const p1222 = subphaseById.get("P122.2") || {};
const changed = changedFiles();
const allowedFiles = new Set(p1221.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P122.1";
const expectedSubphases = ["P122.1", "P122.2", "P122.3", "P122.4", "P122.5", "P122.6", "P122.7"];
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

const p1221CurrentState =
  status.currentPhase === "P122.1"
    && status.previousPhase === "P121.7"
    && status.nextPhase === "P122.2"
    && roadmap.currentPhase === "P122.1"
    && roadmap.previousPhase === "P121.7"
    && roadmap.nextPhase === "P122.2";
const p1222StartedState =
  status.currentPhase === "P122.2"
    && status.previousPhase === "P122.1"
    && status.nextPhase === "P122.3"
    && roadmap.currentPhase === "P122.2"
    && roadmap.previousPhase === "P122.1"
    && roadmap.nextPhase === "P122.3";
const p1223StartedState =
  status.currentPhase === "P122.3"
    && status.previousPhase === "P122.2"
    && status.nextPhase === "P122.4"
    && roadmap.currentPhase === "P122.3"
    && roadmap.previousPhase === "P122.2"
    && roadmap.nextPhase === "P122.4";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1221-founder-runtime-approval-decision-application-authority-handoff-contract"]));
addCheck("contract identifies P122", contract.phaseId === "P122" && contract.title === "Founder Runtime Approval Decision Application Authority Handoff");
addCheck(
  "contract status and handoff",
  contract.status === "in_progress"
    && (
      (contract.currentSubphase === "P122.1" && contract.previousSubphase === "P121.7" && contract.nextSubphase === "P122.2")
      || (contract.currentSubphase === "P122.2" && contract.previousSubphase === "P122.1" && contract.nextSubphase === "P122.3")
      || (contract.currentSubphase === "P122.3" && contract.previousSubphase === "P122.2" && contract.nextSubphase === "P122.4")
    ),
);
addCheck("subphase split complete", expectedSubphases.every((phaseId) => subphaseById.has(phaseId)) && (contract.subphases || []).length === 7);
addCheck("P122.1 complete and P122.2 planned or complete", p1221.status === "complete" && ["planned", "complete"].includes(p1222.status));
addCheck("P121 closed before P122 starts", p121Contract.status === "complete" && statusById.get("P121")?.status === "complete" && roadmapById.get("P121")?.status === "complete");
addCheck("safety rules block live authority", contract.safetyRules?.some((rule) => /Do not enable approval decision application/i.test(rule)) && contract.safetyRules?.some((rule) => /runtime execution/i.test(rule) && /Do not enable/i.test(rule)));
addCheck("reuse requirements present", ["shared/reportWriter.js", "shared/checkResultFormatter.js", "os-roadmap/updatePhaseStatus.js", "existing dashboard tabs/cards/badges"].every((item) => contract.reuseRequirements?.includes(item)));
addCheck("P122.1 allowed files scoped", [
  "contracts/os-roadmap/p122-founder-runtime-approval-decision-application-authority-handoff-contracts.json",
  "docs/architecture/P122_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_PLAN.md",
  "scripts/check-p1221-founder-runtime-approval-decision-application-authority-handoff-contract.js",
  "scripts/check-p1217-founder-runtime-approval-decision-application-boundary.js",
  "scripts/check-os-phase-status.js",
].every((file) => p1221.allowedFiles?.includes(file)));
addCheck("P122.1 avoids forbidden file scope", !(p1221.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("P122.1 records validation commands", [
  "npm run check:p1221-founder-runtime-approval-decision-application-authority-handoff-contract",
  "npm run check:p1217-founder-runtime-approval-decision-application-boundary",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
].every((command) => p1221.validationCommands?.includes(command)));
addCheck("P121.7 checker accepts P122.1 start", p1217Checker.includes("p122StartedState") && p1217Checker.includes("P122") && p1217Checker.includes("P121.7"));
addCheck("OS phase status checker recognizes P122 subphases", ["P122", ...expectedSubphases].every((phaseId) => osStatusChecker.includes(`\"${phaseId}\"`)));
addCheck("docs plan records P122.1", /P122\.1 Authority Handoff Contract \/ Policy[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P122.1", /P122\.1 approval decision application authority handoff contract/i.test(readme) && /P122\.2 is next/i.test(readme));
addCheck("platform roadmap records P122.1", /P122\.1 is complete/.test(platformRoadmap) && /P122\.2 is next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  (p1221CurrentState || p1222StartedState || p1223StartedState)
    && statusById.get("P122")?.status === "in_progress"
    && roadmapById.get("P122")?.status === "in_progress"
    && statusById.get("P122.1")?.status === "complete"
    && roadmapById.get("P122.1")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P122.2")?.status)
    && ["planned", "complete"].includes(roadmapById.get("P122.2")?.status),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P122.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P122.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("docs avoid raw approval authority keys", !/(approvalApplicationId|approvalExecutionId|applicationRequestRef|applicationEventRef|applicationEvidenceRef|applicationRecordKey|runtimeApplyKey|sqliteEntity|recordRef|requestKey|founder_runtime_approval_application|approval_decision_application_events|approval_decision_application_records|approval_decision_application_requests)/i.test(docsBundle));
addCheck(
  "docs avoid unsafe positive claims",
  !hasUnsafePositiveClaim(
    docsBundle,
    /approval decision application is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|runtime execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i,
  ),
);
addCheck("docs avoid fake runnable actions", !/apply approval now|apply decision now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(docsBundle));
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
        "- Validates the P122.1 founder runtime approval decision application authority handoff contract and handoff from P121.",
        "- Confirms P122 is split into implementation-grade subphases before any authority metadata, model, dry-run, or UX work begins.",
        "- Does not enable approval decision application, approval capture, approval persistence, approve/reject decision recording, DB/runtime writes, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1221.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P122.1 is contract-only. It does not apply approvals, capture approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P122.1 Founder Runtime Approval Decision Application Authority Handoff Contract Report", phase: "P122.1" },
);

printCheckReport("P122.1 Founder Runtime Approval Decision Application Authority Handoff Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
