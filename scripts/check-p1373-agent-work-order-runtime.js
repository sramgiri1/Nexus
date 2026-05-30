import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES,
  AGENT_WORK_ORDER_DISPATCH_DRY_RUN_PHASE,
  AGENT_WORK_ORDER_RUNTIME_PHASE,
  AGENT_WORK_ORDER_RUNTIME_SAFETY_FLAG_NAMES,
  AGENT_WORK_ORDER_RUNTIME_VERSION,
  buildAgentWorkOrderDispatchDryRun,
  buildAgentWorkOrderDispatchDryRunEnvelope,
  buildAgentWorkOrderRuntimeModel,
  validateAgentWorkOrderDispatchDryRun,
} from "../shared/agentWorkOrderRuntimeModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1373-agent-work-order-runtime-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p137-agent-work-order-runtime-contracts.json";
const PLAN_PATH = "docs/architecture/P137_AGENT_WORK_ORDER_RUNTIME_PLAN.md";
const REQUIRED_SCRIPT = "check:p1373-agent-work-order-runtime";
const EXPECTED_BASE_COMMIT = "99cdbe6a";
const VALIDATION_COMMANDS = [
  "npm run check:p1373-agent-work-order-runtime",
  "npm run check:p1372-agent-work-order-runtime",
  "npm run check:p1371-agent-work-order-runtime",
  "npm run check:p1367-secrets-providers-tool-governance-final-validation",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];
