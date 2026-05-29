import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1211-founder-runtime-approval-decision-application-boundary-contract-report.md";

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
const contract = readJson("contracts/os-roadmap/p121-founder-runtime-approval-decision-application-boundary-contracts.json");
const p120Contract = readJson("contracts/os-roadmap/p120-founder-runtime-approval-decision-persistence-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P121_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1207Checker = readText("scripts/check-p1207-founder-runtime-approval-decision-persistence-boundary.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1211 = subphaseById.get("P121.1") || {};
const p1212 = subphaseById.get("P121.2") || {};
const changed = changedFiles();
const allowedFiles = new Set(p1211.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P121.1";
const expectedSubphases = ["P121.1", "P121.2", "P121.3", "P121.4", "P121.5", "P121.6", "P121.7"];
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

const p1211CurrentState =
  status.currentPhase === "P121.1"
    && status.previousPhase === "P120.7"
    && status.nextPhase === "P121.2"
    && roadmap.currentPhase === "P121.1"
    && roadmap.previousPhase === "P120.7"
    && roadmap.nextPhase === "P121.2";
const p1212StartedState =
  status.currentPhase === "P121.2"
    && status.previousPhase === "P121.1"
    && status.nextPhase === "P121.3"
    && roadmap.currentPhase === "P121.2"
    && roadmap.previousPhase === "P121.1"
    && roadmap.nextPhase === "P121.3";
const p1213StartedState =
  status.currentPhase === "P121.3"
    && status.previousPhase === "P121.2"
    && status.nextPhase === "P121.4"
    && roadmap.currentPhase === "P121.3"
    && roadmap.previousPhase === "P121.2"
    && roadmap.nextPhase === "P121.4";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1211-founder-runtime-approval-decision-application-boundary-contract"]));
addCheck("contract identifies P121", contract.phaseId === "P121" && contract.title === "Founder Runtime Approval Decision Application Boundary");
addCheck(
  "contract status and handoff",
  contract.status === "in_progress"
    && (
      (contract.currentSubphase === "P121.1" && contract.previousSubphase === "P120.7" && contract.nextSubphase === "P121.2")
      || (contract.currentSubphase === "P121.2" && contract.previousSubphase === "P121.1" && contract.nextSubphase === "P121.3")
      || (contract.currentSubphase === "P121.3" && contract.previousSubphase === "P121.2" && contract.nextSubphase === "P121.4")
    ),
);
addCheck("subphase split complete", expectedSubphases.every((phaseId) => subphaseById.has(phaseId)) && (contract.subphases || []).length === 7);
addCheck("P121.1 complete and P121.2 planned or complete", p1211.status === "complete" && ["planned", "complete"].includes(p1212.status));
addCheck("P120 closed before P121 starts", p120Contract.status === "complete" && statusById.get("P120")?.status === "complete" && roadmapById.get("P120")?.status === "complete");
addCheck("safety rules block application and execution", contract.safetyRules?.some((rule) => /Do not enable approval decision application/i.test(rule)) && contract.safetyRules?.some((rule) => /runtime execution/i.test(rule) && /Do not enable/i.test(rule)));
addCheck("reuse requirements present", ["shared/reportWriter.js", "shared/checkResultFormatter.js", "os-roadmap/updatePhaseStatus.js", "existing dashboard tabs/cards/badges"].every((item) => contract.reuseRequirements?.includes(item)));
addCheck("P121.1 allowed files scoped", [
  "contracts/os-roadmap/p121-founder-runtime-approval-decision-application-boundary-contracts.json",
  "docs/architecture/P121_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_BOUNDARY_PLAN.md",
  "scripts/check-p1211-founder-runtime-approval-decision-application-boundary-contract.js",
  "scripts/check-p1207-founder-runtime-approval-decision-persistence-boundary.js",
  "scripts/check-os-phase-status.js",
].every((file) => p1211.allowedFiles?.includes(file)));
addCheck("P121.1 avoids forbidden file scope", !(p1211.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("P121.1 records validation commands", [
  "npm run check:p1211-founder-runtime-approval-decision-application-boundary-contract",
  "npm run check:p1207-founder-runtime-approval-decision-persistence-boundary",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
].every((command) => p1211.validationCommands?.includes(command)));
addCheck("P120.7 checker accepts P121.1 start", p1207Checker.includes("p1211StartedState") && p1207Checker.includes("P121.1") && p1207Checker.includes("P121.2"));
addCheck("OS phase status checker recognizes P121 subphases", expectedSubphases.every((phaseId) => osStatusChecker.includes(`\"${phaseId}\"`)));
addCheck("docs plan records P121.1", /P121\.1 Application Boundary Contract \/ Policy[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P121.1", /P121\.1 approval decision application contract/i.test(readme) && /P121\.2 is next/i.test(readme));
addCheck("platform roadmap records P121.1", /P121\.1 is complete/.test(platformRoadmap) && /P121\.2 is next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  (p1211CurrentState || p1212StartedState || p1213StartedState)
    && statusById.get("P121")?.status === "in_progress"
    && roadmapById.get("P121")?.status === "in_progress"
    && statusById.get("P121.1")?.status === "complete"
    && roadmapById.get("P121.1")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P121.2")?.status)
    && ["planned", "complete"].includes(roadmapById.get("P121.2")?.status),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P121.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P121.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("docs avoid raw approval application keys", !/(approvalApplicationId|approvalExecutionId|applicationRequestRef|applicationEventRef|applicationEvidenceRef|applicationRecordKey|runtimeApplyKey|sqliteEntity|recordRef|requestKey|founder_runtime_approval_application|approval_decision_application_events|approval_decision_application_records|approval_decision_application_requests)/i.test(docsBundle));
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
        "- Validates the P121.1 founder runtime approval decision application boundary contract and handoff from P120.",
        "- Confirms P121 is split into implementation-grade subphases before any approval decision application model or UX work begins.",
        "- Does not enable approval decision application, approval capture, approval persistence, approve/reject decision recording, DB/runtime writes, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1211.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P121.1 is contract-only. It does not apply approvals, capture approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P121.1 Founder Runtime Approval Decision Application Boundary Contract Report", phase: "P121.1" },
);

printCheckReport("P121.1 Founder Runtime Approval Decision Application Boundary Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
