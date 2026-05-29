import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1171-founder-runtime-execution-approval-gate-contract-report.md";

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
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|contract-only|planned-only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p117-founder-runtime-execution-approval-gate-contracts.json");
const p116Contract = readJson("contracts/os-roadmap/p116-founder-live-runtime-execution-readiness-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1167Checker = readText("scripts/check-p1167-founder-live-runtime-execution-readiness.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1171 = subphaseById.get("P117.1") || {};
const p1172 = subphaseById.get("P117.2") || {};
const changed = changedFiles();
const allowedFiles = new Set(p1171.allowedFiles || []);
const enforceCurrentDiffScope = status.currentPhase === "P117.1";
const expectedSubphases = ["P117.1", "P117.2", "P117.3", "P117.4", "P117.5", "P117.6", "P117.7"];
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1171-founder-runtime-execution-approval-gate-contract"]));
addCheck("contract identifies P117", contract.phaseId === "P117" && contract.title === "Founder Runtime Execution Approval Gate");
addCheck(
  "contract status and handoff",
  contract.status === "in_progress"
    && (
      (contract.currentSubphase === "P117.1" && contract.previousSubphase === "P116.7" && contract.nextSubphase === "P117.2")
      || (contract.currentSubphase === "P117.2" && contract.previousSubphase === "P117.1" && contract.nextSubphase === "P117.3")
      || (contract.currentSubphase === "P117.3" && contract.previousSubphase === "P117.2" && contract.nextSubphase === "P117.4")
    ),
);
addCheck("subphase split complete", expectedSubphases.every((phaseId) => subphaseById.has(phaseId)) && (contract.subphases || []).length === 7);
addCheck("P117.1 complete and P117.2 planned or complete", p1171.status === "complete" && ["planned", "complete"].includes(p1172.status));
addCheck("P116 closed before P117 starts", p116Contract.status === "complete" && statusById.get("P116")?.status === "complete" && roadmapById.get("P116")?.status === "complete");
addCheck("safety rules block approval and execution", contract.safetyRules?.some((rule) => /Do not enable approval capture/i.test(rule)) && contract.safetyRules?.some((rule) => /runtime execution/i.test(rule) && /Do not enable/i.test(rule)));
addCheck("reuse requirements present", ["shared/reportWriter.js", "shared/checkResultFormatter.js", "os-roadmap/updatePhaseStatus.js", "existing dashboard tabs/cards/badges"].every((item) => contract.reuseRequirements?.includes(item)));
addCheck("P117.1 allowed files scoped", ["contracts/os-roadmap/p117-founder-runtime-execution-approval-gate-contracts.json", "scripts/check-p1171-founder-runtime-execution-approval-gate-contract.js", "scripts/check-p1167-founder-live-runtime-execution-readiness.js", "scripts/check-os-phase-status.js"].every((file) => p1171.allowedFiles?.includes(file)));
addCheck("P117.1 avoids forbidden file scope", !(p1171.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("P117.1 records validation commands", [
  "npm run check:p1171-founder-runtime-execution-approval-gate-contract",
  "npm run check:p1167-founder-live-runtime-execution-readiness",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
].every((command) => p1171.validationCommands?.includes(command)));
addCheck("P116.7 checker accepts P117.1 start", p1167Checker.includes("p117StartedState") && p1167Checker.includes("P117.1") && p1167Checker.includes("P117.2"));
addCheck("OS phase status checker recognizes P117 subphases", expectedSubphases.every((phaseId) => osStatusChecker.includes(`\"${phaseId}\"`)));
addCheck("docs plan records P117.1", /P117\.1 Runtime Execution Approval Contract \/ Policy[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P117.1", /P117\.1 runtime execution approval contract/i.test(readme) && /P117\.2 is next/i.test(readme));
addCheck("platform roadmap records P117.1", /P117\.1 is complete/.test(platformRoadmap) && /P117\.2 is next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P117.1"
      && status.previousPhase === "P116.7"
      && status.nextPhase === "P117.2"
      && roadmap.currentPhase === "P117.1"
      && roadmap.previousPhase === "P116.7"
      && roadmap.nextPhase === "P117.2")
    || (status.currentPhase === "P117.2"
      && status.previousPhase === "P117.1"
      && status.nextPhase === "P117.3"
      && roadmap.currentPhase === "P117.2"
      && roadmap.previousPhase === "P117.1"
      && roadmap.nextPhase === "P117.3")
    || (status.currentPhase === "P117.3"
      && status.previousPhase === "P117.2"
      && status.nextPhase === "P117.4"
      && roadmap.currentPhase === "P117.3"
      && roadmap.previousPhase === "P117.2"
      && roadmap.nextPhase === "P117.4"))
    && statusById.get("P117")?.status === "in_progress"
    && roadmapById.get("P117")?.status === "in_progress"
    && statusById.get("P117.1")?.status === "complete"
    && roadmapById.get("P117.1")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P117.2")?.status),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P117.1 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P117.1 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("docs avoid raw approval keys", !/(runtimeApprovalId|approvalDecisionId|approvalGateId|sqliteEntity|recordRef|requestKey|founder_runtime_execution_approval_)/.test(docsBundle));
addCheck(
  "docs avoid unsafe positive claims",
  !hasUnsafePositiveClaim(
    docsBundle,
    /approval capture is enabled|approval persistence is enabled|runtime approval is live|runtime execution is enabled|runtime execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i,
  ),
);
addCheck("docs avoid fake runnable actions", !/approve now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(docsBundle));
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
        "- Validates the P117.1 runtime execution approval gate contract and handoff from P116.",
        "- Confirms P117 is split into implementation-grade subphases before approval-gate implementation begins.",
        "- Does not enable approval capture, approval persistence, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: p1171.validationCommands.map((command) => `- ${command}`).join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P117.1 is contract-only. It does not capture approvals, persist approvals, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P117.1 Founder Runtime Execution Approval Gate Contract Report", phase: "P117.1" },
);

printCheckReport("P117.1 Founder Runtime Execution Approval Gate Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