const EXPECTED_EXPORTS = [
  "AGENT_WORK_ORDER_RUNTIME_PHASE",
  "AGENT_WORK_ORDER_DISPATCH_DRY_RUN_PHASE",
  "AGENT_WORK_ORDER_RUNTIME_VERSION",
  "AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES",
  "AGENT_WORK_ORDER_RUNTIME_SAFETY_FLAG_NAMES",
  "buildAgentWorkOrderRuntimeModel",
  "validateAgentWorkOrderRuntimeModel",
  "buildAgentWorkOrderRuntimeEnvelope",
  "buildAgentWorkOrderDispatchDryRun",
  "validateAgentWorkOrderDispatchDryRun",
  "buildAgentWorkOrderDispatchDryRunEnvelope",
];

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function reportPassed(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) return false;
  return /## Result[\s\S]*PASS/i.test(readText(relativePath));
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
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|checker|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|runtime owns|receive only|scoped|handoff|zero-spend|model)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson(CONTRACT_PATH);
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1373 = subphaseById.get("P137.3") || {};
const p1374 = subphaseById.get("P137.4") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1372Checker = readText("scripts/check-p1372-agent-work-order-runtime.js");
const p1371Checker = readText("scripts/check-p1371-agent-work-order-runtime.js");
const p1367Checker = readText("scripts/check-p1367-secrets-providers-tool-governance-final-validation.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1373-agent-work-order-runtime.js");
const modelSource = readText("shared/agentWorkOrderRuntimeModel.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P137.3";
const allowedFiles = new Set(p1373.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
  "db/",
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
const runtimeModel = buildAgentWorkOrderRuntimeModel({ founderIdeaSummary: "Build a simple iOS Snake game for the App Store" });
const dryRun = buildAgentWorkOrderDispatchDryRun({ runtimeModel });
const dryRunValidation = validateAgentWorkOrderDispatchDryRun(dryRun);
const envelope = buildAgentWorkOrderDispatchDryRunEnvelope({ runtimeModel });
const p1373CurrentState =
  status.currentPhase === "P137.3"
  && status.previousPhase === "P137.2"
  && status.nextPhase === "P137.4"
  && roadmap.currentPhase === "P137.3"
  && roadmap.previousPhase === "P137.2"
  && roadmap.nextPhase === "P137.4"
  && status.current?.phaseId === "P137.3"
  && status.previous?.phaseId === "P137.2"
  && status.next?.phaseId === "P137.4"
  && roadmap.current?.phaseId === "P137.3"
  && roadmap.previous?.phaseId === "P137.2"
  && roadmap.next?.phaseId === "P137.4"
  && statusById.get("P136")?.status === "complete"
  && roadmapById.get("P136")?.status === "complete"
  && statusById.get("P137")?.status === "in_progress"
  && roadmapById.get("P137")?.status === "in_progress"
  && statusById.get("P137.1")?.status === "complete"
  && roadmapById.get("P137.1")?.status === "complete"
  && statusById.get("P137.2")?.status === "complete"
  && roadmapById.get("P137.2")?.status === "complete"
  && statusById.get("P137.3")?.status === "complete"
  && roadmapById.get("P137.3")?.status === "complete"
  && statusById.get("P137.4")?.status === "planned"
  && roadmapById.get("P137.4")?.status === "planned";
const p1374CurrentState =
  status.currentPhase === "P137.4"
  && status.previousPhase === "P137.3"
  && status.nextPhase === "P137.5"
  && roadmap.currentPhase === "P137.4"
  && roadmap.previousPhase === "P137.3"
  && roadmap.nextPhase === "P137.5"
  && status.current?.phaseId === "P137.4"
  && status.previous?.phaseId === "P137.3"
  && status.next?.phaseId === "P137.5"
  && roadmap.current?.phaseId === "P137.4"
  && roadmap.previous?.phaseId === "P137.3"
  && roadmap.next?.phaseId === "P137.5"
  && statusById.get("P137")?.status === "in_progress"
  && roadmapById.get("P137")?.status === "in_progress"
  && ["P137.1", "P137.2", "P137.3", "P137.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P137.5")?.status === "planned"
  && roadmapById.get("P137.5")?.status === "planned";

const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const serializedDryRun = JSON.stringify(dryRun);

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("dry-run exports exist", AGENT_WORK_ORDER_RUNTIME_PHASE === "P137.2" && AGENT_WORK_ORDER_DISPATCH_DRY_RUN_PHASE === "P137.3" && AGENT_WORK_ORDER_RUNTIME_VERSION === "1.0" && EXPECTED_EXPORTS.every((name) => modelSource.includes(`export ${name}`) || modelSource.includes(`export function ${name}`) || modelSource.includes(`export const ${name}`)));
addCheck("dry run reuses P137.2 model and helpers", modelSource.includes("buildAgentWorkOrderRuntimeModel") && modelSource.includes("validateAgentWorkOrderRuntimeModel") && modelSource.includes("./resultEnvelope.js") && modelSource.includes("./redaction.js"));
addCheck("dry run avoids forbidden runtime imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|db|local-state\/runtime|deploy|release|exports|packages|projects)\//.test(modelSource));
addCheck("dry run validates", dryRunValidation.valid, dryRunValidation.errors.join("; "));
addCheck("dry-run envelope validates", envelope.ok === true && envelope.status === "PASS" && envelope.phase === "P137.3" && envelope.data?.phase === "P137.3" && envelope.errors.length === 0);
addCheck("dry run derives from scoped model", dryRun.sourceModelPhase === "P137.2" && dryRun.sourceModelValidation === "valid" && dryRun.dispatchSummary?.sourcePacketCount === runtimeModel.packetCount && dryRun.dispatchRows.length === runtimeModel.packetCount);
addCheck("context packet limits stay explicit", AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES.every((name) => dryRun.agentReceivesOnly?.includes(name)) && dryRun.runtimeOwnsFullRegistries === true && dryRun.dispatchRows.every((row) => AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES.every((name) => row.selectedContextRefs?.includes(name))));
addCheck("dispatch dry-run rows are useful", dryRun.dispatchRows.length >= 5 && dryRun.dispatchRows.every((row) => row.packetLabel && row.proposedDispatchLane && row.taskSummary && row.nextAction && row.blockers?.length >= 4 && row.disabledReason && row.ownerAgentCapability));
addCheck("dispatch dry-run rows are blocked", dryRun.dispatchRows.every((row) => row.dispatchState === "dry_run_ready_dispatch_blocked" && row.dispatchAllowed === false && row.executionAllowed === false && row.providerCallsAllowed === false && row.modelCallsAllowed === false && row.toolExecutionAllowed === false && row.dbRuntimeWritesAllowed === false && row.projectMutationAllowed === false && row.spendAllowed === false && row.providerPayload === null && row.toolPayload === null && row.executableCommand === null && row.runtimeDispatchRequest === null));
addCheck("dispatch gates remain blocked", dryRun.gateRows.length >= 5 && dryRun.gateRows.every((gate) => gate.liveAuthoritySatisfied === false && gate.bypassAllowed === false && gate.disabledReason));
addCheck("blocked authority rows cover all safety flags", dryRun.blockedAuthorityRows.length === AGENT_WORK_ORDER_RUNTIME_SAFETY_FLAG_NAMES.length && dryRun.blockedAuthorityRows.every((row) => row.allowed === false && row.candidateCount === 0 && row.currentState === "blocked"));
addCheck("all safety flags remain blocked", AGENT_WORK_ORDER_RUNTIME_SAFETY_FLAG_NAMES.every((flag) => dryRun[flag] === false && dryRun.safetyFlags?.[flag] === false));
addCheck("all authority candidate counts remain zero", Object.values(dryRun.candidateCounts || {}).every((value) => value === 0) && dryRun.dispatchSummary?.dispatchableCandidateCount === 0 && dryRun.dispatchSummary?.executableCandidateCount === 0);
addCheck("dry run hides raw private ids and dumps", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDryRun) && !/Bearer\s+|sk-[A-Za-z0-9]|DATABASE_URL|postgres(?:ql)?:\/\/|sqliteEntity|recordRef|requestKey|raw JSON|raw logs|raw policy dump/i.test(serializedDryRun));
addCheck("dry run avoids fake runnable actions", !/dispatch agent now|run agent now|execute work order now|execute tool now|call provider now|call model now|write db now|mutate project now|deploy now|export now|package now|spend now/i.test(serializedDryRun));
addCheck("contract advances P137.3", contract.phaseId === "P137" && contract.status === "in_progress" && p1373.status === "complete" && ((contract.currentSubphase === "P137.3" && contract.previousSubphase === "P137.2" && contract.nextSubphase === "P137.4" && p1374.status === "planned") || (contract.currentSubphase === "P137.4" && contract.previousSubphase === "P137.3" && contract.nextSubphase === "P137.5" && p1374.status === "complete")));
addCheck("contract records expected base commit", p1373.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records dry-run exports", EXPECTED_EXPORTS.every((name) => p1373.expectedExports?.includes(name)));
addCheck("P137.2 report passes", reportPassed("reports/p1372-agent-work-order-runtime-report.md"));
addCheck("P137.1 report passes", reportPassed("reports/p1371-agent-work-order-runtime-report.md"));
addCheck("P136.7 report passes", reportPassed("reports/p1367-secrets-providers-tool-governance-final-validation-report.md"));
addCheck("P137.2 checker accepts P137.3", p1372Checker.includes("p1373CurrentState") && p1372Checker.includes('status.currentPhase === "P137.3"'));
addCheck("P137.1 checker accepts P137.3", p1371Checker.includes("p1373CurrentState") && p1371Checker.includes('status.currentPhase === "P137.3"'));
addCheck("P136.7 checker accepts P137.3", p1367Checker.includes("p1373CurrentState") && p1367Checker.includes('status.currentPhase === "P137.3"'));
addCheck("enterprise checker accepts P137.3", enterpriseChecker.includes("p1373CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P137.4 handoff", ["P137.1", "P137.2", "P137.3", "P137.4"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P137 plan records P137.3", /### P137\.3 Dispatch Dry Run[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P137.3", /P137\.3 agent work order dispatch dry run/i.test(readme));
addCheck("platform roadmap records P137.3", /P137\.3 agent work order dispatch dry run is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P137.3", /P137\.3 is now complete/i.test(enterpriseRoadmap) && (/P137\.4 is the next executable subphase/i.test(enterpriseRoadmap) || (/P137\.4 is now complete/i.test(enterpriseRoadmap) && /P137\.5 is the next executable subphase/i.test(enterpriseRoadmap))));
addCheck("phase status starts P137.3 or safely hands off to P137.4", p1373CurrentState || p1374CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P137.3 entries have required fields", [statusById.get("P137"), statusById.get("P137.3"), roadmapById.get("P137.3")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P137.4 remains planned-only or safely complete", (statusById.get("P137.4")?.status === "planned" && roadmapById.get("P137.4")?.status === "planned" && !(statusById.get("P137.4")?.checksRun || []).length) || p1374CurrentState);
addCheck(
  "changed files stay in P137.3 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P137.3 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable work order actions", !/dispatch agent now|run agent now|execute work order now|execute tool now|call provider now|call model now|write db now|mutate project now|deploy now|export now|package now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /agent dispatch is enabled|work order execution is enabled|tool execution is enabled|provider calls are enabled|model calls are enabled|MCP servers are enabled|network calls are enabled|provider spend is enabled|DB writes are enabled|runtime writes are enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|full registry is loaded/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /raw JSON|raw logs|raw policy dump|raw registry dump|raw memory dump|raw tool dump/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Implements the P137.3 local, non-runnable agent work order dispatch dry run from the P137.2 scoped runtime model.",
        "- Confirms dry-run rows show candidate dispatch lanes, gates, blocked authority, evidence, activity, owner, next action, disabled reason, and zero-cost impact.",
        "- Confirms this subphase does not call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, write DB/runtime state, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Dry Run Summary",
      body: [
        `- Source packets: ${dryRun.dispatchSummary.sourcePacketCount}`,
        `- Dry-run rows: ${dryRun.dispatchSummary.dryRunCandidateCount}`,
        `- Dispatchable candidates: ${dryRun.dispatchSummary.dispatchableCandidateCount}`,
        `- Executable candidates: ${dryRun.dispatchSummary.executableCandidateCount}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: p1374CurrentState
        ? "- P137.3 is local non-runnable dry-run work. P137.4 may now surface the display-safe Agent Flow UX. Provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, DB/runtime writes, deploy, release, export, package, network calls, and spend remain blocked."
        : "- P137.3 is local non-runnable dry-run work. It does not update Agent Flow UX, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, write DB/runtime state, deploy, release, export, package, use network calls, or spend. P137.4 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P137.3 Agent Work Order Dispatch Dry Run Report", phase: "P137.3" },
);

printCheckReport("P137.3 Agent Work Order Dispatch Dry Run Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
