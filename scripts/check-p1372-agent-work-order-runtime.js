import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES,
  AGENT_WORK_ORDER_RUNTIME_PHASE,
  AGENT_WORK_ORDER_RUNTIME_SAFETY_FLAG_NAMES,
  AGENT_WORK_ORDER_RUNTIME_VERSION,
  buildAgentWorkOrderRuntimeEnvelope,
  buildAgentWorkOrderRuntimeModel,
  validateAgentWorkOrderRuntimeModel,
} from "../shared/agentWorkOrderRuntimeModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1372-agent-work-order-runtime-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p137-agent-work-order-runtime-contracts.json";
const PLAN_PATH = "docs/architecture/P137_AGENT_WORK_ORDER_RUNTIME_PLAN.md";
const REQUIRED_SCRIPT = "check:p1372-agent-work-order-runtime";
const VALIDATION_COMMANDS = [
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
  "AGENT_WORK_ORDER_RUNTIME_VERSION",
  "AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES",
  "AGENT_WORK_ORDER_RUNTIME_SAFETY_FLAG_NAMES",
  "buildAgentWorkOrderRuntimeModel",
  "validateAgentWorkOrderRuntimeModel",
  "buildAgentWorkOrderRuntimeEnvelope",
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|read-only|checker|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|runtime owns|receive only|scoped|handoff|zero-spend|model)\b/i.test(context);
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
const p1372 = subphaseById.get("P137.2") || {};
const p1373 = subphaseById.get("P137.3") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1371Checker = readText("scripts/check-p1371-agent-work-order-runtime.js");
const p1367Checker = readText("scripts/check-p1367-secrets-providers-tool-governance-final-validation.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const checkerSource = readText("scripts/check-p1372-agent-work-order-runtime.js");
const modelSource = readText("shared/agentWorkOrderRuntimeModel.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P137.2";
const allowedFiles = new Set(p1372.allowedFiles || []);
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
const model = buildAgentWorkOrderRuntimeModel({ founderIdeaSummary: "Build a simple iOS Snake game for the App Store" });
const modelValidation = validateAgentWorkOrderRuntimeModel(model);
const envelope = buildAgentWorkOrderRuntimeEnvelope({ founderIdeaSummary: "Build a simple iOS Snake game for the App Store" });
const p1372CurrentState =
  status.currentPhase === "P137.2"
  && status.previousPhase === "P137.1"
  && status.nextPhase === "P137.3"
  && roadmap.currentPhase === "P137.2"
  && roadmap.previousPhase === "P137.1"
  && roadmap.nextPhase === "P137.3"
  && status.current?.phaseId === "P137.2"
  && status.previous?.phaseId === "P137.1"
  && status.next?.phaseId === "P137.3"
  && roadmap.current?.phaseId === "P137.2"
  && roadmap.previous?.phaseId === "P137.1"
  && roadmap.next?.phaseId === "P137.3"
  && statusById.get("P136")?.status === "complete"
  && roadmapById.get("P136")?.status === "complete"
  && statusById.get("P137")?.status === "in_progress"
  && roadmapById.get("P137")?.status === "in_progress"
  && statusById.get("P137.1")?.status === "complete"
  && roadmapById.get("P137.1")?.status === "complete"
  && statusById.get("P137.2")?.status === "complete"
  && roadmapById.get("P137.2")?.status === "complete"
  && statusById.get("P137.3")?.status === "planned"
  && roadmapById.get("P137.3")?.status === "planned";
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

const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const serializedModel = JSON.stringify(model);

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("model exports exist", AGENT_WORK_ORDER_RUNTIME_PHASE === "P137.2" && AGENT_WORK_ORDER_RUNTIME_VERSION === "1.0" && Array.isArray(AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES) && Array.isArray(AGENT_WORK_ORDER_RUNTIME_SAFETY_FLAG_NAMES) && EXPECTED_EXPORTS.every((name) => modelSource.includes(`export ${name}`) || modelSource.includes(`export function ${name}`) || modelSource.includes(`export const ${name}`)));
addCheck("model reuses existing helpers", [
  "../live-ready/founderLiveHandoffWorkOrders.js",
  "../live-ready/founderLiveWorkAdmission.js",
  "./resultEnvelope.js",
  "./modeGuard.js",
  "./redaction.js",
].every((needle) => modelSource.includes(needle)));
addCheck("model avoids forbidden runtime imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|db|local-state\/runtime|deploy|release|exports|packages|projects)\//.test(modelSource));
addCheck("model validates", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("envelope validates", envelope.ok === true && envelope.status === "PASS" && envelope.phase === "P137.2" && envelope.data?.phase === "P137.2" && envelope.errors.length === 0);
addCheck("context packet limits are explicit", AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES.every((name) => model.agentReceivesOnly?.includes(name)) && model.runtimeOwnsFullRegistries === true && model.policyLimits?.runtimeOwnsFullRegistries === true);
addCheck("runtime does not load full registries", ["fullToolRegistryLoaded", "fullMcpSchemaRegistryLoaded", "fullSkillRegistryLoaded", "fullAgentRegistryLoaded", "fullPolicyRegistryLoaded", "fullMemoryLoaded"].every((flag) => model[flag] === false && model.safetyFlags?.[flag] === false));
addCheck("all authority flags remain blocked", AGENT_WORK_ORDER_RUNTIME_SAFETY_FLAG_NAMES.every((flag) => model[flag] === false && model.safetyFlags?.[flag] === false));
addCheck("work order packets are useful", model.packetCount >= 5 && model.workOrderPackets?.every((packet) => packet.packetLabel && packet.proposedAgent && packet.taskSummary && packet.nextAction && packet.blocker && packet.disabledReason));
addCheck("work order packets are scoped only", model.workOrderPackets?.every((packet) => AGENT_WORK_ORDER_CONTEXT_LIMIT_NAMES.every((name) => packet.selectedContextRefs?.includes(name)) && packet.dispatchAllowed === false && packet.executionAllowed === false && packet.projectMutationAllowed === false && packet.spendAllowed === false && packet.fullRegistryLoaded === false));
addCheck("budget and policy are zero-authority", model.budgetPolicyLimits?.maxUsdPerRun === 0 && model.budgetPolicyLimits?.maxTokensPerRun === 0 && model.budgetPolicyLimits?.spendAllowed === false && model.policyLimits?.dispatchAllowed === false && model.policyLimits?.executionAllowed === false);
addCheck("model hides raw private ids and dumps", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedModel) && !/Bearer\s+|sk-[A-Za-z0-9]|DATABASE_URL|postgres(?:ql)?:\/\/|raw JSON|raw logs|raw policy dump/i.test(serializedModel));
addCheck("model avoids fake runnable actions", !/dispatch agent now|run agent now|execute work order now|execute tool now|call provider now|call model now|write db now|mutate project now|deploy now|export now|package now|spend now/i.test(serializedModel));
addCheck("contract advances P137.2", contract.phaseId === "P137" && contract.status === "in_progress" && p1372.status === "complete" && ((contract.currentSubphase === "P137.2" && contract.previousSubphase === "P137.1" && contract.nextSubphase === "P137.3" && p1373.status === "planned") || (contract.currentSubphase === "P137.3" && contract.previousSubphase === "P137.2" && contract.nextSubphase === "P137.4" && p1373.status === "complete")));
addCheck("contract records expected base commit", p1372.expectedBaseCommit === "fad26b65");
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((name) => p1372.expectedExports?.includes(name)) && !p1372.expectedExports?.includes("buildAgentWorkOrderDispatchDryRun"));
addCheck("future dispatch exports remain future only or safely implemented by P137.3", p1373.expectedExports?.includes("buildAgentWorkOrderDispatchDryRun") && (!modelSource.includes("function buildAgentWorkOrderDispatchDryRun") || p1373CurrentState));
addCheck("P137.1 report passes", reportPassed("reports/p1371-agent-work-order-runtime-report.md"));
addCheck("P136.7 report passes", reportPassed("reports/p1367-secrets-providers-tool-governance-final-validation-report.md"));
addCheck("P137.1 checker accepts P137.2", p1371Checker.includes("p1372CurrentState") && p1371Checker.includes('status.currentPhase === "P137.2"'));
addCheck("P136.7 checker accepts P137.2", p1367Checker.includes("p1372CurrentState") && p1367Checker.includes('status.currentPhase === "P137.2"'));
addCheck("enterprise checker accepts P137.2", enterpriseChecker.includes("p1372CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("OS checker recognizes P137.3 handoff", ["P137.1", "P137.2", "P137.3"].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P137 plan records P137.2", /### P137\.2 Work Order Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P137.2", /P137\.2 agent work order runtime model/i.test(readme));
addCheck("platform roadmap records P137.2", /P137\.2 agent work order runtime model is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P137.2", /P137\.2 is now complete/i.test(enterpriseRoadmap) && (/P137\.3 is the next executable subphase/i.test(enterpriseRoadmap) || /P137\.3 is now complete/i.test(enterpriseRoadmap)));
addCheck("phase status starts P137.2 or safely hands off to P137.3", p1372CurrentState || p1373CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P137.2 entries have required fields", [statusById.get("P137"), statusById.get("P137.2"), roadmapById.get("P137.2")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P137.3 remains planned-only or safely complete", (statusById.get("P137.3")?.status === "planned" && roadmapById.get("P137.3")?.status === "planned" && !(statusById.get("P137.3")?.checksRun || []).length) || p1373CurrentState);
addCheck(
  "changed files stay in P137.2 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P137.2 forbidden path check relaxed for ${status.currentPhase}`,
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
        "- Implements the P137.2 read-only agent work order runtime model and scoped context packet shape.",
        "- Confirms agents receive only task contract, selected project profile, scoped memory, trusted context, selected skill/tool contract summaries, budget/policy limits, and evidence refs.",
        "- Confirms this subphase does not call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, write DB/runtime state, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Model Summary",
      body: [
        `- Work order packets: ${model.packetCount}`,
        `- Dispatchable packets: ${model.dispatchablePacketCount}`,
        `- Executable packets: ${model.executablePacketCount}`,
        `- Context packet fields: ${model.agentReceivesOnly.join(", ")}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: p1373CurrentState
        ? "- P137.2 is read-only model work. P137.3 may now be complete as a local non-runnable dispatch dry run. Agent Flow UX, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, DB/runtime writes, deploy, release, export, package, network calls, and spend remain blocked."
        : "- P137.2 is read-only model work. It does not create dispatch dry-run rows, update Agent Flow UX, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, write DB/runtime state, deploy, release, export, package, use network calls, or spend. P137.3 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P137.2 Agent Work Order Runtime Model Report", phase: "P137.2" },
);

printCheckReport("P137.2 Agent Work Order Runtime Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
